import { Router, Response } from "express";
import { z } from "zod";
import { pgPool } from "../config/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const meetingSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  platform: z.enum(["google_meet", "zoom", "teams"]),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(30),
  aiAgentEnabled: z.boolean().default(false),
});

// List meetings
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { upcoming } = req.query;
    let query = `SELECT m.*, c.name as client_name FROM meetings m
                 LEFT JOIN clients c ON m.client_id = c.id
                 WHERE m.tenant_id = $1`;
    const params: string[] = [req.user!.tenantId];

    if (upcoming === "true") {
      query += " AND m.scheduled_at > NOW() AND m.status = 'scheduled'";
    }

    query += " ORDER BY m.scheduled_at ASC";
    const result = await pgPool.query(query, params);
    res.json({ meetings: result.rows });
  } catch (error) {
    logger.error("List meetings error:", error);
    res.status(500).json({ error: "Failed to list meetings" });
  }
});

// Create meeting
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = meetingSchema.parse(req.body);

    // Generate meeting URL based on platform (placeholder - would integrate with actual APIs)
    const meetingUrl = `https://meet.example.com/${req.user!.tenantId}/${Date.now()}`;

    const result = await pgPool.query(
      `INSERT INTO meetings (tenant_id, client_id, title, description, platform, meeting_url, scheduled_at, duration_minutes, ai_agent_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user!.tenantId, data.clientId || null, data.title,
        data.description || null, data.platform, meetingUrl,
        data.scheduledAt, data.durationMinutes, data.aiAgentEnabled,
      ]
    );

    res.status(201).json({ meeting: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create meeting error:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// Update meeting status
router.patch("/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = z.object({
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
    }).parse(req.body);

    const result = await pgPool.query(
      "UPDATE meetings SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *",
      [status, req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    res.json({ meeting: result.rows[0] });
  } catch (error) {
    logger.error("Update meeting status error:", error);
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

export default router;
