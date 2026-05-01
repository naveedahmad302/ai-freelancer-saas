# AI Freelancer Autonomous SaaS Platform

A production-ready, scalable, multi-tenant SaaS platform that automates freelance business operations using AI agents, workflow automation (n8n), browser automation (Playwright), and a custom AI backend.

## Architecture

```
Frontend (Next.js) → API Gateway (Express) → AI Service (FastAPI) → n8n → Automation Workers
                                    ↓
                          PostgreSQL / MongoDB / Redis
```

### Core Design Principles

- **Multi-Tenant Isolation**: Every user is a tenant with fully isolated data, AI memory, workflows, and browser sessions
- **AI-First**: OpenAI GPT-4 powers communication, proposals, and negotiations — always grounded in user business data
- **Zero Hallucination**: AI ONLY uses user-provided pricing, services, and business rules
- **Human-Like Automation**: Playwright automation simulates natural human behavior to avoid detection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand |
| API Gateway | Node.js, Express, TypeScript |
| AI Service | FastAPI, Python 3.12, OpenAI, LangChain |
| Automation | Playwright (per-tenant browser profiles) |
| Workflows | n8n (self-hosted) |
| Databases | PostgreSQL 16, MongoDB 7 |
| Vector DB | Pinecone |
| Cache/Queues | Redis 7, BullMQ |
| Voice AI | ElevenLabs TTS, OpenAI Realtime API |
| Billing | Stripe |
| Infrastructure | Docker, Docker Compose |

## Project Structure

```
ai-freelancer-saas/
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment variables template
├── packages/
│   ├── frontend/               # Next.js SaaS Dashboard
│   │   └── src/
│   │       ├── app/            # App Router pages
│   │       │   ├── auth/       # Login/Register
│   │       │   ├── dashboard/  # Main dashboard views
│   │       │   └── admin/      # Admin panel
│   │       ├── lib/            # API client
│   │       └── store/          # Zustand state management
│   ├── gateway/                # Express API Gateway
│   │   └── src/
│   │       ├── routes/         # API endpoints
│   │       ├── middleware/     # Auth, rate limiting, tenant isolation
│   │       ├── config/        # Database connections
│   │       └── queues/        # BullMQ workers
│   ├── ai-service/            # FastAPI AI Backend
│   │   └── app/
│   │       ├── api/           # AI endpoints
│   │       ├── services/      # Chat, proposals, negotiation, memory, voice
│   │       └── schemas/       # Pydantic models
│   └── automation/            # Playwright Workers
│       └── src/
│           ├── fiverr/        # Fiverr-specific automation
│           ├── browser/       # Browser profile management
│           └── utils/         # Human-like behavior simulation
├── n8n/
│   └── workflows/             # Pre-built workflow templates
├── database/
│   ├── postgres/migrations/   # SQL schema
│   └── mongo/init/            # MongoDB indexes & validation
├── scripts/
│   └── setup.sh               # One-click setup
└── docs/                      # Additional documentation
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- API keys: OpenAI, Pinecone, ElevenLabs, Stripe

### Setup

```bash
# 1. Clone & setup
git clone <repo-url>
cd ai-freelancer-saas
./scripts/setup.sh

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run with Docker (recommended)
docker compose up --build

# Or run services individually for development:
docker compose up -d postgres mongo redis n8n

# Terminal 1: API Gateway
cd packages/gateway && npm run dev

# Terminal 2: AI Service
cd packages/ai-service && uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd packages/frontend && npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:4000 |
| AI Service | http://localhost:8000 |
| n8n Workflows | http://localhost:5678 |
| PostgreSQL | localhost:5432 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

## Core Modules

### 1. Authentication & Multi-Tenancy
- JWT-based authentication with role-based access control
- Every user creates a tenant on registration
- All data operations enforce `tenant_id` isolation
- Row-level security on PostgreSQL tables

### 2. AI Communication System
- Reads client messages and generates human-like responses
- Uses tenant's business data (services, pricing, tone) in every reply
- Maintains conversation memory per client
- Supports Fiverr, WhatsApp, email, and direct channels

### 3. Business Knowledge Base
Users upload their:
- Service pricing and delivery timelines
- Portfolio links
- Business rules and FAQs
- Communication tone preferences

The AI references this data in EVERY response — no hallucination.

### 4. Fiverr Automation (Playwright)
- Per-tenant browser profiles with session persistence
- Human-like typing with variable delays
- Anti-detection measures (WebDriver override, random mouse movement)
- Read inbox, send replies, check orders
- BullMQ job queuing with retry logic

### 5. AI Proposal Generator
- Generates professional proposals with accurate pricing
- Creates timeline breakdowns with milestones
- Based ONLY on user's service catalog
- JSON-structured output for consistent rendering

### 6. AI Negotiation Agent
- Follows user-defined negotiation rules (min price, max discount)
- Auto-accepts offers above threshold
- Counters with justified pricing
- Tracks conversation to avoid over-discounting

### 7. Meeting System
- Auto-detect meeting intent from conversations
- Generate meeting links for Google Meet, Zoom, Teams
- Schedule with AI voice agent capability

### 8. Voice AI (ElevenLabs + OpenAI)
- Text-to-speech with natural voices
- Real-time speech understanding
- Available voice catalog per tenant

### 9. CRM & Memory System
- MongoDB for conversation storage
- Vector database (Pinecone) for long-term memory
- Client history, preferences, and project details
- Memory-augmented AI responses

### 10. Billing (Stripe)
- Three plans: Starter ($29), Pro ($79), Enterprise ($199)
- Usage tracking per metric (AI calls, automations, clients)
- Stripe Checkout integration
- Webhook handling for subscription lifecycle

### 11. n8n Workflow Engine
Pre-built workflows:
- Fiverr message handler
- Email automation
- Meeting scheduler
- Custom webhook triggers

### 12. Admin Panel
- View all tenants and their usage
- Suspend/activate accounts
- Platform-wide statistics
- Usage monitoring

## API Reference

### Authentication
```
POST /api/auth/register  - Create account + tenant
POST /api/auth/login     - Login
GET  /api/auth/me        - Get profile
```

### Clients
```
GET    /api/clients      - List clients
POST   /api/clients      - Create client
PUT    /api/clients/:id  - Update client
DELETE /api/clients/:id  - Delete client
```

### Knowledge Base
```
GET    /api/knowledge         - List knowledge entries
POST   /api/knowledge         - Create entry
PUT    /api/knowledge/:id     - Update entry
DELETE /api/knowledge/:id     - Delete entry
```

### AI Communication
```
GET  /api/conversations          - List conversations
GET  /api/conversations/:id      - Get conversation
POST /api/conversations/message  - Send message (auto AI reply)
```

### Proposals
```
GET  /api/proposals          - List proposals
POST /api/proposals          - Create manual proposal
POST /api/proposals/generate - AI generate proposal
```

### Negotiation
```
GET  /api/negotiation/rules     - Get negotiation rules
POST /api/negotiation/rules     - Create rule
POST /api/negotiation/negotiate - AI negotiate
```

### Automation
```
GET  /api/automation/sessions          - List sessions
POST /api/automation/run               - Run automation job
POST /api/automation/stop/:sessionId   - Stop automation
```

### Billing
```
GET  /api/billing/plans        - Get plans
GET  /api/billing/subscription - Get subscription
POST /api/billing/checkout     - Start checkout
POST /api/billing/webhook      - Stripe webhook
```

### Admin
```
GET   /api/admin/tenants            - List tenants
GET   /api/admin/tenants/:id        - Get tenant
PATCH /api/admin/tenants/:id/status - Suspend/activate
GET   /api/admin/stats              - Platform stats
```

## Security

- JWT authentication on all protected routes
- Tenant isolation enforced at middleware level
- Rate limiting (API: 100/15min, Auth: 10/15min, AI: 20/min)
- API keys encrypted at rest
- Stripe webhook signature verification
- Browser automation session isolation per tenant
- Row-level security on PostgreSQL

## Scaling Considerations

- Microservices architecture allows independent scaling
- BullMQ for async job processing with configurable concurrency
- Redis caching layer for frequently accessed data
- MongoDB for horizontal scaling of conversation data
- Docker-based deployment for easy container orchestration
- Connection pooling on PostgreSQL (max 20)

## Environment Variables

See `.env.example` for all required and optional variables.

**Required:**
- `OPENAI_API_KEY` - For AI communication, proposals, negotiation
- `JWT_SECRET` - Authentication secret (change in production!)

**Optional:**
- `PINECONE_API_KEY` - Vector database for long-term memory
- `ELEVENLABS_API_KEY` - Voice AI capabilities
- `STRIPE_SECRET_KEY` - Billing integration
- `GOOGLE_CLIENT_ID/SECRET` - Calendar integration
- `ZOOM_CLIENT_ID/SECRET` - Zoom meeting integration

## License

MIT
