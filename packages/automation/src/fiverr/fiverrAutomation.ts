import { Page } from "playwright";
import { BrowserManager } from "../browser/browserManager";
import { humanDelay, humanType } from "../utils/humanBehavior";

export class FiverrAutomation {
  private browserManager: BrowserManager;
  private tenantId: string;

  constructor(browserManager: BrowserManager, tenantId: string) {
    this.browserManager = browserManager;
    this.tenantId = tenantId;
  }

  private async getPage(): Promise<Page> {
    const context = await this.browserManager.getContext(this.tenantId);
    const pages = context.pages();
    return pages.length > 0 ? pages[0] : await context.newPage();
  }

  async readMessages(): Promise<{ messages: Array<{ from: string; preview: string; timestamp: string }> }> {
    const page = await this.getPage();

    try {
      await page.goto("https://www.fiverr.com/inbox", { waitUntil: "networkidle" });
      await humanDelay(2000, 4000);

      // Check if logged in
      const isLoggedIn = await page.locator('[class*="inbox"]').isVisible().catch(() => false);
      if (!isLoggedIn) {
        throw new Error("Not logged in to Fiverr. Please authenticate first.");
      }

      // Read message previews from inbox
      const messageElements = await page.locator('[class*="conversation-item"], [class*="inbox-row"]').all();
      const messages = [];

      for (const element of messageElements.slice(0, 20)) {
        const from = await element.locator('[class*="username"], [class*="name"]').textContent().catch(() => "Unknown");
        const preview = await element.locator('[class*="message-preview"], [class*="last-message"]').textContent().catch(() => "");
        const timestamp = await element.locator('[class*="time"], [class*="date"]').textContent().catch(() => "");

        messages.push({
          from: from?.trim() || "Unknown",
          preview: preview?.trim() || "",
          timestamp: timestamp?.trim() || "",
        });
      }

      await this.browserManager.saveContext(this.tenantId);
      return { messages };
    } catch (error) {
      throw new Error(`Failed to read Fiverr messages: ${error}`);
    }
  }

  async sendReply(conversationId: string, message: string): Promise<{ success: boolean }> {
    const page = await this.getPage();

    try {
      await page.goto(`https://www.fiverr.com/inbox/${conversationId}`, { waitUntil: "networkidle" });
      await humanDelay(2000, 3000);

      // Find the message input
      const messageInput = page.locator('textarea[class*="message-input"], [contenteditable="true"]');
      await messageInput.waitFor({ state: "visible", timeout: 10000 });

      // Type with human-like behavior
      await messageInput.click();
      await humanDelay(500, 1000);
      await humanType(page, message);
      await humanDelay(1000, 2000);

      // Click send button
      const sendButton = page.locator('button[class*="send"], [aria-label*="Send"]');
      await sendButton.click();
      await humanDelay(1000, 2000);

      await this.browserManager.saveContext(this.tenantId);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send Fiverr reply: ${error}`);
    }
  }

  async checkOrders(): Promise<{ orders: Array<{ id: string; status: string; buyer: string }> }> {
    const page = await this.getPage();

    try {
      await page.goto("https://www.fiverr.com/users/orders", { waitUntil: "networkidle" });
      await humanDelay(2000, 4000);

      const orderElements = await page.locator('[class*="order-row"], [class*="order-item"]').all();
      const orders = [];

      for (const element of orderElements.slice(0, 20)) {
        const id = await element.getAttribute("data-order-id").catch(() => "");
        const status = await element.locator('[class*="status"]').textContent().catch(() => "Unknown");
        const buyer = await element.locator('[class*="buyer"], [class*="username"]').textContent().catch(() => "Unknown");

        orders.push({
          id: id || "",
          status: status?.trim() || "Unknown",
          buyer: buyer?.trim() || "Unknown",
        });
      }

      await this.browserManager.saveContext(this.tenantId);
      return { orders };
    } catch (error) {
      throw new Error(`Failed to check Fiverr orders: ${error}`);
    }
  }
}
