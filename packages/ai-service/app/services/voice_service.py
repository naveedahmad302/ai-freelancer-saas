import httpx

from app.config import settings


async def text_to_speech(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> bytes | None:
    """Convert text to speech using ElevenLabs API."""
    if not settings.elevenlabs_api_key:
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                },
            },
        )

        if response.status_code == 200:
            return response.content
        return None


async def get_available_voices() -> list[dict]:
    """Get list of available ElevenLabs voices."""
    if not settings.elevenlabs_api_key:
        return []

    url = "https://api.elevenlabs.io/v1/voices"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"xi-api-key": settings.elevenlabs_api_key},
        )

        if response.status_code == 200:
            data = response.json()
            return [
                {"voice_id": v["voice_id"], "name": v["name"], "category": v.get("category", "")}
                for v in data.get("voices", [])
            ]
        return []
