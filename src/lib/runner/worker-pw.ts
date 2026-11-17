// pw-lite phía Worker: mô phỏng API Playwright Test. Mỗi thao tác trên trang gửi RPC sang luồng chính
// (PwHost) để chạy trên iframe chứa app Sổ Khách. Viết dạng chuỗi, nối sau WORKER_SRC.

export const WORKER_PW = String.raw`
const PW = (() => {
  let seq = 0;
  const pending = new Map();
  let currentTest = "";
  let softErrors = [];
  let asyncErrors = [];
  const dialogHandlers = [];

  function rpc(op, args) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      post({ type: "rpc", id, op, args: args || {}, test: currentTest });
    });
  }
  function resolveRpc(d) {
    const p = pending.get(d.id);
    if (!p) return;
    pending.delete(d.id);
    if (d.ok) p.resolve(d.value);
    else { const e = new Error(d.error); e.name = d.errorName || "Error"; p.reject(e); }
  }
  async function call(op, args) {
    const v = await rpc(op, args);
    if (asyncErrors.length) { const e = asyncErrors.shift(); throw e; }
    return v;
  }

  // ---- Mô tả locator ----
  const q = (s) => typeof s === "string" ? "'" + s.replace(/'/g, "\\'") + "'" : String(s);
  function optStr(o) {
    if (!o) return "";
    const parts = Object.keys(o).filter((k) => o[k] !== undefined).map((k) => k + ": " + (o[k] instanceof RegExp ? String(o[k]) : typeof o[k] === "string" ? q(o[k]) : o[k] instanceof Locator ? o[k].toString() : String(o[k])));
    return parts.length ? ", { " + parts.join(", ") + " }" : "";
  }
  function serial(v) {
    if (v instanceof RegExp) return { re: v.source, flags: v.flags };
    if (v instanceof Locator) return { steps: v.steps };
    return v;
  }

  class Locator {
    constructor(steps, label) { this.steps = steps; this.label = label; }
    _add(step, label) { return new Locator([...this.steps, step], this.label + label); }
    toString() { return this.label; }
    getByRole(role, o) { return this._add({ k: "role", role, name: serial(o && o.name), exact: !!(o && o.exact), level: o && o.level, checked: o && o.checked, includeHidden: !!(o && o.includeHidden) }, (this.steps.length ? "." : "") + "getByRole(" + q(role) + optStr(o) + ")"); }
    getByText(t, o) { return this._add({ k: "text", text: serial(t), exact: !!(o && o.exact) }, (this.steps.length ? "." : "") + "getByText(" + (t instanceof RegExp ? t : q(t)) + optStr(o) + ")"); }
    getByLabel(t, o) { return this._add({ k: "label", text: serial(t), exact: !!(o && o.exact) }, (this.steps.length ? "." : "") + "getByLabel(" + (t instanceof RegExp ? t : q(t)) + optStr(o) + ")"); }
    getByPlaceholder(t, o) { return this._add({ k: "placeholder", text: serial(t), exact: !!(o && o.exact) }, (this.steps.length ? "." : "") + "getByPlaceholder(" + (t instanceof RegExp ? t : q(t)) + ")"); }
    getByAltText(t, o) { return this._add({ k: "alt", text: serial(t), exact: !!(o && o.exact) }, (this.steps.length ? "." : "") + "getByAltText(" + q(t) + ")"); }
    getByTitle(t, o) { return this._add({ k: "title", text: serial(t), exact: !!(o && o.exact) }, (this.steps.length ? "." : "") + "getByTitle(" + q(t) + ")"); }
    getByTestId(t) { return this._add({ k: "testid", text: serial(t) }, (this.steps.length ? "." : "") + "getByTestId(" + (t instanceof RegExp ? t : q(t)) + ")"); }
    locator(sel, o) {
      if (sel instanceof Locator) return new Locator([...this.steps, ...sel.steps], this.label + "." + sel.label);
      let l = this._add({ k: "css", sel }, (this.steps.length ? "." : "") + "locator(" + q(sel) + ")");
      if (o) l = l.filter(o);
      return l;
    }
    filter(o) { o = o || {}; return this._add({ k: "filter", hasText: serial(o.hasText), hasNotText: serial(o.hasNotText), has: o.has ? o.has.steps : undefined, hasNot: o.hasNot ? o.hasNot.steps : undefined, visible: o.visible }, ".filter(" + optStr(o).slice(2) + ")"); }
    nth(i) { return this._add({ k: "nth", i }, ".nth(" + i + ")"); }
    first() { return this._add({ k: "nth", i: 0 }, ".first()"); }
    last() { return this._add({ k: "nth", i: -1 }, ".last()"); }
    and(l) { return this._add({ k: "and", steps: l.steps }, ".and(" + l + ")"); }
    or(l) { return this._add({ k: "or", steps: l.steps }, ".or(" + l + ")"); }
    frameLocator(sel) { return new FrameLocator([...this.steps, { k: "frame", sel }], this.label + ".frameLocator(" + q(sel) + ")"); }
    contentFrame() { return new FrameLocator([...this.steps, { k: "frame", sel: null }], this.label + ".contentFrame()"); }
    _act(action, args) { return call("act", { steps: this.steps, desc: this.label, action, args: args || [] }); }
    click(o) { return this._act("click", [o || {}]); }
    dblclick(o) { return this._act("dblclick", [o || {}]); }
    hover(o) { return this._act("hover", [o || {}]); }
    focus() { return this._act("focus"); }
    blur() { return this._act("blur"); }
    fill(v, o) { return this._act("fill", [String(v), o || {}]); }
    clear() { return this._act("fill", [""]); }
    press(key, o) { return this._act("press", [key, o || {}]); }
    pressSequentially(t, o) { return this._act("type", [String(t), o || {}]); }
    type(t, o) { return this._act("type", [String(t), o || {}]); }
    check(o) { return this._act("check", [true, o || {}]); }
    uncheck(o) { return this._act("check", [false, o || {}]); }
    setChecked(v, o) { return this._act("check", [!!v, o || {}]); }
    selectOption(v, o) { return this._act("select", [Array.isArray(v) ? v : [v], o || {}]); }
    setInputFiles(f) {
      const list = (Array.isArray(f) ? f : [f]).map((x) => typeof x === "string" ? { name: x.split("/").pop(), mimeType: x.endsWith(".pdf") ? "application/pdf" : "application/octet-stream", text: "%PDF-1.4 tệp mẫu" } : { name: x.name, mimeType: x.mimeType, text: typeof x.buffer === "string" ? x.buffer : x.buffer && x.buffer.text ? x.buffer.text : "dữ liệu" });
      return this._act("files", [list]);
    }
    dragTo(target, o) { return this._act("drag", [target.steps, String(target), o || {}]); }
    scrollIntoViewIfNeeded() { return this._act("scroll"); }
    highlight() { return this._act("highlight"); }
    textContent(o) { return this._act("textContent", [o || {}]); }
    innerText(o) { return this._act("innerText", [o || {}]); }
    innerHTML(o) { return this._act("innerHTML", [o || {}]); }
    inputValue(o) { return this._act("inputValue", [o || {}]); }
    getAttribute(n, o) { return this._act("getAttribute", [n, o || {}]); }
    isVisible() { return this._act("isVisible"); }
    isHidden() { return this._act("isVisible").then((v) => !v); }
    isEnabled() { return this._act("isEnabled"); }
    isDisabled() { return this._act("isEnabled").then((v) => !v); }
    isChecked() { return this._act("isChecked"); }
    isEditable() { return this._act("isEditable"); }
    count() { return this._act("count"); }
    allTextContents() { return this._act("allTextContents"); }
    allInnerTexts() { return this._act("allInnerTexts"); }
    boundingBox() { return this._act("boundingBox"); }
    waitFor(o) { return this._act("waitFor", [o || {}]); }
    evaluate(fn, arg) { return this._act("evaluate", [String(fn), arg]); }
    async all() { const n = await this.count(); return Array.from({ length: n }, (_, i) => this.nth(i)); }
    get page() { return page; }
  }
  class FrameLocator {
    constructor(steps, label) { this.steps = steps; this.label = label; }
    _l() { return new Locator(this.steps, this.label); }
    getByRole(r, o) { return this._l().getByRole(r, o); }
    getByText(t, o) { return this._l().getByText(t, o); }
    getByLabel(t, o) { return this._l().getByLabel(t, o); }
    getByPlaceholder(t, o) { return this._l().getByPlaceholder(t, o); }
    getByTestId(t) { return this._l().getByTestId(t); }
    getByTitle(t, o) { return this._l().getByTitle(t, o); }
    getByAltText(t, o) { return this._l().getByAltText(t, o); }
    locator(s) { return this._l().locator(s); }
    frameLocator(s) { return this._l().frameLocator(s); }
    owner() { return new Locator(this.steps.slice(0, -1).concat([{ k: "css", sel: this.steps[this.steps.length - 1].sel || "iframe" }]), this.label + ".owner()"); }
  }

  class Dialog {
    constructor(d, rec) { this.d = d; this.rec = rec; }
    message() { return this.d.message; }
    type() { return this.d.kind; }
    defaultValue() { return this.d.defaultValue || ""; }
    async accept(text) { if (this.rec) { this.rec.action = "accept"; this.rec.text = text; } }
    async dismiss() { if (this.rec) this.rec.action = "dismiss"; }
  }

  // ---- API: fixture request ----
  const VIRTUAL = "https://sokhach.playforge.dev";
  let labUser = "anon";
  function resolveApiUrl(url, base) {
    let u = String(url);
    if (base && !/^https?:\/\//.test(u)) u = String(base).replace(/\/$/, "") + (u.startsWith("/") ? u : "/" + u);
    if (u.startsWith(VIRTUAL)) u = u.slice(VIRTUAL.length);
    if (/^https?:\/\//.test(u)) throw new Error("Sandbox chỉ gọi được API của Sổ Khách (" + VIRTUAL + "/lab-api/v1/...).");
    if (!u.startsWith("/")) u = "/" + u;
    return u;
  }
  function makeResponse(res, body, path) {
    const text = new TextDecoder().decode(body);
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return {
      __pwResponse: true,
      status: () => res.status,
      statusText: () => res.statusText,
      ok: () => res.status >= 200 && res.status < 300,
      headers: () => headers,
      headersArray: () => Object.keys(headers).map((name) => ({ name, value: headers[name] })),
      url: () => VIRTUAL + path,
      text: async () => text,
      body: async () => body,
      json: async () => { try { return JSON.parse(text); } catch (e) { throw new Error("Response không phải JSON: " + text.slice(0, 120)); } },
      dispose: async () => {},
    };
  }
  function makeRequestContext(opts) {
    opts = opts || {};
    const doFetch = async (method, url, o) => {
      o = o || {};
      let path = resolveApiUrl(url, o.baseURL || opts.baseURL);
      if (o.params) {
        const sp = new URLSearchParams();
        for (const k of Object.keys(o.params)) if (o.params[k] !== undefined) sp.append(k, String(o.params[k]));
        const qs = sp.toString();
        if (qs) path += (path.includes("?") ? "&" : "?") + qs;
      }
      const headers = Object.assign({ "x-lab-user": labUser }, opts.extraHTTPHeaders || {}, o.headers || {});
      let body;
      if (o.multipart) {
        const fd = new FormData();
        for (const k of Object.keys(o.multipart)) {
          const v = o.multipart[k];
          if (v && typeof v === "object" && "name" in v) fd.append(k, new Blob([typeof v.buffer === "string" ? v.buffer : v.buffer && v.buffer.text ? v.buffer.text : "dữ liệu"], { type: v.mimeType || "application/octet-stream" }), v.name);
          else fd.append(k, String(v));
        }
        body = fd;
      } else if (o.form) {
        body = new URLSearchParams(o.form).toString();
        headers["content-type"] = headers["content-type"] || "application/x-www-form-urlencoded";
      } else if (o.data !== undefined) {
        body = typeof o.data === "string" ? o.data : JSON.stringify(o.data);
        if (typeof o.data !== "string") headers["content-type"] = headers["content-type"] || "application/json";
      }
      const ctrl = new AbortController();
      const ms = o.timeout || opts.timeout || 30000;
      const timer = setTimeout(() => ctrl.abort(), ms);
      const t0 = Date.now();
      const m = method.toUpperCase();
      let res, buf;
      try {
        res = await fetch(self.location.origin + path, { method: m, headers, body, signal: ctrl.signal });
        buf = new Uint8Array(await res.arrayBuffer());
      } catch (e) {
        post({ type: "step", test: currentTest, name: m + " " + path + " → lỗi mạng", kind: "api", phase: "end", ok: false, ms: Date.now() - t0 });
        throw new Error(e && e.name === "AbortError" ? "apiRequestContext." + m.toLowerCase() + ": Timeout " + ms + "ms" : "apiRequestContext." + m.toLowerCase() + ": " + (e && e.message));
      } finally { clearTimeout(timer); }
      post({ type: "step", test: currentTest, name: m + " " + path + " → " + res.status, kind: "api", phase: "end", ok: true, ms: Date.now() - t0 });
      return makeResponse(res, buf, path);
    };
    return {
      get: (u, o) => doFetch("GET", u, o),
      post: (u, o) => doFetch("POST", u, o),
      put: (u, o) => doFetch("PUT", u, o),
      patch: (u, o) => doFetch("PATCH", u, o),
      delete: (u, o) => doFetch("DELETE", u, o),
      head: (u, o) => doFetch("HEAD", u, o),
      fetch: (u, o) => doFetch((o && o.method) || "GET", u, o),
      dispose: async () => {},
      storageState: async () => ({ cookies: [], origins: [] }),
    };
  }
  const requestApi = { newContext: async (o) => makeRequestContext(o) };

  // ---- page.route ----
  const routeHandlers = new Map();
  let routeSeq = 0;
  function onRoute(d) {
    const h = routeHandlers.get(d.routeId);
    const req = d.request;
    const request = { url: () => req.url, method: () => req.method, headers: () => req.headers || {}, postData: () => req.postData ?? null, postDataJSON: () => { try { return JSON.parse(req.postData); } catch (e) { return null; } } };
    let decided = false;
    const decide = (v) => { if (decided) return; decided = true; rpc("routeDecision", Object.assign({ reqId: d.reqId }, v)); };
    const route = {
      request: () => request,
      fulfill: async (o) => {
        o = o || {};
        let body = o.body !== undefined ? (typeof o.body === "string" ? o.body : JSON.stringify(o.body)) : o.json !== undefined ? JSON.stringify(o.json) : "";
        let headers = Object.assign({}, o.headers || {});
        if (o.json !== undefined) headers["content-type"] = "application/json";
        if (o.response) { const r = o.response; body = o.json !== undefined ? body : await r.text(); headers = Object.assign({}, r.headers(), headers); decide({ action: "fulfill", status: o.status || r.status(), headers, body }); return; }
        decide({ action: "fulfill", status: o.status || 200, headers, body });
      },
      abort: async (code) => decide({ action: "abort", code: code || "failed" }),
      continue: async (o) => decide({ action: "continue", headers: o && o.headers, postData: o && o.postData }),
      fallback: async () => decide({ action: "continue" }),
      fetch: async (o) => makeRequestContext({}).fetch(req.url, Object.assign({ method: req.method, data: req.postData === null ? undefined : req.postData, headers: req.headers }, o || {})),
    };
    Promise.resolve().then(() => h ? h(route, request) : null).then(() => { if (!decided) decide({ action: "continue" }); }).catch((e) => { asyncErrors.push(e); decide({ action: "continue" }); });
  }

  const root = new Locator([], "");
  const page = {
    goto: (url, o) => call("goto", { url: String(url), waitUntil: o && o.waitUntil }),
    url: () => call("url"),
    title: () => call("title"),
    reload: () => call("reload"),
    goBack: () => call("history", { dir: -1 }),
    goForward: () => call("history", { dir: 1 }),
    waitForTimeout: (ms) => call("sleep", { ms }),
    waitForURL: (u, o) => call("waitForURL", { url: serial(u), timeout: o && o.timeout }),
    waitForLoadState: () => call("sleep", { ms: 50 }),
    content: () => call("content"),
    evaluate: (fn, arg) => call("evaluate", { fn: String(fn), arg }),
    setViewportSize: (s) => call("viewport", s),
    screenshot: () => call("screenshot"),
    pause: () => call("pause"),
    bringToFront: async () => {},
    close: async () => {},
    isClosed: () => false,
    keyboard: {
      press: (key) => call("keyboard", { kind: "press", key }),
      type: (text) => call("keyboard", { kind: "type", text: String(text) }),
      insertText: (text) => call("keyboard", { kind: "type", text: String(text) }),
      down: (key) => call("keyboard", { kind: "down", key }),
      up: (key) => call("keyboard", { kind: "up", key }),
    },
    mouse: {
      click: (x, y) => call("mouse", { kind: "click", x, y }),
      move: (x, y) => call("mouse", { kind: "move", x, y }),
      wheel: (dx, dy) => call("mouse", { kind: "wheel", dx, dy }),
    },
    on(ev, fn) { return this._on(ev, fn, false); },
    once(ev, fn) { return this._on(ev, fn, true); },
    off(ev, fn) { const i = dialogHandlers.findIndex((h) => h.fn === fn); if (i >= 0) dialogHandlers.splice(i, 1); },
    _on(ev, fn, once) {
      if (ev !== "dialog") { if (ev !== "console" && ev !== "request" && ev !== "response") console.warn("page.on('" + ev + "') chưa có trong sandbox, bỏ qua."); return page; }
      // Hộp thoại trình duyệt chặn đồng bộ nên phải biết trước cách xử lý: chạy thử handler với hộp thoại giả để ghi lại accept/dismiss.
      const rec = { action: "dismiss", text: undefined };
      try { const r = fn(new Dialog({ message: "", kind: "alert", defaultValue: "" }, rec)); if (r && r.catch) r.catch(() => {}); } catch (e) {}
      dialogHandlers.push({ fn, once });
      rpc("dialogPolicy", { action: rec.action, text: rec.text, once });
      return page;
    },
    waitForEvent: (ev, o) => {
      if (ev === "download") return call("waitDownload", { timeout: (o && o.timeout) || 5000 }).then((d) => ({ suggestedFilename: () => d.name, url: () => d.url, path: async () => "/tmp/" + d.name, saveAs: async () => {}, text: async () => d.text, failure: async () => null }));
      if (ev === "dialog") return call("waitDialog", { timeout: (o && o.timeout) || 5000 }).then((d) => new Dialog(d, null));
      if (ev === "popup") return Promise.reject(new Error("Sandbox chưa hỗ trợ tab/popup mới. Hãy dùng chế độ Chromium thật."));
      return Promise.reject(new Error("waitForEvent('" + ev + "') chưa có trong sandbox."));
    },
    waitForResponse: (u, o) => {
      if (typeof u === "function") return Promise.reject(new Error("Sandbox chỉ hỗ trợ waitForResponse với chuỗi/glob hoặc RegExp."));
      return call("waitNet", { kind: "response", url: serial(u), timeout: (o && o.timeout) || 10000 }).then((r) => ({ url: () => r.url, status: () => r.status, ok: () => r.status >= 200 && r.status < 300, text: async () => r.body, json: async () => JSON.parse(r.body), headers: () => r.headers || {}, request: () => ({ url: () => r.url, method: () => r.method, postData: () => r.postData, postDataJSON: () => { try { return JSON.parse(r.postData); } catch (e) { return null; } } }), __pwResponse: true }));
    },
    waitForRequest: (u, o) => {
      if (typeof u === "function") return Promise.reject(new Error("Sandbox chỉ hỗ trợ waitForRequest với chuỗi/glob hoặc RegExp."));
      return call("waitNet", { kind: "request", url: serial(u), timeout: (o && o.timeout) || 10000 }).then((r) => ({ url: () => r.url, method: () => r.method, postData: () => r.postData, postDataJSON: () => { try { return JSON.parse(r.postData); } catch (e) { return null; } }, headers: () => r.headers || {} }));
    },
    route: async (u, handler, o) => {
      if (typeof u === "function") throw new Error("Sandbox chỉ hỗ trợ page.route với chuỗi/glob hoặc RegExp.");
      const id = ++routeSeq;
      routeHandlers.set(id, handler);
      await call("route", { id, url: serial(u), times: o && o.times });
    },
    unroute: async (u) => { await call("unroute", { url: serial(u) }); },
    unrouteAll: async () => { routeHandlers.clear(); await call("unroute", { all: true }); },
    request: makeRequestContext({}),
    context: () => context,
    frameLocator: (s) => root.frameLocator(s),
    locator: (s, o) => root.locator(s, o),
    getByRole: (r, o) => root.getByRole(r, o),
    getByText: (t, o) => root.getByText(t, o),
    getByLabel: (t, o) => root.getByLabel(t, o),
    getByPlaceholder: (t, o) => root.getByPlaceholder(t, o),
    getByAltText: (t, o) => root.getByAltText(t, o),
    getByTitle: (t, o) => root.getByTitle(t, o),
    getByTestId: (t) => root.getByTestId(t),
    click: (sel, o) => root.locator(sel).click(o),
    fill: (sel, v) => root.locator(sel).fill(v),
    textContent: (sel) => root.locator(sel).textContent(),
    isVisible: (sel) => root.locator(sel).isVisible(),
  };
  const context = {
    pages: () => [page],
    newPage: async () => page,
    clearCookies: async () => call("reset", { keepPage: true }),
    storageState: async () => call("storageState"),
    waitForEvent: (ev) => page.waitForEvent(ev),
    close: async () => {},
  };

  function onEvent(d) {
    if (d.name === "route") return onRoute(d);
    if (d.name === "dialog") {
      const i = dialogHandlers.findIndex(() => true);
      if (i < 0) return;
      const h = dialogHandlers[i];
      if (h.once) dialogHandlers.splice(i, 1);
      Promise.resolve().then(() => h.fn(new Dialog(d.dialog, null))).catch((e) => asyncErrors.push(e));
    }
  }

  // ---- expect web-first ----
  function locExpect(loc, negate, soft, timeout) {
    const m = {};
    const names = ["toBeVisible", "toBeHidden", "toBeEnabled", "toBeDisabled", "toBeChecked", "toBeEditable", "toBeFocused", "toBeEmpty", "toBeAttached", "toHaveText", "toContainText", "toHaveValue", "toHaveValues", "toHaveCount", "toHaveAttribute", "toHaveClass", "toHaveCSS", "toHaveId", "toBeInViewport", "toHaveAccessibleName"];
    for (const name of names) {
      m[name] = async (...args) => {
        const opts = (typeof args[args.length - 1] === "object" && args[args.length - 1] !== null && !(args[args.length - 1] instanceof RegExp) && !Array.isArray(args[args.length - 1]) && name !== "toHaveText" && name !== "toContainText") ? args[args.length - 1] : (typeof args[1] === "object" && args[1] && !(args[1] instanceof RegExp) ? args[1] : {});
        try {
          await call("expect", { steps: loc.steps, desc: loc.label, matcher: name, args: args.map(serial), negate, timeout: (opts && opts.timeout) || timeout });
        } catch (e) {
          if (soft) { softErrors.push(e); return; }
          throw e;
        }
      };
    }
    return m;
  }
  function pageExpect(negate, soft, timeout) {
    const mk = (matcher) => async (v, o) => {
      try { await call("expectPage", { matcher, value: serial(v), negate, timeout: (o && o.timeout) || timeout }); }
      catch (e) { if (soft) { softErrors.push(e); return; } throw e; }
    };
    return { toHaveURL: mk("toHaveURL"), toHaveTitle: mk("toHaveTitle") };
  }
  const baseExpect = expect;
  function pwExpect(actual, opt) {
    const timeout = typeof opt === "object" && opt ? opt.timeout : undefined;
    if (actual instanceof Locator) { const m = locExpect(actual, false, false, timeout); m.not = locExpect(actual, true, false, timeout); return m; }
    if (actual === page) { const m = pageExpect(false, false, timeout); m.not = pageExpect(true, false, timeout); return m; }
    if (actual && actual.__pwResponse) {
      const mk = (neg) => ({ toBeOK: () => { const okv = actual.status() >= 200 && actual.status() < 300; if (okv === neg) throw new AssertionError("expect(response)" + (neg ? ".not" : "") + ".toBeOK()\nMong đợi: status " + (neg ? "ngoài" : "trong") + " khoảng 200–299\nNhận được: " + actual.status() + " " + actual.url()); } });
      const m = Object.assign(baseExpect(actual), mk(false));
      m.not = Object.assign(baseExpect(actual).not, mk(true));
      return m;
    }
    return baseExpect(actual);
  }
  pwExpect.soft = (actual, opt) => {
    const timeout = typeof opt === "object" && opt ? opt.timeout : undefined;
    if (actual instanceof Locator) { const m = locExpect(actual, false, true, timeout); m.not = locExpect(actual, true, true, timeout); return m; }
    if (actual === page) { const m = pageExpect(false, true, timeout); m.not = pageExpect(true, true, timeout); return m; }
    const wrap = (neg) => new Proxy({}, { get: (_, n) => (...a) => { try { const mm = baseExpect(actual); (neg ? mm.not : mm)[n](...a); } catch (e) { softErrors.push(e); } } });
    const s = wrap(false); s.not = wrap(true); return s;
  };
  pwExpect.configure = () => pwExpect;
  pwExpect.poll = (fn, o) => {
    const mk = (neg) => new Proxy({}, { get: (_, n) => async (...a) => {
      const end = Date.now() + ((o && o.timeout) || 5000); let last;
      while (true) { try { const v = await fn(); const mm = baseExpect(v); (neg ? mm.not : mm)[n](...a); return; } catch (e) { last = e; } if (Date.now() > end) throw last; await new Promise((r) => setTimeout(r, 100)); }
    } });
    const p = mk(false); p.not = mk(true); return p;
  };

  // ---- Bộ chạy test ----
  let currentInfo = null;
  function makeInfo(title, path) {
    return {
      title, titlePath: path, retry: 0, repeatEachIndex: 0, workerIndex: 0, project: { name: "chromium" }, annotations: [], tags: [],
      attach: async (name, o) => { post({ type: "step", test: currentTest, name: "attach: " + name, kind: "step", phase: "end", ok: true, ms: 0 }); },
      skip: (c) => { if (c === undefined || c) throw Object.assign(new Error("__skip__"), { __skip: "skip" }); },
      setTimeout: (ms) => { testTimeout = ms; },
      outputPath: (...p) => "test-results/" + p.join("/"),
    };
  }
  function newSuite(title, parent) { return { title, parent, tests: [], suites: [], beforeEach: [], afterEach: [], beforeAll: [], afterAll: [], mode: "default" }; }
  let rootSuite, curSuite, fixtureDefs, onlyMode, testTimeout;

  function paramNames(fn) {
    const s = String(fn);
    const m = s.match(/^[^(]*\(\s*\{([^}]*)\}/) || s.match(/^\s*async\s*\{([^}]*)\}/);
    if (!m) return [];
    return m[1].split(",").map((x) => x.split(":")[0].split("=")[0].trim()).filter(Boolean);
  }

  function makeTest(fixtures) {
    const t = (title, a, b) => {
      const details = typeof a === "object" && a && !(typeof a === "function") ? a : {};
      const fn = typeof a === "function" ? a : b;
      curSuite.tests.push({ title, fn, suite: curSuite, fixtures, tags: [].concat(details.tag || []), mods: {} });
    };
    const withMod = (mod) => (title, a, b) => {
      if (typeof title !== "string") { if (title === undefined || title === true) throw Object.assign(new Error("__skip__"), { __skip: mod }); return; }
      t(title, a, b);
      curSuite.tests[curSuite.tests.length - 1].mods[mod] = true;
      if (mod === "only") onlyMode = true;
    };
    t.only = withMod("only");
    t.skip = withMod("skip");
    t.fixme = withMod("fixme");
    t.fail = withMod("fail");
    t.slow = () => { testTimeout *= 3; };
    t.setTimeout = (ms) => { testTimeout = ms; };
    t.use = () => {};
    t.info = () => currentInfo;
    t.describe = (title, a, b) => {
      const fn = typeof a === "function" ? a : b;
      const s = newSuite(title, curSuite);
      curSuite.suites.push(s);
      const prev = curSuite; curSuite = s;
      try { fn(); } finally { curSuite = prev; }
      return s;
    };
    t.describe.only = (title, fn) => { const s = t.describe(title, fn); const mark = (x) => { x.tests.forEach((y) => { y.mods.only = true; }); x.suites.forEach(mark); }; mark(s); onlyMode = true; };
    t.describe.skip = (title, fn) => { const s = t.describe(title, fn); const mark = (x) => { x.tests.forEach((y) => { y.mods.skip = true; }); x.suites.forEach(mark); }; mark(s); };
    t.describe.serial = (title, fn) => { const s = t.describe(title, fn); s.mode = "serial"; };
    t.describe.parallel = t.describe;
    t.describe.configure = (o) => { if (o && o.mode) curSuite.mode = o.mode; };
    t.beforeEach = (fn) => curSuite.beforeEach.push(fn);
    t.afterEach = (fn) => curSuite.afterEach.push(fn);
    t.beforeAll = (fn) => curSuite.beforeAll.push(fn);
    t.afterAll = (fn) => curSuite.afterAll.push(fn);
    t.step = async (title, fn) => {
      post({ type: "step", test: currentTest, name: title, kind: "step", phase: "begin" });
      const t0 = Date.now();
      try { const r = await fn(); post({ type: "step", test: currentTest, name: title, kind: "step", phase: "end", ok: true, ms: Date.now() - t0 }); return r; }
      catch (e) { post({ type: "step", test: currentTest, name: title, kind: "step", phase: "end", ok: false, ms: Date.now() - t0 }); throw e; }
    };
    t.extend = (defs) => makeTest({ ...fixtures, ...defs });
    t.expect = pwExpect;
    t.__fixtures = fixtures;
    return t;
  }

  const BUILTIN = ["page", "context", "browserName", "baseURL", "request", "browser"];

  async function setupFixtures(names, fixtures, cleanups, cache) {
    const out = {};
    for (const n of names) out[n] = await getFixture(n, fixtures, cleanups, cache);
    return out;
  }
  async function getFixture(name, fixtures, cleanups, cache) {
    if (name in cache) return cache[name];
    if (name === "page") return (cache.page = page);
    if (name === "context") return (cache.context = context);
    if (name === "browserName") return (cache.browserName = "chromium");
    if (name === "baseURL") return (cache.baseURL = "https://sokhach.playforge.dev");
    if (name === "browser") return (cache.browser = { newContext: async () => context, newPage: async () => page, version: () => "sandbox" });
    if (name === "request") return (cache.request = makeRequestContext({}));
    let def = fixtures[name];
    if (def === undefined) throw new Error("Không có fixture '" + name + "'. Kiểm tra test.extend({ " + name + ": ... }).");
    if (Array.isArray(def)) def = def[0];
    if (typeof def !== "function") return (cache[name] = def);
    const deps = await setupFixtures(paramNames(def), fixtures, cleanups, cache);
    let resolveUse, valueSet;
    const valueP = new Promise((r) => { valueSet = r; });
    const done = new Promise((r) => { resolveUse = r; });
    const run = Promise.resolve().then(() => def(deps, async (v) => { valueSet(v); await done; }));
    run.catch((e) => valueSet(Promise.reject(e)));
    const v = await valueP;
    cleanups.push(async () => { resolveUse(); await run; });
    return (cache[name] = v);
  }

  function collect(s, path, out) {
    for (const t of s.tests) out.push({ ...t, path: [...path, t.title] });
    for (const c of s.suites) collect(c, [...path, c.title], out);
    return out;
  }
  function suiteChain(s) { const r = []; while (s) { r.unshift(s); s = s.parent; } return r; }

  async function runHook(fn, fixtures, cleanups, cache, label) {
    const args = await setupFixtures(paramNames(fn).filter((n) => n !== "testInfo"), fixtures, cleanups, cache);
    post({ type: "step", test: currentTest, name: label, kind: "hook", phase: "begin" });
    const t0 = Date.now();
    try { await fn(args, currentInfo); post({ type: "step", test: currentTest, name: label, kind: "hook", phase: "end", ok: true, ms: Date.now() - t0 }); }
    catch (e) { post({ type: "step", test: currentTest, name: label, kind: "hook", phase: "end", ok: false, ms: Date.now() - t0 }); throw e; }
  }

  async function run(data) {
    const { code, files, userLines, grep, extraTests } = data;
    labUser = data.labUser || "anon";
    routeHandlers.clear();
    rootSuite = newSuite("", null); curSuite = rootSuite; fixtureDefs = {}; onlyMode = false;
    const test = makeTest({});
    // Module Node giả lập cho sandbox: fs, path, dotenv, faker, csv-parse
    const norm = (p) => String(p).replace(/^\.\//, "").replace(/^(\.\.\/)+/, "").replace(/^\/+/, "");
    const findFile = (p) => { const n = norm(p); return Object.keys(files || {}).find((f) => f === n || f.endsWith("/" + n)); };
    self.process = self.process || { env: {} };
    const parseEnv = (text) => { const out = {}; String(text).split(/\r?\n/).forEach((l) => { const m = l.match(/^\s*([A-Za-z_][\w]*)\s*=\s*(.*)\s*$/); if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, ""); }); return out; };
    const dotenv = { config: (o) => { const f = findFile((o && o.path) || ".env"); if (!f) return { error: new Error("Không có tệp .env trong dự án") }; const parsed = parseEnv(files[f]); Object.assign(self.process.env, parsed); return { parsed }; } };
    const VN_HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi", "Đỗ", "Ngô", "Dương", "Lý"];
    const VN_DEM = ["Thị", "Minh", "Ngọc", "Thu", "Gia", "Bảo", "Khánh", "Thanh", "Hải", "Mỹ"];
    const VN_TEN = ["Anh", "Hà", "Ngân", "Trâm", "Vy", "Linh", "Châu", "Mai", "Yến", "Nhiên", "Tâm", "Quỳnh"];
    const CITIES = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Huế", "Cần Thơ", "Hải Phòng", "Nha Trang", "Vinh"];
    const pickR = (a) => a[Math.floor(Math.random() * a.length)];
    const ascii = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
    const faker = {
      person: { fullName: () => pickR(VN_HO) + " " + pickR(VN_DEM) + " " + pickR(VN_TEN), firstName: () => pickR(VN_TEN), lastName: () => pickR(VN_HO) },
      internet: { email: (o) => ascii(((o && o.firstName) || pickR(VN_TEN)) + "." + ((o && o.lastName) || pickR(VN_HO))) + Math.floor(Math.random() * 100000) + "@mail.vn", password: () => "Mk@" + Math.random().toString(36).slice(2, 10) },
      location: { city: () => pickR(CITIES) },
      number: { int: (o) => { const min = (o && o.min) || 0, max = (o && o.max) || 9999; return min + Math.floor(Math.random() * (max - min + 1)); } },
      helpers: { arrayElement: pickR },
      string: { alphanumeric: (n) => Array.from({ length: n || 8 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""), uuid: () => "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)) },
      phone: { number: () => "09" + Math.floor(10000000 + Math.random() * 89999999) },
      date: { future: () => new Date(Date.now() + Math.random() * 3e10), past: () => new Date(Date.now() - Math.random() * 3e10) },
      seed: () => {},
    };
    const csvParse = (text, o) => {
      const lines = String(text).split(/\r?\n/).filter((l) => !(o && o.skip_empty_lines) || l.trim());
      const rows = lines.map((l) => l.split(",").map((x) => x.trim()));
      if (o && o.columns) { const head = rows.shift(); return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))); }
      return rows;
    };
    const fsMod = {
      readFileSync: (p, enc) => { const f = findFile(p); if (!f) { const e = new Error("ENOENT: không có tệp '" + p + "' trong dự án"); e.code = "ENOENT"; throw e; } return files[f]; },
      existsSync: (p) => !!findFile(p),
      writeFileSync: (p, data) => { files[norm(p)] = String(data); },
    };
    fsMod.promises = { readFile: async (p, e) => fsMod.readFileSync(p, e), writeFile: async (p, d) => fsMod.writeFileSync(p, d) };
    const pathMod = { join: (...a) => a.filter(Boolean).join("/").replace(/\/+/g, "/").replace(/\/\.\//g, "/"), resolve: (...a) => a.filter(Boolean).join("/").replace(/\/+/g, "/"), dirname: (p) => String(p).split("/").slice(0, -1).join("/") || ".", basename: (p) => String(p).split("/").pop(), extname: (p) => { const m = String(p).match(/\.[^./]+$/); return m ? m[0] : ""; } };
    const req = makeRequire(files, (name) => {
      if (name === "fs" || name === "node:fs") return fsMod;
      if (name === "fs/promises" || name === "node:fs/promises") return fsMod.promises;
      if (name === "path" || name === "node:path") return pathMod;
      if (name === "dotenv") return dotenv;
      if (name === "dotenv/config") { dotenv.config(); return {}; }
      if (name === "@faker-js/faker") return { faker, fakerVI: faker };
      if (name === "csv-parse/sync") return { parse: csvParse };
      if (name === "xlsx" || name === "exceljs") throw new Error("Sandbox chưa đọc được Excel. Hãy xuất sang CSV hoặc chạy bằng Playwright thật trên máy.");
      if (name === "@playwright/test" || name === "playwright/test") return { test, expect: pwExpect, request: requestApi, devices: {}, defineConfig: (c) => c, mergeTests: (...ts) => makeTest(Object.assign({}, ...ts.map((x) => x.__fixtures || {}))), mergeExpects: () => pwExpect };
      return null;
    });
    self.test = test; self.expect = pwExpect; self.page = page;
    let loadError = null;
    try {
      const src = "(async (require, module, exports) => {\n" + code + "\n;\n{\n" + (extraTests || "") + "\n}\n})\n//# sourceURL=user.js";
      const mod = { exports: {} };
      await withTimeout((0, eval)(src)(req, mod, mod.exports), 4000, "Tải file test");
    } catch (e) {
      const line = lineOf(e);
      loadError = { name: (e && e.name) || "Error", message: (e && e.message) || String(e), line: line !== null && line <= userLines ? line : null };
    }
    const all = collect(rootSuite, [], []);
    const gre = grep ? new RegExp(grep.re, grep.flags) : null;
    const selected = all.filter((t) => (!onlyMode || t.mods.only) && (!gre || gre.test(t.path.join(" ") + " " + t.tags.join(" "))));
    const results = [];
    const startedSuites = new Set();
    for (let i = 0; i < selected.length; i++) {
      const t = selected[i];
      const name = t.path.join(" › ");
      currentTest = name; softErrors = []; asyncErrors = []; dialogHandlers.length = 0; routeHandlers.clear(); testTimeout = 15000;
      currentInfo = makeInfo(t.title, t.path);
      if (t.mods.skip || t.mods.fixme) { results.push({ name, ok: true, skipped: true, ms: 0 }); post({ type: "test", name, status: "skipped" }); continue; }
      post({ type: "test", name, status: "running" });
      const t0 = Date.now();
      const cleanups = [];
      const cache = {};
      const fixtures = t.fixtures || {};
      let err = null, skipped = false;
      const chain = suiteChain(t.suite);
      try {
        // Trình duyệt sạch cho mỗi test; dữ liệu máy chủ chỉ reset ở đầu lượt chạy (giống thực tế)
        await call("reset", { fresh: i === 0 });
        const body = async () => {
          for (const s of chain) if (!startedSuites.has(s)) { startedSuites.add(s); for (const h of s.beforeAll) await runHook(h, fixtures, cleanups, cache, "beforeAll"); }
          for (const s of chain) for (const h of s.beforeEach) await runHook(h, fixtures, cleanups, cache, "beforeEach");
          const args = await setupFixtures(paramNames(t.fn).filter((n) => n !== "testInfo"), fixtures, cleanups, cache);
          await t.fn(args, currentInfo);
          if (asyncErrors.length) throw asyncErrors.shift();
        };
        await withTimeout(body(), testTimeout, "Test");
      } catch (e) {
        if (e && e.__skip) skipped = true; else err = e;
      }
      try { for (const s of chain.slice().reverse()) for (const h of s.afterEach) await runHook(h, fixtures, cleanups, cache, "afterEach"); } catch (e) { err = err || e; }
      for (const c of cleanups.reverse()) { try { await c(); } catch (e) { err = err || e; } }
      const last = !selected.slice(i + 1).some((x) => suiteChain(x.suite).some((s) => chain.includes(s) && s !== rootSuite));
      if (last) for (const s of chain.slice().reverse()) { try { for (const h of s.afterAll) await runHook(h, fixtures, [], {}, "afterAll"); } catch (e) { err = err || e; } }
      if (!err && softErrors.length) err = new Error(softErrors.length + " soft assertion thất bại:\n" + softErrors.map((x) => "• " + x.message.split("\n")[0]).join("\n"));
      if (skipped) { results.push({ name, ok: true, skipped: true, ms: Date.now() - t0 }); post({ type: "test", name, status: "skipped" }); continue; }
      let ok = !err;
      let message = err ? (err.message || String(err)) : undefined;
      if (t.mods.fail) { ok = !ok; message = ok ? undefined : "test.fail(): mong đợi test này thất bại nhưng nó lại pass"; }
      const line = err ? lineOf(err) : null;
      results.push({ name, ok, ms: Date.now() - t0, error: message, line: line !== null && line <= userLines ? line : null, tags: t.tags });
      post({ type: "test", name, status: ok ? "passed" : "failed" });
    }
    currentTest = "";
    post({ type: "done", results, error: loadError, ms: 0, total: all.length });
  }

  return { run, resolve: resolveRpc, event: onEvent };
})();
`;
