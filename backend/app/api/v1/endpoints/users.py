# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional
import uuid
from app.db.database import get_db
from app.models.user import User
from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["用户管理"])


# ## 请求 Schema ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    phone: Optional[str] = None
    username: Optional[str] = None
    password: str
    role: str = "trainee"
    display_name: Optional[str] = None
    department: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


# ## 序列化工具 ────────────────────────────────────────────────────────────
def user_to_dict(u: User) -> dict:
    return {
        "id": u.id, "phone": u.phone, "username": u.username,
        "role": u.role, "display_name": u.display_name,
        "department": u.department, "is_active": u.is_active,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        "created_at": u.created_at.isoformat(),
    }


# ## 列表 & 搜索 ───────────────────────────────────────────────────────────
@router.get("")
async def list_users(
    page: int = 1, page_size: int = 20,
    role: Optional[str] = None, keyword: Optional[str] = None, search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = select(User)
    if current_user.role != "superadmin":
        q = q.where(User.role != "superadmin")
    if role:
        q = q.where(User.role == role)
    kw = keyword or search
    if kw:
        q = q.where((User.display_name.contains(kw)) | (User.username.contains(kw)) | (User.phone.contains(kw)))
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(q.offset((page - 1) * page_size).limit(page_size))
    return {"total": total, "items": [user_to_dict(u) for u in result.scalars().all()]}


# ## 创建 ──────────────────────────────────────────────────────────────────
@router.post("", status_code=201)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    if current_user.role != "superadmin" and data.role == "superadmin":
        raise HTTPException(403, "无权创建超级管理员")
    phone = data.phone or None
    display_name = data.display_name or None
    if phone:
        if await db.scalar(select(User).where(User.phone == phone)):
            raise HTTPException(400, "手机号已存在")
    try:
        user = User(
            id=str(uuid.uuid4()),
            phone=phone, username=data.username,
            password_hash=hash_password(data.password),
            role=data.role, display_name=display_name,
            department=data.department,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user_to_dict(user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(400, "账号信息冲突，请检查手机号或用户名是否重复")


# ## 读取 & 更新 & 停用 ────────────────────────────────────────────────────
@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "用户不存在")
    return user_to_dict(user)


@router.put("/{user_id}")
async def update_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "用户不存在")
    if current_user.role != "superadmin":
        if user.role == "superadmin":
            raise HTTPException(403, "无权修改超级管理员")
        if data.role == "superadmin":
            raise HTTPException(403, "无权设置超级管理员角色")
    for field, val in data.model_dump(exclude_none=True).items():
        if field == "password":
            user.password_hash = hash_password(val)
        else:
            setattr(user, field, val)
    await db.commit()
    return user_to_dict(user)


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "用户不存在")
    user.is_active = False
    await db.commit()
    return {"ok": True}
