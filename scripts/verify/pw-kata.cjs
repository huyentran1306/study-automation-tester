// Kiểm chứng thử thách Playwright: dán lời giải tham chiếu, bấm Nộp bài, đọc bảng chấm.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const path = require("path"), fs = require("fs");
const ROOT = process.argv[2]; const only = process.argv[3];
const { transform } = require(path.join(ROOT, "node_modules/sucrase"));
const cache = {};
function load(p) { let file = p; for (const ext of ["", ".ts", ".tsx"]) if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) { file = p + ext; break; }
  if (cache[file]) return cache[file].exports; const src = transform(fs.readFileSync(file, "utf8"), { transforms: ["typescript", "imports"] }).code; const mod = { exports: {} }; cache[file] = mod;
  const req = (n) => n.startsWith("@/") ? load(path.join(ROOT, "src", n.slice(2))) : n.startsWith(".") ? load(path.join(path.dirname(file), n)) : {}; new Function("require", "module", "exports", src)(req, mod, mod.exports); return mod.exports; }
const files = process.argv[4] ? process.argv[4].split(",") : ["kata-ch2.ts"];
const katas = files.flatMap((f) => Object.values(load(path.join(ROOT, "src/content", f))).flat()).filter((k) => k.runner === "pw" && (!only || only === "all" || k.id === only));
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let bad = 0;
  for (const k of katas) {
    await page.goto("http://localhost:3100/kata/" + k.id);
    await page.locator(".monaco-editor").first().waitFor({ timeout: 30000 });
    await page.evaluate(([id, code]) => window.monaco.editor.getModels().find((m) => m.uri.path.includes(id)).setValue(code), [k.id, k.hints[2]]);
    const t0 = Date.now();
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await page.waitForFunction(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Nộp bài"); return b && !b.disabled; }, null, { timeout: 240000 });
    const sheet = await page.getByText("Chấm bài", { exact: true }).locator("..").innerText().catch(() => "?");
    const passed = await page.getByText(/Đã pass, \+\d+ XP/).isVisible();
    console.log(`${passed ? "OK " : "BAD"} ${k.id} (${((Date.now() - t0) / 1000).toFixed(0)}s) ${passed ? "" : "\n   " + sheet.replace(/\n/g, "\n   ")}`);
    if (!passed) { bad++; const res = await page.getByText("Kết quả test").locator("..").locator("..").innerText().catch(() => ""); console.log("   " + res.replace(/\n/g, " | ").slice(0, 700)); }
  }
  console.log(bad ? `${bad} thử thách có vấn đề` : `Tất cả ${katas.length} thử thách Playwright khớp`, errs.length ? "\nERR " + errs.join("\n") : "");
  await b.close();
})();
