# ## Imports ─────────────────────────────────────────────────────────────────
from sqlalchemy import String, Text, Boolean, DateTime, Integer, func, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.database import Base
import uuid


# ## 虚拟角色（Persona）模型 ───────────────────────────────────────────────
class Persona(Base):
    __tablename__ = "personas"

    # ## 基础信息
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100))
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    position: Mapped[str | None] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ## 性格 & 背景（JSON）
    big_five: Mapped[dict] = mapped_column(JSON, default=dict)      # 大五人格维度得分
    background: Mapped[dict] = mapped_column(JSON, default=dict)    # 背景故事/痛点等
    persona_card: Mapped[dict] = mapped_column(JSON, default=dict)  # 前端展示用卡片数据

    # ## 头像 & 声音 & 状态
    avatar_file_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("files.id"), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)   # AI生成或上传后的可访问URL
    voice_id: Mapped[str | None] = mapped_column(String(100), nullable=True)     # MiniMax TTS 音色ID
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
