import json

from openai import AsyncOpenAI

from app.config import settings


client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

NEGOTIATION_PROMPT = """You are a negotiation AI for a freelancer. Handle pricing negotiations intelligently.

Service Details:
- Name: {service_name}
- Base Price: ${base_price}
- Description: {service_description}

Negotiation Rules:
- Minimum acceptable price: ${min_price}
- Maximum discount: {max_discount}%
- Auto-accept above: ${auto_accept}

Guidelines:
1. Never go below the minimum price.
2. Start by justifying the base price with value delivered.
3. If the client's budget is reasonable, offer small concessions.
4. If the budget is too low, politely explain the value and suggest alternatives.
5. Always be professional and aim to close the deal.
6. Track the conversation to avoid over-discounting.

Respond as JSON:
{{
  "response": "Your negotiation message to the client",
  "suggestedPrice": <number>,
  "action": "accept" | "counter" | "decline",
  "reasoning": "Internal reasoning for this decision"
}}
"""


async def negotiate(
    tenant_id: str,
    client_id: str,
    service: dict,
    rules: list[dict],
    client_message: str,
    proposed_price: float | None = None,
) -> dict:
    """AI-powered price negotiation."""
    if not client:
        return {
            "response": "AI service is not configured.",
            "suggestedPrice": float(service.get("base_price", 0)),
            "action": "counter",
            "reasoning": "AI not available",
        }

    # Use the most specific rule
    rule = rules[0] if rules else {}
    base_price = float(service.get("base_price", 0))
    min_price = float(rule.get("min_price", base_price * 0.8))
    max_discount = int(rule.get("max_discount_percent", 10))
    auto_accept = float(rule.get("auto_accept_above", base_price))

    # Quick decision for prices above auto-accept
    if proposed_price and proposed_price >= auto_accept:
        return {
            "response": f"That works perfectly! I'd be happy to proceed at ${proposed_price}. Shall I send you a formal proposal?",
            "suggestedPrice": proposed_price,
            "action": "accept",
            "reasoning": f"Proposed price ${proposed_price} is at or above auto-accept threshold ${auto_accept}",
        }

    # Quick decline for prices below minimum
    if proposed_price and proposed_price < min_price:
        return {
            "response": (
                f"I appreciate your interest, but ${proposed_price} is below what I can offer for this service. "
                f"The minimum I can work with is ${min_price}. Would that work for your budget?"
            ),
            "suggestedPrice": min_price,
            "action": "counter",
            "reasoning": f"Proposed price ${proposed_price} is below minimum ${min_price}",
        }

    prompt = NEGOTIATION_PROMPT.format(
        service_name=service.get("name", ""),
        base_price=base_price,
        service_description=service.get("description", ""),
        min_price=min_price,
        max_discount=max_discount,
        auto_accept=auto_accept,
    )

    user_msg = f"Client message: {client_message}"
    if proposed_price:
        user_msg += f"\nClient's proposed price: ${proposed_price}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.6,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content)
