/**
 * Favicon/Icon Extraction Script for Curated Templates
 *
 * Extracts favicons for each template using:
 * 1. Primary: apple-touch-icon from the site (180x180, highest quality)
 * 2. Fallback: Google Favicon API at 128px (100% reliable)
 *
 * Usage:
 *   npx tsx scripts/capture-template-icons.ts
 *   npx tsx scripts/capture-template-icons.ts --force
 *   npx tsx scripts/capture-template-icons.ts --only=stripe,linear
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

import { CLONE_TEMPLATES } from "../lib/clone-templates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, "../public/templates/icons");

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function fetchBuffer(url: string, maxRedirects = 5): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
        const redirectUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchBuffer(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const contentType = res.headers["content-type"] || "";
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function isImageContentType(ct: string): boolean {
  return ct.includes("image/png") || ct.includes("image/x-icon") || ct.includes("image/ico") || ct.includes("image/jpeg") || ct.includes("image/webp") || ct.includes("image/svg");
}

async function extractIcon(
  templateId: string,
  url: string,
  force: boolean
): Promise<{ id: string; success: boolean; source?: string; error?: string }> {
  const outputPath = path.join(ICONS_DIR, `${templateId}.png`);

  if (!force && fs.existsSync(outputPath)) {
    console.log(`  ⏭  ${templateId} — already exists, skipping`);
    return { id: templateId, success: true, source: "cached" };
  }

  const domain = extractDomain(url);

  // Strategy 1: Try apple-touch-icon (highest quality, 180x180)
  try {
    const appleTouchUrl = `https://${domain}/apple-touch-icon.png`;
    const { buffer, contentType } = await fetchBuffer(appleTouchUrl);
    if (isImageContentType(contentType) && buffer.length > 100) {
      fs.writeFileSync(outputPath, buffer);
      const sizeKB = Math.round(buffer.length / 1024);
      console.log(`  ✅ ${templateId} — apple-touch-icon (${sizeKB}KB)`);
      return { id: templateId, success: true, source: "apple-touch-icon" };
    }
  } catch {
    // apple-touch-icon not available, try fallback
  }

  // Strategy 2: Google Favicon API (128px, 100% reliable in testing)
  try {
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const { buffer, contentType } = await fetchBuffer(googleUrl);
    if (buffer.length > 100) {
      fs.writeFileSync(outputPath, buffer);
      const sizeKB = Math.round(buffer.length / 1024);
      console.log(`  ✅ ${templateId} — google favicon (${sizeKB}KB)`);
      return { id: templateId, success: true, source: "google" };
    }
  } catch (err: any) {
    console.error(`  ❌ ${templateId} — google favicon failed: ${err.message}`);
  }

  console.error(`  ❌ ${templateId} — all methods failed`);
  return { id: templateId, success: false, error: "all methods failed" };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyFlag = args.find((a) => a.startsWith("--only="));
  const onlyIds = onlyFlag
    ? onlyFlag.split("=")[1].split(",").map((s) => s.trim())
    : null;

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const templates = onlyIds
    ? CLONE_TEMPLATES.filter((t) => onlyIds.includes(t.id))
    : CLONE_TEMPLATES;

  console.log(
    `\n🔍 Extracting ${templates.length} template icons${force ? " (force mode)" : ""}...\n`
  );

  const results: { id: string; success: boolean; source?: string; error?: string }[] = [];

  for (const template of templates) {
    const result = await extractIcon(template.id, template.url, force);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const sources: Record<string, number> = {};
  succeeded.forEach((r) => {
    sources[r.source || "unknown"] = (sources[r.source || "unknown"] || 0) + 1;
  });

  console.log(`\n📊 Results: ${succeeded.length}/${results.length} succeeded`);
  console.log(`   Sources: ${JSON.stringify(sources)}`);
  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  }
  console.log(`\nIcons saved to: ${ICONS_DIR}\n`);
}

main().catch(console.error);
