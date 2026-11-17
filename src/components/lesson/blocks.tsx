"use client";

import { useState } from "react";
import { AlertTriangle, Briefcase, Copy, Lightbulb, Play } from "lucide-react";
import type { Block } from "@/content/types";
import { Md } from "@/components/md";
import { CodeLines } from "@/components/highlight";
import { useApp } from "@/lib/progress/store";

export function BlockView({ b, lessonId, onRun }: { b: Block; lessonId: string; onRun?: (code: string) => void }) {
  switch (b.t) {
    case "p":
      return <p className="max-w-[65ch] text-[15px] leading-[1.75] text-ink-2"><Md text={b.md} /></p>;
    case "h":
      return <h3 className="text-base font-bold">{b.text}</h3>;
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className={`flex max-w-[65ch] flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-ink-2 ${b.ordered ? "list-decimal" : "list-disc"}`}>
          {b.items.map((it, i) => <li key={i}><Md text={it} /></li>)}
        </Tag>
      );
    }
    case "code":
      return <CodeBlock code={b.code} lang={b.lang} title={b.title} run={b.run ? onRun : undefined} />;
    case "callout": {
      const tone = {
        tip: { box: "border-ai-edge bg-ai-soft", title: "text-ai-dark", Icon: Lightbulb, ic: "text-ai" },
        warn: { box: "border-warn/25 bg-warn-soft", title: "text-warn-dark", Icon: AlertTriangle, ic: "text-warn" },
        real: { box: "border-ok-edge bg-ok-tint", title: "text-ok-dark", Icon: Briefcase, ic: "text-ok" },
      }[b.tone];
      return (
        <div className={`flex gap-3 rounded-xl border px-4 py-3.5 ${tone.box}`}>
          <tone.Icon size={20} className={`mt-0.5 flex-none ${tone.ic}`} aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className={`text-[13px] font-bold ${tone.title}`}>{b.title}</span>
            <span className="text-sm leading-relaxed text-ink-2"><Md text={b.md} /></span>
          </div>
        </div>
      );
    }
    case "quiz":
      return <Quiz b={b} lessonId={lessonId} />;
  }
}

function CodeBlock({ code, lang, title, run }: { code: string; lang: string; title?: string; run?: (c: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3 py-1.5">
        <span className="font-mono text-xs text-muted">{title ?? (lang === "ts" ? "TypeScript" : lang === "js" ? "JavaScript" : lang)}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="btn-ghost min-h-[30px] px-2.5 text-xs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* trình duyệt chặn clipboard */
              }
            }}
          >
            <Copy size={12} />{copied ? "Đã chép" : "Sao chép"}
          </button>
          {run && (
            <button type="button" className="btn-dark min-h-[30px] px-2.5 text-xs" onClick={() => run(code)}>
              <Play size={11} fill="currentColor" />Chạy thử
            </button>
          )}
        </div>
      </div>
      <CodeLines code={code} lang={lang} />
    </div>
  );
}

function Quiz({ b, lessonId }: { b: Extract<Block, { t: "quiz" }>; lessonId: string }) {
  const { state, answerQuiz } = useApp();
  const first = state.lessons[lessonId]?.quiz[b.id];
  const [pick, setPick] = useState<number | null>(first ?? null);
  const answered = pick !== null;
  const right = pick === b.answer;
  return (
    <section aria-label="Câu hỏi nhanh" className="flex flex-col gap-2.5 rounded-2xl border border-brand-edge bg-brand-tint p-4">
      <span className="eyebrow text-brand-dark">Kiểm tra nhanh</span>
      <span className="text-[15px] font-semibold leading-relaxed">{b.q}</span>
      {b.options.map((o, i) => {
        const sel = pick === i;
        const ok = i === b.answer;
        const cls = sel ? (ok ? "border-ok bg-ok-tint" : "border-bad bg-bad-soft") : answered && ok ? "border-ok-edge bg-white" : "border-line bg-white hover:border-brand-ring";
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              setPick(i);
              answerQuiz(lessonId, b.id, i, i === b.answer);
            }}
            className={`flex min-h-[46px] w-full items-center gap-3 rounded-[10px] border-[1.5px] px-3 py-2 text-left text-sm ${cls}`}
          >
            <span className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-xs font-bold ${sel ? (ok ? "bg-ok text-white" : "bg-bad text-white") : "bg-chip text-ink-3"}`}>
              {String.fromCharCode(65 + i)}
            </span>
            <Md text={o} />
          </button>
        );
      })}
      {answered && (
        <div className={`rounded-[10px] px-3 py-2.5 text-[13px] font-semibold ${right ? "bg-ok-soft text-ok-dark" : "bg-bad-soft text-bad-dark"}`} role="status">
          {right ? "Đúng. " : "Chưa đúng. "}
          {b.explain}
          {right && state.lessons[lessonId]?.ok.includes(b.id) ? " +10 XP" : ""}
        </div>
      )}
    </section>
  );
}
