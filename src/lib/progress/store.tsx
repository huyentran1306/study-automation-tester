"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACCOUNT_API, AUTH_USER_KEY, GOOGLE_OAUTH_URL, UID_KEY, type AccountUser } from "@/lib/account";
import { emptyState, gradeCard, mergeStates, normalizeState, type Grade, type PFState } from "./state";
import { getLessonContent } from "@/content";

export type SyncState = "local" | "loading" | "saving" | "saved" | "offline" | "error";

/** Ngày hôm nay theo giờ máy học viên (YYYY-MM-DD). */
export function todayLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Ctx {
  ready: boolean;
  user: AccountUser | null;
  uid: string | null;
  state: PFState;
  sync: SyncState;
  savedAt: string | null;
  today: string;
  update: (fn: (s: PFState) => void) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  loginGoogle: () => void;
  logout: () => void;
  // tiện ích
  markSection: (lessonId: string, sectionId: string, totalSections: number) => void;
  answerQuiz: (lessonId: string, quizId: string, choice: number, correct: boolean) => void;
  recordRun: (points?: number) => void;
  gradeCardById: (cardId: string, g: Grade) => void;
  setNote: (key: string, text: string) => void;
  toggleTick: (day: string, id: string) => void;
}

const AppCtx = createContext<Ctx | null>(null);

function storageKey(uid: string | null) {
  return `pf-progress:${uid ?? "guest"}`;
}

function readLocal(uid: string | null): PFState {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? normalizeState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

function writeLocal(uid: string | null, s: PFState) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(s));
  } catch {
    /* hết dung lượng hoặc chế độ riêng tư: bỏ qua */
  }
}

async function accountPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ACCOUNT_API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: string };
  if (!j.success || !j.data) throw new Error(j.error || "Không đăng nhập được, thử lại sau");
  return j.data;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<PFState>(emptyState);
  const [sync, setSync] = useState<SyncState>("local");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [today, setToday] = useState(() => todayLocal());
  const stateRef = useRef(state);
  const uidRef = useRef(uid);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  stateRef.current = state;
  uidRef.current = uid;

  // Đổi ngày lúc nửa đêm
  useEffect(() => {
    const t = setInterval(() => setToday(todayLocal()), 60_000);
    return () => clearInterval(t);
  }, []);

  const push = useCallback(async (keepalive = false) => {
    const id = uidRef.current;
    if (!id || !dirty.current) return;
    dirty.current = false;
    setSync("saving");
    try {
      const res = await fetch("/api/pf/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: id, data: stateRef.current, today: todayLocal() }),
        keepalive,
      });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { data: unknown; updatedAt: string };
      if (uidRef.current !== id) return;
      // Gộp lại bản máy chủ (có thể có tiến độ từ máy khác) nhưng giữ thay đổi mới phát sinh trong lúc gửi
      setState((cur) => {
        const merged = mergeStates(cur, normalizeState(j.data));
        writeLocal(id, merged);
        return merged;
      });
      setSavedAt(j.updatedAt);
      setSync("saved");
    } catch {
      dirty.current = true;
      setSync(navigator.onLine ? "error" : "offline");
    }
  }, []);

  const schedule = useCallback(() => {
    if (!uidRef.current) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void push(), 1500);
  }, [push]);

  // Khởi động: đọc user + tiến độ trên máy, rồi kéo bản trên máy chủ về gộp.
  const loadFor = useCallback(async (id: string | null) => {
    const local = readLocal(id);
    setState(local);
    if (!id) {
      setSync("local");
      return;
    }
    setSync("loading");
    try {
      const res = await fetch(`/api/pf/progress?uid=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { data: unknown; updatedAt: string | null };
      const merged = j.data ? mergeStates(local, normalizeState(j.data)) : local;
      if (uidRef.current !== id) return;
      setState(merged);
      writeLocal(id, merged);
      setSavedAt(j.updatedAt);
      setSync("saved");
      dirty.current = true; // đẩy phần chỉ có ở máy này lên
      timer.current = setTimeout(() => void push(), 800);
    } catch {
      setSync(navigator.onLine ? "error" : "offline");
    }
  }, [push]);

  useEffect(() => {
    let u: AccountUser | null = null;
    let id: string | null = null;
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      u = raw ? (JSON.parse(raw) as AccountUser) : null;
      id = u?.id ?? null;
    } catch {
      /* bỏ qua */
    }
    setUser(u);
    setUid(id);
    uidRef.current = id;
    void loadFor(id).finally(() => setReady(true));
    const onHide = () => {
      if (document.visibilityState === "hidden") void push(true);
    };
    const onOnline = () => {
      if (dirty.current) void push();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
    };
  }, [loadFor, push]);

  const update = useCallback(
    (fn: (s: PFState) => void) => {
      setState((cur) => {
        const next = JSON.parse(JSON.stringify(cur)) as PFState;
        fn(next);
        next.updatedAt = new Date().toISOString();
        writeLocal(uidRef.current, next);
        return next;
      });
      schedule();
    },
    [schedule],
  );

  const adopt = useCallback(
    async (u: AccountUser) => {
      // Gộp tiến độ học thử (khách) vào tài khoản
      const guest = readLocal(null);
      const mine = readLocal(u.id);
      writeLocal(u.id, mergeStates(mine, guest));
      try {
        localStorage.removeItem(storageKey(null));
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
        localStorage.setItem(UID_KEY, u.id);
      } catch {
        /* bỏ qua */
      }
      setUser(u);
      setUid(u.id);
      uidRef.current = u.id;
      await loadFor(u.id);
    },
    [loadFor],
  );

  const login = useCallback(async (username: string, password: string) => {
    const u = await accountPost<AccountUser>("/auth/login", { username, password });
    await adopt(u);
  }, [adopt]);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const u = await accountPost<AccountUser>("/auth/register", { username, password, display_name: displayName });
    await adopt(u);
  }, [adopt]);

  const loginGoogle = useCallback(() => {
    const cb = `${window.location.origin}/auth-callback`;
    window.location.href = `${GOOGLE_OAUTH_URL}?state=${encodeURIComponent(cb)}`;
  }, []);

  const logout = useCallback(() => {
    void push(true);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(UID_KEY);
    } catch {
      /* bỏ qua */
    }
    setUser(null);
    setUid(null);
    uidRef.current = null;
    void loadFor(null);
  }, [loadFor, push]);

  const helpers = useMemo(() => {
    const bump = (s: PFState, field: "act" | "rev" | "runs", n = 1) => {
      const d = todayLocal();
      const cur = s.days[d] ?? { act: 0, rev: 0, runs: 0 };
      cur[field] += n;
      s.days[d] = cur;
    };
    return {
      markSection: (lessonId: string, sectionId: string, totalSections: number) =>
        update((s) => {
          const l = (s.lessons[lessonId] ??= { sections: [], quiz: {}, ok: [] });
          if (l.sections.includes(sectionId)) return;
          l.sections.push(sectionId);
          bump(s, "act", 1);
          if (!l.doneAt && l.sections.length >= totalSections) {
            l.doneAt = new Date().toISOString();
            // Mở thẻ ôn của bài: đến hạn từ ngày mai
            const content = getLessonContent(lessonId);
            const tomorrow = new Date(Date.now() + 86400000);
            for (const c of content?.cards ?? []) {
              if (!s.cards[c.id]) s.cards[c.id] = { box: 1, due: todayLocal(tomorrow), seen: 0, at: new Date().toISOString() };
            }
          }
        }),
      answerQuiz: (lessonId: string, quizId: string, choice: number, correct: boolean) =>
        update((s) => {
          const l = (s.lessons[lessonId] ??= { sections: [], quiz: {}, ok: [] });
          if (quizId in l.quiz) return;
          l.quiz[quizId] = choice;
          if (correct) l.ok.push(quizId);
        }),
      recordRun: (points = 0) =>
        update((s) => {
          bump(s, "runs", 1);
          if (points) bump(s, "act", points);
        }),
      gradeCardById: (cardId: string, g: Grade) =>
        update((s) => {
          s.cards[cardId] = gradeCard(s.cards[cardId], g, todayLocal(), new Date().toISOString());
          bump(s, "rev", 1);
        }),
      setNote: (key: string, text: string) =>
        update((s) => {
          s.notes[key] = { text, at: new Date().toISOString() };
        }),
      toggleTick: (day: string, id: string) =>
        update((s) => {
          const list = s.ticks[day] ?? [];
          s.ticks[day] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        }),
    };
  }, [update]);

  const value: Ctx = { ready, user, uid, state, sync, savedAt, today, update, login, register, loginGoogle, logout, ...helpers };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp phải nằm trong AppProvider");
  return c;
}
