"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import {
  CHAPTERS,
  COURSE_START,
  TOTAL_LESSONS,
  TOTAL_SESSIONS,
  addDays,
  chapterSessions,
  currentSession,
  currentWeek,
  fmtDateVi,
  milestoneSession,
  sessionDate,
  sessionOfLesson,
  sessionWeek,
} from "@/lib/curriculum";
import { getLessonContent, katasOfLesson, KATAS } from "@/content";

type Filter = "all" | "todo" | "done";

export default function Roadmap() {
  const { state, today } = useApp();
  const start = state.startDate ?? COURSE_START;
  const [filter, setFilter] = useState<Filter>("all");
  const [closed, setClosed] = useState<Record<number, boolean>>({});
  const sess = currentSession(today, start);
  const week = currentWeek(today, start);
  const end = addDays(sessionDate(TOTAL_SESSIONS, start), 0);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-6 sm:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex max-w-[70ch] flex-col gap-2">
          <span className="text-[13px] text-muted">Khai giảng {fmtDateVi(start, false)} · kết thúc dự kiến {fmtDateVi(end, false)}</span>
          <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-tight sm:text-4xl">Từ chưa biết code tới tự dựng framework Playwright</h1>
          <p className="text-[15px] leading-relaxed text-ink-3">48 buổi theo lịch lớp T2 / T4 / T6. Mỗi chương kết thúc bằng một cột mốc có chấm điểm tự động.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc bài học">
          {([["all", `Tất cả ${TOTAL_LESSONS} bài`], ["todo", "Chưa xong"], ["done", "Đã xong"]] as [Filter, string][]).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-[40px] rounded-full border px-4 text-[13px] font-semibold ${filter === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-3"}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <section aria-label="Tổng quan" className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        {[
          ["16", "tuần"],
          ["48", "buổi · 2,5 giờ / buổi"],
          [String(TOTAL_LESSONS), "bài trong 7 chương"],
          [String(KATAS.length), "thử thách đã mở"],
          ["7", "cột mốc + 1 dự án cuối"],
        ].map(([n, l]) => (
          <div key={l} className="card flex flex-col gap-1 p-4">
            <span className="font-mono text-[26px] font-bold">{n}</span>
            <span className="text-[13px] text-muted">{l}</span>
          </div>
        ))}
      </section>

      <section aria-label="Dòng thời gian" className="card flex flex-col gap-2.5 p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="text-base font-bold">Dòng thời gian</h2>
          <span className="text-xs text-muted">{sess ? `Bạn đang ở tuần ${week} · buổi ${sess} / 48` : "Chưa khai giảng"}</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[860px] flex-col gap-2">
            <div className="grid h-[34px] gap-0.5" style={{ gridTemplateColumns: "repeat(48, minmax(0, 1fr))" }}>
              {CHAPTERS.map((c) => {
                const [a, b] = chapterSessions(c.n);
                const active = sess >= a && sess <= b;
                return (
                  <div key={c.n} className="flex items-center rounded-lg px-2 text-xs font-bold text-white" style={{ gridColumn: `span ${b - a + 1}`, background: c.color, opacity: active || (!sess && c.n === 1) ? 1 : 0.55 }} title={c.name}>
                    C{c.n}
                  </div>
                );
              })}
            </div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className={`rounded-md py-1 text-center font-mono text-[11px] ${i + 1 === week ? "bg-ink font-bold text-white" : "text-muted"}`}>T{i + 1}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Cách học mỗi buổi" className="grid gap-3.5 md:grid-cols-3">
        {[
          ["1", "Trước lớp · 20 phút", "Đọc tóm tắt, chạy 2–3 đoạn code mẫu để vào lớp không bị ngợp.", "bg-brand-tint border-brand-edge", "bg-brand"],
          ["2", "Trong lớp · 19:00", "Ghi chú nhanh vào bài, đánh dấu chỗ chưa hiểu để hỏi lại sau.", "bg-ai-soft border-ai-edge", "bg-ai"],
          ["3", "Sau lớp · 30 phút", "Làm thử thách của bài, thẻ ôn tự lên lịch từ ngày hôm sau.", "bg-ok-tint border-ok-edge", "bg-ok"],
        ].map(([n, t, d, box, dot]) => (
          <div key={n} className={`flex gap-3 rounded-2xl border p-4 ${box}`}>
            <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white ${dot}`}>{n}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">{t}</span>
              <span className="text-[13px] leading-relaxed text-ink-3">{d}</span>
            </div>
          </div>
        ))}
      </section>

      {CHAPTERS.map((c) => {
        const [a, b] = chapterSessions(c.n);
        const lessons = c.lessons.filter((l) => {
          const d = !!state.lessons[l.id]?.doneAt;
          return filter === "all" || (filter === "done" ? d : !d);
        });
        const done = c.lessons.filter((l) => state.lessons[l.id]?.doneAt).length;
        const open = !closed[c.n] && lessons.length > 0;
        const ms = milestoneSession(c.n);
        const status = done === c.lessons.length ? "Hoàn thành" : sess >= a ? "Đang học" : done ? "Học trước" : "Sắp tới";
        return (
          <section key={c.n} className="card overflow-hidden">
            <button type="button" aria-expanded={open} onClick={() => setClosed((x) => ({ ...x, [c.n]: !x[c.n] }))} className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px] font-display text-xl font-extrabold text-white" style={{ background: c.color }}>{c.n}</span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold tracking-wide text-muted">Tuần {sessionWeek(a)}–{sessionWeek(b)} · buổi {a}–{b}</span>
                  <span className="font-display text-xl font-bold">{c.name}</span>
                  <span className="text-[13px] text-ink-3">{c.goal}</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`pill ${status === "Hoàn thành" ? "bg-ok-soft text-ok-dark" : status === "Đang học" ? "bg-brand-soft text-brand-dark" : "bg-chip text-muted"}`}>{status}</span>
                <span className="font-mono text-[13px] text-muted">{done}/{c.lessons.length}</span>
                <ChevronDown size={18} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="flex flex-col gap-3.5 px-5 pb-5">
                <div className="grid gap-2 md:grid-cols-2">
                  {lessons.map((l) => {
                    const lp = state.lessons[l.id];
                    const has = !!getLessonContent(l.id);
                    const st = lp?.doneAt ? "done" : lp?.sections.length ? "now" : "next";
                    const k = sessionOfLesson(l);
                    const kn = katasOfLesson(l.id).length;
                    return (
                      <Link key={l.id} href={`/learn/${l.id}`} className={`flex min-h-[60px] items-center gap-3 rounded-xl border px-3 py-2.5 ${st === "now" ? "border-brand-edge bg-brand-tint" : "border-line2 bg-white hover:border-brand-ring"}`}>
                        <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-[9px] font-mono text-[13px] font-bold ${st === "done" ? "bg-ok-soft text-ok-dark" : st === "now" ? "bg-brand text-white" : "bg-chip text-muted"}`}>{l.n}</span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-semibold">{l.title}</span>
                          <span className="text-xs text-muted">
                            {fmtDateVi(sessionDate(k, start))} · {has ? `${getLessonContent(l.id)!.sections.length} phần` : "dàn ý"}{kn ? ` · ${kn} thử thách` : ""}
                          </span>
                        </span>
                        <span className={`pill flex-none ${st === "done" ? "bg-ok-soft text-ok-dark" : st === "now" ? "bg-brand text-white" : "bg-chip text-muted"}`}>
                          {st === "done" ? "Đã xong" : st === "now" ? "Đang học" : has ? "Mở" : "Sắp mở"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-xl border border-dashed border-brand-ring bg-[#F5F8FC] px-4 py-3.5">
                  <span className="flex items-center gap-3">
                    <Flag size={20} className="text-brand" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold tracking-wide text-brand-dark">CỘT MỐC · TUẦN {sessionWeek(ms)} · {fmtDateVi(sessionDate(ms, start))}</span>
                      <span className="text-sm font-semibold">{c.milestone.title}: {c.milestone.detail}</span>
                    </span>
                  </span>
                  <Link href={c.milestone.href} className="btn-ghost min-h-[40px] text-[13px]">Xem yêu cầu</Link>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
