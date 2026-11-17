import { NextRequest, NextResponse } from "next/server";
import { UID_RE } from "@/lib/account";
import { getDb, userExists, type D1Like } from "@/lib/server/db";
import { mergeStates, normalizeState, summary, type PFState } from "@/lib/progress/state";

export const dynamic = "force-dynamic";

// Tiến độ PlayForge lưu trong D1 (bảng pf_progress), 1 dòng / người. Máy chủ gộp khi nhiều thiết bị cùng ghi.
const MAX_BYTES = 768 * 1024;

async function readRow(db: D1Like, uid: string): Promise<{ state: PFState; updatedAt: string } | null> {
  const row = await db.prepare("SELECT data, updated_at FROM pf_progress WHERE user_id = ?").bind(uid).first<{ data: string; updated_at: string }>();
  if (!row) return null;
  try {
    return { state: normalizeState(JSON.parse(row.data)), updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid") || "";
  if (!UID_RE.test(uid)) return NextResponse.json({ error: "uid không hợp lệ" }, { status: 400 });
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  try {
    const row = await readRow(db, uid);
    return NextResponse.json({ data: row?.state ?? null, updatedAt: row?.updatedAt ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("pf progress GET:", e);
    return NextResponse.json({ error: "Không đọc được tiến độ" }, { status: 500 });
  }
}

async function save(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Dữ liệu quá lớn" }, { status: 413 });
  let body: { uid?: string; data?: unknown; today?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  const uid = String(body.uid || "");
  if (!UID_RE.test(uid)) return NextResponse.json({ error: "uid không hợp lệ" }, { status: 400 });
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  if (!(await userExists(uid))) return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 403 });

  try {
    const incoming = normalizeState(body.data);
    const existing = await readRow(db, uid);
    const merged = existing ? mergeStates(existing.state, incoming) : incoming;
    merged.owner = uid;
    merged.updatedAt = new Date().toISOString();
    const today = typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : merged.updatedAt.slice(0, 10);
    const sum = summary(merged, today);
    await db
      .prepare(
        `INSERT INTO pf_progress (user_id, data, xp, lessons_done, kata_passed, streak, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           data = excluded.data, xp = excluded.xp, lessons_done = excluded.lessons_done,
           kata_passed = excluded.kata_passed, streak = excluded.streak, updated_at = datetime('now')`,
      )
      .bind(uid, JSON.stringify(merged), sum.xp, sum.lessonsDone, sum.kataPassed, sum.streak)
      .run();
    return NextResponse.json({ data: merged, updatedAt: merged.updatedAt });
  } catch (e) {
    console.error("pf progress PUT:", e);
    return NextResponse.json({ error: "Không lưu được tiến độ" }, { status: 500 });
  }
}

export const PUT = save;
export const POST = save;
