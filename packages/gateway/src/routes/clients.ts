import { Router, Response } from "express";
import { z } from "zod";
import { pgPool } from "../config/database";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  platform: z.string().optional(),
  platformUsername: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// List clients
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", search } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    let query = "SELECT * FROM clients WHERE tenant_id = $1";
    const params: (string | number)[] = [req.user!.tenantId];

    if (search) {
      query += " AND (name ILIKE $2 OR email ILIKE $2 OR platform_username ILIKE $2)";
      params.push(`%${search}%`);
    }

    query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), offset);

    const result = await pgPool.query(query, params);

    const countResult = await pgPool.query(
      "SELECT COUNT(*) FROM clients WHERE tenant_id = $1",
      [req.user!.tenantId]
    );

    res.json({
      clients: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
  } catch (error) {
    logger.error("List clients error:", error);
    res.status(500).json({ error: "Failed to list clients" });
  }
});

// Get single client
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "SELECT * FROM clients WHERE id = $1 AND tenant_id = $2",
      [req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.json({ client: result.rows[0] });
  } catch (error) {
    logger.error("Get client error:", error);
    res.status(500).json({ error: "Failed to get client" });
  }
});

// Create client
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);

    const result = await pgPool.query(
      `INSERT INTO clients (tenant_id, name, email, platform, platform_username, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user!.tenantId,
        data.name,
        data.email || null,
        data.platform || null,
        data.platformUsername || null,
        data.notes || null,
        data.tags || [],
      ]
    );

    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Create client error:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = clientSchema.partial().parse(req.body);

    const fields: string[] = [];
    const values: (string | string[] | null)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.email !== undefined) { fields.push(`email = $${paramIndex++}`); values.push(data.email); }
    if (data.platform !== undefined) { fields.push(`platform = $${paramIndex++}`); values.push(data.platform); }
    if (data.platformUsername !== undefined) { fields.push(`platform_username = $${paramIndex++}`); values.push(data.platformUsername); }
    if (data.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(data.notes); }
    if (data.tags !== undefined) { fields.push(`tags = $${paramIndex++}`); values.push(data.tags); }

    fields.push(`updated_at = NOW()`);
    values.push(req.params.id, req.user!.tenantId);

    const result = await pgPool.query(
      `UPDATE clients SET ${fields.join(", ")} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.json({ client: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Update client error:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "DELETE FROM clients WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [req.params.id, req.user!.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.json({ message: "Client deleted" });
  } catch (error) {
    logger.error("Delete client error:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
