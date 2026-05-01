from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.memory_service import store_memory, retrieve_memories

router = APIRouter()


class StoreMemoryRequest(BaseModel):
    tenantId: str
    clientId: str
    type: str
    content: str
    metadata: dict | None = None


class RetrieveMemoryRequest(BaseModel):
    tenantId: str
    clientId: str | None = None
    type: str | None = None
    limit: int = 20


@router.post("/store")
async def store(request: StoreMemoryRequest):
    try:
        memory_id = await store_memory(
            tenant_id=request.tenantId,
            client_id=request.clientId,
            memory_type=request.type,
            content=request.content,
            metadata=request.metadata,
        )
        return {"id": memory_id, "status": "stored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrieve")
async def retrieve(request: RetrieveMemoryRequest):
    try:
        memories = await retrieve_memories(
            tenant_id=request.tenantId,
            client_id=request.clientId,
            memory_type=request.type,
            limit=request.limit,
        )
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
