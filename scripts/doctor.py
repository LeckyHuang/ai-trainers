#!/usr/bin/env python3
"""
AI 陪练项目健康检测工具
用法:
  python scripts/doctor.py            # 基础检测（环境 + 数据库 + 数据完整性）
  python scripts/doctor.py --ai       # 附加 AI 服务连通性检测
  python scripts/doctor.py --fix      # 自动修复可修复问题
  python scripts/doctor.py --all      # 全量检测 + 自动修复
  python scripts/doctor.py --quiet    # 仅输出 WARN/FAIL
"""

import argparse
import asyncio
import hashlib
import hmac
import io
import json
import os
import struct
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── ANSI 颜色 ──────────────────────────────────────────────────────────────────
GREEN  = "\033[32m"
YELLOW = "\033[33m"
RED    = "\033[31m"
CYAN   = "\033[36m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

OK   = f"{GREEN}✓ OK{RESET}"
WARN = f"{YELLOW}⚠ WARN{RESET}"
FAIL = f"{RED}✗ FAIL{RESET}"

# ── 全局结果收集 ───────────────────────────────────────────────────────────────
results: list[dict] = []   # {"label", "status": "ok"|"warn"|"fail", "detail"}
quiet_mode = False

def _record(label: str, status: str, detail: str = ""):
    results.append({"label": label, "status": status, "detail": detail})
    if quiet_mode and status == "ok":
        return
    icon = {"ok": OK, "warn": WARN, "fail": FAIL}[status]
    msg = f"  {icon}  {label}"
    if detail:
        msg += f"  {YELLOW if status == 'warn' else (RED if status == 'fail' else '')}{detail}{RESET}"
    print(msg)

def _section(title: str):
    print(f"\n{BOLD}{CYAN}{'─'*50}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*50}{RESET}")

# ── .env 解析 ─────────────────────────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    env: dict[str, str] = {}
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip('"').strip("'")
        env[k.strip()] = v
    return env

# ── 工具函数 ──────────────────────────────────────────────────────────────────
def make_tiny_wav() -> bytes:
    """生成 100ms 静音 WAV（16kHz 单声道 16-bit）供 ASR 接口测试"""
    sample_rate = 16000
    num_samples = 1600   # 100ms
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size, b"WAVE",
        b"fmt ", 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits_per_sample,
        b"data", data_size,
    )
    return header + b"\x00" * data_size

def http_post_json(url: str, payload: dict, headers: dict, timeout: int = 15) -> dict:
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())

def http_post_raw(url: str, data: bytes, headers: dict, timeout: int = 15) -> tuple[int, dict, bytes]:
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()

# ── Layer 1: 环境变量 & 文件系统 ───────────────────────────────────────────────
REQUIRED_VARS = [
    "DATABASE_URL", "SECRET_KEY",
    "QWEN_API_KEY", "QWEN_BASE_URL",
    "MINIMAX_API_KEY",
    "DOUBAO_ACCESS_KEY", "DOUBAO_SECRET_KEY",
]
OPTIONAL_VARS = ["UPLOAD_DIR", "REDIS_URL", "CELERY_BROKER_URL"]

def check_env_vars(env: dict):
    missing, empty = [], []
    for k in REQUIRED_VARS:
        v = env.get(k) or os.environ.get(k, "")
        if not v:
            missing.append(k)
        elif v in ("your_key_here", "changeme", "xxx"):
            empty.append(k)

    if missing:
        _record("必填环境变量", "fail", f"缺失: {', '.join(missing)}")
    elif empty:
        _record("必填环境变量", "warn", f"疑似占位值: {', '.join(empty)}")
    else:
        _record("必填环境变量", "ok", f"共 {len(REQUIRED_VARS)} 项均已配置")

    opt_missing = [k for k in OPTIONAL_VARS if not (env.get(k) or os.environ.get(k, ""))]
    if opt_missing:
        _record("可选环境变量", "warn", f"未配置（功能降级）: {', '.join(opt_missing)}")
    else:
        _record("可选环境变量", "ok")

def check_upload_dir(env: dict, fix: bool):
    upload_dir = env.get("UPLOAD_DIR") or os.environ.get("UPLOAD_DIR", "./uploads")
    p = Path(upload_dir)
    if p.exists():
        _record("uploads 目录", "ok", str(p.resolve()))
    elif fix:
        p.mkdir(parents=True, exist_ok=True)
        _record("uploads 目录", "warn", f"不存在 → 已自动创建: {p.resolve()}")
    else:
        _record("uploads 目录", "fail", f"不存在: {p.resolve()}  (加 --fix 自动创建)")

# ── Layer 2: 数据库 ────────────────────────────────────────────────────────────
EXPECTED_TABLES = [
    "users", "tasks", "personas", "files",
    "submissions", "submission_answers", "questions",
    "role_play_sessions", "role_play_messages",
]

async def check_database(env: dict):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not db_url:
        _record("数据库连接", "fail", "DATABASE_URL 未配置")
        return False

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite  # type: ignore
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                await conn.execute("SELECT 1")
            _record("数据库连接", "ok", f"SQLite: {db_path}")
        else:
            from sqlalchemy.ext.asyncio import create_async_engine  # type: ignore
            engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
            async with engine.connect() as conn:
                await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            await engine.dispose()
            # 截断密码部分再显示
            safe = db_url.split("@")[-1] if "@" in db_url else db_url
            _record("数据库连接", "ok", safe)
        return True
    except Exception as e:
        _record("数据库连接", "fail", str(e)[:120])
        return False

async def check_tables(env: dict):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not db_url:
        return

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                cursor = await conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                rows = await cursor.fetchall()
            existing = {r[0] for r in rows}
        else:
            from sqlalchemy.ext.asyncio import create_async_engine
            import sqlalchemy as sa
            engine = create_async_engine(db_url, echo=False)
            async with engine.connect() as conn:
                result = await conn.execute(sa.text("SHOW TABLES"))
                existing = {r[0] for r in result}
            await engine.dispose()

        missing = [t for t in EXPECTED_TABLES if t not in existing]
        if missing:
            _record("数据库表结构", "fail", f"缺失表: {', '.join(missing)}")
        else:
            _record("数据库表结构", "ok", f"{len(EXPECTED_TABLES)} 张核心表均存在")
    except Exception as e:
        _record("数据库表结构", "warn", f"无法检测: {e!s:.80}")

# ── Layer 3: AI 服务 ───────────────────────────────────────────────────────────
def check_qwen(env: dict):
    api_key  = env.get("QWEN_API_KEY") or os.environ.get("QWEN_API_KEY", "")
    base_url = (env.get("QWEN_BASE_URL") or os.environ.get("QWEN_BASE_URL", "")).rstrip("/")
    model    = env.get("QWEN_MODEL") or os.environ.get("QWEN_MODEL", "qwen-turbo")

    if not api_key or not base_url:
        _record("Qwen LLM", "fail", "QWEN_API_KEY 或 QWEN_BASE_URL 未配置")
        return

    url = f"{base_url}/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "reply with the single word: ok"}],
        "max_tokens": 5,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    try:
        t0 = time.time()
        data = http_post_json(url, payload, headers, timeout=20)
        elapsed = int((time.time() - t0) * 1000)
        reply = data["choices"][0]["message"]["content"].strip()[:30]
        _record("Qwen LLM", "ok", f"{elapsed}ms  回复: {reply!r}")
    except Exception as e:
        _record("Qwen LLM", "fail", str(e)[:120])

def check_tts(env: dict):
    api_key = env.get("MINIMAX_API_KEY") or os.environ.get("MINIMAX_API_KEY", "")

    if not api_key:
        _record("MiniMax TTS", "fail", "MINIMAX_API_KEY 未配置")
        return

    url = "https://api.minimax.chat/v1/t2a_v2"
    payload = {
        "model": "speech-02-turbo",
        "text": "测",
        "stream": False,
        "voice_setting": {"voice_id": "female-tianmei", "speed": 1.0, "vol": 1.0, "pitch": 0},
        "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3"},
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    try:
        t0 = time.time()
        data = http_post_json(url, payload, headers, timeout=20)
        elapsed = int((time.time() - t0) * 1000)
        status_code = data.get("base_resp", {}).get("status_code")
        if status_code == 0:
            audio_hex = data.get("data", {}).get("audio", "")
            size_kb = len(bytes.fromhex(audio_hex)) // 1024 if audio_hex else 0
            _record("MiniMax TTS", "ok", f"{elapsed}ms  音频: {size_kb}KB")
        else:
            msg = data.get("base_resp", {}).get("status_msg", "unknown error")
            _record("MiniMax TTS", "fail", f"status_code={status_code} {msg}")
    except Exception as e:
        _record("MiniMax TTS", "fail", str(e)[:120])

def _doubao_auth_header(access_key: str, app_key: str, body: bytes) -> str:
    ts = str(int(time.time()))
    sign_str = f"{access_key}{ts}{body.decode('utf-8', errors='replace')}"
    sig = hmac.new(app_key.encode(), sign_str.encode(), hashlib.sha256).hexdigest()
    return f"HMAC256; access_key={access_key}; timestamp={ts}; signature={sig}"

def check_asr(env: dict):
    access_key  = env.get("DOUBAO_ACCESS_KEY")  or os.environ.get("DOUBAO_ACCESS_KEY", "")
    secret_key  = env.get("DOUBAO_SECRET_KEY")  or os.environ.get("DOUBAO_SECRET_KEY", "")

    if not access_key or not secret_key:
        _record("Doubao ASR", "fail", "DOUBAO_ACCESS_KEY 或 DOUBAO_SECRET_KEY 未配置")
        return

    wav = make_tiny_wav()
    import base64
    submit_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
    payload_dict = {
        "user": {"uid": "doctor_check"},
        "audio": {"format": "wav", "sample_rate": 16000, "bits": 16, "channel": 1},
        "request": {"model_name": "bigmodel", "enable_ddc": False},
        "audio_data": {"audio_type": "url_and_data", "audio_bytes": base64.b64encode(wav).decode()},
    }
    body = json.dumps(payload_dict).encode()
    headers = {
        "Content-Type": "application/json",
        "Authorization": _doubao_auth_header(access_key, secret_key, body),
        "X-Api-Resource-Id": "volc.bigasr.sauc.duration",
    }

    try:
        t0 = time.time()
        status, resp_headers, resp_body = http_post_raw(submit_url, body, headers, timeout=20)
        elapsed = int((time.time() - t0) * 1000)
        api_status = resp_headers.get("X-Api-Status-Code") or resp_headers.get("x-api-status-code", "")

        if status == 200 and api_status in ("20000000", "20000001", "20000002"):
            _record("Doubao ASR", "ok", f"{elapsed}ms  提交成功 (status={api_status})")
        elif api_status == "20000003":
            # 静音 → no speech，但接口连通正常
            _record("Doubao ASR", "ok", f"{elapsed}ms  接口连通 (静音无语音，符合预期)")
        elif status in (401, 403):
            _record("Doubao ASR", "fail", f"鉴权失败 HTTP {status}")
        else:
            detail = resp_body[:80].decode("utf-8", errors="replace")
            _record("Doubao ASR", "warn", f"HTTP {status} api_status={api_status}  {detail}")
    except Exception as e:
        _record("Doubao ASR", "fail", str(e)[:120])

# ── Layer 4: 数据完整性 & 自动修复 ────────────────────────────────────────────
async def check_stuck_submissions(env: dict, fix: bool):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not db_url:
        return

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                cursor = await conn.execute(
                    "SELECT id FROM submissions WHERE status='in_progress' "
                    "AND created_at < datetime('now', '-2 hours')"
                )
                rows = await cursor.fetchall()
                stuck_ids = [r[0] for r in rows]
                if stuck_ids and fix:
                    await conn.execute(
                        "UPDATE submissions SET status='expired', updated_at=datetime('now') "
                        "WHERE status='in_progress' AND created_at < datetime('now', '-2 hours')"
                    )
                    await conn.commit()
        else:
            from sqlalchemy.ext.asyncio import create_async_engine
            import sqlalchemy as sa
            engine = create_async_engine(db_url, echo=False)
            async with engine.connect() as conn:
                result = await conn.execute(sa.text(
                    "SELECT id FROM submissions WHERE status='in_progress' "
                    "AND created_at < NOW() - INTERVAL 2 HOUR"
                ))
                stuck_ids = [r[0] for r in result]
                if stuck_ids and fix:
                    await conn.execute(sa.text(
                        "UPDATE submissions SET status='expired', updated_at=NOW() "
                        "WHERE status='in_progress' AND created_at < NOW() - INTERVAL 2 HOUR"
                    ))
                    await conn.commit()
            await engine.dispose()

        if not stuck_ids:
            _record("卡住的提交记录", "ok", "无超过 2 小时的 in_progress 记录")
        elif fix:
            _record("卡住的提交记录", "warn", f"发现 {len(stuck_ids)} 条 → 已标记为 expired")
        else:
            _record("卡住的提交记录", "warn", f"发现 {len(stuck_ids)} 条超 2 小时未完成  (加 --fix 自动修复)")
    except Exception as e:
        _record("卡住的提交记录", "warn", f"检测跳过: {e!s:.80}")

async def check_incomplete_evals(env: dict):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not db_url:
        return

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                cursor = await conn.execute(
                    "SELECT COUNT(*) FROM submissions WHERE status='completed' AND score IS NULL"
                )
                row = await cursor.fetchone()
                count = row[0] if row else 0
        else:
            from sqlalchemy.ext.asyncio import create_async_engine
            import sqlalchemy as sa
            engine = create_async_engine(db_url, echo=False)
            async with engine.connect() as conn:
                result = await conn.execute(sa.text(
                    "SELECT COUNT(*) FROM submissions WHERE status='completed' AND score IS NULL"
                ))
                count = result.scalar() or 0
            await engine.dispose()

        if count == 0:
            _record("评分完整性", "ok", "所有已完成提交均有评分")
        else:
            _record("评分完整性", "warn", f"{count} 条已完成提交缺少评分（可能 AI 评分失败）")
    except Exception as e:
        _record("评分完整性", "warn", f"检测跳过: {e!s:.80}")

async def check_orphaned_files(env: dict):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    upload_dir = env.get("UPLOAD_DIR") or os.environ.get("UPLOAD_DIR", "./uploads")
    if not db_url:
        return

    upload_path = Path(upload_dir)
    if not upload_path.exists():
        _record("文件孤岛检测", "warn", "uploads 目录不存在，跳过")
        return

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                cursor = await conn.execute("SELECT storage_path FROM files")
                rows = await cursor.fetchall()
        else:
            from sqlalchemy.ext.asyncio import create_async_engine
            import sqlalchemy as sa
            engine = create_async_engine(db_url, echo=False)
            async with engine.connect() as conn:
                result = await conn.execute(sa.text("SELECT storage_path FROM files"))
                rows = result.fetchall()
            await engine.dispose()

        db_paths = {Path(r[0]).name for r in rows if r[0]}
        disk_files = {f.name for f in upload_path.rglob("*") if f.is_file()}
        orphans = disk_files - db_paths
        missing = db_paths - disk_files

        issues = []
        if orphans:
            issues.append(f"磁盘多余 {len(orphans)} 个文件")
        if missing:
            issues.append(f"数据库记录缺文件 {len(missing)} 个")

        if issues:
            _record("文件孤岛检测", "warn", "；".join(issues))
        else:
            _record("文件孤岛检测", "ok", f"数据库与磁盘文件一致 ({len(db_paths)} 个)")
    except Exception as e:
        _record("文件孤岛检测", "warn", f"检测跳过: {e!s:.80}")

async def check_active_tasks(env: dict):
    db_url = env.get("DATABASE_URL") or os.environ.get("DATABASE_URL", "")
    if not db_url:
        return

    try:
        if db_url.startswith("sqlite"):
            import aiosqlite
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            async with aiosqlite.connect(db_path) as conn:
                cursor = await conn.execute(
                    "SELECT COUNT(*) FROM tasks WHERE is_active=1 OR is_active='true'"
                )
                row = await cursor.fetchone()
                task_count = row[0] if row else 0
                cursor2 = await conn.execute("SELECT COUNT(*) FROM users WHERE role='learner'")
                row2 = await cursor2.fetchone()
                user_count = row2[0] if row2 else 0
        else:
            from sqlalchemy.ext.asyncio import create_async_engine
            import sqlalchemy as sa
            engine = create_async_engine(db_url, echo=False)
            async with engine.connect() as conn:
                r1 = await conn.execute(sa.text("SELECT COUNT(*) FROM tasks WHERE is_active=1"))
                task_count = r1.scalar() or 0
                r2 = await conn.execute(sa.text("SELECT COUNT(*) FROM users WHERE role='learner'"))
                user_count = r2.scalar() or 0
            await engine.dispose()

        if task_count == 0:
            _record("任务数据", "warn", "没有任何已启用的任务")
        else:
            _record("任务数据", "ok", f"{task_count} 个已启用任务，{user_count} 个学员账号")
    except Exception as e:
        _record("任务数据", "warn", f"检测跳过: {e!s:.80}")

# ── 汇总输出 ───────────────────────────────────────────────────────────────────
def print_summary():
    ok_n    = sum(1 for r in results if r["status"] == "ok")
    warn_n  = sum(1 for r in results if r["status"] == "warn")
    fail_n  = sum(1 for r in results if r["status"] == "fail")
    total   = len(results)

    print(f"\n{BOLD}{'═'*52}{RESET}")
    print(f"{BOLD}  检测汇总  共 {total} 项{RESET}")
    print(f"{'═'*52}")
    print(f"  {GREEN}✓ 正常{RESET}  {ok_n} 项")
    if warn_n:
        print(f"  {YELLOW}⚠ 警告{RESET}  {warn_n} 项")
    if fail_n:
        print(f"  {RED}✗ 失败{RESET}  {fail_n} 项")
    print(f"{'─'*52}")

    if fail_n > 0:
        print(f"\n{RED}{BOLD}  ✗ 系统存在严重问题，请检查上方 FAIL 项目{RESET}")
        verdict = 2
    elif warn_n > 0:
        print(f"\n{YELLOW}{BOLD}  ⚠ 系统基本可用，但存在待优化项{RESET}")
        verdict = 1
    else:
        print(f"\n{GREEN}{BOLD}  ✓ 系统健康，一切正常{RESET}")
        verdict = 0

    print()
    return verdict

# ── 入口 ──────────────────────────────────────────────────────────────────────
async def run(args):
    # 查找 .env 文件（从项目根目录开始）
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    env_path = project_root / "backend" / ".env"
    if not env_path.exists():
        env_path = project_root / ".env"

    env = load_env(env_path)
    fix = args.fix or args.all
    check_ai = args.ai or args.all

    print(f"\n{BOLD}AI 陪练项目 Doctor{RESET}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if env_path.exists():
        print(f"  配置文件: {env_path}")
    else:
        print(f"  {YELLOW}未找到 .env 文件，仅使用系统环境变量{RESET}")
    if fix:
        print(f"  {CYAN}--fix 模式已启用，将自动修复可修复问题{RESET}")

    # Layer 1: 环境
    _section("Layer 1 · 环境配置")
    check_env_vars(env)
    check_upload_dir(env, fix)

    # Layer 2: 数据库
    _section("Layer 2 · 数据库")
    db_ok = await check_database(env)
    if db_ok:
        await check_tables(env)

    # Layer 3: AI 服务（可选）
    if check_ai:
        _section("Layer 3 · AI 服务连通性")
        print(f"  {CYAN}（此层需要真实网络调用，可能耗时 5-20 秒）{RESET}")
        check_qwen(env)
        check_tts(env)
        check_asr(env)

    # Layer 4: 数据完整性
    if db_ok:
        _section("Layer 4 · 数据完整性")
        await check_stuck_submissions(env, fix)
        await check_incomplete_evals(env)
        await check_orphaned_files(env)
        await check_active_tasks(env)

    return print_summary()

def main():
    global quiet_mode
    parser = argparse.ArgumentParser(
        description="AI 陪练项目健康检测工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="示例:\n  python scripts/doctor.py --all     全量检测 + 自动修复\n  python scripts/doctor.py --ai      附加 AI 服务检测\n  python scripts/doctor.py --fix     自动修复可修复问题",
    )
    parser.add_argument("--ai",    action="store_true", help="检测 AI 服务连通性（Qwen/MiniMax/Doubao）")
    parser.add_argument("--fix",   action="store_true", help="自动修复可修复的问题")
    parser.add_argument("--all",   action="store_true", help="全量检测 + 自动修复（等同于 --ai --fix）")
    parser.add_argument("--quiet", action="store_true", help="仅输出 WARN/FAIL 项")
    args = parser.parse_args()
    quiet_mode = args.quiet

    exit_code = asyncio.run(run(args))
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
