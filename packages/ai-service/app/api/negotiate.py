from fastapi import APIRouter, HTTPException

from app.schemas.negotiate import NegotiateRequest, NegotiateResponse
from app.services.negotiation_service import negotiate

router = APIRouter()


@router.post("", response_model=NegotiateResponse)
async def handle_negotiation(request: NegotiateRequest):
    try:
        result = await negotiate(
            tenant_id=request.tenantId,
            client_id=request.clientId,
            service=request.service,
            rules=request.rules,
            client_message=request.clientMessage,
            proposed_price=request.proposedPrice,
        )
        return NegotiateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
