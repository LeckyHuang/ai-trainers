# ## Imports ─────────────────────────────────────────────────────────────────
import httpx
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


# ## LLM 服务（阿里云 Qwen，OpenAI 兼容接口）────────────────────────────
class LLMService:
    def __init__(self):
        self.api_key = settings.QWEN_API_KEY
        self.base_url = settings.QWEN_BASE_URL.rstrip("/")
        self.model = settings.QWEN_MODEL

    # ## 基础 chat 调用 ────────────────────────────────────────────────────
    async def chat(self, messages: list[dict], temperature: float = 0.7) -> str:
        async with httpx.AsyncClient(timeout=60, trust_env=False) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={"model": self.model, "messages": messages, "temperature": temperature},
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    # ## JSON 模式（自动解析 + 重试）─────────────────────────────────────
    async def chat_json(self, messages: list[dict], retries: int = 2) -> dict:
        for attempt in range(retries + 1):
            try:
                text = await self.chat(messages, temperature=0.3)
                text = text.strip()
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(lines[1:-1])
                return json.loads(text)
            except (json.JSONDecodeError, Exception) as e:
                if attempt == retries:
                    logger.error(f"LLM JSON解析失败（{retries+1}次）: {e}")
                    raise
                logger.warning(f"LLM JSON解析失败，重试 {attempt+1}/{retries}")
        return {}


llm_service = LLMService()
