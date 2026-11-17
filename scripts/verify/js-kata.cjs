// Kiểm chứng: lời giải tham chiếu (gợi ý bậc 3) phải qua hết test ẩn; code mẫu (starter) phải KHÔNG qua.
const path = require("path"), fs = require("fs"), vm = require("vm");
const ROOT = process.argv[2];
const { transform } = require(path.join(ROOT, "node_modules/sucrase"));
const cache = {};
function load(p) {
  let file = p;
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) { file = p + ext; break; }
  if (cache[file]) return cache[file].exports;
  const src = transform(fs.readFileSync(file, "utf8"), { transforms: ["typescript", "imports"] }).code;
  const mod = { exports: {} }; cache[file] = mod;
  const req = (n) => n.startsWith("@/") ? load(path.join(ROOT, "src", n.slice(2))) : n.startsWith(".") ? load(path.join(path.dirname(file), n)) : require(n);
  new Function("require", "module", "exports", src)(req, mod, mod.exports);
  return mod.exports;
}
const KATA_CH1 = [...load(path.join(ROOT, "src/content/kata-ch1.ts")).KATA_CH1, ...load(path.join(ROOT, "src/content/kata-ch7.ts")).KATA_CH7].filter((k) => k.runner !== "pw");
const { WORKER_SRC } = load(path.join(ROOT, "src/lib/runner/worker-src.ts"));
const { WORKER_PW } = load(path.join(ROOT, "src/lib/runner/worker-pw.ts"));
const git = load(path.join(ROOT, "src/lib/git/sim.ts"));
const { buildScenario } = load(path.join(ROOT, "src/lib/git/scenarios.ts"));

function runWorker(code, tests) {
  return new Promise((resolve) => {
    const ctx = vm.createContext({ setTimeout, clearTimeout, Promise, console: {} });
    vm.runInContext("var self = globalThis;", ctx);
    const logs = [];
    ctx.postMessage = (m) => { if (m.type === "log") logs.push(m.text); else resolve({ ...m, logs }); };
    vm.runInContext(WORKER_SRC + "\n" + WORKER_PW, ctx);
    const compiled = transform(code, { transforms: ["typescript"] }).code;
    ctx.onmessage({ data: { code: compiled, tests, files: {}, userLines: code.split("\n").length, timeoutMs: 4000 } });
  });
}

function solution(k) {
  const h = k.hints[2];
  let s = k.starter;
  if (/^const lines/.test(h)) return h;
  const decl = h.match(/^(class|interface|function|async function)\s+(\w+)/m);
  if (/^(class|interface|async function|function)\s/.test(h)) {
    // thay các khai báo cùng tên trong starter bằng bản trong lời giải
    let placed = false;
    for (const m of h.matchAll(/^(?:class|interface|async function|function)\s+(\w+)/gm)) {
      const re = new RegExp(`^(?:class|interface|async function|function)\\s+${m[1]}\\b[^{]*\\{[\\s\\S]*?^\\}`, "m");
      s = s.replace(re, "\u0000");
    }
    s = s.replace("\u0000", () => ((placed = true), h)).split("\u0000").join("");
    return placed ? s : s + "\n" + h;
  }
  // lời giải chỉ là thân hàm: thay dòng chú thích đầu tiên trong thân hàm
  const lines = s.split("\n");
  const i = lines.findIndex((l) => /^\s+\/\/ /.test(l));
  const indent = lines[i].match(/^\s+/)[0];
  lines.splice(i, 1, ...h.split("\n").map((l) => indent + l));
  return lines.join("\n");
}

(async () => {
  let bad = 0;
  for (const k of KATA_CH1) {
    if (k.type === "git") {
      let r = buildScenario(k.git.scenario);
      for (const line of k.hints[2].split("\n")) r = git.run(r, line).repo;
      const ok = k.git.goals.map((g) => g.check(r));
      const pass = ok.every(Boolean);
      const startOk = k.git.goals.every((g) => g.check(buildScenario(k.git.scenario)));
      console.log(`${pass && !startOk ? "OK " : "BAD"} ${k.id} goals=${ok.map((x) => (x ? 1 : 0)).join("")}`);
      if (!pass || startOk) bad++;
      continue;
    }
    const sol = solution(k);
    const forbidHit = (k.forbid || []).some((f) => new RegExp(f.pattern).test(sol));
    const res = await runWorker(sol, k.tests);
    const pass = !res.error && res.results.length && res.results.every((r) => r.ok) && !forbidHit;
    const st = await runWorker(k.starter, k.tests);
    const starterPass = !st.error && st.results.length && st.results.every((r) => r.ok);
    console.log(`${pass && !starterPass ? "OK " : "BAD"} ${k.id} ${res.results.filter((r) => r.ok).length}/${res.results.length}${res.error ? " ERR " + res.error.message : ""}${forbidHit ? " FORBID" : ""}${starterPass ? " STARTER-PASSES" : ""}`);
    if (!pass) { bad++; console.log(sol); for (const r of res.results.filter((r) => !r.ok)) console.log("   ✕", r.name, r.error); }
  }
  console.log(bad ? `\n${bad} thử thách có vấn đề` : "\nTất cả thử thách khớp đáp án");
})();
