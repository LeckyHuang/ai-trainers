# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.core.deps import require_admin

router = APIRouter(prefix="/audit-logs", tags=["审计日志"])


# ## 列表查询 ──────────────────────────────────────────────────────────────
@router.get("")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(AuditLog)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)
    if action:
        q = q.where(AuditLog.action == action)

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(
        q.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return {
        "total": total,
        "items": [
            {
                "id": log.id, "user_id": log.user_id,
                "action": log.action, "resource_type": log.resource_type,
                "resource_id": log.resource_id, "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
            }
            for log in result.scalars().all()
        ],
    }
