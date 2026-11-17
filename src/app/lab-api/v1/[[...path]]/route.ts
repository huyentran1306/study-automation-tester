import { NextRequest, NextResponse } from "next/server";
import { getDb, type D1Like } from "@/lib/server/db";
import { ACCOUNTS, API_KEY, TIERS, seedCustomers, type Customer, type Tier } from "@/lib/practice/seed";

export const dynamic = "force-dynamic";

// API luyện tập của app Sổ Khách: https://sokhach.playforge.dev/lab-api/v1/*
// Dữ liệu riêng theo từng người học (header x-lab-user), lưu trong D1 bảng lab_customers.

const LAB_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_FILE = 1024 * 1024;

interface Row {
  id: number;
  name: string;
  email: string;
  tier: string;
  city: string;
  newsletter: number;
  created_at: string;
}

const toCustomer = (r: Row): Customer => ({ id: r.id, name: r.name, email: r.email, tier: r.tier as Tier, city: r.city, newsletter: !!r.newsletter, createdAt: r.created_at.slice(0, 10) });

function err(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}
function ok(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

function makeToken(email: string, role: string) {
  return "skt." + b64url(JSON.stringify({ e: email, r: role, x: Date.now() + 3600_000 }));
}

type Auth = { email: string; role: string } | null;

function authOf(req: NextRequest): { auth: Auth; reason: string } {
  const h = req.headers.get("authorization") ?? "";
  const key = req.headers.get("x-api-key");
  if (key) return key === API_KEY ? { auth: { email: "api-key", role: "admin" }, reason: "" } : { auth: null, reason: "API key không đúng" };
  if (h.startsWith("Bearer ")) {
    const t = h.slice(7).trim();
    if (!t.startsWith("skt.")) return { auth: null, reason: "Token không đúng định dạng" };
    try {
      const p = JSON.parse(unb64url(t.slice(4))) as { e: string; r: string; x: number };
      if (p.x < Date.now()) return { auth: null, reason: "Token đã hết hạn, đăng nhập lại" };
      return { auth: { email: p.e, role: p.r }, reason: "" };
    } catch {
      return { auth: null, reason: "Token không hợp lệ" };
    }
  }
  if (h.startsWith("Basic ")) {
    try {
      const [email, password] = atob(h.slice(6)).split(":");
      const a = ACCOUNTS.find((x) => x.email === email && x.password === password);
      return a ? { auth: { email: a.email, role: a.role }, reason: "" } : { auth: null, reason: "Sai email hoặc mật khẩu" };
    } catch {
      return { auth: null, reason: "Basic auth không hợp lệ" };
    }
  }
  return { auth: null, reason: "Thiếu header Authorization (Bearer token, Basic) hoặc x-api-key" };
}

async function ensureSeed(db: D1Like, user: string) {
  const c = await db.prepare("SELECT COUNT(*) AS n FROM lab_customers WHERE user_id = ?").bind(user).first<{ n: number }>();
  if ((c?.n ?? 0) > 0) return;
  await reseed(db, user);
}

async function reseed(db: D1Like, user: string) {
  await db.prepare("DELETE FROM lab_customers WHERE user_id = ?").bind(user).run();
  const rows = seedCustomers();
  // D1 giới hạn 100 tham số mỗi câu lệnh: chia lô 12 dòng × 8 cột
  for (let i = 0; i < rows.length; i += 12) {
    const chunk = rows.slice(i, i + 12);
    const sql = "INSERT INTO lab_customers (user_id, id, name, email, tier, city, newsletter, created_at) VALUES " + chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    await db.prepare(sql).bind(...chunk.flatMap((c) => [user, c.id, c.name, c.email, c.tier, c.city, c.newsletter ? 1 : 0, c.createdAt])).run();
  }
}

function validate(body: Record<string, unknown>, partial: boolean): { fields: Partial<Customer>; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fields: Partial<Customer> = {};
  const has = (k: string) => body[k] !== undefined;
  if (!partial || has("name")) {
    const n = typeof body.name === "string" ? body.name.trim() : "";
    if (!n) errors.name = "Bắt buộc, là chuỗi không rỗng";
    else if (n.length > 80) errors.name = "Tối đa 80 ký tự";
    else fields.name = n;
  }
  if (!partial || has("email")) {
    const e = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.email = "Email không hợp lệ";
    else fields.email = e;
  }
  if (has("tier") || !partial) {
    const t = body.tier ?? "Thường";
    if (!TIERS.includes(t as Tier)) errors.tier = `Chỉ nhận: ${TIERS.join(", ")}`;
    else fields.tier = t as Tier;
  }
  if (has("city") || !partial) {
    if (body.city !== undefined && typeof body.city !== "string") errors.city = "Phải là chuỗi";
    else fields.city = (body.city as string | undefined)?.trim() ?? "";
  }
  if (has("newsletter")) {
    if (typeof body.newsletter !== "boolean") errors.newsletter = "Phải là true/false";
    else fields.newsletter = body.newsletter;
  }
  return { fields, errors };
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const method = req.method.toUpperCase();
  const route = "/" + path.join("/");

  // Giả lập sự cố để luyện retry, timeout, xử lý lỗi
  const chaos = req.headers.get("x-chaos") ?? req.nextUrl.searchParams.get("chaos");
  if (chaos === "slow") await new Promise((r) => setTimeout(r, 3000));
  if (chaos === "error") return err(500, "chaos_mode", "Lỗi máy chủ giả lập để luyện xử lý lỗi");
  if (chaos === "flaky" && Math.random() < 0.5) return err(503, "service_unavailable", "Máy chủ đang bận, thử lại sau");

  if (route === "/health" && method === "GET") return ok({ status: "ok", time: new Date().toISOString() });

  if (route === "/auth/login" && method === "POST") {
    const b = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
    if (!b?.email || !b?.password) return err(400, "validation_error", "Cần email và password", { fields: { email: !b?.email ? "Bắt buộc" : undefined, password: !b?.password ? "Bắt buộc" : undefined } });
    const a = ACCOUNTS.find((x) => x.email === String(b.email).toLowerCase() && x.password === b.password);
    if (!a) return err(401, "invalid_credentials", "Email hoặc mật khẩu không đúng");
    return ok({ token: makeToken(a.email, a.role), tokenType: "Bearer", expiresIn: 3600, user: { email: a.email, name: a.name, role: a.role } });
  }

  const labUser = req.headers.get("x-lab-user") ?? "anon";
  if (!LAB_RE.test(labUser)) return err(400, "bad_lab_user", "Header x-lab-user không hợp lệ");
  const db = await getDb();
  if (!db) return err(503, "db_unavailable", "Database chưa sẵn sàng");

  if (route === "/reset" && method === "POST") {
    await reseed(db, labUser);
    return ok({ ok: true, total: 25 });
  }

  const { auth, reason } = authOf(req);
  if (!auth) return err(401, "unauthorized", reason);
  if (route === "/me" && method === "GET") return ok({ email: auth.email, role: auth.role });

  const write = method !== "GET";
  if (write && auth.role === "viewer") return err(403, "forbidden", "Tài khoản viewer chỉ được xem, không được thay đổi dữ liệu");

  if (route === "/files" && method === "POST") {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") return err(400, "validation_error", "Cần trường file dạng multipart/form-data");
    if (file.size > MAX_FILE) return err(413, "file_too_large", "Tệp tối đa 1 MB");
    return ok({ fileId: "f_" + Math.random().toString(36).slice(2, 8), name: file.name, size: file.size, type: file.type, note: form?.get("note") ?? null }, 201);
  }

  await ensureSeed(db, labUser);
  const m = route.match(/^\/customers(?:\/(\d+))?$/);
  if (!m) return err(404, "not_found", `Không có endpoint ${method} /lab-api/v1${route}`);
  const id = m[1] ? Number(m[1]) : null;

  if (id === null) {
    if (method === "GET") {
      const sp = req.nextUrl.searchParams;
      const page = Math.max(1, Number(sp.get("page")) || 1);
      const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 10));
      const q = (sp.get("q") ?? "").trim();
      const tier = sp.get("tier");
      if (tier && !TIERS.includes(tier as Tier)) return err(400, "validation_error", `tier chỉ nhận: ${TIERS.join(", ")}`);
      const sort = sp.get("sort") ?? "id";
      const order = sort === "name" ? "name COLLATE NOCASE ASC" : sort === "-name" ? "name COLLATE NOCASE DESC" : sort === "-id" ? "id DESC" : "id ASC";
      const where = ["user_id = ?"];
      const args: unknown[] = [labUser];
      if (q) { where.push("name LIKE ?"); args.push(`%${q}%`); }
      if (tier) { where.push("tier = ?"); args.push(tier); }
      const total = await db.prepare(`SELECT COUNT(*) AS n FROM lab_customers WHERE ${where.join(" AND ")}`).bind(...args).first<{ n: number }>();
      const rows = await db.prepare(`SELECT id, name, email, tier, city, newsletter, created_at FROM lab_customers WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...args, limit, (page - 1) * limit).all<Row>();
      return ok({ data: rows.results.map(toCustomer), page, limit, total: total?.n ?? 0, totalPages: Math.max(1, Math.ceil((total?.n ?? 0) / limit)) });
    }
    if (method === "POST") {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || typeof body !== "object") return err(400, "validation_error", "Body phải là JSON");
      const { fields, errors } = validate(body, false);
      if (Object.keys(errors).length) return err(400, "validation_error", "Dữ liệu không hợp lệ", { fields: errors });
      const dup = await db.prepare("SELECT id FROM lab_customers WHERE user_id = ? AND email = ?").bind(labUser, fields.email).first<{ id: number }>();
      if (dup) return err(409, "email_taken", `Email ${fields.email} đã tồn tại (khách #${dup.id})`);
      const max = await db.prepare("SELECT MAX(id) AS m FROM lab_customers WHERE user_id = ?").bind(labUser).first<{ m: number | null }>();
      const newId = (max?.m ?? 100) + 1;
      const createdAt = new Date().toISOString().slice(0, 10);
      await db.prepare("INSERT INTO lab_customers (user_id, id, name, email, tier, city, newsletter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(labUser, newId, fields.name, fields.email, fields.tier, fields.city ?? "", fields.newsletter ? 1 : 0, createdAt).run();
      return ok({ id: newId, name: fields.name, email: fields.email, tier: fields.tier, city: fields.city ?? "", newsletter: !!fields.newsletter, createdAt }, 201, { Location: `/lab-api/v1/customers/${newId}` });
    }
    return err(405, "method_not_allowed", `${method} không dùng được với /customers`);
  }

  const row = await db.prepare("SELECT id, name, email, tier, city, newsletter, created_at FROM lab_customers WHERE user_id = ? AND id = ?").bind(labUser, id).first<Row>();
  if (!row) return err(404, "not_found", `Không tìm thấy khách #${id}`);
  if (method === "GET") return ok(toCustomer(row));
  if (method === "DELETE") {
    await db.prepare("DELETE FROM lab_customers WHERE user_id = ? AND id = ?").bind(labUser, id).run();
    return new NextResponse(null, { status: 204 });
  }
  if (method === "PUT" || method === "PATCH") {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return err(400, "validation_error", "Body phải là JSON");
    const { fields, errors } = validate(body, method === "PATCH");
    if (method === "PUT") for (const k of ["name", "email", "tier", "city"]) if (body[k] === undefined) errors[k] = errors[k] ?? "PUT cần gửi đủ trường (dùng PATCH để sửa một phần)";
    if (Object.keys(errors).length) return err(400, "validation_error", "Dữ liệu không hợp lệ", { fields: errors });
    if (fields.email && fields.email !== row.email) {
      const dup = await db.prepare("SELECT id FROM lab_customers WHERE user_id = ? AND email = ? AND id != ?").bind(labUser, fields.email, id).first<{ id: number }>();
      if (dup) return err(409, "email_taken", `Email ${fields.email} đã tồn tại (khách #${dup.id})`);
    }
    const next = { ...toCustomer(row), ...fields };
    await db.prepare("UPDATE lab_customers SET name = ?, email = ?, tier = ?, city = ?, newsletter = ?, updated_at = datetime('now') WHERE user_id = ? AND id = ?").bind(next.name, next.email, next.tier, next.city, next.newsletter ? 1 : 0, labUser, id).run();
    return ok(next);
  }
  return err(405, "method_not_allowed", `${method} không dùng được với /customers/:id`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
