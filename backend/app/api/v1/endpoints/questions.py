# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import uuid, json
from app.db.database import get_db
from app.models.question import QuestionBank, Question
from app.models.file import File
from app.models.user import User
from app.core.deps import get_current_user, require_admin
from app.services.ai.llm_service import llm_service
from app.core.config import settings
from app.api.v1.endpoints.system_config import get_config_value

router = APIRouter(prefix="/question-banks", tags=["题库"])


# ## 请求 Schema ───────────────────────────────────────────────────────────
class BankCreate(BaseModel):
    name: str
    description: Optional[str] = None


class BankUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class QuestionCreate(BaseModel):
    question_text: str
    answer_text: str
    score_points: list = []
    max_score: float = 100
    difficulty: Optional[str] = None


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    answer_text: Optional[str] = None
    score_points: Optional[list] = None
    max_score: Optional[float] = None
    difficulty: Optional[str] = None


# ## 序列化工具 ────────────────────────────────────────────────────────────
def bank_to_dict(b: QuestionBank) -> dict:
    return {
        "id": b.id, "name": b.name, "description": b.description,
        "source": b.source, "created_at": b.created_at.isoformat(),
        "question_count": len(b.questions),
    }


def q_to_dict(q: Question) -> dict:
    return {
        "id": q.id, "bank_id": q.bank_id, "question_text": q.question_text,
        "answer_text": q.answer_text, "score_points": q.score_points,
        "max_score": float(q.max_score), "difficulty": q.difficulty,
        "is_active": q.is_active, "created_at": q.created_at.isoformat(),
    }


# ## 题库 CRUD ─────────────────────────────────────────────────────────────
@router.get("")
async def list_banks(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    total = await db.scalar(select(func.count()).select_from(QuestionBank))
    result = await db.execute(select(QuestionBank).order_by(QuestionBank.created_at.desc()))
    return {"total": total, "items": [bank_to_dict(b) for b in result.scalars().all()]}


@router.post("", status_code=201)
async def create_bank(data: BankCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    bank = QuestionBank(id=str(uuid.uuid4()), name=data.name, description=data.description,
                        source="manual", created_by=current_user.id)
    db.add(bank)
    await db.commit()
    await db.refresh(bank)
    return bank_to_dict(bank)


@router.get("/{bank_id}")
async def get_bank(bank_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    bank = await db.get(QuestionBank, bank_id)
    if not bank:
        raise HTTPException(404, "题库不存在")
    return bank_to_dict(bank)


@router.put("/{bank_id}")
async def update_bank(bank_id: str, data: BankUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    bank = await db.get(QuestionBank, bank_id)
    if not bank:
        raise HTTPException(404, "题库不存在")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(bank, field, val)
    await db.commit()
    return bank_to_dict(bank)


@router.delete("/{bank_id}")
async def delete_bank(bank_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    bank = await db.get(QuestionBank, bank_id)
    if not bank:
        raise HTTPException(404, "题库不存在")
    await db.delete(bank)
    await db.commit()
    return {"ok": True}


# ## 题目 CRUD ─────────────────────────────────────────────────────────────
@router.get("/{bank_id}/questions")
async def list_questions(bank_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(Question).where(Question.bank_id == bank_id, Question.is_active == True))
    questions = result.scalars().all()
    return {"total": len(questions), "items": [q_to_dict(q) for q in questions]}


@router.post("/{bank_id}/questions", status_code=201)
async def create_question(bank_id: str, data: QuestionCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    q = Question(id=str(uuid.uuid4()), bank_id=bank_id, question_text=data.question_text,
                 answer_text=data.answer_text, score_points=data.score_points,
                 max_score=data.max_score, difficulty=data.difficulty)
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return q_to_dict(q)


@router.put("/questions/{question_id}")
async def update_question(question_id: str, data: QuestionUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    q = await db.get(Question, question_id)
    if not q:
        raise HTTPException(404, "题目不存在")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(q, field, val)
    await db.commit()
    return q_to_dict(q)


@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    q = await db.get(Question, question_id)
    if not q:
        raise HTTPException(404, "题目不存在")
    q.is_active = False
    await db.commit()
    return {"ok": True}


# ## AI 题库生成（从文本）──────────────────────────────────────────────────
@router.post("/{bank_id}/generate")
async def ai_generate_questions(
    bank_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    bank = await db.get(QuestionBank, bank_id)
    if not bank:
        raise HTTPException(404, "题库不存在")

    material_text = body.get("material_text", "")
    question_count = body.get("question_count", 5)

    system_prompt = await get_config_value(db, "extract_questions_system")
    user_template = await get_config_value(db, "extract_questions_user")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_template.format(question_count=question_count, material_text=material_text[:3000])},
    ]

    try:
        result = await llm_service.chat_json(messages)
        created = []
        for qd in result.get("questions", []):
            q = Question(
                id=str(uuid.uuid4()), bank_id=bank_id,
                question_text=qd.get("question_text", ""),
                answer_text=qd.get("answer_text", ""),
                score_points=qd.get("score_points", []),
                max_score=qd.get("max_score", 100),
                difficulty=qd.get("difficulty", "medium"),
            )
            db.add(q)
            created.append(q)
        bank.source = "ai_generated"
        await db.commit()
        return {"created": len(created), "questions": [q_to_dict(q) for q in created]}
    except Exception as e:
        raise HTTPException(500, f"AI生成失败: {str(e)}")


# ## AI 题库生成（从文件，支持 PDF 自动解析）────────────────────────────
@router.post("/{bank_id}/generate-from-file")
async def ai_generate_from_file(
    bank_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    bank = await db.get(QuestionBank, bank_id)
    if not bank:
        raise HTTPException(404, "题库不存在")

    file_id = body.get("file_id")
    question_count = body.get("question_count", 5)
    if not file_id:
        raise HTTPException(400, "缺少 file_id")

    file_obj = await db.get(File, file_id)
    if not file_obj:
        raise HTTPException(404, "文件不存在")

    file_path = Path(settings.UPLOAD_DIR) / file_obj.storage_key
    if not file_path.exists():
        raise HTTPException(404, "文件已丢失")

    # ## 提取文本（PDF 用 pdfplumber，其他文件直接读取）
    material_text = ""
    try:
        if file_obj.mime_type == "application/pdf" or file_obj.original_name.lower().endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(str(file_path)) as pdf:
                pages_text = [page.extract_text() for page in pdf.pages[:20] if page.extract_text()]
            material_text = "\n".join(pages_text)
        else:
            material_text = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(422, f"文件解析失败: {str(e)}")

    if not material_text.strip():
        raise HTTPException(422, "文件内容为空，无法提取题目")

    system_prompt = await get_config_value(db, "extract_questions_system")
    user_template = await get_config_value(db, "extract_questions_user")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_template.format(question_count=question_count, material_text=material_text[:4000])},
    ]

    try:
        result = await llm_service.chat_json(messages)
        created = []
        for qd in result.get("questions", []):
            q = Question(
                id=str(uuid.uuid4()), bank_id=bank_id,
                question_text=qd.get("question_text", ""),
                answer_text=qd.get("answer_text", ""),
                score_points=qd.get("score_points", []),
                max_score=qd.get("max_score", 100),
                difficulty=qd.get("difficulty", "medium"),
            )
            db.add(q)
            created.append(q)
        bank.source = "ai_generated"
        await db.commit()
        return {"created": len(created), "questions": [q_to_dict(q) for q in created]}
    except Exception as e:
        raise HTTPException(500, f"AI生成失败: {str(e)}")
