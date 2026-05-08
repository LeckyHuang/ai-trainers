# ## Imports & 路由汇总 ────────────────────────────────────────────────────
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, files, questions, personas, tasks, qa, notifications, system_config, audit, tts

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(files.router)
api_router.include_router(questions.router)
api_router.include_router(personas.router)
api_router.include_router(tasks.router)
api_router.include_router(qa.router)
api_router.include_router(notifications.router)
api_router.include_router(system_config.router, prefix="/system-config", tags=["system-config"])
api_router.include_router(audit.router)
api_router.include_router(tts.router)
