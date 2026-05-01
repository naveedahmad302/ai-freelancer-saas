import { Router, Response } from "express";
import { z } from "zod";
import { pgPool } from "../config/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  deliveryTimeDays: z.number().int().positive().optional(),
  revisions: z.number().int().min(0).default(1),
  metadata: z.record(z.unknown()).optional(),
});

// List services
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "SELECT * FROM services WHERE tenant_id = $1 AND is_active = true ORDER BY name",
      [req.user!.tenantId]
    );
    res.json({ services: result.rows });
  } catch (error) {
    logger.error("List services error:", error);
    res.status(500).json({ error: "Failed to list services" });
  }
});

// Create service
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = serviceSchema.parse(req.body);
    const result = await pgPool.query(
      `INSERT INTO services (tenant_id, name, description, base_price, currency, delivery_time_days, revisions, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user!.tenantId, data.name, data.description || null,
        data.basePrice, data.currency, data.deliveryTimeDays || null,
        data.revisions, data.metadata || {},
      ]
    );
    res.status(201).json({ service: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create service error:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

// Update service
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const result = await pgPool.query(
      `UPDATE services SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        base_price = COALESCE($3, base_price),
        currency = COALESCE($4, currency),
        delivery_time_days = COALESCE($5, delivery_time_days),
        revisions = COALESCE($6, revisions),
        metadata = COALESCE($7, metadata),
        updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9 RETURNING *`,
      [data.name, data.description, data.basePrice, data.currency,
       data.deliveryTimeDays, data.revisions, data.metadata,
       req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json({ service: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Update service error:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Delete service
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [req.params.id, req.user!.tenantId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json({ message: "Service deleted" });
  } catch (error) {
    logger.error("Delete service error:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
