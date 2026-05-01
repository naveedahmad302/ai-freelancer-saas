from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatReplyRequest, ChatReplyResponse
from app.services.chat_service import generate_reply

router = APIRouter()


@router.post("/reply", response_model=ChatReplyResponse)
async def create_reply(request: ChatReplyRequest):
    try:
        result = await generate_reply(
            tenant_id=request.tenantId,
            client_id=request.clientId,
            message=request.message,
            conversation_history=[msg.model_dump() for msg in request.conversationHistory],
            platform=request.platform,
        )
        return ChatReplyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
