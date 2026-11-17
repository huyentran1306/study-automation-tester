import { NextRequest, NextResponse } from "next/server";
import { UID_RE } from "@/lib/account";
import { getDb, userExists } from "@/lib/server/db";
import { normalizeState } from "@/lib/progress/state";

export const dynamic = "force-dynamic";

// Nhóm học: tạo nhóm, tham gia bằng mã mời, bảng xếp hạng.
// GET  ?uid=…            → nhóm của tôi + bảng xếp hạng
// POST { uid, action: "create", name, displayName } | { uid, action: "join", code, displayName } | { uid, action: "leave", groupId }

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_MEMBERS = 50;

function newCode() {
  let s = "PF-";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

const err = (status: number, message: string) => NextResponse.json({ error: message }, { status });

function weekActivity(raw: string, today: string): number {
  try {
    const s = normalizeState(JSON.parse(raw));
    let n = 0;
    const d = new Date(today + "T00:00:00Z");
    for (let i = 0; i < 7; i++) {
      const k = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10);
      const x = s.days[k];
      if (x) n += x.act * 5 + x.rev * 2 + x.runs;
    }
    return n;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  if (!UID_RE.test(uid)) return err(400, "uid không hợp lệ");
  const db = await getDb();
  if (!db) return err(503, "Database chưa sẵn sàng");
  const today = new Date().toISOString().slice(0, 10);
  const groups = await db
    .prepare("SELECT g.id, g.name, g.invite_code, g.owner_id FROM pf_groups g JOIN pf_group_members m ON m.group_id = g.id WHERE m.user_id = ? ORDER BY m.joined_at")
    .bind(uid)
    .all<{ id: string; name: string; invite_code: string; owner_id: string }>();
  const out = [];
  for (const g of groups.results) {
    const rows = await db
      .prepare("SELECT m.user_id, m.display_name, p.data, COALESCE(p.xp, 0) AS xp, COALESCE(p.lessons_done, 0) AS lessons, COALESCE(p.kata_passed, 0) AS kata, COALESCE(p.streak, 0) AS streak FROM pf_group_members m LEFT JOIN pf_progress p ON p.user_id = m.user_id WHERE m.group_id = ?")
      .bind(g.id)
      .all<{ user_id: string; display_name: string; data: string | null; xp: number; lessons: number; kata: number; streak: number }>();
    out.push({
      id: g.id,
      name: g.name,
      code: g.invite_code,
      isOwner: g.owner_id === uid,
      members: rows.results.map((r) => ({ uid: r.user_id, name: r.display_name || "Thành viên", xp: r.xp, lessons: r.lessons, kata: r.kata, streak: r.streak, week: r.data ? weekActivity(r.data, today) : 0, me: r.user_id === uid })),
    });
  }
  return NextResponse.json({ groups: out }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { uid?: string; action?: string; name?: string; code?: string; groupId?: string; displayName?: string } | null;
  const uid = String(b?.uid ?? "");
  if (!UID_RE.test(uid)) return err(400, "uid không hợp lệ");
  const db = await getDb();
  if (!db) return err(503, "Database chưa sẵn sàng");
  if (!(await userExists(uid))) return err(403, "Không tìm thấy người dùng");
  const display = String(b?.displayName ?? "").trim().slice(0, 40) || "Thành viên";

  if (b?.action === "create") {
    const name = String(b.name ?? "").trim().slice(0, 60);
    if (name.length < 2) return err(400, "Tên nhóm cần ít nhất 2 ký tự");
    const mine = await db.prepare("SELECT COUNT(*) AS n FROM pf_groups WHERE owner_id = ?").bind(uid).first<{ n: number }>();
    if ((mine?.n ?? 0) >= 5) return err(400, "Mỗi người tạo tối đa 5 nhóm");
    const id = crypto.randomUUID();
    let code = newCode();
    for (let i = 0; i < 5 && (await db.prepare("SELECT 1 AS x FROM pf_groups WHERE invite_code = ?").bind(code).first()); i++) code = newCode();
    await db.prepare("INSERT INTO pf_groups (id, name, invite_code, owner_id) VALUES (?, ?, ?, ?)").bind(id, name, code, uid).run();
    await db.prepare("INSERT INTO pf_group_members (group_id, user_id, display_name) VALUES (?, ?, ?)").bind(id, uid, display).run();
    return NextResponse.json({ id, code }, { status: 201 });
  }
  if (b?.action === "join") {
    const code = String(b.code ?? "").trim().toUpperCase();
    const g = await db.prepare("SELECT id, name FROM pf_groups WHERE invite_code = ?").bind(code).first<{ id: string; name: string }>();
    if (!g) return err(404, "Mã mời không đúng");
    const cnt = await db.prepare("SELECT COUNT(*) AS n FROM pf_group_members WHERE group_id = ?").bind(g.id).first<{ n: number }>();
    if ((cnt?.n ?? 0) >= MAX_MEMBERS) return err(400, "Nhóm đã đủ 50 người");
    await db.prepare("INSERT INTO pf_group_members (group_id, user_id, display_name) VALUES (?, ?, ?) ON CONFLICT(group_id, user_id) DO UPDATE SET display_name = excluded.display_name").bind(g.id, uid, display).run();
    return NextResponse.json({ id: g.id, name: g.name });
  }
  if (b?.action === "leave") {
    const gid = String(b.groupId ?? "");
    await db.prepare("DELETE FROM pf_group_members WHERE group_id = ? AND user_id = ?").bind(gid, uid).run();
    const left = await db.prepare("SELECT COUNT(*) AS n FROM pf_group_members WHERE group_id = ?").bind(gid).first<{ n: number }>();
    if ((left?.n ?? 0) === 0) await db.prepare("DELETE FROM pf_groups WHERE id = ?").bind(gid).run();
    return NextResponse.json({ ok: true });
  }
  return err(400, "action không hợp lệ");
}
