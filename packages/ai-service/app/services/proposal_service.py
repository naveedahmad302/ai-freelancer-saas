import json

from openai import AsyncOpenAI

from app.config import settings
from app.services.knowledge_service import (
    get_tenant_knowledge,
    get_tenant_services,
    format_knowledge_context,
)


client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

PROPOSAL_PROMPT = """You are a proposal generator for a freelancer. Generate a professional project proposal.

CRITICAL RULES:
1. ONLY use services, pricing, and timelines from the business data below.
2. NEVER make up services or pricing that doesn't exist in the data.
3. If the project requires services not in the data, note that those would need custom quoting.
4. Be professional and persuasive.
5. Include clear pricing breakdown and timeline.

{knowledge_context}

Generate a JSON response with this structure:
{{
  "title": "Proposal title",
  "content": "Full proposal text in markdown",
  "pricing": {{
    "items": [{{"name": "...", "price": ..., "description": "..."}}],
    "total": ...,
    "currency": "USD",
    "notes": "..."
  }},
  "timeline": {{
    "total_days": ...,
    "milestones": [{{"name": "...", "days": ..., "deliverables": ["..."]}}]
  }}
}}
"""


async def generate_proposal(
    tenant_id: str,
    project_description: str,
    client_budget: float | None = None,
    client_timeline: str | None = None,
) -> dict:
    """Generate an AI proposal based on tenant knowledge and project requirements."""
    if not client:
        return {
            "title": "Proposal",
            "content": "AI service is not configured.",
            "pricing": {"items": [], "total": 0},
            "timeline": {"total_days": 0, "milestones": []},
        }

    knowledge = await get_tenant_knowledge(tenant_id)
    services = await get_tenant_services(tenant_id)
    knowledge_context = format_knowledge_context(knowledge, services)

    prompt = PROPOSAL_PROMPT.format(knowledge_context=knowledge_context)

    user_message = f"Project Description: {project_description}"
    if client_budget:
        user_message += f"\nClient Budget: ${client_budget}"
    if client_timeline:
        user_message += f"\nClient Timeline: {client_timeline}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.5,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content)
