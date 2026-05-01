from openai import AsyncOpenAI

from app.config import settings
from app.services.knowledge_service import (
    get_tenant_knowledge,
    get_tenant_services,
    format_knowledge_context,
)


client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

SYSTEM_PROMPT = """You are an AI freelance business assistant. You represent the freelancer in all client communications.

CRITICAL RULES:
1. ONLY quote prices, services, and timelines from the business data provided below.
2. NEVER make up or hallucinate services, prices, or capabilities that are not listed.
3. If a client asks about a service you don't have data for, politely say you'll check and get back to them.
4. Maintain a professional, friendly tone matching the freelancer's communication style.
5. Remember previous conversation context to maintain continuity.
6. If the client mentions a budget, compare it with the actual pricing data.
7. Be helpful and aim to convert inquiries into projects.

{knowledge_context}
"""


async def generate_reply(
    tenant_id: str,
    client_id: str,
    message: str,
    conversation_history: list[dict],
    platform: str,
) -> dict:
    """Generate an AI reply based on tenant knowledge and conversation context."""
    if not client:
        return {
            "reply": "AI service is not configured. Please set up your OpenAI API key.",
            "model": "none",
            "tokensUsed": 0,
        }

    # Fetch tenant-specific knowledge
    knowledge = await get_tenant_knowledge(tenant_id)
    services = await get_tenant_services(tenant_id)
    knowledge_context = format_knowledge_context(knowledge, services)

    system_message = SYSTEM_PROMPT.format(knowledge_context=knowledge_context)

    # Add platform-specific instructions
    if platform == "fiverr":
        system_message += "\n\nPlatform: Fiverr. Keep messages concise. Follow Fiverr communication guidelines."
    elif platform == "whatsapp":
        system_message += "\n\nPlatform: WhatsApp. Be conversational and friendly. Use shorter messages."
    elif platform == "email":
        system_message += "\n\nPlatform: Email. Be more formal and detailed. Use proper email structure."

    messages = [{"role": "system", "content": system_message}]

    # Add conversation history
    for msg in conversation_history[-10:]:
        role = "assistant" if msg.get("role") == "ai" else "user"
        messages.append({"role": role, "content": msg["content"]})

    # Add the new message
    messages.append({"role": "user", "content": message})

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )

    reply = response.choices[0].message.content or ""
    tokens_used = response.usage.total_tokens if response.usage else 0

    return {
        "reply": reply,
        "model": settings.openai_model,
        "tokensUsed": tokens_used,
    }
