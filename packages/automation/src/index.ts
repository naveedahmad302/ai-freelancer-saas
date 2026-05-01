import { Worker, Job } from "bullmq";
import { FiverrAutomation } from "./fiverr/fiverrAutomation";
import { BrowserManager } from "./browser/browserManager";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PROFILES_DIR = process.env.BROWSER_PROFILES_DIR || "/data/browser-profiles";

const browserManager = new BrowserManager(PROFILES_DIR);

interface AutomationJobData {
  tenantId: string;
  platform: string;
  action: string;
  config: Record<string, unknown>;
}

const worker = new Worker<AutomationJobData>(
  "automation",
  async (job: Job<AutomationJobData>) => {
    const { tenantId, platform, action, config: jobConfig } = job.data;
    logger.info(`Processing: ${platform}/${action} for tenant ${tenantId}`);

    if (platform === "fiverr") {
      const fiverr = new FiverrAutomation(browserManager, tenantId);

      switch (action) {
        case "read_messages":
          return await fiverr.readMessages();
        case "send_reply":
          return await fiverr.sendReply(
            jobConfig.conversationId as string,
            jobConfig.message as string
          );
        case "check_orders":
          return await fiverr.checkOrders();
        default:
          throw new Error(`Unknown Fiverr action: ${action}`);
      }
    }

    throw new Error(`Unsupported platform: ${platform}`);
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 3,
  }
);

worker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});

logger.info("Automation worker started");
