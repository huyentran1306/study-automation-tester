"use client";

import { accessibleName, norm, resolve, roleOf, type Pattern, type Step } from "./dom";

// Locator Lab: dựng locator từ biểu thức học viên gõ, chấm độ bền, sinh locator gợi ý.

export interface Built {
  steps: Step[];
  label: string;
}

const pat = (v: unknown): Pattern => (v instanceof RegExp ? { re: v.source, flags: v.flags } : v === undefined ? undefined : String(v));
const q = (s: unknown) => (s instanceof RegExp ? String(s) : `'${String(s).replace(/'/g, "\\'")}'`);
const optStr = (o?: Record<string, unknown>) => {
  if (!o) return "";
  const parts = Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v instanceof RegExp ? String(v) : typeof v === "string" ? q(v) : v instanceof B ? v.label : String(v)}`);
  return parts.length ? `, { ${parts.join(", ")} }` : "";
};

class B implements Built {
  constructor(public steps: Step[], public label: string) {}
  private add(s: Step, l: string) {
    return new B([...this.steps, s], this.label + (this.steps.length ? "." : "") + l);
  }
  getByRole(role: string, o?: { name?: string | RegExp; exact?: boolean; level?: number; checked?: boolean }) {
    return this.add({ k: "role", role, name: pat(o?.name), exact: !!o?.exact, level: o?.level, checked: o?.checked }, `getByRole(${q(role)}${optStr(o)})`);
  }
  getByText(t: string | RegExp, o?: { exact?: boolean }) { return this.add({ k: "text", text: pat(t), exact: !!o?.exact }, `getByText(${q(t)}${optStr(o)})`); }
  getByLabel(t: string | RegExp, o?: { exact?: boolean }) { return this.add({ k: "label", text: pat(t), exact: !!o?.exact }, `getByLabel(${q(t)}${optStr(o)})`); }
  getByPlaceholder(t: string | RegExp, o?: { exact?: boolean }) { return this.add({ k: "placeholder", text: pat(t), exact: !!o?.exact }, `getByPlaceholder(${q(t)}${optStr(o)})`); }
  getByAltText(t: string | RegExp) { return this.add({ k: "alt", text: pat(t) }, `getByAltText(${q(t)})`); }
  getByTitle(t: string | RegExp) { return this.add({ k: "title", text: pat(t) }, `getByTitle(${q(t)})`); }
  getByTestId(t: string | RegExp) { return this.add({ k: "testid", text: pat(t) }, `getByTestId(${q(t)})`); }
  locator(sel: string, o?: { hasText?: string | RegExp; has?: B }) {
    let l = this.add({ k: "css", sel }, `locator(${q(sel)})`);
    if (o) l = l.filter(o);
    return l;
  }
  filter(o: { hasText?: string | RegExp; hasNotText?: string | RegExp; has?: B; hasNot?: B; visible?: boolean }) {
    return new B([...this.steps, { k: "filter", hasText: pat(o.hasText), hasNotText: pat(o.hasNotText), has: o.has?.steps, hasNot: o.hasNot?.steps, visible: o.visible }], `${this.label}.filter(${optStr(o as Record<string, unknown>).slice(2)})`);
  }
  nth(i: number) { return new B([...this.steps, { k: "nth", i }], `${this.label}.nth(${i})`); }
  first() { return new B([...this.steps, { k: "nth", i: 0 }], `${this.label}.first()`); }
  last() { return new B([...this.steps, { k: "nth", i: -1 }], `${this.label}.last()`); }
  frameLocator(sel: string) { return new B([...this.steps, { k: "frame", sel }], `${this.label}${this.steps.length ? "." : ""}frameLocator(${q(sel)})`); }
  contentFrame() { return new B([...this.steps, { k: "frame", sel: null }], `${this.label}.contentFrame()`); }
  and(o: B) { return new B([...this.steps, { k: "and", steps: o.steps }], `${this.label}.and(${o.label})`); }
  or(o: B) { return new B([...this.steps, { k: "or", steps: o.steps }], `${this.label}.or(${o.label})`); }
}

/** Đọc biểu thức như `page.getByRole('button', { name: 'Lưu' })`. Chỉ cho phép chuỗi gọi hàm trên page. */
export function buildLocator(expr: string): Built {
  const src = expr.trim().replace(/;$/, "").replace(/^await\s+/, "");
  if (!src) throw new Error("Gõ một locator, ví dụ: page.getByRole('button', { name: 'Lưu' })");
  if (!/^page\s*\./.test(src)) throw new Error("Bắt đầu bằng page. (ví dụ page.getByLabel('Email'))");
  if (/[;{}]\s*\w+\s*\(|=>|\bfunction\b|\beval\b|\bwindow\b|\bdocument\b|\bfetch\b|\bimport\b/.test(src.replace(/\{[^{}]*\}/g, "{}"))) throw new Error("Chỉ gõ chuỗi locator, không gõ code khác.");
  const fn = new Function("page", `"use strict"; return (${src});`) as (p: B) => unknown;
  const r = fn(new B([], "page."));
  if (!(r instanceof B)) throw new Error("Biểu thức chưa trả về locator. Có thể bạn gọi .click() hay .fill()? Locator Lab chỉ cần phần tìm phần tử.");
  return r;
}

export interface Score {
  score: number;
  grade: string;
  notes: string[];
}

const TARGET_KINDS = new Set(["role", "label", "testid", "placeholder", "alt", "title", "text", "css"]);

function baseScore(st: Step, notes: string[], isTarget: boolean): number {
  switch (st.k) {
    case "role":
      if (st.name === undefined) {
        if (isTarget) notes.push("getByRole không kèm name dễ khớp nhiều phần tử. Thêm { name: '…' }.");
        return 62;
      }
      if (isTarget) notes.push("Tìm theo vai trò + tên hiển thị: giống cách người dùng nhìn trang, bền khi đổi CSS.");
      return 92;
    case "label": if (isTarget) notes.push("Tìm ô nhập theo nhãn: bền và dễ đọc."); return 90;
    case "testid": if (isTarget) notes.push("data-testid ổn định vì dev giữ riêng cho test, nhưng người đọc không thấy trên giao diện."); return 86;
    case "placeholder": if (isTarget) notes.push("Placeholder dùng được khi ô không có nhãn. Nếu dev thêm label, hãy đổi sang getByLabel."); return 80;
    case "alt": case "title": return 78;
    case "text": if (isTarget) notes.push("getByText hợp với chữ tĩnh (thông báo, tiêu đề). Với nút và link, getByRole tốt hơn."); return st.exact ? 74 : 70;
    case "css": {
      const sel = String(st.sel ?? "");
      if (/^(xpath=|\/|\(\/)/.test(sel)) {
        const positional = /\[\d+\]/.test(sel) || /^\/html/.test(sel) || (/^\/\//.test(sel) && !/[@(]/.test(sel));
        notes.push(positional ? "XPath theo vị trí (tr[2], td[5]…) gãy ngay khi thêm một dòng hay đổi thứ tự cột." : "XPath theo thuộc tính/chữ dùng được, nhưng khó đọc hơn locator có sẵn của Playwright.");
        return positional ? 22 : 48;
      }
      if (/^#[\w-]+$/.test(sel)) { if (isTarget) notes.push("Id ổn định nếu dev không sinh id tự động."); return 68; }
      if (/^iframe\[(title|name)=/.test(sel) || /\[(name|data-[\w-]+|aria-[\w-]+|type|title)=/.test(sel)) return 66;
      if (/\.[\w-]/.test(sel)) { notes.push("Class CSS hay đổi khi chỉnh giao diện, và người đọc test không biết đây là nút gì."); return 45; }
      notes.push("Selector theo thẻ HTML quá chung chung.");
      return 35;
    }
    default:
      return 50;
  }
}

export function scoreLocator(b: Built): Score {
  const notes: string[] = [];
  const idx = b.steps.map((s, i) => (TARGET_KINDS.has(s.k) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return { score: 0, grade: "Chưa có", notes: ["Chưa có bước tìm phần tử nào."] };
  const last = idx[idx.length - 1];
  // Điểm chính tính theo bước nhắm phần tử cuối cùng
  let score = baseScore(b.steps[last], notes, true);
  // Các bước thu hẹp phía trước
  for (const i of idx.slice(0, -1)) {
    const st = b.steps[i];
    const filtered = b.steps[i + 1]?.k === "filter";
    const sc = baseScore(st, notes, false);
    if (sc < 50) score -= sc < 30 ? 25 : 10;
    else if (st.k === "role" && st.name === undefined && !filtered) { score -= 6; notes.push(`Vùng ${st.role} chưa được thu hẹp, nên lọc bằng .filter({ hasText }).`); }
  }
  if (b.steps.some((s) => s.k === "filter" && (s.hasText !== undefined || s.has))) score += 4;
  if (b.steps.some((s) => s.k === "nth")) { score -= 15; notes.push("nth/first/last phụ thuộc thứ tự. Lọc theo nội dung (filter hasText, theo dòng) bền hơn."); }
  if (idx.length > 3) { score -= 8; notes.push("Chuỗi locator dài, khó bảo trì."); }
  score = Math.max(5, Math.min(100, score));
  const grade = score >= 85 ? "Rất bền" : score >= 70 ? "Bền" : score >= 50 ? "Tạm được" : "Dễ gãy";
  return { score, grade, notes: [...new Set(notes)] };
}

const IMPORTANT_ROLES = new Set(["button", "link", "textbox", "checkbox", "radio", "combobox", "heading", "searchbox", "option", "menuitem", "tab", "cell", "row", "listitem", "dialog", "alertdialog", "img", "spinbutton", "slider", "listbox", "columnheader"]);

/** Sinh locator tốt nhất cho một phần tử (giống "Pick locator" của Playwright). */
export function suggestFor(el: Element, doc: Document): string | null {
  const unique = (expr: string) => {
    try {
      const b = buildLocator(expr);
      const r = resolve(b.steps, doc);
      return r.length === 1 && r[0] === el;
    } catch {
      return false;
    }
  };
  const s = (v: string) => `'${v.replace(/'/g, "\\'")}'`;
  const role = roleOf(el);
  const name = norm(accessibleName(el));
  const cands: string[] = [];
  if (role && IMPORTANT_ROLES.has(role) && name) {
    cands.push(`page.getByRole(${s(role)}, { name: ${s(name)} })`);
    cands.push(`page.getByRole(${s(role)}, { name: ${s(name)}, exact: true })`);
  }
  if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
    const id = el.getAttribute("id");
    const lab = id ? doc.querySelector(`label[for="${CSS.escape(id)}"]`) : el.closest("label");
    const lt = lab ? norm(lab.textContent) : "";
    if (lt) { cands.push(`page.getByLabel(${s(lt)})`); cands.push(`page.getByLabel(${s(lt)}, { exact: true })`); }
    const ph = el.getAttribute("placeholder");
    if (ph) cands.push(`page.getByPlaceholder(${s(ph)})`);
  }
  const tid = el.getAttribute("data-testid");
  if (tid) cands.push(`page.getByTestId(${s(tid)})`);
  const txt = norm(el.textContent);
  if (txt && txt.length <= 40 && el.children.length === 0) { cands.push(`page.getByText(${s(txt)})`); cands.push(`page.getByText(${s(txt)}, { exact: true })`); }
  for (const c of cands) if (unique(c)) return c;
  // Thu hẹp theo dòng bảng chứa phần tử
  const row = el.closest("tr");
  if (row && role && name) {
    const firstCell = norm(row.querySelector("td:nth-child(2), td")?.textContent ?? "");
    const key = Array.from(row.querySelectorAll("td")).map((td) => norm(td.textContent)).find((t) => t && t.length > 3) ?? firstCell;
    const c = `page.getByRole('row').filter({ hasText: ${s(key)} }).getByRole(${s(role)}, { name: ${s(name)} })`;
    if (unique(c)) return c;
  }
  const dlg = el.closest("[role=dialog],[role=alertdialog]");
  if (dlg && role && name) {
    const c = `page.getByRole(${s(dlg.getAttribute("role")!)}).getByRole(${s(role)}, { name: ${s(name)} })`;
    if (unique(c)) return c;
  }
  const id = el.getAttribute("id");
  if (id && !/^[:\d]/.test(id) && unique(`page.locator('#${id}')`)) return `page.locator('#${id}')`;
  return null;
}

export interface Mission {
  id: string;
  path: string;
  title: string;
  ref: string; // locator chuẩn để xác định phần tử đích
  min: number; // điểm độ bền tối thiểu
  noNth?: boolean;
  hint: string;
  xp: number;
}

export const MISSIONS: Mission[] = [
  { id: "m01", path: "/login", title: "Nút “Đăng nhập”", ref: "page.getByRole('button', { name: 'Đăng nhập' })", min: 85, hint: "Nút có vai trò button và tên là chữ trên nút.", xp: 20 },
  { id: "m02", path: "/login", title: "Ô Mật khẩu", ref: "page.getByLabel('Mật khẩu')", min: 85, hint: "Ô password không có role textbox. Hãy tìm theo nhãn.", xp: 20 },
  { id: "m03", path: "/login", title: "Checkbox “Ghi nhớ đăng nhập”", ref: "page.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' })", min: 85, hint: "Checkbox có tên lấy từ label bao quanh nó.", xp: 20 },
  { id: "m04", path: "/customers", title: "Tiêu đề trang “Khách hàng”", ref: "page.getByRole('heading', { name: 'Khách hàng' })", min: 85, hint: "Tiêu đề h1 có vai trò heading.", xp: 20 },
  { id: "m05", path: "/customers", title: "Ô tìm kiếm khách hàng", ref: "page.getByPlaceholder('Tìm theo tên…')", min: 75, hint: "Ô này không có nhãn, chỉ có chữ mờ gợi ý (placeholder). Ô type=search có role searchbox nhưng không có tên.", xp: 30 },
  { id: "m06", path: "/customers", title: "Ô chọn lọc “Hạng”", ref: "page.getByLabel('Hạng')", min: 85, hint: "Select có nhãn bao quanh.", xp: 20 },
  { id: "m07", path: "/customers", title: "Nút “Xóa” ở dòng Trần Thu Hà", ref: "page.getByRole('row').filter({ hasText: 'Trần Thu Hà' }).getByRole('button', { name: 'Xóa' })", min: 85, noNth: true, hint: "Có nhiều nút Xóa. Lọc dòng (row) chứa tên trước, rồi tìm nút trong dòng đó.", xp: 40 },
  { id: "m08", path: "/customers", title: "Checkbox chọn Lê Bảo Ngọc", ref: "page.getByRole('checkbox', { name: 'Chọn Lê Bảo Ngọc' })", min: 85, hint: "Checkbox có aria-label riêng cho từng khách.", xp: 30 },
  { id: "m09", path: "/customers", title: "Ô thành phố của Nguyễn Minh Anh", ref: "page.getByRole('row').filter({ hasText: 'Nguyễn Minh Anh' }).getByRole('cell', { name: 'Hà Nội' })", min: 85, noNth: true, hint: "Lọc theo dòng của khách, rồi tìm ô (cell) có chữ Hà Nội.", xp: 40 },
  { id: "m10", path: "/customers", title: "Dòng chữ “Trang 1 / 3”", ref: "page.getByTestId('page-info')", min: 70, hint: "Chữ này đổi theo trang. Dev đã gắn data-testid cho nó.", xp: 30 },
  { id: "m11", path: "/widgets", title: "Radio “Nâng cao”", ref: "page.getByRole('radio', { name: 'Nâng cao' })", min: 85, hint: "Radio có tên từ label bao quanh.", xp: 20 },
  { id: "m12", path: "/widgets", title: "Ô “Số thẻ” trong iframe thanh toán", ref: "page.frameLocator('iframe[title=\"Cổng thanh toán\"]').getByLabel('Số thẻ')", min: 85, hint: "Phần tử nằm trong iframe: dùng page.frameLocator('iframe[title=\"Cổng thanh toán\"]') rồi mới getByLabel.", xp: 50 },
  { id: "m13", path: "/widgets", title: "Nút “3 sao” trong Shadow DOM", ref: "page.getByRole('button', { name: '3 sao' })", min: 85, hint: "Playwright tự xuyên Shadow DOM mở, cứ dùng getByRole như bình thường.", xp: 40 },
  { id: "m14", path: "/widgets", title: "Mục “Tiếng Việt” trong dropdown Ngôn ngữ (mở dropdown trước)", ref: "page.getByRole('option', { name: 'Tiếng Việt' })", min: 85, hint: "Bấm nút Ngôn ngữ trong khung trình duyệt để mở danh sách. Mỗi mục có role option.", xp: 40 },
];

export const PRESETS = [
  "page.getByRole('button', { name: 'Xóa' })",
  "page.getByRole('row').filter({ hasText: 'Trần Thu Hà' }).getByRole('button', { name: 'Xóa' })",
  "page.locator('//table/tbody/tr[2]/td[7]/span/button[2]')",
  "page.getByPlaceholder('Tìm theo tên…')",
  "page.locator('.btn.btn-primary')",
  "page.getByText('VIP')",
];
