const path = require("path"), fs = require("fs"), vm = require("vm");
const ROOT = process.argv[2];
const { transform } = require(path.join(ROOT, "node_modules/sucrase"));
const cache = {};
function load(p) {
  let file = p;
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) { file = p + ext; break; }
  if (cache[file]) return cache[file].exports;
  const src = transform(fs.readFileSync(file, "utf8"), { transforms: ["typescript", "imports", "jsx"] }).code;
  const mod = { exports: {} }; cache[file] = mod;
  const req = (n) => n.startsWith("@/") ? load(path.join(ROOT, "src", n.slice(2))) : n.startsWith(".") ? load(path.join(path.dirname(file), n)) : require(n);
  new Function("require", "module", "exports", src)(req, mod, mod.exports);
  return mod.exports;
}
const { WORKER_SRC } = load(path.join(ROOT, "src/lib/runner/worker-src.ts"));
const a = load(path.join(ROOT, "src/content/ch1a.ts")), b = load(path.join(ROOT, "src/content/ch1b.ts"));
function runWorker(code) {
  return new Promise((resolve) => {
    const ctx = vm.createContext({ setTimeout, clearTimeout, Promise, console: {} });
    vm.runInContext("var self = globalThis;", ctx);
    const logs = [];
    ctx.postMessage = (m) => { if (m.type === "log") logs.push(m.text); else resolve({ ...m, logs }); };
    vm.runInContext(WORKER_SRC, ctx);
    ctx.onmessage({ data: { code: transform(code, { transforms: ["typescript"] }).code, tests: "", files: {}, userLines: 99, timeoutMs: 4000 } });
  });
}
(async () => {
  let n = 0, bad = 0;
  for (const L of [...Object.values(a), ...Object.values(b)]) {
    const snippets = [];
    if (L.starter) snippets.push(["starter", L.starter]);
    for (const s of L.sections) for (const blk of s.blocks) if (blk.t === "code" && blk.run) snippets.push([s.id, blk.code]);
    for (const [where, code] of snippets) {
      n++;
      const r = await runWorker(code);
      if (r.error) { bad++; console.log(`BAD ${L.id}/${where}: ${r.error.name}: ${r.error.message}`); }
      else if (where === "starter" || L.id === "l09") console.log(`ok  ${L.id}/${where} → ${r.logs.slice(0, 2).join(" | ").slice(0, 110)}`);
    }
  }
  console.log(`\n${n} đoạn code, ${bad} lỗi`);
})();
