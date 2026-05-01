import { Router, Response } from "express";
import { z } from "zod";
import { Queue } from "bullmq";
import { pgPool } from "../config/database";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

// BullMQ queue for automation jobs
const automationQueue = new Queue("automation", {
  connection: { url: config.redis.url },
});

const automationConfigSchema = z.object({
  platform: z.enum(["fiverr", "upwork", "freelancer"]),
  action: z.enum(["read_messages", "send_reply", "check_orders", "update_profile"]),
  config: z.record(z.unknown()).optional(),
});

// List automation sessions
router.get("/sessions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "SELECT * FROM automation_sessions WHERE tenant_id = $1 ORDER BY updated_at DESC",
      [req.user!.tenantId]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    logger.error("List automation sessions error:", error);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// Start automation job
router.post("/run", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = automationConfigSchema.parse(req.body);

    // Create or update session
    const sessionResult = await pgPool.query(
      `INSERT INTO automation_sessions (tenant_id, platform, status, config)
       VALUES ($1, $2, 'running', $3)
       ON CONFLICT (tenant_id, platform) WHERE status != 'running'
       DO UPDATE SET status = 'running', config = $3, last_run = NOW(), updated_at = NOW()
       RETURNING *`,
      [req.user!.tenantId, data.platform, JSON.stringify(data.config || {})]
    );

    // Queue the automation job
    const job = await automationQueue.add(`${data.platform}-${data.action}`, {
      tenantId: req.user!.tenantId,
      platform: data.platform,
      action: data.action,
      config: data.config,
      sessionId: sessionResult.rows[0]?.id,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    res.json({
      jobId: job.id,
      session: sessionResult.rows[0],
      message: "Automation job queued",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Run automation error:", error);
    res.status(500).json({ error: "Failed to start automation" });
  }
});

// Stop automation
router.post("/stop/:sessionId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "UPDATE automation_sessions SET status = 'idle', updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [req.params.sessionId, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({ session: result.rows[0], message: "Automation stopped" });
  } catch (error) {
    logger.error("Stop automation error:", error);
    res.status(500).json({ error: "Failed to stop automation" });
  }
});

export default router;
