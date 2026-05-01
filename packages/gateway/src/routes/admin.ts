import { Router, Response } from "express";
import { pgPool } from "../config/database";
import { authenticate, AuthenticatedRequest, requireRole } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(requireRole("admin", "super_admin"));

// List all tenants
router.get("/tenants", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      `SELECT t.*, u.email as owner_email, u.full_name as owner_name,
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count
       FROM tenants t LEFT JOIN users u ON t.owner_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json({ tenants: result.rows });
  } catch (error) {
    logger.error("Admin list tenants error:", error);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

// Get tenant details
router.get("/tenants/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantResult = await pgPool.query("SELECT * FROM tenants WHERE id = $1", [req.params.id]);
    if (tenantResult.rows.length === 0) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const usageResult = await pgPool.query(
      `SELECT metric, SUM(quantity) as total FROM usage_records
       WHERE tenant_id = $1 AND recorded_at >= date_trunc('month', NOW())
       GROUP BY metric`,
      [req.params.id]
    );

    res.json({
      tenant: tenantResult.rows[0],
      usage: usageResult.rows,
    });
  } catch (error) {
    logger.error("Admin get tenant error:", error);
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

// Suspend/activate tenant
router.patch("/tenants/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const result = await pgPool.query(
      "UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // If suspending, deactivate all users
    if (status === "suspended") {
      await pgPool.query("UPDATE users SET is_active = false WHERE tenant_id = $1", [req.params.id]);
    } else {
      await pgPool.query("UPDATE users SET is_active = true WHERE tenant_id = $1", [req.params.id]);
    }

    res.json({ tenant: result.rows[0] });
  } catch (error) {
    logger.error("Admin update tenant status error:", error);
    res.status(500).json({ error: "Failed to update tenant status" });
  }
});

// Platform-wide stats
router.get("/stats", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [tenants, users, conversations, proposals] = await Promise.all([
      pgPool.query("SELECT COUNT(*) as count FROM tenants"),
      pgPool.query("SELECT COUNT(*) as count FROM users"),
      pgPool.query("SELECT COUNT(*) as count FROM usage_records WHERE metric = 'ai_call' AND recorded_at >= date_trunc('month', NOW())"),
      pgPool.query("SELECT COUNT(*) as count FROM proposals WHERE created_at >= date_trunc('month', NOW())"),
    ]);

    res.json({
      stats: {
        totalTenants: parseInt(tenants.rows[0].count, 10),
        totalUsers: parseInt(users.rows[0].count, 10),
        monthlyAiCalls: parseInt(conversations.rows[0].count, 10),
        monthlyProposals: parseInt(proposals.rows[0].count, 10),
      },
    });
  } catch (error) {
    logger.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
