# ## Imports ─────────────────────────────────────────────────────────────────
from pydantic_settings import BaseSettings
from typing import List, Optional


# ## 应用配置（从 .env 自动加载） ─────────────────────────────────────────────
class Settings(BaseSettings):
    DEPLOYMENT_MODE: str = "standalone"
    # 超管初始密码：未设置时启动自动随机生成并写入 data/INITIAL_ADMIN_PASSWORD.txt
    DEFAULT_ADMIN_PASSWORD: Optional[str] = None

    # ## JWT 认证配置
    SECRET_KEY: str = "changeme"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ## 数据库 & 文件存储
    DATABASE_URL: str = "mysql+aiomysql://root:password@127.0.0.1:3306/ai_trainer?charset=utf8mb4"
    UPLOAD_DIR: str = "./uploads"

    # ## LLM - 阿里云 Qwen
    LLM_PROVIDER: str = "qwen"
    QWEN_API_KEY: str = ""
    QWEN_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    QWEN_MODEL: str = "qwen-plus"

    # ## ASR - 火山引擎 Doubao
    ASR_PROVIDER: str = "doubao"
    DOUBAO_APP_ID: str = ""
    DOUBAO_ACCESS_KEY: str = ""
    DOUBAO_SECRET_KEY: str = ""

    # ## 图像生成 - 豆包 Ark 文生图
    DOUBAO_IMAGE_API_KEY: str = ""

    # ## TTS - MiniMax（TTS_PROVIDER="browser" 时不调用 API）
    TTS_PROVIDER: str = "browser"
    MINIMAX_API_KEY: str = ""

    # ## CORS（逗号分隔多个域名）
    CORS_ORIGINS: str = "http://localhost:5173"

    def get_cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
