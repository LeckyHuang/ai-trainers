# ## Imports ─────────────────────────────────────────────────────────────────
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


# ## TTS 服务（MiniMax，TTS_PROVIDER="browser" 时不调用 API）────────────
class TTSService:
    def __init__(self):
        self.provider = settings.TTS_PROVIDER
        self.api_key = settings.MINIMAX_API_KEY

    async def synthesize(self, text: str, voice_id: str = "male-qn-qingse") -> bytes | None:
        if self.provider == "minimax" and self.api_key:
            return await self._synthesize_minimax(text, voice_id)
        return None

    # ## MiniMax T2A v2 调用 ───────────────────────────────────────────────
    async def _synthesize_minimax(self, text: str, voice_id: str) -> bytes | None:
        url = "https://api.minimax.chat/v1/t2a_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "speech-01-turbo",
            "text": text,
            "stream": False,
            "voice_setting": {"voice_id": voice_id, "speed": 1.0, "vol": 1.0, "pitch": 0},
            "audio_setting": {"sample_rate": 24000, "format": "mp3"},
        }

        async with httpx.AsyncClient(timeout=30, trust_env=False) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(f"MiniMax TTS error: {resp.status_code} {resp.text[:200]}")
                return None

            data = resp.json()
            code = data.get("base_resp", {}).get("status_code", -1)
            if code != 0:
                logger.error(f"MiniMax TTS failed: {data.get('base_resp', {}).get('status_msg')}")
                return None

            # MiniMax 返回 hex 编码的音频数据
            audio_hex = data.get("data", {}).get("audio")
            if not audio_hex:
                return None
            return bytes.fromhex(audio_hex)


tts_service = TTSService()
