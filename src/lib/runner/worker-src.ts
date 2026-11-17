// Mã nguồn Web Worker chạy code học viên. Viết dạng chuỗi để tạo Worker từ Blob (không cần cấu hình bundler).
// Worker nhận { code, tests, files } (đã dịch sang JS), trả về log + kết quả từng test.

export const WORKER_SRC = String.raw`
"use strict";
const post = (m) => self.postMessage(m);

function fmt(v, depth, seen, top) {
  if (depth === undefined) depth = 0;
  if (seen === undefined) seen = new Set();
  const t = typeof v;
  if (v === null) return "null";
  if (t === "undefined") return "undefined";
  if (t === "string") return top ? v : "'" + v.replace(/'/g, "\\'") + "'";
  if (t === "number" || t === "boolean" || t === "bigint") return String(v);
  if (t === "symbol") return v.toString();
  if (t === "function") return v.toString().startsWith("class") ? "[class " + (v.name || "anonymous") + "]" : "[Function: " + (v.name || "anonymous") + "]";
  if (v instanceof Error) return (top ? "" : "[") + v.name + ": " + v.message + (top ? "" : "]");
  if (v instanceof Promise) return "Promise { <pending> }";
  if (v instanceof Date) return v.toISOString();
  if (v instanceof RegExp) return v.toString();
  if (seen.has(v)) return "[Circular]";
  if (depth > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.add(v);
  let out;
  if (Array.isArray(v)) {
    const items = v.slice(0, 50).map((x) => fmt(x, depth + 1, seen, false));
    if (v.length > 50) items.push("... " + (v.length - 50) + " phần tử nữa");
    out = items.length ? "[ " + items.join(", ") + " ]" : "[]";
  } else if (v instanceof Map) {
    out = "Map(" + v.size + ") { " + [...v].map(([k, x]) => fmt(k, depth + 1, seen) + " => " + fmt(x, depth + 1, seen)).join(", ") + " }";
  } else if (v instanceof Set) {
    out = "Set(" + v.size + ") { " + [...v].map((x) => fmt(x, depth + 1, seen)).join(", ") + " }";
  } else {
    const keys = Object.keys(v);
    const name = v.constructor && v.constructor !== Object && v.constructor.name ? v.constructor.name + " " : "";
    const body = keys.map((k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'") + ": " + fmt(v[k], depth + 1, seen, false));
    out = body.length ? name + "{ " + body.join(", ") + " }" : name + "{}";
    if (out.length > 80 && depth === 0) out = name + "{\n  " + body.join(",\n  ") + "\n}";
  }
  seen.delete(v);
  return out;
}

const fmtArgs = (args) => args.map((a) => fmt(a, 0, new Set(), true)).join(" ");
for (const level of ["log", "info", "warn", "error", "debug"]) {
  console[level] = (...args) => post({ type: "log", level: level === "debug" || level === "info" ? "log" : level, text: fmtArgs(args) });
}
console.table = (x) => post({ type: "log", level: "log", text: fmt(x, 0, new Set(), true) });

function eq(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  const ka = Object.keys(a).filter((k) => a[k] !== undefined);
  const kb = Object.keys(b).filter((k) => b[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => eq(a[k], b[k]));
}
function subset(a, b) {
  if (typeof b !== "object" || b === null) return Object.is(a, b) || eq(a, b);
  if (typeof a !== "object" || a === null) return false;
  return Object.keys(b).every((k) => subset(a[k], b[k]));
}

class AssertionError extends Error { constructor(m) { super(m); this.name = "AssertionError"; } }
const show = (v) => fmt(v, 0, new Set(), false);

function makeMatchers(actual, negate) {
  const check = (pass, msg) => {
    if (negate ? pass : !pass) throw new AssertionError((negate ? "[not] " : "") + msg);
  };
  const m = {
    toBe: (e) => check(Object.is(actual, e), "toBe\nMong đợi: " + show(e) + "\nNhận được: " + show(actual)),
    toEqual: (e) => check(eq(actual, e), "toEqual\nMong đợi: " + show(e) + "\nNhận được: " + show(actual)),
    toStrictEqual: (e) => check(eq(actual, e), "toStrictEqual\nMong đợi: " + show(e) + "\nNhận được: " + show(actual)),
    toMatchObject: (e) => check(subset(actual, e), "toMatchObject\nMong đợi chứa: " + show(e) + "\nNhận được: " + show(actual)),
    toBeTruthy: () => check(!!actual, "toBeTruthy\nNhận được: " + show(actual)),
    toBeFalsy: () => check(!actual, "toBeFalsy\nNhận được: " + show(actual)),
    toBeNull: () => check(actual === null, "toBeNull\nNhận được: " + show(actual)),
    toBeUndefined: () => check(actual === undefined, "toBeUndefined\nNhận được: " + show(actual)),
    toBeDefined: () => check(actual !== undefined, "toBeDefined\nNhận được: undefined"),
    toBeNaN: () => check(Number.isNaN(actual), "toBeNaN\nNhận được: " + show(actual)),
    toBeGreaterThan: (e) => check(actual > e, "toBeGreaterThan " + show(e) + "\nNhận được: " + show(actual)),
    toBeGreaterThanOrEqual: (e) => check(actual >= e, "toBeGreaterThanOrEqual " + show(e) + "\nNhận được: " + show(actual)),
    toBeLessThan: (e) => check(actual < e, "toBeLessThan " + show(e) + "\nNhận được: " + show(actual)),
    toBeLessThanOrEqual: (e) => check(actual <= e, "toBeLessThanOrEqual " + show(e) + "\nNhận được: " + show(actual)),
    toBeCloseTo: (e, d) => check(Math.abs(actual - e) < Math.pow(10, -(d === undefined ? 2 : d)) / 2, "toBeCloseTo " + show(e) + "\nNhận được: " + show(actual)),
    toContain: (e) => check(actual != null && actual.includes(e), "toContain " + show(e) + "\nNhận được: " + show(actual)),
    toHaveLength: (n) => check(actual != null && actual.length === n, "toHaveLength " + n + "\nNhận được độ dài: " + (actual == null ? show(actual) : actual.length)),
    toHaveProperty: (k) => check(actual != null && k in Object(actual), "toHaveProperty " + show(k)),
    toBeInstanceOf: (C) => check(actual instanceof C, "toBeInstanceOf " + (C && C.name)),
    toMatch: (re) => check(typeof actual === "string" && (typeof re === "string" ? actual.includes(re) : re.test(actual)), "toMatch " + show(re) + "\nNhận được: " + show(actual)),
    toThrow: (e) => {
      if (typeof actual !== "function") throw new AssertionError("toThrow cần truyền vào một hàm: expect(() => ...).toThrow()");
      let threw = false, err;
      try { actual(); } catch (x) { threw = true; err = x; }
      const msg = err && err.message !== undefined ? err.message : String(err);
      let ok = threw;
      if (threw && e !== undefined) ok = typeof e === "string" ? msg.includes(e) : e instanceof RegExp ? e.test(msg) : typeof e === "function" ? err instanceof e : true;
      check(ok, "toThrow" + (e !== undefined ? " " + show(e) : "") + "\n" + (threw ? "Lỗi nhận được: " + msg : "Hàm không ném lỗi nào"));
    },
  };
  return m;
}

function expect(actual) {
  const m = makeMatchers(actual, false);
  m.not = makeMatchers(actual, true);
  const asyncWrap = (mode) => new Proxy({}, { get: (_, name) => async (...args) => {
    let val, err, rejected = false;
    try { val = await actual; } catch (x) { rejected = true; err = x; }
    if (mode === "rejects") {
      if (!rejected) throw new AssertionError("rejects: Promise không bị reject mà trả về " + show(val));
      if (name === "toThrow") return makeMatchers(() => { throw err; }, false).toThrow(...args);
      return makeMatchers(err, false)[name](...args);
    }
    if (rejected) throw new AssertionError("resolves: Promise bị reject: " + (err && err.message));
    return makeMatchers(val, false)[name](...args);
  } });
  m.rejects = asyncWrap("rejects");
  m.resolves = asyncWrap("resolves");
  return m;
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
test.skip = () => {};
const it = test;
const describe = (name, fn) => fn();

function lineOf(err) {
  const s = (err && err.stack) || "";
  const m = s.match(/user\.js:(\d+):(\d+)/);
  return m ? Number(m[1]) - 1 : null;
}

function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(label + " quá " + ms + "ms (quên await, hoặc Promise không bao giờ xong?)")), ms))]);
}

function makeRequire(files, special) {
  const cache = {};
  function req(name) {
    const sp = special && special(name);
    if (sp) return sp;
    const key = Object.keys(files || {}).find((f) => {
      const base = f.replace(/\.(ts|js)$/, "");
      const n = name.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "").replace(/\.(ts|js)$/, "");
      return base === n || base.endsWith("/" + n);
    });
    if (!key) throw new Error("Không tìm thấy module '" + name + "' (sandbox chỉ có các tệp trong dự án)");
    if (cache[key]) return cache[key].exports;
    const module = { exports: {} };
    cache[key] = module;
    if (/\.json$/.test(key)) { module.exports = JSON.parse(files[key]); module.exports.default = module.exports; return module.exports; }
    (0, eval)("(function (require, module, exports) {\n" + files[key] + "\n})\n//# sourceURL=" + key)(req, module, module.exports);
    return module.exports;
  }
  return req;
}

async function runPlain(data) {
  const { code, tests: testSrc, files, userLines, timeoutMs } = data;
  const started = Date.now();
  const req = makeRequire(files, null);
  const g = self;
  g.test = test; g.it = it; g.describe = describe; g.expect = expect; g.require = req;
  let userError = null;
  try {
    // Test ẩn nằm trong khối riêng để biến phụ của test không trùng tên với biến của học viên
    const src = "(async (require, module, exports) => {\n" + code + "\n;\n{\n" + (testSrc || "") + "\n}\n})\n//# sourceURL=user.js";
    const fn = (0, eval)(src);
    const mod = { exports: {} };
    await withTimeout(fn(req, mod, mod.exports), timeoutMs || 4000, "Code chạy");
  } catch (e) {
    const line = lineOf(e);
    userError = { name: (e && e.name) || "Error", message: (e && e.message) || String(e), line: line !== null && line <= userLines ? line : null };
  }
  const results = [];
  if (testSrc) {
    for (const t of tests) {
      const t0 = Date.now();
      if (userError) { results.push({ name: t.name, ok: false, ms: 0, error: "Không chạy được vì code bị lỗi trước đó" }); continue; }
      try {
        await withTimeout(Promise.resolve().then(() => t.fn()), 2500, "Test");
        results.push({ name: t.name, ok: true, ms: Date.now() - t0 });
      } catch (e) {
        results.push({ name: t.name, ok: false, ms: Date.now() - t0, error: (e && e.message) || String(e) });
      }
    }
  }
  post({ type: "done", results, error: userError, ms: Date.now() - started });
}

self.onmessage = (ev) => {
  const d = ev.data;
  if (d.type === "rpc-result") return PW.resolve(d);
  if (d.type === "event") return PW.event(d);
  if (d.mode === "pw") return PW.run(d);
  return runPlain(d);
};
`;
