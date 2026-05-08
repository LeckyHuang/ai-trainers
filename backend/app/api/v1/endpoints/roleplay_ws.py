# ## Imports ─────────────────────────────────────────────────────────────────
import asyncio
import json
import uuid
import base64
import tempfile
import logging
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.task import Task, TaskPersona, TaskSubmission, RoleplaySession
from app.models.persona import Persona
from app.core.security import decode_token
from app.services.ai.llm_service import llm_service
from app.services.ai.asr_service import asr_service
from app.api.v1.endpoints.system_config import get_config_value
from app.core.config import settings

router = APIRouter(prefix="/api/v1", tags=["对练WebSocket"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(settings.UPLOAD_DIR)


# ## System Prompt 构建 ────────────────────────────────────────────────────
async def build_system_prompt(persona: Persona, task: Task, db: AsyncSession) -> str:
    behavior_instructions = await get_config_value(db, "roleplay_behavior_instructions")
    card = persona.persona_card or {}
    objective = task.config.get("objective", "推销产品或服务")
    topic = task.config.get("topic", "")
    difficulty_level = task.config.get("difficulty_level", "medium")
    difficulty_instructions = await get_config_value(db, f"roleplay_difficulty_{difficulty_level}")

    topic_section = ""
    if topic:
        topic_section = (
            f"本次对话话题：{topic}\n"
            f"（请将对话严格限制在此话题范围内，不主动引入话题外的内容）\n"
        )

    return (
        f"你正在扮演一位虚拟客户，进行角色扮演对话训练。\n\n"
        f"【角色信息】\n"
        f"姓名：{card.get('role_name', persona.name)}\n"
        f"年龄：{persona.age or '未知'}岁，{persona.gender or ''}\n"
        f"行业：{persona.industry or '未知'}，职位：{card.get('position', persona.position or '未知')}\n"
        f"背景：{card.get('role_description', '')}\n"
        f"从业经验：{card.get('experience', '')}\n\n"
        f"【行为画像】\n"
        f"核心动机：{card.get('motivation', '未知')}\n"
        f"关注重点：{card.get('focus', '未知')}\n"
        f"情绪反应：{card.get('emotional_response_mode', '未知')}\n\n"
        f"【训练场景】\n"
        f"训练目标：{objective}\n"
        f"{topic_section}"
        f"\n【行为要求】\n{behavior_instructions}\n\n"
        f"【难度设置】\n{difficulty_instructions}"
    )


# ## 结束评估生成 ──────────────────────────────────────────────────────────
async def generate_final_evaluation(turns: list, persona: Persona, task: Task, db: AsyncSession) -> dict:
    user_turns = [t for t in turns if t["role"] == "user"]

    # 学员完全没有发言，直接返回零分，不调用 AI
    if len(user_turns) == 0:
        return {
            "score": 0, "max_score": 100,
            "dimensions": [
                {"name": d, "score": 0, "max": 100, "comment": "学员未参与"}
                for d in ["开场与建立信任", "需求挖掘与倾听", "表达与说服能力", "异议处理", "推进与收尾"]
            ],
            "summary": "本次对练学员未进行任何有效发言，无法完成评估。请重新开始并积极参与对话。",
            "strengths": [],
            "improvements": ["需要积极参与对话，勇于开口表达"],
            "next_focus": "鼓励自己主动开口，哪怕只是一句简单问候",
        }

    history_lines = "\n".join(
        f"{'学员' if t['role'] == 'user' else persona.name}：{t['text']}"
        for t in turns
    )
    # 把参与情况注入 history，让评估 AI 感知到对话深度
    history = (
        f"（本次对练共 {len(turns)} 条对话，其中学员发言 {len(user_turns)} 轮）\n\n"
        + history_lines
    )

    objective = task.config.get("objective", "销售沟通")
    system_prompt = await get_config_value(db, "roleplay_eval_system")
    user_template = await get_config_value(db, "roleplay_eval_user")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_template.format(objective=objective, history=history)},
    ]
    try:
        return await llm_service.chat_json(messages)
    except Exception as e:
        logger.error(f"最终评分失败: {e}")
        return {"score": 0, "error": str(e)}


# ## WebSocket 对练主循环 ──────────────────────────────────────────────────
@router.websocket("/ws/roleplay/{task_id}")
async def roleplay_ws(
    websocket: WebSocket,
    task_id: str,
    token: str = Query(...),
    persona_id: str = Query(...),
    mode: str = Query("practice"),
):
    # ## 鉴权
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        persona = await db.get(Persona, persona_id)

        if not task or not persona:
            await websocket.send_json({"type": "error", "message": "任务或角色不存在"})
            await websocket.close()
            return

        # ## 创建 submission & session 记录
        submission = TaskSubmission(
            id=str(uuid.uuid4()), task_id=task_id, user_id=user_id, mode=mode, status="in_progress"
        )
        db.add(submission)

        session = RoleplaySession(
            id=str(uuid.uuid4()), submission_id=submission.id,
            persona_id=persona_id, turns=[],
        )
        db.add(session)
        await db.commit()

        system_prompt = await build_system_prompt(persona, task, db)
        messages = [{"role": "system", "content": system_prompt}]
        turns = []
        ended_by = "user"
        consecutive_timeouts = 0

        # ## AI 开场白
        try:
            messages.append({"role": "user", "content": (
                "请开始对话，以你的角色自然开场。"
                "注意：对方（学员）还没有介绍自己，你不知道他的姓名或职位，"
                "绝对不要称呼对方任何具体的姓名、职位或头衔，用「你好」或结合场景的自然开场即可。"
            )})
            opening = await llm_service.chat(messages)
            messages.append({"role": "assistant", "content": opening})
            turns.append({"turn_id": str(uuid.uuid4()), "role": "ai", "text": opening, "timestamp": datetime.now(timezone.utc).isoformat()})

            await websocket.send_json({
                "type": "session_ready",
                "persona_name": persona.name,
                "persona_avatar_url": persona.avatar_url or "",
                "persona_voice_id": persona.voice_id or "",
                "submission_id": submission.id,
                "session_id": session.id,
            })
            await websocket.send_json({"type": "ai_response", "text": opening, "turn_id": turns[-1]["turn_id"]})
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"开场白生成失败: {e}"})
            await websocket.close()
            return

        # ## 对话循环
        try:
            while True:
                try:
                    raw = await asyncio.wait_for(websocket.receive_text(), timeout=120)
                    consecutive_timeouts = 0
                except asyncio.TimeoutError:
                    consecutive_timeouts += 1
                    if consecutive_timeouts >= 3:
                        break
                    await websocket.send_json({"type": "ping"})
                    continue

                msg = json.loads(raw)
                msg_type = msg.get("type")

                if msg_type == "pong":
                    continue

                if msg_type == "end_session":
                    break

                if msg_type == "user_audio":
                    # ## 音频输入：ASR → LLM
                    audio_b64 = msg.get("audio", "")
                    audio_format = msg.get("format", "webm")
                    tmp_path = UPLOAD_DIR / f"tmp_{uuid.uuid4()}.{audio_format}"
                    tmp_path.write_bytes(base64.b64decode(audio_b64))

                    try:
                        # 并发 ASR + 心跳（每 4s 一次，防止 WS 因静默被关闭）
                        asr_task = asyncio.create_task(asr_service.transcribe(str(tmp_path)))
                        tick = 0
                        while not asr_task.done():
                            await asyncio.sleep(4)
                            if not asr_task.done():
                                tick += 1
                                await websocket.send_json({"type": "asr_progress", "tick": tick})
                        asr_result = asr_task.result()
                        user_text = asr_result.get("text", "") if asr_result["success"] else msg.get("text_fallback", "")
                    finally:
                        tmp_path.unlink(missing_ok=True)

                    if not user_text:
                        await websocket.send_json({"type": "asr_error", "message": "语音识别失败，请重试或切换文字输入"})
                        continue

                    turns.append({"turn_id": str(uuid.uuid4()), "role": "user", "text": user_text, "timestamp": datetime.now(timezone.utc).isoformat()})
                    messages.append({"role": "user", "content": user_text})

                    ai_reply = await llm_service.chat(messages)
                    end_signal = "[END_SIGNAL]" in ai_reply
                    ai_reply_clean = ai_reply.replace("[END_SIGNAL]", "").strip()

                    messages.append({"role": "assistant", "content": ai_reply_clean})
                    turn_id = str(uuid.uuid4())
                    turns.append({"turn_id": turn_id, "role": "ai", "text": ai_reply_clean, "timestamp": datetime.now(timezone.utc).isoformat()})

                    await websocket.send_json({
                        "type": "ai_response",
                        "text": ai_reply_clean,
                        "user_text": user_text,
                        "turn_id": turn_id,
                        "end_signal": end_signal,
                    })

                    if end_signal:
                        ended_by = "ai_signal"
                        break

                elif msg_type == "user_text":
                    # ## 文字输入（语音降级模式）
                    user_text = msg.get("text", "")
                    if not user_text:
                        continue
                    turns.append({"turn_id": str(uuid.uuid4()), "role": "user", "text": user_text, "timestamp": datetime.now(timezone.utc).isoformat()})
                    messages.append({"role": "user", "content": user_text})

                    ai_reply = await llm_service.chat(messages)
                    end_signal = "[END_SIGNAL]" in ai_reply
                    ai_reply_clean = ai_reply.replace("[END_SIGNAL]", "").strip()
                    messages.append({"role": "assistant", "content": ai_reply_clean})
                    turn_id = str(uuid.uuid4())
                    turns.append({"turn_id": turn_id, "role": "ai", "text": ai_reply_clean, "timestamp": datetime.now(timezone.utc).isoformat()})

                    await websocket.send_json({
                        "type": "ai_response", "text": ai_reply_clean,
                        "turn_id": turn_id, "end_signal": end_signal,
                    })
                    if end_signal:
                        ended_by = "ai_signal"
                        break

        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"对练异常: {e}")

        # ## 会话结束：触发综合评分
        await websocket.send_json({"type": "session_ended", "submission_id": submission.id})

        try:
            evaluation = await generate_final_evaluation(turns, persona, task, db)
            async with AsyncSessionLocal() as db2:
                session2 = await db2.get(RoleplaySession, session.id)
                submission2 = await db2.get(TaskSubmission, submission.id)
                if session2:
                    session2.turns = turns
                    session2.final_evaluation = evaluation
                    session2.total_turns = len(turns)
                    session2.completed_at = datetime.now(timezone.utc)
                    session2.ended_by = ended_by
                if submission2:
                    submission2.score = evaluation.get("score", 0)
                    submission2.max_score = 100
                    submission2.ai_feedback = evaluation
                    submission2.status = "completed"
                    submission2.completed_at = datetime.now(timezone.utc)
                await db2.commit()

            await websocket.send_json({"type": "evaluation_ready", "submission_id": submission.id, "evaluation": evaluation})
        except Exception as e:
            logger.error(f"评分保存失败: {e}")

        try:
            await websocket.close()
        except Exception:
            pass


# ## REST: 对练结果查询（带归属校验）─────────────────────────────────────
@router.get("/roleplay/sessions/{submission_id}")
async def get_roleplay_result(submission_id: str, token: str = Query(...)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "未授权")

    current_user_id = payload.get("sub")
    current_role = payload.get("role", "")

    async with AsyncSessionLocal() as db:
        submission = await db.get(TaskSubmission, submission_id)
        if not submission:
            raise HTTPException(404, "对练记录不存在")
        if submission.user_id != current_user_id and current_role not in ("admin", "superadmin"):
            raise HTTPException(403, "无权限访问该会话")

        result = await db.execute(select(RoleplaySession).where(RoleplaySession.submission_id == submission_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(404, "对练记录不存在")
        return {
            "id": session.id,
            "submission_id": session.submission_id,
            "turns": session.turns,
            "final_evaluation": session.final_evaluation,
            "total_turns": session.total_turns,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        }
