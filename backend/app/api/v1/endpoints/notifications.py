# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["通知"])


# ## 序列化工具 ────────────────────────────────────────────────────────────
def notif_to_dict(n: Notification) -> dict:
    return {
        "id": n.id, "type": n.type, "title": n.title, "body": n.body,
        "task_id": n.task_id, "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }


# ## 列表（未读优先排序）──────────────────────────────────────────────────
@router.get("")
async def list_notifications(
    page: int = 1, page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Notification).where(Notification.user_id == current_user.id).order_by(
        Notification.is_read, Notification.created_at.desc()
    )
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(q.offset((page - 1) * page_size).limit(page_size))
    return {"total": total, "items": [notif_to_dict(n) for n in result.scalars().all()]}


# ## 未读数量 ──────────────────────────────────────────────────────────────
@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = await db.scalar(
        select(func.count()).select_from(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    return {"count": count}


# ## 标记已读 ──────────────────────────────────────────────────────────────
@router.post("/{notif_id}/read")
async def mark_read(notif_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = await db.get(Notification, notif_id)
    if n and n.user_id == current_user.id:
        n.is_read = True
        await db.commit()
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    for n in result.scalars().all():
        n.is_read = True
    await db.commit()
    return {"ok": True}
