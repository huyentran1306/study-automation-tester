"use client";

import { accessibleName, isEnabled, isVisible, norm, resolve, roleOf, textOf, type Pattern, type Step } from "./dom";
import { PREFIX } from "@/lib/practice/store";
import { labReset } from "@/lib/practice/api";

// pw-lite phía luồng chính: nhận RPC từ worker và thao tác thật trên iframe Sổ Khách.

export const VIRTUAL_ORIGIN = "https://sokhach.playforge.dev";

export interface TraceStep {
  id: number;
  test: string;
  name: string;
  kind: "action" | "expect" | "nav" | "step" | "hook" | "warn" | "context";
  ok: boolean;
  ms: number;
  error?: string;
  url?: string;
}

export interface HostOptions {
  slowMo?: number;
  actionTimeout?: number;
  expectTimeout?: number;
  onStep?: (s: TraceStep) => void;
  onEvent?: (e: { name: string; [k: string]: unknown }) => void;
}

type W = Window & typeof globalThis;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class PwError extends Error {
  constructor(msg: string, name = "Error") {
    super(msg);
    this.name = name;
  }
}

function describeEl(el: Element) {
  const html = el.outerHTML.replace(/\s+/g, " ");
  const open = html.slice(0, html.indexOf(">") + 1);
  const text = norm(el.textContent).slice(0, 30);
  return `${open.length > 90 ? open.slice(0, 87) + "…>" : open}${text}${text ? "…" : ""}`;
}

function show(v: unknown): string {
  if (v && typeof v === "object" && "re" in (v as object)) return `/${(v as { re: string }).re}/${(v as { flags: string }).flags}`;
  return JSON.stringify(v);
}

const KEYMAP: Record<string, string> = { Control: "Control", Ctrl: "Control", Meta: "Meta", ControlOrMeta: "Control", Shift: "Shift", Alt: "Alt" };

export class PwHost {
  private stepId = 0;
  private policies: { action: string; text?: string; once: boolean }[] = [];
  private dialogWaiters: ((d: { message: string; kind: string; defaultValue?: string }) => void)[] = [];
  private downloadWaiters: ((d: { name: string; url: string; text: string }) => void)[] = [];
  private lastHover: Element | null = null;
  private routes: { id: number; src: string; re: RegExp; times?: number }[] = [];
  private pendingRoutes = new Map<number, (d: Record<string, unknown>) => void>();
  private netWaiters: { kind: "request" | "response"; re: RegExp; resolve: (v: unknown) => void }[] = [];
  private reqSeq = 0;
  private overlay: HTMLElement | null = null;

  constructor(private frame: HTMLIFrameElement, private opts: HostOptions = {}) {
    frame.addEventListener("load", () => this.install());
  }

  setSlowMo(ms: number) {
    this.opts.slowMo = ms;
  }

  private get win(): W | null {
    return (this.frame.contentWindow as W) ?? null;
  }
  private get doc(): Document | null {
    try {
      return this.frame.contentDocument;
    } catch {
      return null;
    }
  }

  /** Cài móc vào cửa sổ iframe: hộp thoại trình duyệt, download. */
  private install() {
    const w = this.win;
    // Đánh dấu trên cửa sổ thật của trang (contentWindow là WindowProxy, giữ nguyên khi iframe chuyển trang)
    const mark = w as unknown as { __pfHooked?: boolean };
    if (!w || mark.__pfHooked) return;
    mark.__pfHooked = true;
    const handle = (kind: string, message: string, def?: string): unknown => {
      const p = this.policies[0];
      if (p?.once) this.policies.shift();
      const accept = p ? p.action === "accept" : false;
      const d = { message: String(message ?? ""), kind, defaultValue: def };
      this.opts.onEvent?.({ name: "dialog", dialog: d });
      this.dialogWaiters.splice(0).forEach((f) => f(d));
      this.record({ name: `dialog (${kind}): "${d.message}" → ${accept ? "accept" : "dismiss"}`, kind: "warn", ok: true, ms: 0 });
      if (kind === "confirm") return accept;
      if (kind === "prompt") return accept ? (p?.text ?? def ?? "") : null;
      return undefined;
    };
    w.alert = (m?: unknown) => void handle("alert", String(m ?? ""));
    w.confirm = (m?: string) => handle("confirm", m ?? "") as boolean;
    w.prompt = (m?: string, d?: string) => handle("prompt", m ?? "", d) as string | null;
    const self = this;
    // Thay fetch của app để page.route / waitForResponse hoạt động
    const origFetch = w.fetch.bind(w);
    w.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawUrl = typeof input === "string" ? input : input instanceof w.Request ? input.url : String(input);
      const abs = new URL(rawUrl, w.location.href);
      const virtual = abs.origin === window.location.origin ? VIRTUAL_ORIGIN + abs.pathname + abs.search : abs.href;
      const method = (init?.method ?? (input instanceof w.Request ? input.method : "GET")).toUpperCase();
      const postData = typeof init?.body === "string" ? init.body : null;
      const headers: Record<string, string> = {};
      new w.Headers(init?.headers).forEach((v, k) => { headers[k] = v; });
      const info = { url: virtual, method, postData, headers };
      self.emitNet("request", info);
      const r = self.routes.find((x) => x.re.test(virtual));
      let res: Response;
      if (r) {
        if (r.times !== undefined) {
          r.times -= 1;
          if (r.times <= 0) self.routes = self.routes.filter((x) => x !== r);
        }
        const reqId = ++self.reqSeq;
        const t0 = Date.now();
        const d = await new Promise<Record<string, unknown>>((resolve) => {
          self.pendingRoutes.set(reqId, resolve);
          self.opts.onEvent?.({ name: "route", routeId: r.id, reqId, request: info });
        });
        self.record({ name: `route ${method} ${abs.pathname} → ${d.action}${d.action === "fulfill" ? " " + (d.status ?? 200) : ""}`, kind: "nav", ok: true, ms: Date.now() - t0 });
        if (d.action === "abort") throw new w.TypeError("Failed to fetch (route.abort)");
        if (d.action === "fulfill") {
          const status = Number(d.status ?? 200);
          res = new w.Response(status === 204 || status === 304 ? null : String(d.body ?? ""), { status, headers: (d.headers as Record<string, string>) ?? {} });
        } else {
          const h2 = { ...headers, ...((d.headers as Record<string, string>) ?? {}) };
          res = await origFetch(input, { ...init, headers: h2, body: (d.postData as string | undefined) ?? init?.body });
        }
      } else res = await origFetch(input, init);
      if (self.netWaiters.some((x) => x.kind === "response")) {
        const body = await res.clone().text().catch(() => "");
        self.emitNet("response", { ...info, status: res.status, body });
      }
      return res;
    };
    const origClick = w.HTMLAnchorElement.prototype.click;
    w.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute("download")) return self.captureDownload(this);
      return origClick.call(this);
    };
    w.document.addEventListener(
      "click",
      (e) => {
        const a = (e.target as Element)?.closest?.("a[download]") as HTMLAnchorElement | null;
        if (a) {
          e.preventDefault();
          self.captureDownload(a);
        }
      },
      true,
    );
  }

  private emitNet(kind: "request" | "response", info: { url: string; [k: string]: unknown }) {
    const hit = this.netWaiters.filter((x) => x.kind === kind && x.re.test(info.url));
    this.netWaiters = this.netWaiters.filter((x) => !hit.includes(x));
    hit.forEach((x) => x.resolve(info));
  }

  private toRegex(p: unknown): RegExp {
    if (p && typeof p === "object" && "re" in (p as object)) return new RegExp((p as { re: string }).re, (p as { flags: string }).flags);
    const s = String(p);
    if (!s.includes("*") && !s.includes("?")) {
      const full = s.startsWith("/") ? VIRTUAL_ORIGIN + s : s;
      return new RegExp("^" + full.replace(/[.+^${}()|[\]\\]/g, "\\$&") + "(\\?.*)?$");
    }
    let r = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "*" && s[i + 1] === "*") { r += ".*"; i++; if (s[i + 1] === "/") { r += "/?"; i++; } }
      else if (c === "*") r += "[^/]*";
      else if (c === "?") r += "\\?";
      else r += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp("^" + (s.startsWith("/") && !s.startsWith("//") ? VIRTUAL_ORIGIN.replace(/[.]/g, "\\.") : "") + r + "$");
  }

  private async captureDownload(a: HTMLAnchorElement) {
    const name = a.getAttribute("download") || a.href.split("/").pop() || "download";
    let text = "";
    try {
      text = await (await fetch(a.href)).text();
    } catch {
      /* bỏ qua */
    }
    this.record({ name: `download: ${name}`, kind: "warn", ok: true, ms: 0 });
    this.downloadWaiters.splice(0).forEach((f) => f({ name, url: a.href, text }));
  }

  private record(s: Omit<TraceStep, "id" | "test"> & { test?: string }) {
    const step: TraceStep = { id: ++this.stepId, test: s.test ?? this.currentTest, ...s };
    this.opts.onStep?.(step);
    return step;
  }
  private currentTest = "";

  virtualUrl(): string {
    const w = this.win;
    if (!w) return "about:blank";
    const loc = w.location;
    if (loc.href === "about:blank") return "about:blank";
    return VIRTUAL_ORIGIN + (loc.pathname.replace(/^\/practice/, "") || "/") + loc.search + loc.hash;
  }

  private waitLoad(timeout = 15000) {
    const started = Date.now();
    return new Promise<void>((res, rej) => {
      const t = setTimeout(() => rej(new PwError(`page.goto: Timeout ${timeout}ms khi chờ trang tải`, "TimeoutError")), timeout + 500);
      const on = async () => {
        this.frame.removeEventListener("load", on);
        this.install();
        // Chờ app trong iframe hydrate xong (React gắn sự kiện) rồi mới cho thao tác
        const w = this.win;
        if (w && w.location.href !== "about:blank") {
          while (!w.document.body?.dataset.hydrated) {
            if (Date.now() - started > timeout) break;
            await sleep(30);
          }
        }
        clearTimeout(t);
        res();
      };
      this.frame.addEventListener("load", on);
    });
  }

  private highlight(el: Element, label: string) {
    const d = this.doc;
    if (!d) return;
    this.overlay?.remove();
    const r = el.getBoundingClientRect();
    const box = d.createElement("div");
    box.setAttribute("data-pw-overlay", "");
    box.setAttribute("aria-hidden", "true");
    Object.assign(box.style, {
      position: "fixed", left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px`,
      border: "2px solid #2563C9", background: "rgba(37,99,201,0.10)", borderRadius: "6px", zIndex: "2147483647", pointerEvents: "none",
      boxSizing: "border-box",
    });
    const tag = d.createElement("div");
    tag.textContent = label;
    Object.assign(tag.style, { position: "absolute", left: "-2px", top: "-22px", background: "#2563C9", color: "#fff", font: "600 11px/18px ui-monospace,monospace", padding: "0 6px", borderRadius: "4px", whiteSpace: "nowrap" });
    box.appendChild(tag);
    d.body?.appendChild(box);
    this.overlay = box;
    const cur = box;
    setTimeout(() => { if (this.overlay === cur) { cur.remove(); this.overlay = null; } }, Math.max(600, (this.opts.slowMo ?? 0) * 2));
  }

  /** Phần tử ở tâm của el (để phát hiện bị che). */
  private hitTest(el: Element): Element | null {
    const d = el.ownerDocument;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    let hit = d.elementFromPoint(x, y);
    while (hit?.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    if (hit?.hasAttribute("data-pw-overlay")) return el;
    return hit;
  }

  private docOrThrow(): Document {
    const d = this.doc;
    if (!d || this.win?.location.href === "about:blank") throw new PwError("Trang đang trống. Gọi await page.goto('/login') trước khi tìm phần tử.");
    return d;
  }

  /** Chờ đúng 1 phần tử thỏa điều kiện (auto-wait + strict mode). */
  private async target(steps: Step[], desc: string, method: string, need: { visible?: boolean; enabled?: boolean; editable?: boolean; hit?: boolean }, timeout: number): Promise<Element> {
    const t0 = Date.now();
    const log: string[] = [`waiting for ${desc}`];
    let last = "";
    for (;;) {
      const d = this.doc;
      let reason = "";
      if (!d || this.win?.location.href === "about:blank") reason = "trang chưa mở (cần page.goto)";
      else {
        const els = resolve(steps, d);
        if (els.length > 1) {
          throw new PwError(`${method}: Error: strict mode violation: ${desc} resolved to ${els.length} elements:\n${els.slice(0, 5).map((e, i) => `    ${i + 1}) ${describeEl(e)}`).join("\n")}${els.length > 5 ? `\n    … và ${els.length - 5} phần tử nữa` : ""}\n\nGợi ý: thu hẹp locator (lọc theo dòng/vùng cha, .filter({ hasText }), hoặc tên chính xác) để chỉ còn 1 phần tử.`);
        }
        if (els.length === 0) reason = "chưa tìm thấy phần tử nào khớp";
        else {
          const el = els[0];
          if (need.visible && !isVisible(el)) reason = "phần tử có nhưng chưa hiển thị";
          else if (need.enabled && !isEnabled(el)) reason = "phần tử đang bị khóa (disabled)";
          else if (need.editable && ((el as HTMLInputElement).readOnly || !isEnabled(el))) reason = "ô nhập đang readonly/disabled";
          else {
            if (need.hit) {
              el.scrollIntoView({ block: "center", inline: "center" });
              const hit = this.hitTest(el);
              if (hit && hit !== el && !el.contains(hit) && !(hit.contains(el) && hit.tagName === "LABEL")) {
                reason = `${describeEl(hit)} đang che (intercepts pointer events)`;
              }
            }
            if (!reason) return el;
          }
        }
      }
      if (reason !== last) {
        log.push(`  - ${reason}`);
        last = reason;
      }
      if (Date.now() - t0 > timeout) {
        throw new PwError(`${method}: Timeout ${timeout}ms exceeded.\nCall log:\n  - ${log.join("\n  ")}`, "TimeoutError");
      }
      await sleep(60);
    }
  }

  private async single(steps: Step[], desc: string, method: string, timeout: number) {
    return this.target(steps, desc, method, {}, timeout);
  }

  private fire(el: Element, type: string, init: MouseEventInit = {}) {
    const w = win(el);
    const r = el.getBoundingClientRect();
    const base = { bubbles: true, cancelable: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, view: w, ...init };
    const Ctor = type.startsWith("pointer") ? w.PointerEvent ?? w.MouseEvent : w.MouseEvent;
    return el.dispatchEvent(new Ctor(type, base));
  }

  private hover(el: Element) {
    if (this.lastHover && this.lastHover !== el && this.lastHover.isConnected) {
      this.fire(this.lastHover, "pointerout", { relatedTarget: el });
      this.fire(this.lastHover, "mouseout", { relatedTarget: el });
    }
    this.fire(el, "pointerover", { relatedTarget: this.lastHover ?? undefined });
    this.fire(el, "pointerenter");
    this.fire(el, "mouseover", { relatedTarget: this.lastHover ?? el.ownerDocument.body });
    this.fire(el, "mouseenter");
    this.fire(el, "mousemove");
    this.lastHover = el;
  }

  private click(el: Element, o: { button?: string; clickCount?: number } = {}) {
    this.hover(el);
    const button = o.button === "right" ? 2 : o.button === "middle" ? 1 : 0;
    this.fire(el, "pointerdown", { button });
    this.fire(el, "mousedown", { button });
    if ((el as HTMLElement).focus && el.matches("input,select,textarea,button,a,[tabindex]")) (el as HTMLElement).focus();
    this.fire(el, "pointerup", { button });
    this.fire(el, "mouseup", { button });
    if (button === 2) {
      this.fire(el, "contextmenu", { button: 2 });
      return;
    }
    (el as HTMLElement).click();
  }

  private setValue(el: Element, value: string) {
    const w = win(el);
    const proto = el.tagName === "TEXTAREA" ? w.HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? w.HTMLSelectElement.prototype : w.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new w.Event("input", { bubbles: true, composed: true }));
  }

  private keyEvent(el: Element, type: string, key: string, mods: Set<string>) {
    const w = win(el);
    return el.dispatchEvent(new w.KeyboardEvent(type, { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true, cancelable: true, composed: true, ctrlKey: mods.has("Control"), shiftKey: mods.has("Shift"), altKey: mods.has("Alt"), metaKey: mods.has("Meta") }));
  }

  private press(el: Element, combo: string) {
    const parts = combo.split("+");
    const key = parts.pop()!;
    const mods = new Set(parts.map((p) => KEYMAP[p] ?? p));
    const ok = this.keyEvent(el, "keydown", key, mods);
    const input = el as HTMLInputElement;
    const editable = (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !input.readOnly;
    if (ok) {
      if (key.length === 1 && !mods.has("Control") && !mods.has("Meta") && editable) this.setValue(el, input.value + key);
      else if (key === "Backspace" && editable) this.setValue(el, input.value.slice(0, -1));
      else if ((key === "a" || key === "A") && (mods.has("Control") || mods.has("Meta")) && editable) input.select();
      else if (key === "Enter" && el.tagName === "INPUT") {
        const form = input.form;
        if (form) form.requestSubmit();
      } else if (key === "Tab") {
        const all = Array.from(el.ownerDocument.querySelectorAll<HTMLElement>("input,select,textarea,button,a[href],[tabindex]:not([tabindex='-1'])")).filter((x) => isVisible(x) && isEnabled(x));
        const i = all.indexOf(el as HTMLElement);
        all[(i + (mods.has("Shift") ? -1 : 1) + all.length) % all.length]?.focus();
      }
    }
    this.keyEvent(el, "keyup", key, mods);
    if (editable && (key.length === 1 || key === "Backspace")) el.dispatchEvent(new (win(el).Event)("change", { bubbles: true }));
  }

  // ---- RPC ----
  async handle(op: string, a: Record<string, unknown>, test: string): Promise<unknown> {
    this.currentTest = test;
    const actionTimeout = this.opts.actionTimeout ?? 5000;
    const t0 = Date.now();
    const done = <T>(name: string, kind: TraceStep["kind"], v: T) => {
      this.record({ name, kind, ok: true, ms: Date.now() - t0, url: this.virtualUrl() });
      return v;
    };
    const fail = (name: string, kind: TraceStep["kind"], e: unknown): never => {
      this.record({ name, kind, ok: false, ms: Date.now() - t0, error: (e as Error).message, url: this.virtualUrl() });
      throw e;
    };

    switch (op) {
      case "reset": {
        try {
          for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
        } catch {
          /* bỏ qua */
        }
        this.policies = [];
        this.lastHover = null;
        this.routes = [];
        this.pendingRoutes.forEach((f) => f({ action: "continue" }));
        this.pendingRoutes.clear();
        this.netWaiters = [];
        // Dữ liệu trên máy chủ /lab-api cũng về trạng thái mẫu (25 khách)
        if (a.fresh !== false) await labReset().catch(() => undefined);
        if (!a.keepPage) {
          const p = this.waitLoad();
          this.frame.src = "about:blank";
          await p;
        }
        return done("Mở context mới (trình duyệt sạch)", "context", null);
      }
      case "goto": {
        let url = String(a.url);
        if (url.startsWith(VIRTUAL_ORIGIN)) url = url.slice(VIRTUAL_ORIGIN.length) || "/";
        if (/^https?:\/\//.test(url)) return fail(`page.goto(${show(a.url)})`, "nav", new PwError(`page.goto: Sandbox chỉ mở được trang Sổ Khách (${VIRTUAL_ORIGIN}). Dùng đường dẫn tương đối như '/login'.`));
        if (!url.startsWith("/")) url = "/" + url;
        const p = this.waitLoad();
        this.frame.src = "/practice" + (url === "/" ? "" : url);
        try {
          await p;
        } catch (e) {
          fail(`page.goto('${url}')`, "nav", e);
        }
        await sleep(this.opts.slowMo ?? 0);
        return done(`page.goto('${url}')`, "nav", null);
      }
      case "url":
        return this.virtualUrl();
      case "title":
        return this.doc?.title ?? "";
      case "content":
        return this.doc?.documentElement.outerHTML ?? "";
      case "reload": {
        const p = this.waitLoad();
        this.win?.location.reload();
        await p;
        return done("page.reload()", "nav", null);
      }
      case "history": {
        this.win?.history.go(Number(a.dir));
        await sleep(400);
        return done(Number(a.dir) < 0 ? "page.goBack()" : "page.goForward()", "nav", null);
      }
      case "sleep": {
        const ms = Number(a.ms) || 0;
        await sleep(ms);
        if (ms >= 200) this.record({ name: `page.waitForTimeout(${ms}) · nên thay bằng assertion web-first`, kind: "warn", ok: true, ms });
        return null;
      }
      case "waitForURL":
      case "expectPage": {
        const timeout = Number(a.timeout) || (op === "waitForURL" ? 10000 : this.opts.expectTimeout ?? 5000);
        const matcher = op === "waitForURL" ? "toHaveURL" : String(a.matcher);
        const want = (op === "waitForURL" ? a.url : a.value) as Pattern;
        const negate = !!a.negate;
        const label = op === "waitForURL" ? `page.waitForURL(${show(want)})` : `expect(page)${negate ? ".not" : ""}.${matcher}(${show(want)})`;
        let actual = "";
        for (;;) {
          actual = matcher === "toHaveTitle" ? this.doc?.title ?? "" : this.virtualUrl();
          let pass: boolean;
          if (typeof want === "string") {
            if (matcher === "toHaveURL") pass = actual === want || actual === VIRTUAL_ORIGIN + want || (want.includes("*") && new RegExp("^" + want.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$").test(actual));
            else pass = actual === want;
          } else pass = new RegExp(want!.re, want!.flags).test(actual);
          if (pass !== negate) return done(label, "expect", null);
          if (Date.now() - t0 > timeout) return fail(label, "expect", new PwError(`${label} failed\n\nMong đợi${negate ? " (not)" : ""}: ${show(want)}\nNhận được: "${actual}"\nTimeout: ${timeout}ms`, "AssertionError"));
          await sleep(80);
        }
      }
      case "evaluate": {
        const w = this.win;
        if (!w) throw new PwError("Trang chưa mở");
        const fn = (w as unknown as { eval(s: string): (x: unknown) => unknown }).eval(`(${String(a.fn)})`);
        const v = await fn(a.arg);
        return done("page.evaluate(...)", "action", JSON.parse(JSON.stringify(v ?? null)));
      }
      case "viewport": {
        if (a.width) this.frame.style.width = `${Number(a.width)}px`;
        return null;
      }
      case "screenshot":
        this.record({ name: "page.screenshot() · sandbox không lưu ảnh, dùng Chromium thật để có ảnh", kind: "warn", ok: true, ms: 0 });
        return "";
      case "pause":
        this.record({ name: "page.pause() · trong sandbox chỉ dừng 2 giây", kind: "warn", ok: true, ms: 2000 });
        await sleep(2000);
        return null;
      case "storageState": {
        const origins = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).map((k) => ({ name: k, value: localStorage.getItem(k) }));
        return { cookies: [], origins: [{ origin: VIRTUAL_ORIGIN, localStorage: origins }] };
      }
      case "route":
        this.routes.push({ id: Number(a.id), src: JSON.stringify(a.url), re: this.toRegex(a.url), times: a.times === undefined ? undefined : Number(a.times) });
        return done(`page.route(${show(a.url)})`, "nav", null);
      case "unroute":
        this.routes = a.all ? [] : this.routes.filter((x) => x.src !== JSON.stringify(a.url));
        return null;
      case "routeDecision": {
        const f = this.pendingRoutes.get(Number(a.reqId));
        this.pendingRoutes.delete(Number(a.reqId));
        f?.(a);
        return null;
      }
      case "waitNet": {
        const kind = a.kind === "request" ? "request" : "response";
        const re = this.toRegex(a.url);
        const timeout = Number(a.timeout) || 10000;
        return new Promise((res, rej) => {
          const t = setTimeout(() => {
            this.netWaiters = this.netWaiters.filter((x) => x !== waiter);
            rej(new PwError(`page.waitFor${kind === "request" ? "Request" : "Response"}: Timeout ${timeout}ms khi chờ ${show(a.url)}.\nNhớ tạo Promise chờ TRƯỚC thao tác gây ra request.`, "TimeoutError"));
          }, timeout);
          const waiter = { kind, re, resolve: (v: unknown) => { clearTimeout(t); this.record({ name: `waitFor${kind === "request" ? "Request" : "Response"}(${show(a.url)})`, kind: "nav", ok: true, ms: Date.now() - t0 }); res(v); } } as (typeof this.netWaiters)[number];
          this.netWaiters.push(waiter);
        });
      }
      case "dialogPolicy":
        this.policies.push({ action: String(a.action), text: a.text as string | undefined, once: !!a.once });
        return null;
      case "waitDialog":
        return new Promise((res, rej) => {
          const t = setTimeout(() => rej(new PwError(`page.waitForEvent('dialog'): Timeout ${a.timeout}ms`, "TimeoutError")), Number(a.timeout));
          this.dialogWaiters.push((d) => { clearTimeout(t); res(d); });
        });
      case "waitDownload":
        return new Promise((res, rej) => {
          const t = setTimeout(() => rej(new PwError(`page.waitForEvent('download'): Timeout ${a.timeout}ms. Nhớ tạo Promise trước rồi mới click nút tải.`, "TimeoutError")), Number(a.timeout));
          this.downloadWaiters.push((d) => { clearTimeout(t); res(d); });
        });
      case "keyboard": {
        const d = this.docOrThrow();
        const el = d.activeElement ?? d.body;
        const label = `page.keyboard.${a.kind}(${show(a.key ?? a.text)})`;
        if (a.kind === "type") for (const ch of String(a.text)) this.press(el, ch);
        else if (a.kind === "press") this.press(el, String(a.key));
        else this.keyEvent(el, a.kind === "down" ? "keydown" : "keyup", String(a.key), new Set());
        return done(label, "action", null);
      }
      case "mouse": {
        const d = this.docOrThrow();
        const el = d.elementFromPoint(Number(a.x), Number(a.y));
        if (el && a.kind === "click") this.click(el);
        else if (el && a.kind === "move") this.hover(el);
        return done(`page.mouse.${a.kind}(${a.x}, ${a.y})`, "action", null);
      }
      case "act":
        return this.act(a, t0, done, fail, actionTimeout);
      case "expect":
        return this.expect(a, t0, done, fail);
      default:
        throw new PwError(`pw-lite chưa hỗ trợ thao tác "${op}"`);
    }
  }

  private async act(a: Record<string, unknown>, t0: number, done: <T>(n: string, k: TraceStep["kind"], v: T) => T, fail: (n: string, k: TraceStep["kind"], e: unknown) => never, actionTimeout: number) {
    const steps = a.steps as Step[];
    const desc = String(a.desc);
    const action = String(a.action);
    const args = (a.args as unknown[]) ?? [];
    const opt = (args.find((x) => x && typeof x === "object" && !Array.isArray(x)) ?? {}) as { timeout?: number; button?: string; force?: boolean; state?: string };
    const timeout = opt.timeout ?? actionTimeout;
    const argStr = action === "fill" || action === "press" || action === "type" ? `'${args[0]}'` : action === "select" ? show((args[0] as unknown[]).length === 1 ? (args[0] as unknown[])[0] : args[0]) : action === "getAttribute" ? `'${args[0]}'` : "";
    const apiName: Record<string, string> = { type: "pressSequentially", select: "selectOption", files: "setInputFiles", drag: "dragTo", check: args[0] ? "check" : "uncheck", scroll: "scrollIntoViewIfNeeded" };
    const label = `${desc}.${apiName[action] ?? action}(${argStr}${action === "drag" ? String(args[1]) : ""})`;
    const method = `locator.${apiName[action] ?? action}`;
    const slow = async (el: Element, l: string) => {
      this.highlight(el, l);
      if (this.opts.slowMo) await sleep(this.opts.slowMo);
    };
    try {
      switch (action) {
        case "click":
        case "dblclick":
        case "hover": {
          const el = await this.target(steps, desc, method, { visible: true, enabled: action !== "hover", hit: !opt.force }, timeout);
          await slow(el, action);
          if (action === "hover") this.hover(el);
          else if (action === "dblclick") { this.click(el); this.click(el); this.fire(el, "dblclick", { detail: 2 }); }
          else this.click(el, opt);
          return done(label, "action", null);
        }
        case "focus":
        case "blur": {
          const el = await this.single(steps, desc, method, timeout);
          (el as HTMLElement)[action]();
          return done(label, "action", null);
        }
        case "fill": {
          const el = await this.target(steps, desc, method, { visible: true, enabled: true, editable: true }, timeout);
          const ok = el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["checkbox", "radio", "file", "button", "submit"].includes((el as HTMLInputElement).type)) || (el as HTMLElement).isContentEditable;
          if (!ok) throw new PwError(`${method}: Error: Phần tử không phải ô nhập liệu: ${describeEl(el)}\nfill() chỉ dùng cho <input>, <textarea> hoặc [contenteditable].`);
          await slow(el, `fill`);
          (el as HTMLElement).focus();
          if ((el as HTMLElement).isContentEditable) el.textContent = String(args[0]);
          else this.setValue(el, String(args[0]));
          el.dispatchEvent(new (win(el).Event)("change", { bubbles: true }));
          return done(label, "action", null);
        }
        case "press":
        case "type": {
          const el = await this.target(steps, desc, method, { visible: true }, timeout);
          await slow(el, action === "press" ? `press ${args[0]}` : "type");
          (el as HTMLElement).focus();
          if (action === "press") this.press(el, String(args[0]));
          else for (const ch of String(args[0])) { this.press(el, ch); const delay = (opt as { delay?: number }).delay; if (delay) await sleep(delay); }
          return done(label, "action", null);
        }
        case "check": {
          const want = !!args[0];
          const el = await this.target(steps, desc, method, { visible: true, enabled: true, hit: true }, timeout);
          const role = roleOf(el);
          if (role !== "checkbox" && role !== "radio" && role !== "switch") throw new PwError(`${method}: Error: Phần tử không phải checkbox/radio: ${describeEl(el)}`);
          const state = () => (el.getAttribute("aria-checked") ? el.getAttribute("aria-checked") === "true" : (el as HTMLInputElement).checked);
          if (state() !== want) {
            if (!want && role === "radio") throw new PwError(`${method}: Error: Không thể bỏ chọn radio. Hãy chọn một radio khác.`);
            await slow(el, want ? "check" : "uncheck");
            this.click(el);
          }
          if (state() !== want) throw new PwError(`${method}: Error: Bấm xong nhưng trạng thái không đổi`);
          return done(label, "action", null);
        }
        case "select": {
          const el = await this.target(steps, desc, method, { visible: true, enabled: true }, timeout);
          if (el.tagName !== "SELECT") throw new PwError(`${method}: Error: Phần tử không phải <select>: ${describeEl(el)}\nVới dropdown tự làm, hãy click mở rồi click vào option.`);
          const sel = el as HTMLSelectElement;
          const wants = args[0] as (string | { value?: string; label?: string; index?: number })[];
          const picked: string[] = [];
          for (const w of wants) {
            const opts = Array.from(sel.options);
            const o = typeof w === "string" ? opts.find((x) => x.value === w) ?? opts.find((x) => norm(x.label) === norm(w)) : w.value !== undefined ? opts.find((x) => x.value === w.value) : w.label !== undefined ? opts.find((x) => norm(x.label) === norm(w.label!)) : opts[w.index ?? -1];
            if (!o) throw new PwError(`${method}: Error: Không có option khớp ${show(w)}. Các option: ${opts.map((x) => `"${x.label}" (value=${x.value})`).join(", ")}`);
            picked.push(o.value);
          }
          await slow(el, "selectOption");
          if (sel.multiple) Array.from(sel.options).forEach((o) => { o.selected = picked.includes(o.value); });
          else this.setValue(el, picked[0]);
          el.dispatchEvent(new (win(el).Event)("change", { bubbles: true }));
          return done(label, "action", picked);
        }
        case "files": {
          const el = await this.single(steps, desc, method, timeout);
          if (el.tagName !== "INPUT" || (el as HTMLInputElement).type !== "file") throw new PwError(`${method}: Error: Phần tử không phải <input type="file">`);
          const w = win(el);
          const dt = new w.DataTransfer();
          for (const f of args[0] as { name: string; mimeType: string; text: string }[]) dt.items.add(new w.File([f.text], f.name, { type: f.mimeType }));
          (el as HTMLInputElement).files = dt.files;
          el.dispatchEvent(new w.Event("input", { bubbles: true }));
          el.dispatchEvent(new w.Event("change", { bubbles: true }));
          return done(label, "action", null);
        }
        case "drag": {
          const src = await this.target(steps, desc, method, { visible: true }, timeout);
          const dst = await this.target(args[0] as Step[], String(args[1]), method, { visible: true }, timeout);
          await slow(src, "drag");
          const w = win(src);
          const dt = new w.DataTransfer();
          const ev = (el: Element, type: string) => el.dispatchEvent(new w.DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
          ev(src, "dragstart");
          ev(dst, "dragenter");
          ev(dst, "dragover");
          ev(dst, "drop");
          ev(src, "dragend");
          return done(label, "action", null);
        }
        case "scroll":
        case "highlight": {
          const el = await this.single(steps, desc, method, timeout);
          el.scrollIntoView({ block: "center" });
          if (action === "highlight") this.highlight(el, "highlight");
          return null;
        }
        case "textContent":
          return (await this.single(steps, desc, method, timeout)).textContent;
        case "innerText": {
          const el = await this.single(steps, desc, method, timeout);
          return (el as HTMLElement).innerText ?? textOf(el);
        }
        case "innerHTML":
          return (await this.single(steps, desc, method, timeout)).innerHTML;
        case "inputValue": {
          const el = await this.single(steps, desc, method, timeout);
          if (!["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) throw new PwError(`${method}: Error: Phần tử không phải <input>, <textarea> hay <select>`);
          return (el as HTMLInputElement).value;
        }
        case "getAttribute":
          return (await this.single(steps, desc, method, timeout)).getAttribute(String(args[0]));
        case "isVisible":
        case "isEnabled":
        case "isChecked":
        case "isEditable": {
          const d = this.doc;
          const els = d ? resolve(steps, d) : [];
          if (els.length > 1) throw new PwError(`${method}: Error: strict mode violation: ${desc} resolved to ${els.length} elements`);
          const el = els[0];
          if (!el) return action === "isVisible" ? false : fail(label, "action", new PwError(`${method}: không tìm thấy phần tử ${desc}`));
          if (action === "isVisible") return isVisible(el);
          if (action === "isEnabled") return isEnabled(el);
          if (action === "isEditable") return isEnabled(el) && !(el as HTMLInputElement).readOnly;
          return el.getAttribute("aria-checked") ? el.getAttribute("aria-checked") === "true" : !!(el as HTMLInputElement).checked;
        }
        case "count": {
          const d = this.doc;
          return d ? resolve(steps, d).length : 0;
        }
        case "allTextContents":
        case "allInnerTexts": {
          const d = this.doc;
          return d ? resolve(steps, d).map((e) => (action === "allInnerTexts" ? norm((e as HTMLElement).innerText) : e.textContent ?? "")) : [];
        }
        case "boundingBox": {
          const r = (await this.single(steps, desc, method, timeout)).getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }
        case "waitFor": {
          const state = opt.state ?? "visible";
          for (;;) {
            const d = this.doc;
            const els = d ? resolve(steps, d) : [];
            const vis = els.some(isVisible);
            const ok = state === "attached" ? els.length > 0 : state === "detached" ? els.length === 0 : state === "hidden" ? !vis : vis;
            if (ok) return done(`${desc}.waitFor({ state: '${state}' })`, "action", null);
            if (Date.now() - t0 > timeout) throw new PwError(`locator.waitFor: Timeout ${timeout}ms exceeded.\nCall log:\n  - waiting for ${desc} to be ${state}`, "TimeoutError");
            await sleep(60);
          }
        }
        case "evaluate": {
          const el = await this.single(steps, desc, method, timeout);
          const w = win(el) as unknown as { eval(s: string): (e: Element, x: unknown) => unknown };
          const v = await w.eval(`(${String(args[0])})`)(el, args[1]);
          return JSON.parse(JSON.stringify(v ?? null));
        }
      }
      throw new PwError(`pw-lite chưa hỗ trợ ${method}`);
    } catch (e) {
      return fail(label, "action", e);
    }
  }

  private async expect(a: Record<string, unknown>, t0: number, done: <T>(n: string, k: TraceStep["kind"], v: T) => T, fail: (n: string, k: TraceStep["kind"], e: unknown) => never) {
    const steps = a.steps as Step[];
    const desc = String(a.desc);
    const m = String(a.matcher);
    const args = (a.args as unknown[]) ?? [];
    const negate = !!a.negate;
    const timeout = Number(a.timeout) || this.opts.expectTimeout || 5000;
    const firstArg = args[0];
    const label = `expect(${desc})${negate ? ".not" : ""}.${m}(${firstArg === undefined || (typeof firstArg === "object" && firstArg && !("re" in firstArg) && !Array.isArray(firstArg)) ? "" : show(firstArg)}${m === "toHaveAttribute" && args[1] !== undefined && typeof args[1] !== "object" ? ", " + show(args[1]) : m === "toHaveAttribute" && args[1] && "re" in (args[1] as object) ? ", " + show(args[1]) : ""})`;
    const strictMatchers = !["toHaveCount", "toBeHidden"].includes(m) && !(Array.isArray(firstArg));
    let received = "";
    const test = (p: Pattern, v: string, full: boolean, ignoreCase?: boolean) => {
      if (p === undefined) return true;
      if (typeof p === "string") {
        const a1 = norm(v), b1 = norm(p);
        const [x, y] = ignoreCase ? [a1.toLowerCase(), b1.toLowerCase()] : [a1, b1];
        return full ? x === y : x.includes(y);
      }
      return new RegExp(p.re, p.flags + (ignoreCase && !p.flags.includes("i") ? "i" : "")).test(norm(v));
    };
    for (;;) {
      const d = this.doc;
      const els = d && this.win?.location.href !== "about:blank" ? resolve(steps, d) : [];
      if (strictMatchers && els.length > 1) {
        return fail(label, "expect", new PwError(`${label} failed\n\nError: strict mode violation: ${desc} resolved to ${els.length} elements:\n${els.slice(0, 5).map((e, i) => `    ${i + 1}) ${describeEl(e)}`).join("\n")}`, "AssertionError"));
      }
      const el = els[0];
      let pass = false;
      const opt = (args.find((x) => x && typeof x === "object" && !("re" in (x as object)) && !Array.isArray(x)) ?? {}) as { checked?: boolean; ignoreCase?: boolean };
      switch (m) {
        case "toBeVisible": pass = !!el && isVisible(el); received = el ? (isVisible(el) ? "visible" : "hidden") : "<không tìm thấy phần tử>"; break;
        case "toBeHidden": pass = els.every((e) => !isVisible(e)); received = els.length ? (els.some(isVisible) ? "visible" : "hidden") : "<không có phần tử>"; break;
        case "toBeAttached": pass = !!el; received = el ? "attached" : "detached"; break;
        case "toBeEnabled": pass = !!el && isEnabled(el); received = el ? (isEnabled(el) ? "enabled" : "disabled") : "<không tìm thấy phần tử>"; break;
        case "toBeDisabled": pass = !!el && !isEnabled(el); received = el ? (isEnabled(el) ? "enabled" : "disabled") : "<không tìm thấy phần tử>"; break;
        case "toBeEditable": pass = !!el && isEnabled(el) && !(el as HTMLInputElement).readOnly; received = el ? (pass ? "editable" : "readonly") : "<không tìm thấy phần tử>"; break;
        case "toBeChecked": {
          const want = opt.checked ?? true;
          const st = el ? (el.getAttribute("aria-checked") ? el.getAttribute("aria-checked") === "true" : !!(el as HTMLInputElement).checked) : undefined;
          pass = st === want;
          received = st === undefined ? "<không tìm thấy phần tử>" : st ? "checked" : "unchecked";
          break;
        }
        case "toBeFocused": pass = !!el && el.ownerDocument.activeElement === el; received = pass ? "focused" : "not focused"; break;
        case "toBeEmpty": pass = !!el && (["INPUT", "TEXTAREA"].includes(el.tagName) ? !(el as HTMLInputElement).value : !norm(el.textContent)); received = el ? `"${norm(el.textContent)}"` : "<không tìm thấy phần tử>"; break;
        case "toBeInViewport": { const r = el?.getBoundingClientRect(); const w = this.win; pass = !!r && !!w && r.bottom > 0 && r.right > 0 && r.top < w.innerHeight && r.left < w.innerWidth; received = pass ? "trong khung nhìn" : "ngoài khung nhìn"; break; }
        case "toHaveText":
        case "toContainText": {
          const full = m === "toHaveText";
          const txt = (e: Element) => (["INPUT"].includes(e.tagName) && ["button", "submit"].includes((e as HTMLInputElement).type) ? (e as HTMLInputElement).value : textOf(e));
          if (Array.isArray(firstArg)) {
            const texts = els.map(txt);
            received = JSON.stringify(texts);
            pass = full ? texts.length === firstArg.length && firstArg.every((p, i) => test(p as Pattern, texts[i], true, opt.ignoreCase)) : (() => { let j = 0; for (const t of texts) if (j < firstArg.length && test(firstArg[j] as Pattern, t, false, opt.ignoreCase)) j++; return j === firstArg.length; })();
          } else {
            received = el ? `"${txt(el)}"` : "<không tìm thấy phần tử>";
            pass = !!el && test(firstArg as Pattern, txt(el), full, opt.ignoreCase);
          }
          break;
        }
        case "toHaveValue": { const v = el && "value" in el ? String((el as HTMLInputElement).value) : undefined; received = v === undefined ? "<không tìm thấy phần tử>" : `"${v}"`; pass = v !== undefined && (typeof firstArg === "string" ? v === firstArg : test(firstArg as Pattern, v, true)); break; }
        case "toHaveValues": { const v = el?.tagName === "SELECT" ? Array.from((el as HTMLSelectElement).selectedOptions).map((o) => o.value) : []; received = JSON.stringify(v); pass = Array.isArray(firstArg) && v.length === firstArg.length && firstArg.every((p, i) => test(p as Pattern, v[i], true)); break; }
        case "toHaveCount": pass = els.length === Number(firstArg); received = String(els.length); break;
        case "toHaveAttribute": { const v = el?.getAttribute(String(firstArg)); received = v === null || v === undefined ? "<không có thuộc tính>" : `"${v}"`; pass = v !== null && v !== undefined && (args[1] === undefined || (typeof args[1] === "object" && !("re" in (args[1] as object))) || test(args[1] as Pattern, v, true)); break; }
        case "toHaveClass": { const v = el?.getAttribute("class") ?? ""; received = `"${v}"`; pass = !!el && (typeof firstArg === "string" ? norm(v) === norm(firstArg) : test(firstArg as Pattern, v, true)); break; }
        case "toHaveId": pass = !!el && el.id === firstArg; received = el ? `"${el.id}"` : "<không tìm thấy phần tử>"; break;
        case "toHaveCSS": { const v = el ? win(el).getComputedStyle(el).getPropertyValue(String(firstArg)) : ""; received = `"${v}"`; pass = !!el && test(args[1] as Pattern, v, true); break; }
        case "toHaveAccessibleName": { const v = el ? accessibleName(el) : ""; received = `"${v}"`; pass = !!el && test(firstArg as Pattern, v, true); break; }
        default:
          return fail(label, "expect", new PwError(`pw-lite chưa hỗ trợ ${m}`));
      }
      if (pass !== negate) return done(label, "expect", null);
      if (Date.now() - t0 > timeout) {
        const exp = firstArg === undefined || (typeof firstArg === "object" && firstArg && !Array.isArray(firstArg) && !("re" in firstArg)) ? "" : `\nMong đợi${negate ? " (not)" : ""}: ${show(firstArg)}`;
        return fail(label, "expect", new PwError(`${label} failed\n\nLocator: ${desc}${exp}\nNhận được: ${received}\nTimeout: ${timeout}ms`, "AssertionError"));
      }
      await sleep(80);
    }
  }
}

function win(el: Element) {
  return el.ownerDocument.defaultView as W;
}

