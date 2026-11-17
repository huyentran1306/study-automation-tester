// Trạng thái tiến độ PlayForge. File thuần (không "use client") để dùng chung cho trình duyệt và API máy chủ.
// Nguyên tắc: XP, cấp, chuỗi ngày đều TÍNH RA từ dữ liệu gốc, nên gộp nhiều thiết bị không bị cộng trùng.

export interface LessonProgress {
  /** id các phần đã đọc xong */
  sections: string[];
  /** quiz id → lựa chọn đầu tiên */
  quiz: Record<string, number>;
  /** quiz trả lời đúng ngay lần đầu (để tính XP mà không cần đáp án) */
  ok: string[];
  doneAt?: string;
}

export interface KataProgress {
  status: "open" | "pass";
  attempts: number;
  hints: number; // số bậc gợi ý đã mở (0..3)
  xp: number; // XP nhận được khi pass
  passedAt?: string;
  code?: string; // bản nháp gần nhất
  at: string; // lần sửa cuối, dùng khi gộp
}

export interface CardProgress {
  box: number; // 1..6
  due: string; // YYYY-MM-DD
  seen: number;
  at: string;
}

export interface DayLog {
  /** điểm hoạt động trong ngày (đọc bài, chạy code, nộp bài) */
  act: number;
  /** số thẻ đã ôn */
  rev: number;
  /** số lần chạy code */
  runs: number;
}

export interface Note {
  text: string;
  at: string;
}

export interface PFState {
  v: 1;
  owner?: string;
  updatedAt?: string;
  startDate?: string; // ngày khai giảng của học viên (mặc định lịch lớp)
  lessons: Record<string, LessonProgress>;
  kata: Record<string, KataProgress>;
  cards: Record<string, CardProgress>;
  days: Record<string, DayLog>;
  notes: Record<string, Note>;
  /** việc tự tick trong kế hoạch ngày: ngày → id việc */
  ticks: Record<string, string[]>;
  settings: { remind: string; editorFont: number; mentor: "hint" | "full" };
}

export function emptyState(): PFState {
  return {
    v: 1,
    lessons: {},
    kata: {},
    cards: {},
    days: {},
    notes: {},
    ticks: {},
    settings: { remind: "18:30", editorFont: 14, mentor: "hint" },
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const str = (x: unknown, d = "") => (typeof x === "string" ? x : d);
const num = (x: unknown, d = 0) => (typeof x === "number" && Number.isFinite(x) ? x : d);

export function normalizeState(raw: unknown): PFState {
  const s = emptyState();
  if (!isObj(raw)) return s;
  s.owner = typeof raw.owner === "string" ? raw.owner : undefined;
  s.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : undefined;
  s.startDate = typeof raw.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate) ? raw.startDate : undefined;
  if (isObj(raw.lessons))
    for (const [k, v] of Object.entries(raw.lessons)) {
      if (!isObj(v)) continue;
      s.lessons[k] = {
        sections: Array.isArray(v.sections) ? v.sections.filter((x): x is string => typeof x === "string").slice(0, 50) : [],
        quiz: isObj(v.quiz) ? Object.fromEntries(Object.entries(v.quiz).filter(([, x]) => typeof x === "number")) as Record<string, number> : {},
        ok: Array.isArray(v.ok) ? v.ok.filter((x): x is string => typeof x === "string").slice(0, 50) : [],
        doneAt: typeof v.doneAt === "string" ? v.doneAt : undefined,
      };
    }
  if (isObj(raw.kata))
    for (const [k, v] of Object.entries(raw.kata)) {
      if (!isObj(v)) continue;
      s.kata[k] = {
        status: v.status === "pass" ? "pass" : "open",
        attempts: num(v.attempts),
        hints: Math.max(0, Math.min(3, num(v.hints))),
        xp: num(v.xp),
        passedAt: typeof v.passedAt === "string" ? v.passedAt : undefined,
        code: typeof v.code === "string" ? v.code.slice(0, 20000) : undefined,
        at: str(v.at, "1970-01-01T00:00:00.000Z"),
      };
    }
  if (isObj(raw.cards))
    for (const [k, v] of Object.entries(raw.cards)) {
      if (!isObj(v)) continue;
      s.cards[k] = { box: Math.max(1, Math.min(6, num(v.box, 1))), due: str(v.due, "1970-01-01"), seen: num(v.seen), at: str(v.at, "1970-01-01T00:00:00.000Z") };
    }
  if (isObj(raw.days))
    for (const [k, v] of Object.entries(raw.days)) {
      if (!isObj(v) || !/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      s.days[k] = { act: num(v.act), rev: num(v.rev), runs: num(v.runs) };
    }
  if (isObj(raw.notes))
    for (const [k, v] of Object.entries(raw.notes)) {
      if (!isObj(v)) continue;
      s.notes[k] = { text: str(v.text).slice(0, 20000), at: str(v.at, "1970-01-01T00:00:00.000Z") };
    }
  if (isObj(raw.ticks))
    for (const [k, v] of Object.entries(raw.ticks)) if (Array.isArray(v)) s.ticks[k] = v.filter((x): x is string => typeof x === "string");
  if (isObj(raw.settings)) {
    const st = raw.settings;
    s.settings = {
      remind: str(st.remind, "18:30"),
      editorFont: Math.max(12, Math.min(18, num(st.editorFont, 14))),
      mentor: st.mentor === "full" ? "full" : "hint",
    };
  }
  return s;
}

const later = (a?: string, b?: string) => ((a ?? "") >= (b ?? "") ? a : b);

/** Gộp hai trạng thái (máy này + máy chủ). Không bao giờ làm mất tiến độ. */
export function mergeStates(a: PFState, b: PFState): PFState {
  const out = emptyState();
  out.owner = a.owner ?? b.owner;
  out.startDate = a.startDate ?? b.startDate;
  out.updatedAt = later(a.updatedAt, b.updatedAt);
  for (const k of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])) {
    const x = a.lessons[k], y = b.lessons[k];
    if (!x || !y) { out.lessons[k] = structuredCloneSafe(x ?? y); continue; }
    out.lessons[k] = {
      sections: [...new Set([...x.sections, ...y.sections])],
      quiz: { ...y.quiz, ...x.quiz },
      ok: [...new Set([...x.ok, ...y.ok])],
      doneAt: x.doneAt && y.doneAt ? (x.doneAt < y.doneAt ? x.doneAt : y.doneAt) : x.doneAt ?? y.doneAt,
    };
  }
  for (const k of new Set([...Object.keys(a.kata), ...Object.keys(b.kata)])) {
    const x = a.kata[k], y = b.kata[k];
    if (!x || !y) { out.kata[k] = { ...(x ?? y) }; continue; }
    const newer = x.at >= y.at ? x : y;
    const pass = x.status === "pass" ? x : y.status === "pass" ? y : null;
    out.kata[k] = {
      status: pass ? "pass" : "open",
      attempts: Math.max(x.attempts, y.attempts),
      hints: Math.max(x.hints, y.hints),
      xp: Math.max(x.xp, y.xp),
      passedAt: pass?.passedAt,
      code: newer.code,
      at: newer.at,
    };
  }
  for (const k of new Set([...Object.keys(a.cards), ...Object.keys(b.cards)])) {
    const x = a.cards[k], y = b.cards[k];
    out.cards[k] = { ...(!x ? y : !y ? x : x.at >= y.at ? x : y) };
  }
  for (const k of new Set([...Object.keys(a.days), ...Object.keys(b.days)])) {
    const x = a.days[k] ?? { act: 0, rev: 0, runs: 0 }, y = b.days[k] ?? { act: 0, rev: 0, runs: 0 };
    out.days[k] = { act: Math.max(x.act, y.act), rev: Math.max(x.rev, y.rev), runs: Math.max(x.runs, y.runs) };
  }
  for (const k of new Set([...Object.keys(a.notes), ...Object.keys(b.notes)])) {
    const x = a.notes[k], y = b.notes[k];
    out.notes[k] = { ...(!x ? y : !y ? x : x.at >= y.at ? x : y) };
  }
  for (const k of new Set([...Object.keys(a.ticks), ...Object.keys(b.ticks)])) out.ticks[k] = [...new Set([...(a.ticks[k] ?? []), ...(b.ticks[k] ?? [])])];
  out.settings = (a.updatedAt ?? "") >= (b.updatedAt ?? "") ? { ...a.settings } : { ...b.settings };
  return out;
}

function structuredCloneSafe<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// ---- Điểm số ----
export const XP = { section: 10, quizFirstTry: 10, lessonDone: 30, review: 2 };

export function computeXp(s: PFState): number {
  let xp = 0;
  for (const l of Object.values(s.lessons)) {
    xp += l.sections.length * XP.section;
    if (l.doneAt) xp += XP.lessonDone;
    xp += l.ok.length * XP.quizFirstTry;
  }
  for (const k of Object.values(s.kata)) if (k.status === "pass") xp += k.xp;
  for (const d of Object.values(s.days)) xp += d.rev * XP.review;
  return xp;
}

/** XP cần để lên cấp n (cấp 1 = 0 XP). */
export function xpForLevel(n: number) {
  return 50 * n * (n - 1);
}

export function levelOf(xp: number) {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  return { level: n, from: xpForLevel(n), to: xpForLevel(n + 1) };
}

export function streakOf(s: PFState, today: string): number {
  const active = (d: string) => {
    const x = s.days[d];
    return !!x && x.act + x.rev + x.runs > 0;
  };
  let n = 0;
  const d = new Date(today + "T00:00:00Z");
  // Hôm nay chưa học thì vẫn giữ chuỗi tính tới hôm qua
  if (!active(today)) d.setUTCDate(d.getUTCDate() - 1);
  while (active(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function summary(s: PFState, today: string) {
  return {
    xp: computeXp(s),
    lessonsDone: Object.values(s.lessons).filter((l) => l.doneAt).length,
    kataPassed: Object.values(s.kata).filter((k) => k.status === "pass").length,
    streak: streakOf(s, today),
  };
}

// ---- Lặp lại ngắt quãng (6 hộp) ----
export const BOX_DAYS = [0, 1, 2, 4, 7, 14, 30]; // index = hộp

export type Grade = "again" | "hard" | "good" | "easy";

export function addDaysIso(day: string, n: number) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function gradeCard(c: CardProgress | undefined, g: Grade, today: string, nowIso: string): CardProgress {
  const box = c?.box ?? 1;
  let nb = box;
  let due = today;
  if (g === "again") { nb = 1; due = today; }
  else if (g === "hard") { nb = box; due = addDaysIso(today, 1); }
  else if (g === "good") { nb = Math.min(6, box + 1); due = addDaysIso(today, BOX_DAYS[nb]); }
  else { nb = Math.min(6, box + 2); due = addDaysIso(today, BOX_DAYS[nb]); }
  return { box: nb, due, seen: (c?.seen ?? 0) + 1, at: nowIso };
}

export function nextIntervalLabel(c: CardProgress | undefined, g: Grade) {
  const box = c?.box ?? 1;
  if (g === "again") return "lại ngay";
  if (g === "hard") return "1 ngày";
  const nb = Math.min(6, box + (g === "good" ? 1 : 2));
  const d = BOX_DAYS[nb];
  return d >= 30 ? "1 tháng" : d >= 14 ? "2 tuần" : d >= 7 ? "1 tuần" : `${d} ngày`;
}
