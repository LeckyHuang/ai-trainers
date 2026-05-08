# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pathlib import Path
import uuid, aiofiles, os
from app.db.database import get_db
from app.models.file import File
from app.models.user import User
from app.core.deps import get_current_user, require_admin
from app.core.security import decode_token
from app.core.config import settings

router = APIRouter(prefix="/files", tags=["文件库"])

# ## 上传目录初始化 ─────────────────────────────────────────────────────────
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "application/pdf": "material",
    "audio/mpeg": "audio", "audio/mp3": "audio", "audio/mp4": "audio",
    "audio/webm": "audio", "audio/ogg": "audio", "audio/wav": "audio",
    "video/mp4": "video", "video/webm": "video",
    "image/jpeg": "image", "image/png": "image", "image/gif": "image",
}


# ## 序列化工具 ────────────────────────────────────────────────────────────
def file_to_dict(f: File) -> dict:
    return {
        "id": f.id, "original_name": f.original_name,
        "mime_type": f.mime_type, "size_bytes": f.size_bytes,
        "file_type": f.file_type, "storage_key": f.storage_key,
        "created_at": f.created_at.isoformat(),
    }


# ## 上传 ──────────────────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_id = str(uuid.uuid4())
    suffix = Path(file.filename or "file").suffix
    storage_key = f"{file_id}{suffix}"
    save_path = UPLOAD_DIR / storage_key

    async with aiofiles.open(save_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    file_type = ALLOWED_TYPES.get(file.content_type, "other")
    db_file = File(
        id=file_id, original_name=file.filename or "unknown",
        storage_key=storage_key, mime_type=file.content_type,
        size_bytes=len(content), file_type=file_type,
        uploaded_by=current_user.id,
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    return file_to_dict(db_file)


# ## 列表 & 获取 ───────────────────────────────────────────────────────────
@router.get("")
async def list_files(
    page: int = 1, page_size: int = 20,
    file_type: str = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(File)
    if file_type:
        q = q.where(File.file_type == file_type)
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    result = await db.execute(q.order_by(File.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return {"total": total, "items": [file_to_dict(f) for f in result.scalars().all()]}


@router.get("/{file_id}")
async def get_file(file_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    f = await db.get(File, file_id)
    if not f:
        raise HTTPException(404, "文件不存在")
    return file_to_dict(f)


# ## 下载（?token= 认证，供浏览器直接 <a href> 下载使用）──────────────────
@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    token: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if not token:
        raise HTTPException(401, "需要认证，请携带 token 参数")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(401, "无效令牌")
    result = await db.execute(select(User).where(User.id == payload.get("sub"), User.is_active == True))
    if not result.scalar_one_or_none():
        raise HTTPException(401, "用户不存在")

    f = await db.get(File, file_id)
    if not f:
        raise HTTPException(404, "文件不存在")
    path = UPLOAD_DIR / f.storage_key
    if not path.exists():
        raise HTTPException(404, "文件已丢失")
    return FileResponse(str(path), filename=f.original_name, media_type=f.mime_type or "application/octet-stream")


# ## 删除 ──────────────────────────────────────────────────────────────────
@router.delete("/{file_id}")
async def delete_file(file_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    f = await db.get(File, file_id)
    if not f:
        raise HTTPException(404, "文件不存在")
    path = UPLOAD_DIR / f.storage_key
    if path.exists():
        path.unlink()
    await db.delete(f)
    await db.commit()
    return {"ok": True}
