from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.voice_service import text_to_speech, get_available_voices

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voiceId: str = "21m00Tcm4TlvDq8ikWAM"


@router.post("/tts")
async def convert_text_to_speech(request: TTSRequest):
    audio_bytes = await text_to_speech(request.text, request.voiceId)
    if audio_bytes is None:
        raise HTTPException(status_code=503, detail="Voice service not configured or unavailable")
    return Response(content=audio_bytes, media_type="audio/mpeg")


@router.get("/voices")
async def list_voices():
    voices = await get_available_voices()
    return {"voices": voices}
