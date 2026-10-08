import { createRequire } from "node:module";
import assert from "node:assert/strict";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (value) => { window.__copiedProfile = value; } },
  }));
  const page = await context.newPage();
  await page.goto(`${process.env.TEST_APP_URL || "http://127.0.0.1:3001"}/stella`);
  const reject = page.getByRole("button", { name: "Reject optional" });
  if (await reject.isVisible()) await reject.click();
  assert.equal(await page.getByRole("button", { name: "Copy @stella profile link" }).isVisible(), true);
  await page.getByRole("button", { name: "Copy @stella profile link" }).click();
  await page.getByRole("button", { name: "Link copied" }).waitFor();
  assert.equal(await page.evaluate(() => window.__copiedProfile), "https://getreplypass.com/stella");
  assert.equal(await page.locator(".profile-footer").count(), 0);
  assert.equal(await page.locator(".hero-image img").evaluate((img) => getComputedStyle(img).objectPosition), "50% 0%");
  assert.ok((await page.locator(".hero-image").boundingBox()).height <= 340);
  const more = page.getByText("About & policies", { exact: true });
  assert.equal(await more.isVisible(), true);
  await more.click();
  assert.equal(await page.locator(".footer-details").getByRole("link", { name: "Privacy" }).isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const gap = await page.evaluate(() => document.querySelector(".site-footer").getBoundingClientRect().top - document.querySelector(".profile-page").getBoundingClientRect().bottom);
  assert.ok(gap < 60, `Footer gap too large: ${gap}`);
  await page.screenshot({ path: "/private/tmp/replypass-profile-mobile.png", fullPage: true });
  console.log("PASS mobile profile copy, crop, compact footer, and no horizontal overflow");
} finally {
  await browser.close();
}
