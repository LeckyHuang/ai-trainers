# ## Imports ─────────────────────────────────────────────────────────────────
import asyncio
import base64
import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


# ## ASR 服务（火山引擎 Doubao 大模型识别）──────────────────────────────
class ASRService:
    def __init__(self):
        self.app_id = settings.DOUBAO_APP_ID
        self.access_key = settings.DOUBAO_ACCESS_KEY
        self.secret_key = settings.DOUBAO_SECRET_KEY

    # ## 签名生成（HMAC-SHA256）────────────────────────────────────────────
    def _generate_volc_token(self) -> str:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(hours=1)
        date_str = now.strftime("%Y%m%dT%H%M%SZ")

        sign_str = "".join([
            "GET\n",
            "/api/v3/auc/bigmodel/submit\n",
            "host:openspeech.bytedance.com\n",
            f"date: {date_str}\n",
            "action: BigmodelAudioSubmit\n",
            "version: 2024-03-01\n",
            f"{expire.strftime('%Y%m%dT%H%M%SZ')}"
        ])

        signature = hmac.new(
            self.secret_key.encode("utf-8"),
            sign_str.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return f"Bearer; {self.access_key}; {signature}"

    # ## 公开接口 ──────────────────────────────────────────────────────────
    async def transcribe(self, file_path: str) -> dict:
        if not Path(file_path).exists():
            return {"success": False, "text": "", "error": "文件不存在"}
        try:
            return await self._transcribe_doubao(file_path)
        except Exception as e:
            logger.error(f"ASR 转写异常: {e}")
            return {"success": False, "text": "", "error": str(e)}

    # ## 音频转 MP3（非 MP3 格式通过 ffmpeg 转换）─────────────────────────
    async def _to_mp3(self, file_path: str) -> tuple[str, str | None]:
        ext = Path(file_path).suffix.lower().lstrip(".")
        if ext == "mp3":
            return file_path, None

        import shutil
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("ffmpeg 未安装，无法转换音频格式")

        tmp_path = str(Path(file_path).with_suffix(".tmp_asr.mp3"))
        proc = await asyncio.create_subprocess_exec(
            ffmpeg, "-y", "-i", file_path,
            "-ar", "16000", "-ac", "1", "-b:a", "64k", tmp_path,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg 转换失败: {stderr.decode()}")
        return tmp_path, tmp_path

    # ## 调用豆包 ASR：提交 → 轮询 → 返回文本 ────────────────────────────
    async def _transcribe_doubao(self, file_path: str) -> dict:
        actual_path, tmp_path = await self._to_mp3(file_path)
        try:
            with open(actual_path, "rb") as f:
                audio_b64 = base64.b64encode(f.read()).decode()
        finally:
            if tmp_path:
                Path(tmp_path).unlink(missing_ok=True)

        request_id = str(uuid.uuid4())
        authorization = self._generate_volc_token()

        headers = {
            "Authorization": authorization,
            "X-Api-Access-Key": self.access_key,
            "X-Api-App-Key": self.app_id,
            "X-Api-Resource-Id": "volc.bigasr.auc",
            "X-Api-Request-Id": request_id,
            "X-Api-Sequence": "-1",
            "Content-Type": "application/json",
        }

        payload = {
            "user": {"uid": "ai-trainer"},
            "audio": {"format": "mp3", "rate": 16000, "bits": 16, "channel": 1, "data": audio_b64},
            "request": {"model_name": "bigmodel", "enable_itn": True, "enable_punc": True, "show_utterances": True},
        }

        submit_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
        query_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"

        async with httpx.AsyncClient(timeout=300, trust_env=False) as client:
            resp = await client.post(submit_url, json=payload, headers=headers)
            status_code = resp.headers.get("X-Api-Status-Code", "")
            if status_code not in ("20000000", ""):
                msg = resp.headers.get("X-Api-Message", status_code)
                logger.error(f"豆包ASR提交失败: status={status_code}, msg={msg}")
                return {"success": False, "text": "", "error": f"提交失败: {msg}"}

            await asyncio.sleep(2)

            query_headers = {k: v for k, v in headers.items() if k != "X-Api-Sequence"}
            for _ in range(90):
                await asyncio.sleep(2)
                qresp = await client.post(query_url, json={}, headers=query_headers, timeout=30)
                rs = qresp.headers.get("X-Api-Status-Code", "")
                if rs == "20000000":
                    text = qresp.json().get("result", {}).get("text", "")
                    return {"success": True, "text": text}
                if rs in ("20000001", "20000002"):
                    continue
                if rs == "20000003":
                    return {"success": False, "text": "", "error": "音频中未检测到人声"}
                return {"success": False, "text": "", "error": f"查询失败: {qresp.headers.get('X-Api-Message', rs)}"}

        return {"success": False, "text": "", "error": "识别超时"}


asr_service = ASRService()
