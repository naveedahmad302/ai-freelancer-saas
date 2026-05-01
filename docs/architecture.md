# System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                       │
│  Landing Page | Dashboard | Admin Panel | Auth               │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────────────┐
│                   API GATEWAY (Express)                       │
│  Auth | Rate Limiting | Tenant Isolation | Route Handlers    │
│  └── BullMQ Workers (Automation Job Queue)                   │
└────┬──────────┬──────────┬──────────┬────────────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────────────────┐
│PostgreSQL│ │MongoDB │ │ Redis  │ │    AI SERVICE (FastAPI)   │
│ Users   │ │ Convos │ │ Cache  │ │  Chat | Proposals | Nego  │
│ Billing │ │ Memory │ │ Queue  │ │  Memory | Voice           │
│ Services│ │ Logs   │ │        │ │  └── OpenAI / LangChain   │
└────────┘ └────────┘ └────────┘ └─────────┬──────────────────┘
                                            │
                                   ┌────────▼──────────┐
                                   │   Pinecone (Vector │
                                   │   Memory Store)    │
                                   └───────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  n8n WORKFLOW ENGINE                           │
│  Fiverr Handler | Email Automation | Meeting Scheduler       │
│  Custom Webhooks | Event Triggers                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              AUTOMATION WORKERS (Playwright)                  │
│  Per-Tenant Browser Profiles | Human-Like Behavior           │
│  Fiverr: Read Inbox | Send Reply | Check Orders             │
└──────────────────────────────────────────────────────────────┘
```

## Tenant Isolation Model

Every request passes through tenant isolation middleware:

1. **Authentication**: JWT token contains `tenantId`
2. **Middleware**: `enforceTenantIsolation` injects `tenantId` into all queries
3. **Database**: All tables include `tenant_id` column with indexes
4. **Row-Level Security**: PostgreSQL RLS policies enforce isolation
5. **AI Memory**: Separate vector namespaces per tenant in Pinecone
6. **Browser Profiles**: Isolated Playwright storage state per tenant
7. **n8n Workflows**: All payloads include `tenantId` field

## Data Flow: Client Message → AI Reply

```
1. Client sends message on Fiverr
2. Playwright automation reads message
3. BullMQ job queued with tenant context
4. Gateway receives message via automation worker
5. Gateway calls AI Service with:
   - Tenant's business knowledge
   - Tenant's service catalog
   - Conversation history
   - Platform context
6. AI generates reply using ONLY tenant data
7. Reply stored in MongoDB conversation
8. Playwright sends reply with human-like typing
```

## Data Flow: Proposal Generation

```
1. User requests proposal via dashboard
2. Gateway sends to AI Service:
   - Project description
   - Client budget/timeline
   - All tenant services & pricing
   - Business knowledge
3. AI generates structured proposal:
   - Title & content
   - Itemized pricing (from real services)
   - Timeline with milestones
4. Proposal saved to PostgreSQL
5. User reviews and sends to client
```

## Security Architecture

- **Transport**: HTTPS in production
- **Authentication**: JWT with configurable expiry
- **Authorization**: Role-based (user, owner, admin, super_admin)
- **Rate Limiting**: Per-route with express-rate-limit
- **Input Validation**: Zod (gateway) + Pydantic (AI service)
- **Secrets**: API keys encrypted, never exposed in responses
- **Automation**: Anti-detection measures, session isolation
