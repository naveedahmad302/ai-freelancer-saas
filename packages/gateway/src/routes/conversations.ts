import { Router, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import axios from "axios";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { enforceTenantIsolation } from "../middleware/tenantIsolation";
import { aiLimiter } from "../middleware/rateLimiter";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

// MongoDB Conversation model
const conversationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  clientId: { type: String, required: true },
  platform: { type: String, enum: ["fiverr", "whatsapp", "email", "direct", "website"], required: true },
  status: { type: String, enum: ["active", "archived", "closed"], default: "active" },
  messages: [{
    role: { type: String, enum: ["client", "ai", "user"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  }],
  context: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

const messageSchema = z.object({
  clientId: z.string(),
  platform: z.enum(["fiverr", "whatsapp", "email", "direct", "website"]),
  message: z.string().min(1),
  autoReply: z.boolean().default(true),
});

// List conversations
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platform, status = "active" } = req.query;
    const filter: Record<string, string> = { tenantId: req.user!.tenantId };

    if (platform) filter.platform = platform as string;
    if (status) filter.status = status as string;

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("-messages");

    res.json({ conversations });
  } catch (error) {
    logger.error("List conversations error:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// Get conversation with messages
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      tenantId: req.user!.tenantId,
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({ conversation });
  } catch (error) {
    logger.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// Send message / receive client message
router.post("/message", aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = messageSchema.parse(req.body);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      tenantId: req.user!.tenantId,
      clientId: data.clientId,
      platform: data.platform,
      status: "active",
    });

    if (!conversation) {
      conversation = new Conversation({
        tenantId: req.user!.tenantId,
        clientId: data.clientId,
        platform: data.platform,
        messages: [],
      });
    }

    // Add client message
    conversation.messages.push({
      role: "client",
      content: data.message,
      timestamp: new Date(),
      metadata: {},
    });

    let aiReply = null;

    // Generate AI reply if autoReply is enabled
    if (data.autoReply) {
      try {
        const aiResponse = await axios.post(`${config.aiService.url}/api/chat/reply`, {
          tenantId: req.user!.tenantId,
          clientId: data.clientId,
          message: data.message,
          conversationHistory: conversation.messages.slice(-10),
          platform: data.platform,
        });

        aiReply = aiResponse.data.reply;

        conversation.messages.push({
          role: "ai",
          content: aiReply,
          timestamp: new Date(),
          metadata: { model: aiResponse.data.model },
        });
      } catch (aiError) {
        logger.error("AI reply generation failed:", aiError);
      }
    }

    await conversation.save();

    res.json({
      conversation: conversation._id,
      clientMessage: data.message,
      aiReply,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
      return;
    }
    logger.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
