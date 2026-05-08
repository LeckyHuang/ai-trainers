# ## Imports ─────────────────────────────────────────────────────────────────
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# ## 豆包 Ark 文生图服务 ────────────────────────────────────────────────────
# 使用字节跳动 Ark 平台 doubao-seedream-3-0-t2i 模型，OpenAI 兼容接口，同步返回
# API 文档：https://www.volcengine.com/docs/82379/1399344

ARK_IMAGE_URL = "https://ark.volces.com/api/v3/images/generations"
ARK_IMAGE_MODEL = "doubao-seedream-4-0-250828"


class ImageService:

    # ## 行业风格映射 ────────────────────────────────────────────────────
    INDUSTRY_STYLE: dict[str, str] = {
        "互联网/科技":  "科技感商务，简洁休闲正装",
        "金融/银行":    "严谨正式，深色西装，金融精英形象",
        "制造业":       "稳重务实，商务正装",
        "零售/快消":    "亲和力强，商务休闲装",
        "医疗/健康":    "专业白大褂或正装，医疗行业形象",
        "教育/培训":    "温和亲切，商务休闲，有亲和力",
        "房地产":       "商务正装，专业精干",
        "咨询/服务":    "专业顾问形象，正式商务装",
        "其他":         "商务正装",
    }

    # ## 生成角色头像 ─────────────────────────────────────────────────────
    async def generate_persona_avatar(
        self,
        name: str,
        gender: str | None = None,
        industry: str | None = None,
        position: str | None = None,
    ) -> bytes | None:
        """调用豆包 Ark 文生图，生成专业头像，返回图片字节；失败返回 None"""

        gender_cn = "中年女性" if gender == "女" else "中年男性"
        industry_style = self.INDUSTRY_STYLE.get(industry or "", "商务正装") if industry else "商务正装"
        position_cn = f"{position}，" if position else ""

        prompt = (
            f"专业商务人像摄影，{gender_cn}，{position_cn}{industry_style}，"
            "面部与肩部特写构图（半身照），正面视角，眼神自信从容，"
            "自然柔和光线，纯白或浅灰色背景，真实人物写实风格，"
            "证件照质感，面部五官清晰，无滤镜，高清"
        )

        logger.info(f"[ImageService] 调用豆包文生图: {prompt[:60]}...")
        image_url = await self._generate(prompt)
        if not image_url:
            return None

        return await self._download(image_url)

    # ## 调用 Ark 文生图 API ──────────────────────────────────────────────
    async def _generate(self, prompt: str) -> str | None:
        api_key = settings.DOUBAO_IMAGE_API_KEY
        if not api_key:
            logger.error("[ImageService] DOUBAO_IMAGE_API_KEY 未配置")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": ARK_IMAGE_MODEL,
            "prompt": prompt,
            "n": 1,
            "size": "512x512",
            "response_format": "url",
        }
        try:
            async with httpx.AsyncClient(timeout=60, trust_env=False) as client:
                resp = await client.post(ARK_IMAGE_URL, json=payload, headers=headers)
                if resp.status_code != 200:
                    logger.error(f"[ImageService] API 错误 {resp.status_code}: {resp.text[:300]}")
                    return None
                data = resp.json()
                results = data.get("data", [])
                if not results:
                    logger.error(f"[ImageService] 返回数据为空: {data}")
                    return None
                url = results[0].get("url")
                logger.info(f"[ImageService] 生成成功: {url[:60] if url else None}")
                return url
        except Exception as e:
            logger.error(f"[ImageService] 请求异常: {e}")
            return None

    # ## 下载图片字节 ─────────────────────────────────────────────────────
    async def _download(self, url: str) -> bytes | None:
        try:
            async with httpx.AsyncClient(timeout=30, trust_env=False) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
                logger.error(f"[ImageService] 下载失败 {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"[ImageService] 下载异常: {e}")
            return None


image_service = ImageService()
