#!/usr/bin/env node
// Smoke tests for the E2E Tracker. Run before every PR and before deploy.
//
// Usage: node scripts/test.js
// Needs Playwright with Chromium (preinstalled in Claude Code cloud sessions).
//
// Covers:
//  1. Live mode (claude.ai) with a mocked Microsoft 365 connector, for both
//     text layouts the connector returns (sectioned and compact).
//  2. Flow map layout: step order, same-line placement, one arrow per dependency.
//  3. Filters: multi-select systems, clear by background click and Esc.
//  4. Standalone mode: built-in data, editing, paste from Excel, save in place
//     (File System Access, mocked) and download fallback, reopen saved file.
//  5. Desktop and phone width without horizontal page scroll.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const SRC = fs.readFileSync(path.join(root, "index.html"), "utf8");
const fixture = (n) => fs.readFileSync(path.join(root, "tests", "fixtures", n), "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-test-"));
const wrap = (name) => { const f = path.join(tmp, name); fs.writeFileSync(f, '<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + SRC + "</body></html>"); return f; };

let failures = 0, passes = 0;
const check = (name, ok, detail) => { if (ok) { passes++; console.log("  ✓ " + name); } else { failures++; console.log("  ✗ " + name + (detail !== undefined ? "  → " + JSON.stringify(detail) : "")); } };

async function livePage(browser, text, viewport = { width: 1300, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript((t) => {
    const mcp = { callTool: async () => ({ payload: t, content: [{ type: "text", text: t }] }), watchTool: () => () => {} };
    window.claude = { use: (n) => Promise.resolve(n === "mcp" ? mcp : null) };
    try { localStorage.clear(); } catch (e) {}
  }, text);
  await p.goto("file://" + wrap("live.html"));
  await p.waitForTimeout(600);
  return { p, errors, ctx };
}

(async () => {
  const browser = await chromium.launch();

  for (const [label, file] of [["sectioned", "workbook-sectioned.txt"], ["compact", "workbook-compact.txt"]]) {
    console.log(`Live mode, ${label} connector text`);
    const { p, errors } = await livePage(browser, fixture(file));
    const s = await p.evaluate(() => ({
      src: document.getElementById("srcText").textContent,
      cards: [...document.querySelectorAll(".card")].map((c) => [c.querySelector("h3").textContent, c.querySelector(".eyebrow").textContent]),
      feats: document.querySelectorAll(".feat").length,
      defects: document.querySelectorAll("#dTable tbody tr").length,
      edges: document.querySelectorAll("#links path.edge").length,
    }));
    check("loads live data", s.src.startsWith("Live from OneDrive"), s.src);
    check("5 flows, 13 features, 10 defects", s.cards.length === 5 && s.feats === 13 && s.defects === 10, s);
    const step = Object.fromEntries(s.cards);
    check("step order: Flow 1/4 → Flow 2 + Flow 5 (same line) → Flow 3",
      step["Flow 1"] === "Step 1" && step["Flow 4"] === "Step 1" && step["Flow 2"] === "Step 2" && step["Flow 5"] === "Step 2" && step["Flow 3"] === "Step 3", step);
    check("one arrow per dependency (7)", s.edges === 7, s.edges);
    check("no page errors", errors.length === 0, errors);
  }

  console.log("Filters");
  {
    const { p, errors } = await livePage(browser, fixture("workbook-sectioned.txt"));
    const dimmed = () => p.evaluate(() => document.querySelectorAll(".card.dim").length);
    await p.click('#sysTable tr[data-sys="System 1"]');
    await p.click('.sys[data-sys="System 3"]');
    check("two systems selected", (await p.evaluate(() => document.querySelectorAll("#sysTable tr.focus").length)) === 2);
    check("other steps dimmed", (await dimmed()) === 3);
    await p.mouse.click(5, 650);
    check("background click clears", (await dimmed()) === 0);
    await p.click('.sys[data-sys="System 2"]'); await p.keyboard.press("Escape");
    check("Esc clears", (await dimmed()) === 0);
    check("no page errors", errors.length === 0, errors);
  }

  console.log("Layout widths");
  for (const vp of [{ width: 1300, height: 900 }, { width: 400, height: 900 }]) {
    const { p } = await livePage(browser, fixture("workbook-sectioned.txt"), vp);
    const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    check(`no horizontal page scroll at ${vp.width}px`, !over);
  }

  console.log("Standalone mode");
  {
    const file = path.join(tmp, "E2E-Tracker.html");
    // Start from a standalone copy written by the page itself.
    {
      const ctx = await browser.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
      await p.addInitScript(() => { delete window.showSaveFilePicker; });
      await p.goto("file://" + wrap("seed.html")); await p.waitForTimeout(300); await p.click("#dataBtn");
      const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveBtn")]); await dl.saveAs(file); await ctx.close();
    }
    const ctx = await browser.newContext({ acceptDownloads: true });
    let picks = 0;
    await ctx.exposeFunction("__write", (d) => fs.writeFileSync(file, d));
    await ctx.exposeFunction("__pick", () => { picks++; });
    await ctx.addInitScript(() => {
      window.showSaveFilePicker = async () => { await window.__pick();
        return { name: "E2E-Tracker.html", queryPermission: async () => "granted",
          createWritable: async () => { let b = ""; return { write: async (d) => { b += d; }, close: async () => window.__write(b) }; } }; };
    });
    const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + file); await p.waitForTimeout(400);
    check("opens with built-in data", (await p.textContent("#srcText")).startsWith("Built-in data"));
    check("13 features shown", (await p.evaluate(() => document.querySelectorAll(".feat").length)) === 13);
    await p.click("#dataBtn"); await p.click('[data-tab="feature"]');
    await p.selectOption('#eTable select[data-r="11"][data-c="2"]', "OK");
    await p.click("#addRowBtn");
    await p.fill('#eTable [data-r="14"][data-c="0"]', "Feature 14"); await p.fill('#eTable [data-r="14"][data-c="1"]', "Flow 4");
    await p.waitForTimeout(450);
    check("edit + add row update the tracker", (await p.evaluate(() => [document.querySelectorAll(".feat").length, document.querySelectorAll(".card").length])).join() === "14,5");
    await p.click('[data-tab="defects"]'); await p.click("#pasteBtn");
    await p.fill("#pasteArea", "Title\tFeature\tCategory\tStatus\nDefect 11\tFeature 14\t1-Critical\tNew\n"); await p.click("#pasteAppend");
    check("paste from Excel adds defect", (await p.evaluate(() => document.querySelectorAll("#dTable tbody tr").length)) === 11);
    await p.click("#saveBtn"); await p.waitForTimeout(300);
    await p.fill('#eTable [data-r="1"][data-c="0"]', "Defect 1b"); await p.waitForTimeout(450);
    await p.click("#saveBtn"); await p.waitForTimeout(300);
    check("Save writes into the same file, asking once", picks === 1, picks);
    check("Save button switches to Save", (await p.textContent("#saveBtn")) === "Save");
    const p2 = await (await browser.newContext()).newPage(); p2.on("pageerror", (e) => errors.push("reopen: " + e.message));
    await p2.goto("file://" + file); await p2.waitForTimeout(400);
    const re = await p2.evaluate(() => ({ feats: document.querySelectorAll(".feat").length, d1b: !!document.querySelector("#dTable") && document.querySelector("#dTable").textContent.includes("Defect 1b"), f11: document.querySelector('.feat[data-feat="Feature 11"] .st')?.textContent }));
    check("reopened file has the saved data", re.feats === 14 && re.d1b && re.f11 === "OK", re);
    const c3 = await browser.newContext({ acceptDownloads: true }); const p3 = await c3.newPage();
    await p3.addInitScript(() => { delete window.showSaveFilePicker; });
    await p3.goto("file://" + file); await p3.waitForTimeout(300); await p3.click("#dataBtn");
    const [dl] = await Promise.all([p3.waitForEvent("download"), p3.click("#saveBtn")]);
    check("other browsers download a copy", /^E2E Tracker \d{4}-\d{2}-\d{2}\.html$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    check("no page errors", errors.length === 0, errors);
  }

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
