#!/usr/bin/env node
// Builds E2E-Tracker.html (the standalone, shareable copy) from index.html.
// It runs the page's own "Save as HTML file" in a headless browser, so the
// output is exactly what a user would save, with the built-in data from index.html.
//
// Usage: node scripts/build.js
// Needs Playwright with Chromium (preinstalled in Claude Code cloud sessions).

const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "index.html");
const out = path.join(root, "E2E-Tracker.html");

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-build-"));
  const page = path.join(tmp, "page.html");
  // Same wrapper claude.ai puts around the published page.
  fs.writeFileSync(page, '<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'
    + fs.readFileSync(src, "utf8") + "</body></html>");

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => { delete window.showSaveFilePicker; }); // force the download path
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + page);
  await p.waitForTimeout(300);
  await p.click("#dataBtn");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveBtn")]);
  await dl.saveAs(out);
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  if (errors.length) { console.error("Page errors while building:\n" + errors.join("\n")); process.exit(1); }
  console.log(`Built ${path.relative(root, out)} (${fs.statSync(out).size} bytes)`);
})().catch((e) => { console.error(e); process.exit(1); });
