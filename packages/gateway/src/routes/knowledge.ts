import { Router, Response } from "express";
import { z } from "zod";
import { pgPool } from "../config/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const knowledgeSchema = z.object({
  category: z.enum([
    "pricing", "portfolio", "delivery_timeline", "business_rules",
    "faq", "communication_tone", "services", "custom",
  ]),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

// List knowledge entries
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM business_knowledge WHERE tenant_id = $1 AND is_active = true";
    const params: string[] = [req.user!.tenantId];

    if (category) {
      query += " AND category = $2";
      params.push(category as string);
    }

    query += " ORDER BY category, created_at DESC";
    const result = await pgPool.query(query, params);

    res.json({ knowledge: result.rows });
  } catch (error) {
    logger.error("List knowledge error:", error);
    res.status(500).json({ error: "Failed to list knowledge" });
  }
});

// Create knowledge entry
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = knowledgeSchema.parse(req.body);

    const result = await pgPool.query(
      `INSERT INTO business_knowledge (tenant_id, category, title, content, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.tenantId, data.category, data.title, data.content, data.metadata || {}]
    );

    res.status(201).json({ knowledge: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create knowledge error:", error);
    res.status(500).json({ error: "Failed to create knowledge" });
  }
});

// Update knowledge entry
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = knowledgeSchema.partial().parse(req.body);

    const result = await pgPool.query(
      `UPDATE business_knowledge 
       SET category = COALESCE($1, category),
           title = COALESCE($2, title),
           content = COALESCE($3, content),
           metadata = COALESCE($4, metadata),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6 RETURNING *`,
      [data.category, data.title, data.content, data.metadata, req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Knowledge entry not found" });
      return;
    }

    res.json({ knowledge: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Update knowledge error:", error);
    res.status(500).json({ error: "Failed to update knowledge" });
  }
});

// Delete knowledge entry
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "UPDATE business_knowledge SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Knowledge entry not found" });
      return;
    }

    res.json({ message: "Knowledge entry deleted" });
  } catch (error) {
    logger.error("Delete knowledge error:", error);
    res.status(500).json({ error: "Failed to delete knowledge" });
  }
});

export default router;
