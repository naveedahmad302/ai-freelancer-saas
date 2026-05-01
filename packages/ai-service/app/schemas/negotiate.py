from pydantic import BaseModel


class NegotiateRequest(BaseModel):
    tenantId: str
    clientId: str
    service: dict
    rules: list[dict] = []
    clientMessage: str
    proposedPrice: float | None = None


class NegotiateResponse(BaseModel):
    response: str
    suggestedPrice: float
    action: str  # accept, counter, decline
    reasoning: str
