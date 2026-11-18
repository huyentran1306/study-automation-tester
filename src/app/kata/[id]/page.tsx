"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Play, RotateCcw, Send, Sparkles } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { getKata, katasOfLesson } from "@/content";
import { codeExt, getLesson } from "@/lib/curriculum";
import { earnedXp, KATA_TYPE_LABEL, KATA_TYPE_STYLE } from "@/lib/kata";
import { MdBlock } from "@/components/md";
import { CodeEditor } from "@/components/code/editor";
import { OutputPanel } from "@/components/code/output";
import { GitSandbox } from "@/components/git/git-sandbox";
import { PwKata } from "@/components/pw/pw-kata";
import { askMentor, MentorText } from "@/components/lesson/mentor";
import { runCode, type RunOutcome } from "@/lib/runner/run";
import type { Repo } from "@/lib/git/sim";

export default function KataSolve() {
  const { id } = useParams<{ id: string }>();
  const kata = getKata(id);
  const { state, update, recordRun, uid } = useApp();
  const prog = state.kata[id];
  const [code, setCode] = useState(prog?.code ?? kata?.starter ?? "");
  const [out, setOut] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState<"run" | "submit" | null>(null);
  const [mentor, setMentor] = useState<{ busy: boolean; text: string; err: string }>({ busy: false, text: "", err: "" });
  const [repo, setRepo] = useState<Repo | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCode(state.kata[id]?.code ?? kata?.starter ?? "");
    setOut(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const touch = useCallback(
    (fn: (k: NonNullable<typeof prog>) => void) =>
      update((s) => {
        const k = (s.kata[id] ??= { status: "open", attempts: 0, hints: 0, xp: 0, at: new Date().toISOString() });
        fn(k);
        k.at = new Date().toISOString();
      }),
    [id, update],
  );

  const onCode = (v: string) => {
    setCode(v);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => touch((k) => { k.code = v; }), 1200);
  };

  const run = useCallback(
    async (submit: boolean) => {
      if (!kata) return;
      setRunning(submit ? "submit" : "run");
      setMentor({ busy: false, text: "", err: "" });
      const res = await runCode({ code, tests: submit ? kata.tests : undefined, forbid: kata.forbid });
      setOut(res);
      setRunning(null);
      recordRun(submit ? 2 : 0);
      if (submit) {
        const allOk = !res.error && !res.violations.length && res.results.length > 0 && res.results.every((r) => r.ok);
        touch((k) => {
          k.attempts += 1;
          k.code = code;
          if (allOk && k.status !== "pass") {
            k.status = "pass";
            k.xp = earnedXp(kata, k.hints);
            k.passedAt = new Date().toISOString();
          }
        });
      }
    },
    [code, kata, recordRun, touch],
  );

  if (!kata) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Không tìm thấy thử thách</h1>
        <Link href="/kata" className="btn-primary mt-6">Về danh sách</Link>
      </div>
    );
  }

  const lesson = getLesson(kata.lesson)!;
  const hints = prog?.hints ?? 0;
  const passed = prog?.status === "pass";
  const siblings = katasOfLesson(kata.lesson);
  const nextKata = siblings.find((k) => k.id !== id && state.kata[k.id]?.status !== "pass");
  const gitDone = kata.git && repo ? kata.git.goals.every((g) => g.check(repo)) : false;
  const failing = out && (out.error || out.results.some((r) => !r.ok));

  const explain = async () => {
    if (!out) return;
    setMentor({ busy: true, text: "", err: "" });
    const err = out.error ? `${out.error.name}: ${out.error.message}${out.error.line ? ` (dòng ${out.error.line})` : ""}` : out.results.filter((r) => !r.ok).map((r) => `✕ ${r.name}\n${r.error}`).join("\n\n");
    try {
      const text = await askMentor({ uid, mode: "hint", topic: `Thử thách: ${kata.title}. Đề: ${kata.prompt.slice(0, 600)}`, question: "Vì sao code của em chưa qua test? Gợi ý giúp em, đừng đưa lời giải.", code, error: err });
      setMentor({ busy: false, text, err: "" });
    } catch (e) {
      setMentor({ busy: false, text: "", err: (e as Error).message });
    }
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6 lg:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/kata" className="flex items-center gap-1 text-[13px] text-muted hover:text-brand"><ArrowLeft size={14} />Thử thách</Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{kata.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`pill ${KATA_TYPE_STYLE[kata.type]}`}>{KATA_TYPE_LABEL[kata.type]}</span>
          <span className="pill bg-chip text-ink-3">Bài {lesson.n}</span>
          <span className="pill bg-brand-soft font-mono text-brand-dark">+{earnedXp(kata, hints)} XP</span>
          {passed && <span className="pill bg-ok-soft text-ok-dark"><CheckCircle2 size={13} />Đã pass · {prog?.attempts} lần nộp</span>}
        </div>
      </header>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <aside className="card flex w-full flex-col gap-4 p-5 lg:sticky lg:top-4 lg:w-[400px] lg:flex-none">
          <div className="text-[14.5px] leading-relaxed text-ink-2"><MdBlock text={kata.prompt} /></div>
          {kata.forbid && (
            <div className="flex flex-col gap-1 rounded-xl bg-warn-soft px-3.5 py-2.5 text-[13px] text-warn-dark">
              <span className="font-bold">Luật</span>
              {kata.forbid.map((f) => <span key={f.pattern}>{f.message}</span>)}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="eyebrow text-[11px] text-muted">Gợi ý · mở dần, mỗi bậc trừ XP</span>
            {kata.hints.map((h, i) => {
              const shown = hints > i;
              const can = hints === i;
              return (
                <div key={i} className={`flex flex-col rounded-[10px] border ${shown ? "border-ai-edge bg-ai-soft" : "border-line bg-white"} ${!shown && !can ? "opacity-60" : ""}`}>
                  <button type="button" disabled={!can && !shown} onClick={() => can && touch((k) => { k.hints = i + 1; })} className="flex min-h-[40px] items-center justify-between px-3 text-left text-[13px] font-semibold">
                    {["Bậc 1 · Hướng suy nghĩ", "Bậc 2 · Chỗ cần sửa", "Bậc 3 · Lời giải"][i]}
                    <span className="text-xs font-normal text-muted">{shown ? "Đã mở" : i === 2 ? "còn 50% XP" : "−10 XP"}</span>
                  </button>
                  {shown && (i === 2 ? <pre className="mx-3 mb-3 overflow-x-auto whitespace-pre rounded-lg bg-white p-2.5 font-mono text-[12px] leading-relaxed">{h}</pre> : <p className="px-3 pb-3 text-[13px] leading-relaxed text-ink-2">{h}</p>)}
                </div>
              );
            })}
          </div>

          {passed && (
            <div className="flex flex-col gap-2 rounded-xl border border-ok-edge bg-ok-tint p-4">
              <span className="font-bold text-ok-dark">Đã pass, +{prog?.xp} XP</span>
              <div className="flex flex-wrap gap-2">
                {nextKata ? <Link href={`/kata/${nextKata.id}`} className="btn-primary min-h-[36px] text-[13px]">Thử thách tiếp theo</Link> : <Link href={`/learn/${lesson.id}`} className="btn-primary min-h-[36px] text-[13px]">Về bài {lesson.n}</Link>}
                <Link href="/kata" className="btn-ghost min-h-[36px] text-[13px]">Danh sách</Link>
              </div>
            </div>
          )}
        </aside>

        <section className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {kata.runner === "pw" ? (
            <PwKata
              kata={kata}
              code={code}
              onCode={onCode}
              fontSize={state.settings.editorFont}
              onGraded={() =>
                touch((k) => {
                  k.attempts += 1;
                  k.code = code;
                  if (k.status !== "pass") {
                    k.status = "pass";
                    k.xp = earnedXp(kata, k.hints);
                    k.passedAt = new Date().toISOString();
                  }
                })
              }
              onFail={() => touch((k) => { k.attempts += 1; k.code = code; })}
            />
          ) : kata.git ? (
            <div className="card flex flex-col gap-3 p-4">
              <GitSandbox scenario={kata.git.scenario} goals={kata.git.goals} onChange={setRepo} />
              <div className="flex flex-wrap items-center gap-3 border-t border-line2 pt-3">
                <button
                  type="button"
                  className="btn-primary min-h-[44px]"
                  disabled={!gitDone || passed}
                  onClick={() =>
                    touch((k) => {
                      k.attempts += 1;
                      if (k.status !== "pass") {
                        k.status = "pass";
                        k.xp = earnedXp(kata, k.hints);
                        k.passedAt = new Date().toISOString();
                      }
                    })
                  }
                >
                  <Send size={15} />{passed ? "Đã nộp" : "Nộp bài"}
                </button>
                <span className="text-[13px] text-muted">{gitDone ? "Đủ các nhiệm vụ, nộp được rồi." : "Hoàn thành đủ nhiệm vụ để nộp."}</span>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3 py-2">
                <span className="font-mono text-xs text-muted">{kata.id}.ts</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost min-h-[36px] text-xs" onClick={() => { onCode(kata.starter ?? ""); setOut(null); }}>
                    <RotateCcw size={13} />Làm lại
                  </button>
                  <button type="button" className="btn-ghost min-h-[36px] text-xs" onClick={() => run(false)} disabled={!!running}>
                    <Play size={12} fill="currentColor" />Chạy thử
                  </button>
                  <button type="button" className="btn-primary min-h-[36px] text-xs" onClick={() => run(true)} disabled={!!running}>
                    {running === "submit" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}Nộp bài: chạy test ẩn
                  </button>
                </div>
              </div>
              <div className="h-[420px]">
                <CodeEditor value={code} onChange={onCode} language={codeExt(kata.lesson) === "js" ? "javascript" : "typescript"} path={`file:///kata/${kata.id}.${codeExt(kata.lesson)}`} onRun={() => run(false)} errorLine={out?.error?.line} fontSize={state.settings.editorFont} />
              </div>
              <div className="max-h-[360px] min-h-[120px] overflow-auto border-t border-line">
                <OutputPanel out={out} running={!!running} empty="Chạy thử để xem console.log. Nộp bài để chạy test ẩn." />
              </div>
              {failing && (
                <div className="flex flex-col gap-2.5 border-t border-line bg-ai-soft p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-ai-dark">Mentor AI giải thích lỗi</span>
                    <button type="button" className="btn-ai min-h-[34px] text-xs" onClick={explain} disabled={mentor.busy}>
                      {mentor.busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}Vì sao chưa qua?
                    </button>
                  </div>
                  {mentor.text && <div className="text-[13.5px] leading-relaxed text-ink-2"><MentorText text={mentor.text} /></div>}
                  {mentor.err && <div className="text-[13px] text-bad-dark">{mentor.err}</div>}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
