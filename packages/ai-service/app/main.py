from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, proposals, negotiate, memory, voice

app = FastAPI(
    title="AI Freelancer Service",
    description="AI Service Layer for Freelancer SaaS Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}


app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(proposals.router, prefix="/api/proposals", tags=["proposals"])
app.include_router(negotiate.router, prefix="/api/negotiate", tags=["negotiation"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
