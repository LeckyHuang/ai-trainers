# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid
from app.db.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["认证"])


# ## 请求 / 响应 Schema ─────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str  # 手机号 或 username
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


# ## 登录 ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            ((User.phone == data.username) | (User.username == data.username)) & (User.is_active == True)
        )
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    user.last_login_at = datetime.now(timezone.utc)
    db.add(AuditLog(
        id=str(uuid.uuid4()), user_id=user.id,
        action="login", resource_type="user", resource_id=user.id,
    ))
    await db.commit()

    token_data = {"sub": user.id, "role": user.role}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "user": {
            "id": user.id, "role": user.role,
            "display_name": user.display_name or user.username or user.phone,
            "phone": user.phone, "username": user.username,
        },
    }


# ## 刷新 Token ────────────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效的刷新令牌")
    token_data = {"sub": payload["sub"], "role": payload["role"]}
    return {"access_token": create_access_token(token_data)}


# ## 当前用户信息 ──────────────────────────────────────────────────────────
@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "role": current_user.role,
        "display_name": current_user.display_name or current_user.username or current_user.phone,
        "phone": current_user.phone,
        "username": current_user.username,
        "department": current_user.department,
    }


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None


@router.patch("/me")
async def update_me(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip() or current_user.display_name
    await db.commit()
    return {
        "id": current_user.id,
        "role": current_user.role,
        "display_name": current_user.display_name or current_user.username or current_user.phone,
        "phone": current_user.phone,
        "username": current_user.username,
        "department": current_user.department,
    }


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="新密码至少6位")
    current_user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "密码修改成功"}
