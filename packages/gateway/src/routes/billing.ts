import { Router, Request, Response } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { pgPool } from "../config/database";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { logger } from "../utils/logger";

const router = Router();

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
  : null;

const PLANS = {
  starter: { name: "Starter", price: 29, aiCalls: 500, automations: 3, clients: 50 },
  pro: { name: "Pro", price: 79, aiCalls: 5000, automations: 20, clients: 500 },
  enterprise: { name: "Enterprise", price: 199, aiCalls: -1, automations: -1, clients: -1 },
};

// Get available plans
router.get("/plans", (_req: Request, res: Response) => {
  res.json({ plans: PLANS });
});

// Get current subscription
router.get("/subscription", authenticate, enforceTenantIsolation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pgPool.query(
      "SELECT * FROM subscriptions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.user!.tenantId]
    );

    const subscription = result.rows[0] || { plan: "starter", status: "active" };
    const plan = PLANS[subscription.plan as keyof typeof PLANS] || PLANS.starter;

    // Get current usage
    const usageResult = await pgPool.query(
      `SELECT metric, SUM(quantity) as total FROM usage_records 
       WHERE tenant_id = $1 AND recorded_at >= date_trunc('month', NOW())
       GROUP BY metric`,
      [req.user!.tenantId]
    );

    const usage: Record<string, number> = {};
    for (const row of usageResult.rows) {
      usage[row.metric] = parseInt(row.total, 10);
    }

    res.json({ subscription, plan, usage });
  } catch (error) {
    logger.error("Get subscription error:", error);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

// Create checkout session
router.post("/checkout", authenticate, enforceTenantIsolation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!stripe) {
      res.status(503).json({ error: "Billing not configured" });
      return;
    }

    const { plan } = z.object({ plan: z.enum(["starter", "pro", "enterprise"]) }).parse(req.body);
    const priceId = config.stripe.prices[plan];

    if (!priceId) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    // Get or create Stripe customer
    let customerId: string;
    const subResult = await pgPool.query(
      "SELECT stripe_customer_id FROM subscriptions WHERE tenant_id = $1 LIMIT 1",
      [req.user!.tenantId]
    );

    if (subResult.rows.length > 0 && subResult.rows[0].stripe_customer_id) {
      customerId = subResult.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        metadata: { tenantId: req.user!.tenantId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/dashboard/billing?success=true`,
      cancel_url: `${req.headers.origin}/dashboard/billing?cancelled=true`,
      metadata: { tenantId: req.user!.tenantId, plan },
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe webhook
router.post("/webhook", async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: "Billing not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan;

        if (tenantId && plan) {
          await pgPool.query(
            `INSERT INTO subscriptions (tenant_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_start)
             VALUES ($1, $2, $3, $4, 'active', NOW())
             ON CONFLICT (tenant_id) DO UPDATE SET
               stripe_subscription_id = $3, plan = $4, status = 'active', updated_at = NOW()`,
            [tenantId, session.customer, session.subscription, plan]
          );
          await pgPool.query("UPDATE tenants SET plan = $1 WHERE id = $2", [plan, tenantId]);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await pgPool.query(
          "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE stripe_subscription_id = $1",
          [subscription.id]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
});

export default router;
