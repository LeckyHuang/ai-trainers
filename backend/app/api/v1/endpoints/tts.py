# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from app.core.deps import get_current_user
from app.services.ai.tts_service import tts_service

router = APIRouter(prefix="/tts", tags=["TTS"])


# ## MiniMax 可用音色列表（Speech-01-Turbo 支持的音色）───────────────────────
MINIMAX_VOICES = [
    # 男声
    {"id": "male-qn-qingse",       "name": "青涩男声",   "gender": "male",   "style": "青年"},
    {"id": "male-qn-jingying",     "name": "精英男声",   "gender": "male",   "style": "商务"},
    {"id": "male-qn-badao",        "name": "霸道总裁",   "gender": "male",   "style": "霸气"},
    {"id": "male-qn-daxuesheng",   "name": "青年学生",   "gender": "male",   "style": "活力"},
    {"id": "presenter_male",       "name": "男主播",     "gender": "male",   "style": "播音"},
    {"id": "audiobook_male_1",     "name": "有声书·男",  "gender": "male",   "style": "沉稳"},
    {"id": "audiobook_male_2",     "name": "有声书·男2", "gender": "male",   "style": "磁性"},
    # 女声
    {"id": "female-shaonv",        "name": "少女音色",   "gender": "female", "style": "清甜"},
    {"id": "female-yujie",         "name": "御姐音色",   "gender": "female", "style": "成熟"},
    {"id": "female-chengshu",      "name": "成熟女声",   "gender": "female", "style": "知性"},
    {"id": "female-tianmei",       "name": "甜美女声",   "gender": "female", "style": "温柔"},
    {"id": "presenter_female",     "name": "女主播",     "gender": "female", "style": "播音"},
    {"id": "audiobook_female_1",   "name": "有声书·女",  "gender": "female", "style": "温婉"},
    {"id": "audiobook_female_2",   "name": "有声书·女2", "gender": "female", "style": "亲切"},
    # 特色
    {"id": "cute_boy",             "name": "可爱男孩",   "gender": "male",   "style": "活泼"},
    {"id": "adorable_girl",        "name": "可爱女孩",   "gender": "female", "style": "活泼"},
]


# ## 音色列表接口 ──────────────────────────────────────────────────────────
@router.get("/voices")
async def list_voices(_=Depends(get_current_user)):
    """返回 MiniMax TTS 支持的音色列表"""
    return {"voices": MINIMAX_VOICES}


# ## 语音合成 ──────────────────────────────────────────────────────────────
@router.get("/synthesize")
async def synthesize(
    text: str = Query(..., min_length=1, max_length=1000),
    voice_id: str = Query("male-qn-jingying", description="MiniMax 音色 ID"),
    _=Depends(get_current_user),
):
    audio = await tts_service.synthesize(text, voice_id=voice_id)
    if not audio:
        raise HTTPException(503, "TTS 合成失败，请确认 TTS_PROVIDER=minimax 且 MINIMAX_API_KEY 有效")
    return Response(content=audio, media_type="audio/mpeg")
