// Bộ tìm phần tử cho pw-lite, chạy ở luồng chính trên document của iframe Sổ Khách.
// Mô phỏng các engine của Playwright: role (ARIA ngầm định + tên truy cập), text, label, placeholder, testid, css, xpath.

export type Pattern = string | { re: string; flags: string } | undefined;

export interface Step {
  k: "role" | "text" | "label" | "placeholder" | "alt" | "title" | "testid" | "css" | "filter" | "nth" | "and" | "or" | "frame";
  role?: string;
  name?: Pattern;
  text?: Pattern;
  exact?: boolean;
  level?: number;
  checked?: boolean;
  includeHidden?: boolean;
  sel?: string | null;
  hasText?: Pattern;
  hasNotText?: Pattern;
  has?: Step[];
  hasNot?: Step[];
  visible?: boolean;
  i?: number;
  steps?: Step[];
}

type Scope = Document | Element;

export const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Kiểm tra Document an toàn giữa các realm (iframe có class Document riêng nên instanceof sai). */
const isDoc = (x: unknown): x is Document => !!x && (x as Node).nodeType === 9;

export function matchText(value: string, p: Pattern, exact = false): boolean {
  if (p === undefined) return true;
  const v = norm(value);
  if (typeof p === "string") {
    const t = norm(p);
    return exact ? v === t : v.toLowerCase().includes(t.toLowerCase());
  }
  return new RegExp(p.re, p.flags).test(v);
}

/** Mọi phần tử con (kể cả trong shadow root mở) theo thứ tự tài liệu. */
export function allElements(scope: Scope): Element[] {
  const out: Element[] = [];
  const walk = (node: ParentNode) => {
    for (const el of Array.from(node.children)) {
      out.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
      if (el.tagName === "TEMPLATE") continue;
      walk(el);
    }
  };
  walk(scope);
  return out;
}

function win(el: Element) {
  return el.ownerDocument.defaultView as Window & typeof globalThis;
}

export function isVisible(el: Element): boolean {
  if (!el.isConnected) return false;
  if (el.tagName === "OPTION") {
    const sel = el.closest("select");
    return sel ? isVisible(sel) : false;
  }
  const st = win(el).getComputedStyle(el);
  if (st.visibility === "hidden" || st.visibility === "collapse") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function isEnabled(el: Element): boolean {
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.closest("fieldset[disabled]") && !el.closest("legend")) return false;
  if (el.closest("[aria-disabled='true']")) return false;
  return true;
}

function ariaHidden(el: Element) {
  return !!el.closest("[aria-hidden='true']");
}

export function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute("type") || "text").toLowerCase();
  switch (tag) {
    case "a": return el.hasAttribute("href") ? "link" : null;
    case "button": return "button";
    case "input":
      if (["button", "submit", "reset", "image"].includes(type)) return "button";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "range") return "slider";
      if (type === "number") return "spinbutton";
      if (type === "search") return el.hasAttribute("list") ? "combobox" : "searchbox";
      if (["text", "email", "tel", "url", ""].includes(type)) return el.hasAttribute("list") ? "combobox" : "textbox";
      return null; // password, date, file… không có role ngầm định
    case "textarea": return "textbox";
    case "select": return (el as HTMLSelectElement).multiple || (el as HTMLSelectElement).size > 1 ? "listbox" : "combobox";
    case "option": return "option";
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": return "heading";
    case "img": return el.getAttribute("alt") === "" ? "presentation" : "img";
    case "ul": case "ol": return "list";
    case "li": return "listitem";
    case "table": return "table";
    case "thead": case "tbody": case "tfoot": return "rowgroup";
    case "tr": return "row";
    case "td": return "cell";
    case "th": return el.getAttribute("scope") === "row" ? "rowheader" : "columnheader";
    case "nav": return "navigation";
    case "main": return "main";
    case "header": return el.closest("article,section,aside,main,nav") ? null : "banner";
    case "footer": return el.closest("article,section,aside,main,nav") ? null : "contentinfo";
    case "aside": return "complementary";
    case "article": return "article";
    case "section": return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") ? "region" : null;
    case "form": return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") ? "form" : null;
    case "dialog": return "dialog";
    case "fieldset": return "group";
    case "progress": return "progressbar";
    case "hr": return "separator";
    case "summary": return "button";
    default: return null;
  }
}

function textOf(el: Element): string {
  // Nội dung chữ để làm tên: gồm alt của ảnh, bỏ qua phần tử ẩn
  let s = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) s += n.textContent;
    else if (n.nodeType === 1) {
      const c = n as Element;
      if (c.tagName === "STYLE" || c.tagName === "SCRIPT") return;
      if (c.getAttribute("aria-hidden") === "true") return;
      if (c.tagName === "IMG") s += " " + (c.getAttribute("alt") ?? "") + " ";
      else s += " " + textOf(c) + " ";
    }
  });
  if (el.shadowRoot) s += " " + textOf(el.shadowRoot as unknown as Element);
  return norm(s);
}

const NAME_FROM_CONTENT = new Set(["button", "link", "heading", "cell", "columnheader", "rowheader", "row", "option", "menuitem", "tab", "listitem", "checkbox", "radio", "switch", "tooltip", "treeitem", "gridcell"]);

export function accessibleName(el: Element): string {
  const doc = el.ownerDocument;
  const lb = el.getAttribute("aria-labelledby");
  if (lb) return norm(lb.split(/\s+/).map((id) => { const t = doc.getElementById(id); return t ? textOf(t) : ""; }).join(" "));
  const al = el.getAttribute("aria-label");
  if (al && norm(al)) return norm(al);
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "METER" || tag === "PROGRESS") {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (tag === "INPUT" && ["button", "submit", "reset"].includes(type)) return norm((el as HTMLInputElement).value || (type === "submit" ? "Submit" : ""));
    const labels = labelTexts(el);
    if (labels.length) return norm(labels.join(" "));
    return norm(el.getAttribute("title") || el.getAttribute("placeholder") || "");
  }
  if (tag === "IMG") return norm(el.getAttribute("alt") || el.getAttribute("title") || "");
  if (tag === "FIELDSET") {
    const lg = el.querySelector(":scope > legend");
    if (lg) return textOf(lg);
  }
  if (tag === "TABLE") {
    const cap = el.querySelector(":scope > caption");
    if (cap) return textOf(cap);
  }
  const role = roleOf(el);
  if (role && NAME_FROM_CONTENT.has(role)) {
    if (tag === "INPUT" || tag === "TEXTAREA") return "";
    return textOf(el);
  }
  return norm(el.getAttribute("title") || "");
}

function labelTexts(el: Element): string[] {
  const out: string[] = [];
  const id = el.getAttribute("id");
  const doc = el.ownerDocument;
  if (id) doc.querySelectorAll(`label[for="${CSS.escape(id)}"]`).forEach((l) => out.push(labelText(l, el)));
  const wrap = el.closest("label");
  if (wrap && !out.length) out.push(labelText(wrap, el));
  return out.filter(Boolean);
}

function labelText(label: Element, control: Element): string {
  // Chữ của label, bỏ phần chữ của chính control và các control khác lồng bên trong
  let s = "";
  label.childNodes.forEach((n) => {
    if (n.nodeType === 3) s += n.textContent;
    else if (n.nodeType === 1) {
      const c = n as Element;
      if (c === control || ["INPUT", "SELECT", "TEXTAREA"].includes(c.tagName)) return;
      if (c.contains(control)) s += " " + labelText(c, control) + " ";
      else s += " " + textOf(c) + " ";
    }
  });
  return norm(s);
}

function isLabelable(el: Element) {
  return ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "METER", "PROGRESS", "OUTPUT"].includes(el.tagName) || el.hasAttribute("aria-labelledby") || el.hasAttribute("aria-label");
}

function checkedState(el: Element): boolean | undefined {
  const a = el.getAttribute("aria-checked");
  if (a === "true") return true;
  if (a === "false") return false;
  if (el.tagName === "INPUT" && ["checkbox", "radio"].includes((el as HTMLInputElement).type)) return (el as HTMLInputElement).checked;
  return undefined;
}

function headingLevel(el: Element) {
  const a = el.getAttribute("aria-level");
  if (a) return Number(a);
  const m = el.tagName.match(/^H(\d)$/);
  return m ? Number(m[1]) : 0;
}

function queryXPath(scope: Scope, xp: string): Element[] {
  const doc = isDoc(scope) ? scope : scope.ownerDocument;
  let expr = xp.replace(/^xpath=/, "");
  if (!isDoc(scope) && expr.startsWith("/")) expr = "." + expr;
  const res = doc.evaluate(expr, scope, null, 7 /* ORDERED_NODE_SNAPSHOT_TYPE */, null);
  const out: Element[] = [];
  for (let i = 0; i < res.snapshotLength; i++) {
    const n = res.snapshotItem(i);
    if (n && n.nodeType === 1) out.push(n as Element);
  }
  return out;
}

function queryCss(scope: Scope, selector: string): Element[] {
  let sel = selector.trim();
  if (/^(xpath=|\/\/|\.\.\/|\(\/\/)/.test(sel)) return queryXPath(scope, sel);
  if (sel.startsWith("text=")) return queryText(scope, sel.slice(5).replace(/^["']|["']$/g, ""), false);
  // Hỗ trợ phần mở rộng của Playwright: :has-text("..."), :visible
  let hasText: string | null = null;
  let visibleOnly = false;
  sel = sel.replace(/:has-text\((["'])(.*?)\1\)/g, (_, __, t) => { hasText = t; return ""; }).replace(/:visible/g, () => { visibleOnly = true; return ""; });
  if (!sel) sel = "*";
  const out: Element[] = [];
  const roots: ParentNode[] = [scope];
  allElements(scope).forEach((e) => { if (e.shadowRoot) roots.push(e.shadowRoot); });
  for (const r of roots) r.querySelectorAll(sel).forEach((e) => { if (!out.includes(e)) out.push(e); });
  return out.filter((e) => (hasText === null || matchText(textOf(e), hasText)) && (!visibleOnly || isVisible(e)));
}

function queryText(scope: Scope, t: Pattern, exact: boolean): Element[] {
  const els = allElements(scope).filter((e) => !["SCRIPT", "STYLE", "HEAD", "TITLE", "NOSCRIPT", "TEMPLATE"].includes(e.tagName));
  const val = (e: Element) => (e.tagName === "INPUT" && ["button", "submit", "reset"].includes((e as HTMLInputElement).type) ? (e as HTMLInputElement).value : textOf(e));
  const hit = new Set(els.filter((e) => matchText(val(e), t, exact)));
  // Chỉ giữ phần tử sâu nhất: bỏ phần tử nếu có con cũng khớp
  return [...hit].filter((e) => !Array.from(e.children).some((c) => hit.has(c)) && !(e.shadowRoot && Array.from(e.shadowRoot.children).some((c) => hit.has(c))));
}

function applyStep(scopes: Scope[], step: Step): Scope[] {
  const out: Element[] = [];
  const push = (e: Element) => { if (!out.includes(e)) out.push(e); };
  switch (step.k) {
    case "role":
      for (const s of scopes)
        allElements(s).forEach((e) => {
          if (roleOf(e) !== step.role) return;
          if (!step.includeHidden && (ariaHidden(e) || !isVisible(e))) return;
          if (step.name !== undefined && !matchText(accessibleName(e), step.name, step.exact)) return;
          if (step.level && headingLevel(e) !== step.level) return;
          if (step.checked !== undefined && checkedState(e) !== step.checked) return;
          push(e);
        });
      return out;
    case "text":
      for (const s of scopes) queryText(s, step.text, !!step.exact).forEach(push);
      return out;
    case "label":
      for (const s of scopes)
        allElements(s).forEach((e) => {
          if (!isLabelable(e)) return;
          const names = [...labelTexts(e), e.getAttribute("aria-label") ?? ""];
          const lb = e.getAttribute("aria-labelledby");
          if (lb) names.push(lb.split(/\s+/).map((id) => textOf(e.ownerDocument.getElementById(id) ?? e.ownerDocument.createElement("i"))).join(" "));
          if (names.some((n) => n && matchText(n, step.text, step.exact))) push(e);
        });
      return out;
    case "placeholder":
    case "alt":
    case "title": {
      const attr = step.k === "alt" ? "alt" : step.k;
      for (const s of scopes) allElements(s).forEach((e) => { const v = e.getAttribute(attr); if (v !== null && matchText(v, step.text, step.exact)) push(e); });
      return out;
    }
    case "testid":
      for (const s of scopes)
        allElements(s).forEach((e) => {
          const v = e.getAttribute("data-testid");
          if (v === null) return;
          if (typeof step.text === "string" ? v === step.text : step.text && new RegExp(step.text.re, step.text.flags).test(v)) push(e);
        });
      return out;
    case "css":
      for (const s of scopes) queryCss(s, step.sel ?? "*").forEach(push);
      return out;
    case "filter":
      return (scopes as Element[]).filter((e) => {
        if (step.hasText !== undefined && !matchText(textOf(e), step.hasText)) return false;
        if (step.hasNotText !== undefined && matchText(textOf(e), step.hasNotText)) return false;
        if (step.has && resolve(step.has, e).length === 0) return false;
        if (step.hasNot && resolve(step.hasNot, e).length > 0) return false;
        if (step.visible !== undefined && isVisible(e) !== step.visible) return false;
        return true;
      });
    case "nth": {
      const i = step.i ?? 0;
      const el = i < 0 ? scopes[scopes.length + i] : scopes[i];
      return el ? [el] : [];
    }
    case "and": {
      const other = resolveFrom(step.steps ?? [], [rootDoc(scopes)]);
      return scopes.filter((e) => other.includes(e as Element));
    }
    case "or": {
      const other = resolveFrom(step.steps ?? [], [rootDoc(scopes)]);
      const doc = rootDoc(scopes);
      return allElements(doc).filter((e) => scopes.includes(e) || other.includes(e));
    }
    case "frame": {
      const frames = step.sel ? scopes.flatMap((s) => queryCss(s, step.sel!)) : (scopes as Element[]);
      const docs: Document[] = [];
      for (const f of frames) {
        const d = (f as HTMLIFrameElement).contentDocument;
        if (d && !docs.includes(d)) docs.push(d);
      }
      return docs;
    }
  }
}

function rootDoc(scopes: Scope[]): Document {
  const s = scopes[0];
  return isDoc(s) ? s : (s as Element).ownerDocument;
}

function resolveFrom(steps: Step[], start: Scope[]): Element[] {
  let cur: Scope[] = start;
  for (const st of steps) {
    cur = applyStep(cur, st);
    if (!cur.length) return [];
  }
  return cur.filter((x): x is Element => !isDoc(x));
}

export function resolve(steps: Step[], scope: Scope): Element[] {
  return resolveFrom(steps, [scope]);
}

export { textOf };
