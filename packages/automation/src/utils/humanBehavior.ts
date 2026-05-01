import { Page } from "playwright";

/**
 * Generate a random delay between min and max milliseconds.
 * Simulates human-like pauses between actions.
 */
export function humanDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Type text with human-like speed variations.
 * Simulates natural typing patterns with variable delays between keystrokes.
 */
export async function humanType(page: Page, text: string): Promise<void> {
  for (const char of text) {
    // Variable typing speed: 50-150ms per character
    const charDelay = Math.floor(Math.random() * 100) + 50;

    // Occasional longer pauses (simulating thinking)
    const thinkPause = Math.random() < 0.05 ? Math.floor(Math.random() * 500) + 200 : 0;

    await page.keyboard.type(char, { delay: charDelay });

    if (thinkPause > 0) {
      await new Promise((resolve) => setTimeout(resolve, thinkPause));
    }
  }
}

/**
 * Move mouse with human-like behavior.
 * Adds slight randomness to target coordinates.
 */
export async function humanMouseMove(
  page: Page,
  targetX: number,
  targetY: number
): Promise<void> {
  // Add slight randomness to the target position
  const offsetX = Math.floor(Math.random() * 6) - 3;
  const offsetY = Math.floor(Math.random() * 6) - 3;

  await page.mouse.move(targetX + offsetX, targetY + offsetY, {
    steps: Math.floor(Math.random() * 10) + 5,
  });
}

/**
 * Scroll with human-like behavior.
 */
export async function humanScroll(page: Page, direction: "down" | "up" = "down"): Promise<void> {
  const scrollAmount = Math.floor(Math.random() * 300) + 200;
  const delta = direction === "down" ? scrollAmount : -scrollAmount;

  await page.mouse.wheel(0, delta);
  await humanDelay(300, 800);
}
