const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  for (const n of (process.argv[2] || "11-22").includes("-") ? Array.from({length: 31}, (_, i) => 11 + i) : process.argv[2].split(",").map(Number)) {
    const id = "l" + n;
    await page.goto("http://localhost:3100/learn/" + id);
    await page.locator(".monaco-editor").first().waitFor({ timeout: 30000 });
    if (!(await page.getByRole("button", { name: "Chạy test" }).count())) { console.log("--  " + id + ": bài không chạy Playwright"); continue; }
    await page.getByRole("button", { name: "Chạy test" }).click();
    await page.getByText(/pass( · \d+ fail)?( · \d+ skip)? · [\d.]+s$/).first().waitFor({ timeout: 90000 }).catch(() => {});
    const res = (await page.getByText("Kết quả test").locator("..").locator("..").innerText().catch(() => "?")).replace(/\n+/g, " | ");
    const bad = /fail/.test(res.split("|")[1] || "");
    console.log(`${bad ? "BAD" : "OK "} ${id}: ${bad ? res.slice(0, 600) : res.split("|")[1]}`);
    if (n === 16) await page.screenshot({ path: __dirname + "/shots/40-lesson-pw.png" });
  }
  console.log(errs.length ? "ERR " + [...new Set(errs)].join("\n") : "không lỗi trang");
  await b.close();
})();
