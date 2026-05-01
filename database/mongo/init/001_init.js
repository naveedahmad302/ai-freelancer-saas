// ═══════════════════════════════════════════════════════════════
// AI Freelancer SaaS - MongoDB Initial Schema
// ═══════════════════════════════════════════════════════════════

db = db.getSiblingDB("freelancer_saas");

// ─── Conversations Collection ───────────────────────────────
db.createCollection("conversations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "clientId", "platform", "messages"],
      properties: {
        tenantId: { bsonType: "string" },
        clientId: { bsonType: "string" },
        platform: { enum: ["fiverr", "whatsapp", "email", "direct", "website"] },
        status: { enum: ["active", "archived", "closed"] },
        messages: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["role", "content", "timestamp"],
            properties: {
              role: { enum: ["client", "ai", "user"] },
              content: { bsonType: "string" },
              timestamp: { bsonType: "date" },
              metadata: { bsonType: "object" },
            },
          },
        },
        context: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

// ─── AI Memory Collection ───────────────────────────────────
db.createCollection("ai_memory", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "type", "content"],
      properties: {
        tenantId: { bsonType: "string" },
        clientId: { bsonType: "string" },
        type: { enum: ["conversation_summary", "client_preference", "project_detail", "interaction_note"] },
        content: { bsonType: "string" },
        embedding: { bsonType: "array" },
        metadata: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" },
      },
    },
  },
});

// ─── Workflow Logs Collection ───────────────────────────────
db.createCollection("workflow_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "workflowId", "status"],
      properties: {
        tenantId: { bsonType: "string" },
        workflowId: { bsonType: "string" },
        triggerSource: { bsonType: "string" },
        status: { enum: ["running", "completed", "failed"] },
        input: { bsonType: "object" },
        output: { bsonType: "object" },
        error: { bsonType: "string" },
        startedAt: { bsonType: "date" },
        completedAt: { bsonType: "date" },
      },
    },
  },
});

// ─── Audit Logs ─────────────────────────────────────────────
db.createCollection("audit_logs");

// ─── Indexes ────────────────────────────────────────────────
db.conversations.createIndex({ tenantId: 1, clientId: 1 });
db.conversations.createIndex({ tenantId: 1, platform: 1 });
db.conversations.createIndex({ tenantId: 1, updatedAt: -1 });

db.ai_memory.createIndex({ tenantId: 1, clientId: 1 });
db.ai_memory.createIndex({ tenantId: 1, type: 1 });

db.workflow_logs.createIndex({ tenantId: 1, workflowId: 1 });
db.workflow_logs.createIndex({ tenantId: 1, status: 1 });

db.audit_logs.createIndex({ tenantId: 1, createdAt: -1 });
db.audit_logs.createIndex({ tenantId: 1, action: 1 });

print("MongoDB initialization complete");
