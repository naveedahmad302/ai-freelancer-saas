import { Worker, Job } from "bullmq";
import { config } from "../config";
import { pgPool } from "../config/database";
import { logger } from "../utils/logger";

interface AutomationJobData {
  tenantId: string;
  platform: string;
  action: string;
  config: Record<string, unknown>;
  sessionId: string;
}

export function startAutomationWorker(): void {
  const worker = new Worker<AutomationJobData>(
    "automation",
    async (job: Job<AutomationJobData>) => {
      const { tenantId, platform, action, sessionId } = job.data;
      logger.info(`Processing automation job: ${platform}/${action} for tenant ${tenantId}`);

      try {
        // Update session status
        await pgPool.query(
          "UPDATE automation_sessions SET status = 'running', last_run = NOW() WHERE id = $1",
          [sessionId]
        );

        // Record usage
        await pgPool.query(
          "INSERT INTO usage_records (tenant_id, metric, quantity) VALUES ($1, $2, 1)",
          [tenantId, `automation_${platform}`]
        );

        // Dispatch to appropriate handler
        switch (platform) {
          case "fiverr":
            await handleFiverrAutomation(job.data);
            break;
          default:
            logger.warn(`Unsupported platform: ${platform}`);
        }

        // Update session status to completed
        await pgPool.query(
          "UPDATE automation_sessions SET status = 'idle', updated_at = NOW() WHERE id = $1",
          [sessionId]
        );

        return { success: true };
      } catch (error) {
        // Update session with error
        await pgPool.query(
          "UPDATE automation_sessions SET status = 'error', error_log = $1, updated_at = NOW() WHERE id = $2",
          [String(error), sessionId]
        );
        throw error;
      }
    },
    {
      connection: { url: config.redis.url },
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Automation job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Automation job ${job?.id} failed:`, err);
  });

  logger.info("Automation worker started");
}

async function handleFiverrAutomation(data: AutomationJobData): Promise<void> {
  // This will delegate to the Playwright automation service
  const axios = await import("axios");
  const automationServiceUrl = process.env.AUTOMATION_SERVICE_URL || "http://automation:3001";

  await axios.default.post(`${automationServiceUrl}/fiverr/${data.action}`, {
    tenantId: data.tenantId,
    config: data.config,
  });
}
