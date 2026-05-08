# ## Imports ─────────────────────────────────────────────────────────────────
from sqlalchemy import String, Text, Boolean, DateTime, Numeric, Integer, func, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base
import uuid


# ## 任务主表 ──────────────────────────────────────────────────────────────
class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(20))  # qa / roleplay
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/active/ended/cancelled
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    materials: Mapped[list["TaskMaterial"]] = relationship("TaskMaterial", back_populates="task", lazy="selectin")
    assignments: Mapped[list["TaskAssignment"]] = relationship("TaskAssignment", back_populates="task", lazy="selectin")


# ## 任务素材关联 ──────────────────────────────────────────────────────────
class TaskMaterial(Base):
    __tablename__ = "task_materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"))
    file_id: Mapped[str] = mapped_column(String(36), ForeignKey("files.id"))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    task: Mapped["Task"] = relationship("Task", back_populates="materials")


# ## 任务题库关联（多对多）────────────────────────────────────────────────
class TaskQuestionBank(Base):
    __tablename__ = "task_question_banks"

    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    bank_id: Mapped[str] = mapped_column(String(36), ForeignKey("question_banks.id"), primary_key=True)


# ## 任务角色关联（多对多）────────────────────────────────────────────────
class TaskPersona(Base):
    __tablename__ = "task_personas"

    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    persona_id: Mapped[str] = mapped_column(String(36), ForeignKey("personas.id"), primary_key=True)


# ## 任务指派（任务 → 学员）──────────────────────────────────────────────
class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship("Task", back_populates="assignments")


# ## 任务提交记录 ──────────────────────────────────────────────────────────
class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    mode: Mapped[str] = mapped_column(String(20))  # practice / assessment
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    ai_feedback: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    answers: Mapped[list["SubmissionAnswer"]] = relationship("SubmissionAnswer", back_populates="submission", lazy="selectin")


# ## 单题答案记录 ──────────────────────────────────────────────────────────
class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("task_submissions.id", ondelete="CASCADE"))
    question_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("questions.id"), nullable=True)
    question_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    audio_file_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("files.id"), nullable=True)
    transcribed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    max_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    partial_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped["TaskSubmission"] = relationship("TaskSubmission", back_populates="answers")


# ## 角色对练会话记录 ─────────────────────────────────────────────────────
class RoleplaySession(Base):
    __tablename__ = "roleplay_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("task_submissions.id"))
    persona_id: Mapped[str] = mapped_column(String(36), ForeignKey("personas.id"))
    turns: Mapped[list] = mapped_column(JSON, default=list)
    final_evaluation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    total_turns: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ended_by: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ## 素材阅读进度 ──────────────────────────────────────────────────────────
class MaterialReadingProgress(Base):
    __tablename__ = "material_reading_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"))
    file_id: Mapped[str] = mapped_column(String(36), ForeignKey("files.id"))
    total_pages: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visited_pages: Mapped[list] = mapped_column(JSON, default=list)
    max_page_reached: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    last_read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
