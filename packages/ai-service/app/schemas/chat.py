from pydantic import BaseModel


class MessageItem(BaseModel):
    role: str
    content: str


class ChatReplyRequest(BaseModel):
    tenantId: str
    clientId: str
    message: str
    conversationHistory: list[MessageItem] = []
    platform: str = "direct"


class ChatReplyResponse(BaseModel):
    reply: str
    model: str
    tokensUsed: int = 0
