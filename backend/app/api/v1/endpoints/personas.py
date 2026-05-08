# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
import uuid, aiofiles, os
from pathlib import Path
from app.db.database import get_db
from app.models.persona import Persona
from app.models.file import File
from app.models.user import User
from app.core.deps import get_current_user, require_admin
from app.services.ai.llm_service import llm_service
from app.services.ai.image_service import image_service
from app.api.v1.endpoints.system_config import get_config_value
from app.core.config import settings

router = APIRouter(prefix="/personas", tags=["角色库"])


# ## 请求 Schema ───────────────────────────────────────────────────────────
class PersonaCreate(BaseModel):
    name: str
    gender: Optional[str] = None
    age: Optional[int] = None
    industry: Optional[str] = None
    position: Optional[str] = None
    experience_years: Optional[int] = None
    big_five: dict = {}
    background: dict = {}
    avatar_url: Optional[str] = None
    voice_id: Optional[str] = None


class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    industry: Optional[str] = None
    position: Optional[str] = None
    experience_years: Optional[int] = None
    big_five: Optional[dict] = None
    background: Optional[dict] = None
    persona_card: Optional[dict] = None
    avatar_url: Optional[str] = None
    voice_id: Optional[str] = None


# ## 序列化工具 ────────────────────────────────────────────────────────────
def persona_to_dict(p: Persona) -> dict:
    return {
        "id": p.id, "name": p.name, "gender": p.gender, "age": p.age,
        "industry": p.industry, "position": p.position,
        "experience_years": p.experience_years,
        "big_five": p.big_five, "background": p.background,
        "persona_card": p.persona_card, "is_active": p.is_active,
        "avatar_url": p.avatar_url, "voice_id": p.voice_id,
        "created_at": p.created_at.isoformat(),
    }


# ## 列表 & CRUD ───────────────────────────────────────────────────────────
@router.get("")
async def list_personas(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    q = select(Persona).where(Persona.is_active == True).order_by(Persona.created_at.desc())
    total = await db.scalar(select(func.count()).select_from(Persona).where(Persona.is_active == True))
    result = await db.execute(q)
    return {"total": total, "items": [persona_to_dict(p) for p in result.scalars().all()]}


@router.post("", status_code=201)
async def create_persona(data: PersonaCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    p = Persona(id=str(uuid.uuid4()), created_by=current_user.id, **data.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return persona_to_dict(p)


@router.get("/{persona_id}")
async def get_persona(persona_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    p = await db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "角色不存在")
    return persona_to_dict(p)


@router.put("/{persona_id}")
async def update_persona(persona_id: str, data: PersonaUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    p = await db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "角色不存在")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(p, field, val)
    await db.commit()
    return persona_to_dict(p)


@router.delete("/{persona_id}")
async def delete_persona(persona_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    p = await db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "角色不存在")
    p.is_active = False
    await db.commit()
    return {"ok": True}


# ## 角色试聊 ──────────────────────────────────────────────────────────────
class TryChatBody(BaseModel):
    messages: list[dict]  # [{"role": "user"|"assistant", "content": "..."}]


@router.post("/{persona_id}/try-chat")
async def try_chat_with_persona(
    persona_id: str,
    body: TryChatBody,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    persona = await db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(404, "角色不存在")
    card = persona.persona_card or {}
    system_prompt = (
        f"你正在扮演虚拟客户进行角色扮演训练（管理员验证模式，不计入正式记录）。\n\n"
        f"【角色信息】\n"
        f"姓名：{card.get('role_name', persona.name)}\n"
        f"年龄：{persona.age or '未知'}岁，{persona.gender or ''}\n"
        f"行业：{persona.industry or '未知'}，职位：{card.get('position', persona.position or '未知')}\n"
        f"背景：{card.get('role_description', '')}\n\n"
        f"【行为画像】\n"
        f"核心动机：{card.get('motivation', '未知')}\n"
        f"关注重点：{card.get('focus', '未知')}\n"
        f"情绪反应：{card.get('emotional_response_mode', '未知')}\n\n"
        f"保持角色扮演，用第一人称回应。回复简洁自然，不超过100字。"
    )
    messages = [{"role": "system", "content": system_prompt}] + body.messages
    try:
        reply = await llm_service.chat(messages)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(500, f"AI响应失败: {str(e)}")


# ## AI 画像生成 ───────────────────────────────────────────────────────────
@router.post("/{persona_id}/generate-card")
async def generate_persona_card(persona_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    p = await db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "角色不存在")

    bg = p.background or {}
    character = bg.get("character", "") if isinstance(bg, dict) else ""
    others = bg.get("others", "") if isinstance(bg, dict) else ""

    persona_info = (
        f"性别：{p.gender or '未知'}\n"
        f"行业：{p.industry or '未知'}\n"
        f"职位角色：{p.position or '未知'}\n"
        f"性格特点：{character or '未设置'}\n"
        f"其他补充：{others or '未设置'}"
    )

    system_prompt = await get_config_value(db, "generate_persona_system")
    user_template = await get_config_value(db, "generate_persona_user")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_template.format(persona_info=persona_info)},
    ]

    card = await llm_service.chat_json(messages)
    if "big_five" in card:
        p.big_five = card.pop("big_five")
    if "role_name" in card:
        p.name = card.pop("role_name")
    if "position" in card and not p.position:
        p.position = card.pop("position")
    else:
        card.pop("position", None)
    p.persona_card = card
    await db.commit()
    return persona_to_dict(p)


# ## AI 头像生成 ───────────────────────────────────────────────────────────
@router.post("/{persona_id}/generate-avatar")
async def generate_persona_avatar(
    persona_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """调用 DashScope Wanx 文生图模型，为角色生成专业头像并存储到本地"""
    p = await db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "角色不存在")

    # 生成图片字节
    img_bytes = await image_service.generate_persona_avatar(
        name=p.name,
        gender=p.gender,
        industry=p.industry,
        position=p.position,
    )
    if not img_bytes:
        raise HTTPException(502, "图片生成失败，请稍后重试")

    # 保存到本地 uploads
    file_id = str(uuid.uuid4())
    storage_key = f"{file_id}.png"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    save_path = upload_dir / storage_key
    async with aiofiles.open(save_path, "wb") as f:
        await f.write(img_bytes)

    # 写入 files 表
    db_file = File(
        id=file_id,
        original_name=f"avatar_{p.name}.png",
        storage_key=storage_key,
        mime_type="image/png",
        size_bytes=len(img_bytes),
        file_type="image",
        uploaded_by=current_user.id,
    )
    db.add(db_file)

    # 更新角色头像 URL（走后端静态文件路径）
    p.avatar_url = f"/uploads/{storage_key}"
    await db.commit()
    return persona_to_dict(p)
