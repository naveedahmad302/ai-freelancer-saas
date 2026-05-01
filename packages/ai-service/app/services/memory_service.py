from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db():
    return get_mongo_client().freelancer_saas


async def store_memory(
    tenant_id: str,
    client_id: str,
    memory_type: str,
    content: str,
    metadata: dict | None = None,
) -> str:
    """Store a memory entry for a tenant-client relationship."""
    db = get_db()
    result = await db.ai_memory.insert_one({
        "tenantId": tenant_id,
        "clientId": client_id,
        "type": memory_type,
        "content": content,
        "metadata": metadata or {},
    })
    return str(result.inserted_id)


async def retrieve_memories(
    tenant_id: str,
    client_id: str | None = None,
    memory_type: str | None = None,
    limit: int = 20,
) -> list[dict]:
    """Retrieve memory entries for a tenant."""
    db = get_db()
    query: dict = {"tenantId": tenant_id}
    if client_id:
        query["clientId"] = client_id
    if memory_type:
        query["type"] = memory_type

    cursor = db.ai_memory.find(query).sort("_id", -1).limit(limit)
    memories = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        memories.append(doc)
    return memories


async def get_conversation_history(
    tenant_id: str,
    client_id: str,
    platform: str | None = None,
) -> list[dict]:
    """Get recent conversation history for a client."""
    db = get_db()
    query: dict = {"tenantId": tenant_id, "clientId": client_id, "status": "active"}
    if platform:
        query["platform"] = platform

    conversation = await db.conversations.find_one(query, sort=[("updatedAt", -1)])
    if not conversation:
        return []

    return conversation.get("messages", [])[-20:]
