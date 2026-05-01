import { Router, Response } from "express";
import { z } from "zod";
import axios from "axios";
import { pgPool } from "../config/database";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { aiLimiter } from "../middleware/rateLimiter";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const proposalSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  pricing: z.record(z.unknown()).optional(),
  timeline: z.record(z.unknown()).optional(),
  source: z.string().optional(),
});

const generateProposalSchema = z.object({
  clientId: z.string().uuid().optional(),
  projectDescription: z.string().min(10),
  clientBudget: z.number().optional(),
  clientTimeline: z.string().optional(),
});

// List proposals
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    let query = `SELECT p.*, c.name as client_name FROM proposals p
                 LEFT JOIN clients c ON p.client_id = c.id
                 WHERE p.tenant_id = $1`;
    const params: (string | number)[] = [req.user!.tenantId];

    if (status) {
      query += ` AND p.status = $${params.length + 1}`;
      params.push(status as string);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), offset);

    const result = await pgPool.query(query, params);
    res.json({ proposals: result.rows });
  } catch (error) {
    logger.error("List proposals error:", error);
    res.status(500).json({ error: "Failed to list proposals" });
  }
});

// Generate AI proposal
router.post("/generate", aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = generateProposalSchema.parse(req.body);

    const aiResponse = await axios.post(`${config.aiService.url}/api/proposals/generate`, {
      tenantId: req.user!.tenantId,
      ...data,
    });

    const proposal = aiResponse.data;

    // Save the generated proposal
    const result = await pgPool.query(
      `INSERT INTO proposals (tenant_id, client_id, title, content, pricing, timeline, status, ai_generated, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', true, $7) RETURNING *`,
      [
        req.user!.tenantId,
        data.clientId || null,
        proposal.title,
        proposal.content,
        JSON.stringify(proposal.pricing),
        JSON.stringify(proposal.timeline),
        "ai_generated",
      ]
    );

    res.status(201).json({ proposal: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Generate proposal error:", error);
    res.status(500).json({ error: "Failed to generate proposal" });
  }
});

// Create manual proposal
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = proposalSchema.parse(req.body);
    const result = await pgPool.query(
      `INSERT INTO proposals (tenant_id, client_id, title, content, pricing, timeline, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user!.tenantId, data.clientId || null, data.title,
        data.content || "", JSON.stringify(data.pricing || {}),
        JSON.stringify(data.timeline || {}), data.source || "manual",
      ]
    );
    res.status(201).json({ proposal: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create proposal error:", error);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

// Update proposal status
router.patch("/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = z.object({ status: z.enum(["draft", "sent", "accepted", "rejected"]) }).parse(req.body);
    const result = await pgPool.query(
      "UPDATE proposals SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *",
      [status, req.params.id, req.user!.tenantId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    res.json({ proposal: result.rows[0] });
  } catch (error) {
    logger.error("Update proposal status error:", error);
    res.status(500).json({ error: "Failed to update proposal" });
  }
});

export default router;
