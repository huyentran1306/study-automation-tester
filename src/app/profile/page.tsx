"use client";

import { useRef, useState } from "react";
import { Download, LogIn, LogOut, Upload } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { CHAPTERS, COURSE_START, fmtDateVi } from "@/lib/curriculum";
import { KATAS } from "@/content";
import { computeXp, levelOf, mergeStates, normalizeState, streakOf, type PFState } from "@/lib/progress/state";
import { LoginDialog } from "@/components/shell/login-dialog";
import { SyncBadge } from "@/components/shell/sync-badge";
import { Groups } from "@/components/groups";

function badges(s: PFState, streak: number) {
  const runs = Object.values(s.days).reduce((a, d) => a + d.runs, 0);
  const rev = Object.values(s.days).reduce((a, d) => a + d.rev, 0);
  const pass = (id: string) => s.kata[id]?.status === "pass";
  const quizOk = Object.values(s.lessons).reduce((a, l) => a + l.ok.length, 0);
  const noHint = Object.values(s.kata).filter((k) => k.status === "pass" && k.hints === 0).length;
  const ch1 = CHAPTERS[0].lessons.every((l) => s.lessons[l.id]?.doneAt);
  return [
    { name: "Bước đầu", how: "Học xong bài 1", on: !!s.lessons.l01?.doneAt },
    { name: "Gõ phím đều tay", how: "Chạy code 10 lần", on: runs >= 10 },
    { name: "Commit đầu tay", how: "Mở Pull Request trong Git Sandbox", on: pass("k-l07-pr") },
    { name: "Gỡ rối conflict", how: "Sửa merge conflict", on: pass("k-l07-conflict") },
    { name: "Quiz chuẩn", how: "10 câu đúng ngay lần đầu", on: quizOk >= 10 },
    { name: "Tự lực", how: "Pass 5 thử thách không mở gợi ý", on: noHint >= 5 },
    { name: "7 ngày liền", how: "Học 7 ngày không nghỉ", on: streak >= 7 },
    { name: "Ôn đều tay", how: "Ôn 100 thẻ", on: rev >= 100 },
    { name: "Người dùng TypeScript", how: "Pass 2 thử thách TypeScript", on: pass("k-l10-rate") && pass("k-l10-readonly") },
    { name: "Xong chương 1", how: "Học xong 10 bài JS/TS + Git", on: ch1 },
  ];
}

export default function Profile() {
  const { user, state, today, logout, update } = useApp();
  const [login, setLogin] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const xp = computeXp(state);
  const lv = levelOf(xp);
  const streak = streakOf(state, today);
  const b = badges(state, streak);
  const tints = ["bg-brand-soft text-brand", "bg-ai-tint text-ai", "bg-ok-soft text-ok", "bg-warn-soft text-warn"];
  const name = user?.display_name || user?.username || "Bạn đang học thử";
  const initials = name.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `playforge-tien-do-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const incoming = normalizeState(JSON.parse(await f.text()));
      update((s) => Object.assign(s, mergeStates(s, incoming)));
      setMsg("Đã gộp tiến độ từ tệp sao lưu.");
    } catch {
      setMsg("Tệp không đúng định dạng sao lưu của PlayForge.");
    }
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-6 sm:px-8 lg:py-8">
      <section className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[18px] border border-brand-edge bg-brand-tint p-6">
        <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24">
          <circle cx="120" cy="120" r="118" fill="none" stroke="#D4E4FA" strokeWidth="2" />
          <circle cx="120" cy="120" r="80" fill="none" stroke="#E1EAF8" strokeWidth="2" />
        </svg>
        <div className="relative flex items-center gap-4">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-brand font-display text-[28px] font-extrabold text-white">{initials || "PF"}</span>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[26px] font-extrabold">{name}</h1>
            <span className="text-sm text-ink-3">{user ? `@${user.username} · dùng chung tài khoản với web học tiếng Anh` : "Đăng nhập để lưu tiến độ lên máy chủ và học tiếp trên máy khác"}</span>
            {user ? <SyncBadge /> : null}
          </div>
        </div>
        <div className="relative grid min-w-[300px] grid-cols-3 gap-2.5">
          {[["Cấp", lv.level], ["Tổng XP", xp.toLocaleString("vi-VN")], ["Chuỗi", streak]].map(([l, v]) => (
            <div key={l as string} className="flex flex-col gap-0.5 rounded-xl bg-white px-3.5 py-3">
              <span className="text-xs text-muted">{l}</span>
              <span className="font-mono text-[22px] font-bold">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Bản đồ kỹ năng" className="card flex flex-col gap-3 p-5">
          <h2 className="text-base font-bold">Bản đồ kỹ năng</h2>
          <span className="text-xs text-muted">Tính từ phần bài đã đọc và thử thách đã pass của từng chương</span>
          {CHAPTERS.map((c) => {
            const secs = c.lessons.reduce((a, l) => a + (state.lessons[l.id]?.doneAt ? 1 : 0), 0) / c.lessons.length;
            const ks = KATAS.filter((k) => k.chapter === c.n);
            const kp = ks.length ? ks.filter((k) => state.kata[k.id]?.status === "pass").length / ks.length : 0;
            const v = Math.round((ks.length ? secs * 0.5 + kp * 0.5 : secs) * 100);
            return (
              <div key={c.n} className="grid grid-cols-[minmax(120px,170px)_minmax(0,1fr)_40px] items-center gap-3 text-[13px]">
                <span className="font-semibold">{c.short}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-line2"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, v)}%`, background: c.color }} /></span>
                <span className="text-right font-mono text-ink-3">{v}</span>
              </div>
            );
          })}
        </section>

        <section aria-label="Huy hiệu" className="card flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold">Huy hiệu</h2>
            <span className="text-xs text-muted">{b.filter((x) => x.on).length} / {b.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {b.map((x, i) => (
              <div key={x.name} className={`flex flex-col gap-1.5 rounded-xl border border-line2 p-3 ${x.on ? "bg-white" : "bg-ground opacity-70"}`}>
                <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-base font-bold ${x.on ? tints[i % 4] : "bg-line2 text-muted-2"}`}>{x.on ? "★" : "·"}</span>
                <span className="text-[13px] font-bold leading-tight">{x.name}</span>
                <span className="text-[11.5px] leading-snug text-muted">{x.how}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Cài đặt" className="card flex flex-col gap-3.5 p-5">
          <h2 className="text-base font-bold">Cài đặt học</h2>
          <label htmlFor="set-start" className="flex items-center justify-between gap-3 text-sm">
            Ngày khai giảng của bạn
            <input id="set-start" type="date" value={state.startDate ?? COURSE_START} onChange={(e) => update((s) => { s.startDate = e.target.value || undefined; })} className="min-h-[38px] rounded-lg border border-line px-2.5 text-[13px]" />
          </label>
          <label htmlFor="set-font" className="flex items-center justify-between gap-3 text-sm">
            Cỡ chữ editor
            <select id="set-font" value={state.settings.editorFont} onChange={(e) => update((s) => { s.settings.editorFont = Number(e.target.value); })} className="min-h-[38px] rounded-lg border border-line bg-white px-2.5 text-[13px]">
              {[13, 14, 15, 16].map((n) => <option key={n} value={n}>{n} px</option>)}
            </select>
          </label>
          <label htmlFor="set-ai" className="flex items-center justify-between gap-3 text-sm">
            Mentor AI
            <select id="set-ai" value={state.settings.mentor} onChange={(e) => update((s) => { s.settings.mentor = e.target.value === "full" ? "full" : "hint"; })} className="min-h-[38px] rounded-lg border border-line bg-white px-2.5 text-[13px]">
              <option value="hint">Gợi ý, không đưa đáp án</option>
              <option value="full">Giải thích đầy đủ</option>
            </select>
          </label>
          <span className="text-xs text-muted">Lịch lớp mặc định: khai giảng {fmtDateVi(COURSE_START)}, T2 / T4 / T6 lúc 19:00.</span>
        </section>

        <section aria-label="Tài khoản và dữ liệu" className="card flex flex-col gap-3.5 p-5">
          <h2 className="text-base font-bold">Tài khoản &amp; dữ liệu</h2>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <button type="button" className="btn-ghost" onClick={logout}><LogOut size={15} />Đăng xuất</button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setLogin(true)}><LogIn size={15} />Đăng nhập</button>
            )}
            <button type="button" className="btn-ghost" onClick={exportJson}><Download size={15} />Tải bản sao lưu</button>
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={15} />Khôi phục từ tệp</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </div>
          {msg && <span className="text-sm text-ok-dark" role="status">{msg}</span>}
        </section>
      </div>

      <section aria-label="Nhóm học" className="card flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold">Nhóm học &amp; bảng xếp hạng</h2>
        <Groups onLogin={() => setLogin(true)} />
      </section>
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </div>
  );
}
