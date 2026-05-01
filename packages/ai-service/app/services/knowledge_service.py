import asyncpg

from app.config import settings


async def get_tenant_knowledge(tenant_id: str) -> dict:
    """Fetch all active business knowledge for a tenant."""
    conn = await asyncpg.connect(settings.database_url)
    try:
        rows = await conn.fetch(
            "SELECT category, title, content FROM business_knowledge WHERE tenant_id = $1 AND is_active = true",
            tenant_id,
        )
        knowledge: dict[str, list[dict]] = {}
        for row in rows:
            category = row["category"]
            if category not in knowledge:
                knowledge[category] = []
            knowledge[category].append({"title": row["title"], "content": row["content"]})
        return knowledge
    finally:
        await conn.close()


async def get_tenant_services(tenant_id: str) -> list[dict]:
    """Fetch all active services/pricing for a tenant."""
    conn = await asyncpg.connect(settings.database_url)
    try:
        rows = await conn.fetch(
            """SELECT name, description, base_price, currency, delivery_time_days, revisions
               FROM services WHERE tenant_id = $1 AND is_active = true""",
            tenant_id,
        )
        return [dict(row) for row in rows]
    finally:
        await conn.close()


def format_knowledge_context(knowledge: dict, services: list[dict]) -> str:
    """Format tenant knowledge into a context string for the AI."""
    sections = []

    if services:
        services_text = "\n".join(
            f"- {s['name']}: ${s['base_price']} {s['currency']}, "
            f"Delivery: {s['delivery_time_days'] or 'TBD'} days, "
            f"Revisions: {s['revisions']}"
            for s in services
        )
        sections.append(f"## Services & Pricing\n{services_text}")

    for category, items in knowledge.items():
        category_title = category.replace("_", " ").title()
        items_text = "\n".join(f"### {item['title']}\n{item['content']}" for item in items)
        sections.append(f"## {category_title}\n{items_text}")

    return "\n\n".join(sections)
