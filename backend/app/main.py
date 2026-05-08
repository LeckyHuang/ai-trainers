# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging, os, uuid, secrets, stat
from sqlalchemy import select
from app.core.config import settings
from app.api.v1.router import api_router
from app.api.v1.endpoints.roleplay_ws import router as ws_router
from app.db.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

# ## 日志配置 ──────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

# ## FastAPI 应用实例 ────────────────────────────────────────────────────────
app = FastAPI(title="AI陪练平台", version="0.1.0")

# ## CORS 中间件 ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ## 路由挂载 ──────────────────────────────────────────────────────────────
app.include_router(api_router)
app.include_router(ws_router)

# ## 静态文件（上传目录对外暴露，用于文件预览）────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ## 启动事件 ──────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await init_db()
    await _migrate_add_persona_columns()
    await _seed_superadmin()


async def _migrate_add_persona_columns():
    """兼容旧数据库：为 personas 表补充新字段"""
    from sqlalchemy import text
    from app.db.database import engine
    async with engine.begin() as conn:
        for col_def in [
            "ALTER TABLE personas ADD COLUMN avatar_url TEXT",
            "ALTER TABLE personas ADD COLUMN voice_id TEXT",
        ]:
            try:
                await conn.execute(text(col_def))
            except Exception:
                pass  # 列已存在，忽略


async def _seed_superadmin():
    """首次启动时创建超管账号（仅当无超管时执行）"""
    async with AsyncSessionLocal() as db:
        exists = await db.scalar(select(User).where(User.role == "superadmin"))
        if not exists:
            password = settings.DEFAULT_ADMIN_PASSWORD
            if not password:
                password = secrets.token_urlsafe(12)
                password_file = os.path.join(
                    os.path.dirname(settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")),
                    "INITIAL_ADMIN_PASSWORD.txt"
                )
                os.makedirs(os.path.dirname(os.path.abspath(password_file)), exist_ok=True)
                with open(password_file, "w") as f:
                    f.write(f"username: admin\npassword: {password}\n")
                try:
                    os.chmod(password_file, stat.S_IRUSR | stat.S_IWUSR)
                except Exception:
                    pass
                print(f"⚠️  未设置 DEFAULT_ADMIN_PASSWORD，已随机生成初始密码")
                print(f"⚠️  请查看文件: {os.path.abspath(password_file)}")
                print(f"⚠️  首次登录后请立即修改密码！")

            db.add(User(
                id=str(uuid.uuid4()), username="admin", phone="13800000000",
                password_hash=hash_password(password), role="superadmin",
                display_name="超级管理员",
            ))
            await db.commit()
            print("✅ 已创建默认超管账号: username=admin")


# ## 健康检查 ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
