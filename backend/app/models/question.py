# ## Imports ─────────────────────────────────────────────────────────────────
from sqlalchemy import String, Text, Boolean, DateTime, Numeric, func, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base
import uuid


# ## 题库模型 ──────────────────────────────────────────────────────────────
class QuestionBank(Base):
    __tablename__ = "question_banks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(20), nullable=True)  # manual/ai_generated
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    questions: Mapped[list["Question"]] = relationship("Question", back_populates="bank", lazy="selectin")


# ## 题目模型 ──────────────────────────────────────────────────────────────
class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bank_id: Mapped[str] = mapped_column(String(36), ForeignKey("question_banks.id", ondelete="CASCADE"))
    question_text: Mapped[str] = mapped_column(Text)
    answer_text: Mapped[str] = mapped_column(Text)
    # score_points 存储评分维度列表，如 [{"key": "完整性", "weight": 0.5}, ...]
    score_points: Mapped[list] = mapped_column(JSON, default=list)
    max_score: Mapped[float] = mapped_column(Numeric(5, 2), default=100)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)  # easy/medium/hard
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bank: Mapped["QuestionBank"] = relationship("QuestionBank", back_populates="questions")
