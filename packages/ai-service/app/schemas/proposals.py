from pydantic import BaseModel


class GenerateProposalRequest(BaseModel):
    tenantId: str
    clientId: str | None = None
    projectDescription: str
    clientBudget: float | None = None
    clientTimeline: str | None = None


class ProposalResponse(BaseModel):
    title: str
    content: str
    pricing: dict
    timeline: dict
