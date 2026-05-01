from fastapi import APIRouter, HTTPException

from app.schemas.proposals import GenerateProposalRequest, ProposalResponse
from app.services.proposal_service import generate_proposal

router = APIRouter()


@router.post("/generate", response_model=ProposalResponse)
async def create_proposal(request: GenerateProposalRequest):
    try:
        result = await generate_proposal(
            tenant_id=request.tenantId,
            project_description=request.projectDescription,
            client_budget=request.clientBudget,
            client_timeline=request.clientTimeline,
        )
        return ProposalResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
