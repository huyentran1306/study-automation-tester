"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { COURSE_START, LESSONS, fmtDateVi, getChapter, getLesson, sessionDate, sessionOfLesson } from "@/lib/curriculum";
import { getLessonContent, katasOfLesson } from "@/content";
import { BlockView } from "@/components/lesson/blocks";
import { Playground } from "@/components/code/playground";
import { GitSandbox } from "@/components/git/git-sandbox";
import { PwPlayground } from "@/components/pw/pw-playground";
import { MentorChat } from "@/components/lesson/mentor";
import { nextStepHint } from "@/lib/git/hints";

type Tab = "run" | "note" | "ai";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const meta = getLesson(id);
  const content = getLessonContent(id);
  const { state, markSection, setNote } = useApp();
  const lp = state.lessons[id];
  const [tab, setTab] = useState<Tab>("run");
  const initial = content?.starter ?? "// Viết code và bấm Chạy (Ctrl + Enter)\nconsole.log('Xin chào PlayForge');";
  const [code, setCode] = useState(initial);
  const codeRef = useRef(code);
  codeRef.current = code;
  const [note, setNoteDraft] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCode(content?.starter ?? initial);
    setNoteDraft(state.notes[id]?.text ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRunBlock = useCallback((c: string) => {
    setCode(c);
    setTab("run");
    if (window.innerWidth < 1024) document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!meta) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Không tìm thấy bài học</h1>
        <Link href="/roadmap" className="btn-primary mt-6">Về lộ trình</Link>
      </div>
    );
  }

  const ch = getChapter(meta.chapter)!;
  const idx = LESSONS.findIndex((l) => l.id === id);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const start = state.startDate ?? COURSE_START;
  const katas = katasOfLesson(id);
  const isGit = !!content?.git;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6 lg:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <nav aria-label="Vị trí" className="flex flex-wrap gap-1.5 text-[13px] text-muted">
            <Link href="/roadmap" className="hover:text-brand">Lộ trình</Link><span aria-hidden="true">/</span>
            <span>Chương {meta.chapter}</span><span aria-hidden="true">/</span>
            <span className="font-semibold text-ink">Bài {meta.n}</span>
          </nav>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">{meta.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {katas[0] && <Link href={`/kata/${katas[0].id}`} className="btn-primary min-h-[44px]">Làm thử thách của bài</Link>}
        </div>
      </header>

      {!content ? (
        <div className="card flex max-w-3xl flex-col gap-3 p-6">
          <span className="eyebrow text-brand">Sắp mở · {fmtDateVi(sessionDate(sessionOfLesson(meta), start))}</span>
          <p className="text-[15px] leading-relaxed text-ink-2">
            Nội dung chi tiết của bài này sẽ mở trước buổi học trên lớp. Bài thuộc chương “{ch.name}”, mục tiêu: {ch.goal}
          </p>
          <div className="flex flex-wrap gap-2">
            {prev && <Link href={`/learn/${prev.id}`} className="btn-ghost"><ArrowLeft size={14} />Bài {prev.n}</Link>}
            <Link href="/roadmap" className="btn-ghost">Xem lộ trình</Link>
          </div>
        </div>
      ) : (
        <>
          <div role="list" aria-label="Các phần của bài" className="flex flex-wrap gap-1.5">
            {content.sections.map((s, i) => {
              const done = lp?.sections.includes(s.id);
              return (
                <a key={s.id} role="listitem" href={`#${s.id}`} className={`pill ${done ? "bg-ok-soft text-ok-dark" : "bg-chip text-muted hover:text-brand"}`}>
                  {done && <Check size={12} strokeWidth={3} />}
                  {i + 1} · {s.title}
                </a>
              );
            })}
          </div>

          <div className="flex flex-col items-start gap-5 lg:flex-row">
            <article className="card flex w-full min-w-0 flex-1 flex-col gap-9 p-5 sm:p-7">
              <p className="max-w-[65ch] text-[15px] leading-relaxed text-muted">{content.summary}</p>
              {content.sections.map((s, i) => {
                const done = lp?.sections.includes(s.id);
                return (
                  <section key={s.id} id={s.id} className="flex scroll-mt-6 flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="eyebrow text-brand">Phần {i + 1} / {content.sections.length} · {s.minutes} phút đọc</span>
                      <h2 className="font-display text-[22px] font-bold leading-snug">{s.title}</h2>
                    </div>
                    {s.blocks.map((b, j) => (
                      <BlockView key={j} b={b} lessonId={id} onRun={content.git ? undefined : onRunBlock} />
                    ))}
                    <div>
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => markSection(id, s.id, content.sections.length)}
                        className={done ? "btn min-h-[40px] bg-ok-soft text-ok-dark disabled:opacity-100" : "btn-ghost"}
                      >
                        {done ? <><CheckCircle2 size={16} />Đã hiểu phần này</> : <>Đã hiểu phần này · +10 XP</>}
                      </button>
                    </div>
                  </section>
                );
              })}
              {lp?.doneAt && (
                <div className="flex flex-col gap-2 rounded-2xl border border-ok-edge bg-ok-tint p-5">
                  <span className="font-bold text-ok-dark">Xong bài {meta.n}. Đã mở {content.cards.length} thẻ ôn từ ngày mai.</span>
                  <span className="text-sm text-ink-3">Tiếp theo: làm {katas.length} thử thách của bài để nhớ lâu hơn.</span>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2.5 border-t border-line2 pt-5">
                {prev ? <Link href={`/learn/${prev.id}`} className="btn-ghost min-h-[44px]"><ArrowLeft size={14} />Bài {prev.n}</Link> : <span />}
                {next && <Link href={`/learn/${next.id}`} className="btn-dark min-h-[44px]">Bài {next.n}: {next.title.slice(0, 32)}{next.title.length > 32 ? "…" : ""}<ArrowRight size={14} /></Link>}
              </div>
            </article>

            <aside id="practice" aria-label="Khu thực hành" className="card w-full overflow-hidden lg:sticky lg:top-4 lg:w-[540px] lg:flex-none xl:w-[600px]">
              <div role="tablist" aria-label="Công cụ" className="flex flex-wrap gap-1 border-b border-line bg-[#F5F8FC] p-2">
                {([["run", isGit ? "Git Sandbox" : content.pw ? "Chạy test" : "Chạy thử"], ["note", "Ghi chú"], ["ai", "Hỏi Mentor AI"]] as [Tab, string][]).map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[38px] rounded-[9px] px-3.5 text-[13px] font-semibold ${tab === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className={tab === "run" ? "block" : "hidden"}>
                <div className="p-4">
                  {isGit ? (
                    <GitSandbox scenario={content.git!} hint={nextStepHint} />
                  ) : content.pw ? (
                    <PwPlayground code={code} setCode={setCode} initial={content.starter ?? initial} fileName={`tests/bai-${meta.n}.spec.ts`} />
                  ) : (
                    <Playground code={code} setCode={setCode} initial={content.starter ?? initial} fileName={`bai-${meta.n}.ts`} height={360} />
                  )}
                </div>
              </div>
              {tab === "note" && (
                <div className="flex flex-col gap-2.5 p-4">
                  <label htmlFor="lesson-note" className="text-[13px] font-bold">Ghi chú của bạn cho bài {meta.n}</label>
                  <textarea
                    id="lesson-note"
                    rows={14}
                    value={note}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNoteDraft(v);
                      if (noteTimer.current) clearTimeout(noteTimer.current);
                      noteTimer.current = setTimeout(() => setNote(id, v), 800);
                    }}
                    placeholder={"- Điều mình mới hiểu…\n- Hỏi thầy: …"}
                    className="w-full resize-y rounded-xl border border-line p-3.5 text-sm leading-relaxed"
                  />
                  <span className="text-xs text-muted">Tự lưu{state.notes[id] ? " · lần cuối " + new Date(state.notes[id].at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
              )}
              {tab === "ai" && <MentorChat topic={`Bài ${meta.n}: ${meta.title}`} getCode={isGit ? undefined : () => codeRef.current} />}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
