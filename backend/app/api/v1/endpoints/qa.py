# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path
import uuid, random, json
from app.db.database import get_db
from app.models.task import Task, TaskQuestionBank, TaskSubmission, SubmissionAnswer
from app.models.question import QuestionBank, Question
from app.models.file import File
from app.models.user import User
from app.core.deps import get_current_user
from app.services.ai.llm_service import llm_service
from app.services.ai.asr_service import asr_service
from app.core.config import settings
from app.api.v1.endpoints.system_config import get_config_value

router = APIRouter(prefix="/qa", tags=["知识问答"])


# ## 开始答题会话 ──────────────────────────────────────────────────────────
@router.post("/start-session")
async def start_session(body: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    task_id = body.get("task_id")
    mode = body.get("mode", "practice")  # practice / assessment
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "任务不存在")

    bank_links = await db.execute(select(TaskQuestionBank).where(TaskQuestionBank.task_id == task_id))
    bank_ids = [r.bank_id for r in bank_links.scalars().all()]

    all_questions = []
    for bid in bank_ids:
        result = await db.execute(select(Question).where(Question.bank_id == bid, Question.is_active == True))
        all_questions.extend(result.scalars().all())

    if not all_questions:
        raise HTTPException(400, "任务没有关联题库或题目为空")

    count_key = "question_count_practice" if mode == "practice" else "question_count_assessment"
    count = task.config.get(count_key, task.config.get("question_count", len(all_questions)))
    selected = random.sample(all_questions, min(count, len(all_questions)))

    submission = TaskSubmission(
        id=str(uuid.uuid4()), task_id=task_id, user_id=current_user.id,
        mode=mode, status="in_progress",
        max_score=sum(float(q.max_score) for q in selected),
    )
    db.add(submission)
    await db.commit()

    return {
        "submission_id": submission.id, "mode": mode,
        "questions": [
            {"id": q.id, "question_text": q.question_text, "max_score": float(q.max_score), "order": i}
            for i, q in enumerate(selected)
        ],
    }


# ## 提交单题答案 ──────────────────────────────────────────────────────────
class SubmitAnswerRequest(BaseModel):
    submission_id: str
    question_id: str
    question_order: int
    audio_file_id: str
    mode: str = "practice"
    text_override: Optional[str] = None  # 跳过 ASR，直接使用文本（ASR 降级/测试用）


@router.post("/submit-answer")
async def submit_answer(data: SubmitAnswerRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    question = await db.get(Question, data.question_id)
    if not question:
        raise HTTPException(404, "题目不存在")

    if data.text_override:
        user_text = data.text_override.strip()
    else:
        audio_file = await db.get(File, data.audio_file_id)
        if not audio_file:
            raise HTTPException(404, "音频文件不存在")
        asr_result = await asr_service.transcribe(str(Path(settings.UPLOAD_DIR) / audio_file.storage_key))
        if not asr_result["success"]:
            raise HTTPException(503, f"语音识别失败: {asr_result['error']}")
        user_text = asr_result["text"]

    # ## AI 评分
    score_points_text = json.dumps(question.score_points, ensure_ascii=False) if question.score_points else "[]"
    system_prompt = await get_config_value(db, "qa_score_system")
    user_template = await get_config_value(db, "qa_score_user")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_template.format(
            question_text=question.question_text,
            answer_text=question.answer_text,
            score_points=score_points_text,
            user_answer=user_text,
            max_score=float(question.max_score),
        )},
    ]

    try:
        score_result = await llm_service.chat_json(messages)
    except Exception as e:
        raise HTTPException(503, f"AI评分失败: {str(e)}")

    answer = SubmissionAnswer(
        id=str(uuid.uuid4()),
        submission_id=data.submission_id,
        question_id=data.question_id,
        question_order=data.question_order,
        audio_file_id=data.audio_file_id,
        transcribed_text=user_text,
        score=score_result.get("score", 0),
        max_score=score_result.get("max_score", float(question.max_score)),
        partial_scores=score_result.get("partial_scores"),
        ai_feedback=score_result.get("feedback"),
        reference_answer=score_result.get("reference_answer") if data.mode == "practice" else None,
    )
    db.add(answer)
    await db.commit()

    resp = {
        "answer_id": answer.id, "transcribed_text": user_text,
        "score": answer.score, "max_score": answer.max_score,
        "partial_scores": answer.partial_scores, "feedback": answer.ai_feedback,
    }
    if data.mode == "practice":
        resp["reference_answer"] = answer.reference_answer
    return resp


# ## 完成会话 & 汇总成绩 & AI综合评估 ─────────────────────────────────────
@router.post("/complete-session")
async def complete_session(body: dict, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    submission_id = body.get("submission_id")
    submission = await db.get(TaskSubmission, submission_id)
    if not submission:
        raise HTTPException(404, "提交记录不存在")

    total_score = sum(float(a.score or 0) for a in submission.answers)
    submission.score = total_score
    submission.status = "completed"
    submission.completed_at = datetime.now(timezone.utc)

    # ## AI 综合评估
    ai_evaluation = None
    try:
        answer_details_lines = []
        for i, a in enumerate(submission.answers):
            line = f"第{i + 1}题（{float(a.score or 0)}/{float(a.max_score or 0)}分）"
            if a.transcribed_text:
                line += f"：学员作答「{a.transcribed_text[:120]}」"
            if a.ai_feedback:
                line += f"，单题反馈：{a.ai_feedback[:60]}"
            answer_details_lines.append(line)
        answer_details = "\n".join(answer_details_lines)

        system_prompt = await get_config_value(db, "qa_overall_eval_system")
        user_template = await get_config_value(db, "qa_overall_eval_user")
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_template.format(
                total_score=total_score,
                max_score=float(submission.max_score or 0),
                question_count=len(submission.answers),
                answer_details=answer_details,
            )},
        ]
        ai_evaluation = await llm_service.chat_json(messages)
        submission.ai_feedback = ai_evaluation
    except Exception:
        pass  # 综合评估失败不阻断主流程

    await db.commit()

    return {
        "submission_id": submission_id,
        "score": float(total_score),
        "max_score": float(submission.max_score or 0),
        "ai_evaluation": ai_evaluation,
        "answers": [
            {
                "question_id": a.question_id, "question_order": a.question_order,
                "score": float(a.score or 0), "max_score": float(a.max_score or 0),
                "feedback": a.ai_feedback, "reference_answer": a.reference_answer,
                "transcribed_text": a.transcribed_text,
            }
            for a in submission.answers
        ],
    }


# ## 我的提交历史 ──────────────────────────────────────────────────────────
@router.get("/tasks/{task_id}/my-submissions")
async def my_submissions(task_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(
        select(TaskSubmission)
        .where(TaskSubmission.task_id == task_id, TaskSubmission.user_id == current_user.id)
        .order_by(TaskSubmission.started_at.desc())
    )
    return [{"id": s.id, "mode": s.mode, "status": s.status, "score": float(s.score) if s.score else None} for s in res.scalars().all()]


# ## 会话详情（带归属校验）────────────────────────────────────────────────
@router.get("/sessions/{submission_id}")
async def get_session(submission_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    submission = await db.get(TaskSubmission, submission_id)
    if not submission:
        raise HTTPException(404, "提交记录不存在")
    if submission.user_id != current_user.id and current_user.role not in ("admin", "superadmin"):
        raise HTTPException(403, "无权限访问该提交记录")
    return {
        "id": submission.id, "task_id": submission.task_id,
        "mode": submission.mode, "status": submission.status,
        "score": float(submission.score) if submission.score else None,
        "max_score": float(submission.max_score) if submission.max_score else None,
        "completed_at": submission.completed_at.isoformat() if submission.completed_at else None,
        "answers": [
            {
                "question_id": a.question_id, "question_order": a.question_order,
                "score": float(a.score or 0), "max_score": float(a.max_score or 0),
                "feedback": a.ai_feedback, "reference_answer": a.reference_answer,
                "transcribed_text": a.transcribed_text, "partial_scores": a.partial_scores,
            }
            for a in submission.answers
        ],
    }
