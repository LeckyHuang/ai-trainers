# ## Imports ─────────────────────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# ## 引擎 & 会话工厂 ────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_recycle=3600,   # 每小时回收连接，避免 MySQL 断开空闲连接
    pool_pre_ping=True,  # 连接前检测存活，防止 "MySQL has gone away"
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


# ## ORM 基类 ─────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ## 依赖注入：数据库会话 ────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


# ## 初始化：建表 ──────────────────────────────────────────────────────────
async def init_db():
    from app.models import user, task, question, persona, file, notification, audit, system_config
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
