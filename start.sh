#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════╗"
echo "║   AI Trainer 本地开发环境启动       ║"
echo "╚══════════════════════════════════════╝"

# ── 清理旧进程 ────────────────────────────────────────────────
echo ""
echo "→ 清理旧进程..."
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:5179 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
echo "  ✓ 端口已释放"

# ── 配置 no_proxy 让本地请求 bypass 系统代理（关键！）──
export no_proxy=localhost,127.0.0.1,.local,0.0.0.0
export NO_PROXY=localhost,127.0.0.1,.local,0.0.0.0

# ── 后端 ─────────────────────────────────────────────────────
echo ""
echo "→ 启动后端 (port 8000)..."
cd "$ROOT/backend"
"$ROOT/backend/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "  ✓ 后端已启动  http://127.0.0.1:8000"
  echo "  API 文档       http://127.0.0.1:8000/docs"
else
  echo "  ✗ 后端启动失败"
fi

# ── 管理后台前端 ─────────────────────────────────────────────
echo ""
echo "→ 启动管理后台 (port 5173)..."
cd "$ROOT/admin"
pnpm dev --port 5173 --host 0.0.0.0 &
ADMIN_PID=$!
sleep 3
if kill -0 $ADMIN_PID 2>/dev/null; then
  echo "  ✓ 管理后台已启动  http://localhost:5173"
else
  echo "  ✗ 管理后台启动失败"
fi

# ── 学员端前端 ──────────────────────────────────────────────
echo ""
echo "→ 启动学员端 (port 5179)..."
cd "$ROOT/learning"
pnpm dev --port 5179 --host 0.0.0.0 &
LEARN_PID=$!
sleep 3
if kill -0 $LEARN_PID 2>/dev/null; then
  echo "  ✓ 学员端已启动    http://127.0.0.1:5179"
else
  echo "  ✗ 学员端启动失败"
fi

# ── 完成 ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  全部启动完成                       ║"
echo "╠══════════════════════════════════════╣"
echo "║  后端 API      http://127.0.0.1:8000  ║"
echo "║  管理后台      http://localhost:5173  ║"
echo "║  学员端        http://127.0.0.1:5179  ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# ── 等待任意子进程退出 ──────────────────────────────────────
trap "kill $BACKEND_PID $ADMIN_PID $LEARN_PID 2>/dev/null; exit" INT TERM
wait
