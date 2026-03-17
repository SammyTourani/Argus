/**
 * Screenshot Capture Script for Curated Templates
 *
 * Visits each curated template URL and captures a 1280x800 screenshot.
 * Saves as .webp to public/templates/screenshots/
 *
 * Usage:
 *   npx tsx scripts/capture-template-screenshots.ts
 *   npx tsx scripts/capture-template-screenshots.ts --force    # Overwrite existing
 *   npx tsx scripts/capture-template-screenshots.ts --only stripe,linear  # Specific templates
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Import templates from the data file
import { CLONE_TEMPLATES } from "../lib/clone-templates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.resolve(
  __dirname,
  "../public/templates/screenshots"
);
const VIEWPORT = { width: 1280, height: 800 };
const TIMEOUT = 30_000;
const SCROLL_DELAY = 1500; // Wait after scrolling for lazy content to load
const PAGE_LOAD_DELAY = 2000; // Wait after initial load

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Common cookie consent selectors to auto-dismiss
const COOKIE_SELECTORS = [
  '[id*="cookie"] button',
  '[class*="cookie"] button',
  '[id*="consent"] button',
  '[class*="consent"] button',
  'button[aria-label*="Accept"]',
  'button[aria-label*="accept"]',
  'button[aria-label*="Close"]',
  'button[data-testid*="cookie"]',
  ".cc-dismiss",
  ".cc-accept",
  "#onetrust-accept-btn-handler",
  ".js-accept-cookies",
  '[data-action="accept"]',
];

async function dismissCookieBanner(page: any) {
  for (const selector of COOKIE_SELECTORS) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        await delay(500);
        return;
      }
    } catch {
      // Ignore — selector didn't match
    }
  }
}

async function captureScreenshot(
  browser: any,
  templateId: string,
  url: string,
  force: boolean
): Promise<{ id: string; success: boolean; error?: string }> {
  const outputPath = path.join(SCREENSHOTS_DIR, `${templateId}.webp`);

  if (!force && fs.existsSync(outputPath)) {
    console.log(`  ⏭  ${templateId} — already exists, skipping`);
    return { id: templateId, success: true };
  }

  const page = await browser.newPage();

  try {
    await page.setViewport(VIEWPORT);

    // Block heavy resources to speed up capture
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      const type = req.resourceType();
      if (["media", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`  📸 ${templateId} — loading ${url}`);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: TIMEOUT,
    });

    // Wait for page to settle
    await delay(PAGE_LOAD_DELAY);

    // Try to dismiss cookie banners
    await dismissCookieBanner(page);

    // Scroll down slightly to trigger lazy loading, then back to top
    await page.evaluate(() => {
      window.scrollTo(0, 300);
    });
    await delay(SCROLL_DELAY);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await delay(500);

    // Capture screenshot as webp
    await page.screenshot({
      path: outputPath,
      type: "webp",
      quality: 80,
      clip: {
        x: 0,
        y: 0,
        width: VIEWPORT.width,
        height: VIEWPORT.height,
      },
    });

    const stats = fs.statSync(outputPath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`  ✅ ${templateId} — saved (${sizeKB}KB)`);
    return { id: templateId, success: true };
  } catch (err: any) {
    console.error(`  ❌ ${templateId} — ${err.message}`);
    return { id: templateId, success: false, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyFlag = args.find((a) => a.startsWith("--only="));
  const onlyIds = onlyFlag
    ? onlyFlag.split("=")[1].split(",").map((s) => s.trim())
    : null;

  // Ensure output directory exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const templates = onlyIds
    ? CLONE_TEMPLATES.filter((t) => onlyIds.includes(t.id))
    : CLONE_TEMPLATES;

  console.log(
    `\n🔍 Capturing ${templates.length} template screenshots${force ? " (force mode)" : ""}...\n`
  );

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const results: { id: string; success: boolean; error?: string }[] = [];

  // Process sequentially to avoid overloading
  for (const template of templates) {
    const result = await captureScreenshot(
      browser,
      template.id,
      template.url,
      force
    );
    results.push(result);
  }

  await browser.close();

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  console.log(`\n📊 Results: ${succeeded}/${results.length} succeeded`);
  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  }
  console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}\n`);
}

main().catch(console.error);
