import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pgPool } from "../config/database";
import { config } from "../config";
import { authLimiter } from "../middleware/rateLimiter";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  businessName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const client = await pgPool.connect();

    try {
      await client.query("BEGIN");

      // Check existing user
      const existing = await client.query("SELECT id FROM users WHERE email = $1", [data.email]);
      if (existing.rows.length > 0) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      // Create tenant
      const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const tenantResult = await client.query(
        "INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id",
        [data.businessName, `${slug}-${Date.now()}`]
      );
      const tenantId = tenantResult.rows[0].id;

      // Create user
      const passwordHash = await bcrypt.hash(data.password, 12);
      const userResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4, 'owner') RETURNING id, email, full_name, role`,
        [tenantId, data.email, passwordHash, data.fullName]
      );
      const user = userResult.rows[0];

      // Update tenant owner
      await client.query("UPDATE tenants SET owner_id = $1 WHERE id = $2", [user.id, tenantId]);

      await client.query("COMMIT");

      const token = jwt.sign(
        { userId: user.id, tenantId, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiry as string }
      );

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
        tenantId,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await pgPool.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.tenant_id, u.is_active
       FROM users u WHERE u.email = $1`,
      [data.email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: "Account is suspended" });
      return;
    }

    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update last login
    await pgPool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry as string }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      tenantId: user.tenant_id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.avatar_url, u.created_at,
              t.name as tenant_name, t.plan, t.slug
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
