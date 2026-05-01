import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { config } from "./config";
import { connectPostgres, connectMongoDB } from "./config/database";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { startAutomationWorker } from "./queues/automationWorker";

// Routes
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/clients";
import knowledgeRoutes from "./routes/knowledge";
import serviceRoutes from "./routes/services";
import proposalRoutes from "./routes/proposals";
import meetingRoutes from "./routes/meetings";
import conversationRoutes from "./routes/conversations";
import billingRoutes from "./routes/billing";
import automationRoutes from "./routes/automation";
import adminRoutes from "./routes/admin";
import negotiationRoutes from "./routes/negotiation";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(compression());
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Parse JSON for all routes except Stripe webhook
app.use((req, res, next) => {
  if (req.path === "/api/billing/webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use("/api/", apiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "gateway" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/negotiation", negotiationRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function start(): Promise<void> {
  try {
    await connectPostgres();
    await connectMongoDB();
    startAutomationWorker();

    app.listen(config.port, () => {
      logger.info(`Gateway running on port ${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;
