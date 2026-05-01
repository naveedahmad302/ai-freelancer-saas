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

const negotiationRuleSchema = z.object({
  serviceId: z.string().uuid().optional(),
  minPrice: z.number().positive(),
  maxDiscountPercent: z.number().int().min(0).max(50).default(10),
  autoAcceptAbove: z.number().positive().optional(),
  rules: z.record(z.unknown()).optional(),
});

const negotiateSchema = z.object({
  clientId: z.string(),
  serviceId: z.string().uuid(),
  clientMessage: z.string(),
  proposedPrice: z.number().positive().optional(),
});

// Get negotiation rules
router.get("/rules", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      `SELECT nr.*, s.name as service_name FROM negotiation_rules nr
       LEFT JOIN services s ON nr.service_id = s.id
       WHERE nr.tenant_id = $1 AND nr.is_active = true`,
      [req.user!.tenantId]
    );
    res.json({ rules: result.rows });
  } catch (error) {
    logger.error("Get negotiation rules error:", error);
    res.status(500).json({ error: "Failed to get rules" });
  }
});

// Create/update negotiation rule
router.post("/rules", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = negotiationRuleSchema.parse(req.body);
    const result = await pgPool.query(
      `INSERT INTO negotiation_rules (tenant_id, service_id, min_price, max_discount_percent, auto_accept_above, rules)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user!.tenantId, data.serviceId || null, data.minPrice,
        data.maxDiscountPercent, data.autoAcceptAbove || null,
        JSON.stringify(data.rules || {}),
      ]
    );
    res.status(201).json({ rule: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create negotiation rule error:", error);
    res.status(500).json({ error: "Failed to create rule" });
  }
});

// AI negotiate
router.post("/negotiate", aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = negotiateSchema.parse(req.body);

    // Get service and negotiation rules
    const [serviceResult, rulesResult] = await Promise.all([
      pgPool.query("SELECT * FROM services WHERE id = $1 AND tenant_id = $2", [data.serviceId, req.user!.tenantId]),
      pgPool.query(
        "SELECT * FROM negotiation_rules WHERE (service_id = $1 OR service_id IS NULL) AND tenant_id = $2 AND is_active = true",
        [data.serviceId, req.user!.tenantId]
      ),
    ]);

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    const aiResponse = await axios.post(`${config.aiService.url}/api/negotiate`, {
      tenantId: req.user!.tenantId,
      clientId: data.clientId,
      service: serviceResult.rows[0],
      rules: rulesResult.rows,
      clientMessage: data.clientMessage,
      proposedPrice: data.proposedPrice,
    });

    res.json({
      response: aiResponse.data.response,
      suggestedPrice: aiResponse.data.suggestedPrice,
      action: aiResponse.data.action, // accept, counter, decline
      reasoning: aiResponse.data.reasoning,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Negotiate error:", error);
    res.status(500).json({ error: "Failed to negotiate" });
  }
});

export default router;
