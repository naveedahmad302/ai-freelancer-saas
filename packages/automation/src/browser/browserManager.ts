import { chromium, Browser, BrowserContext } from "playwright";
import path from "path";
import fs from "fs";

export class BrowserManager {
  private profilesDir: string;
  private contexts: Map<string, BrowserContext> = new Map();
  private browser: Browser | null = null;

  constructor(profilesDir: string) {
    this.profilesDir = profilesDir;
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });
    }
    return this.browser;
  }

  async getContext(tenantId: string): Promise<BrowserContext> {
    // Check if we already have an active context for this tenant
    const existing = this.contexts.get(tenantId);
    if (existing) {
      return existing;
    }

    const browser = await this.getBrowser();
    const profileDir = path.join(this.profilesDir, tenantId);

    // Create tenant profile directory if it doesn't exist
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    // Load or create storage state
    const storagePath = path.join(profileDir, "storage-state.json");
    const hasStorage = fs.existsSync(storagePath);

    const context = await browser.newContext({
      storageState: hasStorage ? storagePath : undefined,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    // Anti-detection: override navigator.webdriver
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    this.contexts.set(tenantId, context);
    return context;
  }

  async saveContext(tenantId: string): Promise<void> {
    const context = this.contexts.get(tenantId);
    if (context) {
      const storagePath = path.join(this.profilesDir, tenantId, "storage-state.json");
      await context.storageState({ path: storagePath });
    }
  }

  async closeContext(tenantId: string): Promise<void> {
    const context = this.contexts.get(tenantId);
    if (context) {
      await this.saveContext(tenantId);
      await context.close();
      this.contexts.delete(tenantId);
    }
  }

  async closeAll(): Promise<void> {
    for (const [tenantId] of this.contexts) {
      await this.closeContext(tenantId);
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
