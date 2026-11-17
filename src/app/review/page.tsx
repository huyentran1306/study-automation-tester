"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { getCard } from "@/content";
import { addDaysIso, nextIntervalLabel, type Grade } from "@/lib/progress/state";
import { getLesson } from "@/lib/curriculum";
import { askMentor, MentorText } from "@/components/lesson/mentor";

const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: "again", label: "Quên", key: "1", cls: "bg-bad-soft text-bad-dark" },
  { g: "hard", label: "Khó", key: "2", cls: "bg-warn-soft text-warn-dark" },
  { g: "good", label: "Nhớ", key: "3", cls: "bg-ok-soft text-ok-dark" },
  { g: "easy", label: "Dễ", key: "4", cls: "bg-ai-tint text-ai-dark" },
];

const INTERVIEW = [
  { q: "Vì sao bạn không dùng waitForTimeout trong test?", tags: ["Chống flaky", "Hay hỏi"] },
  { q: "Phân biệt == và === trong JavaScript. Trong test bạn dùng cái nào?", tags: ["JavaScript", "Fresher"] },
  { q: "Page Object Model là gì? Lợi ích khi dự án có 200 test?", tags: ["POM", "Hay hỏi"] },
  { q: "Bạn xử lý merge conflict thế nào khi hai người cùng sửa một file test?", tags: ["Git"] },
  { q: "async/await giải quyết vấn đề gì? Quên await thì test bị sao?", tags: ["JavaScript", "Hay hỏi"] },
  { q: "Vì sao automation nên dùng TypeScript thay vì JavaScript?", tags: ["TypeScript"] },
  { q: "Locator nào bạn ưu tiên trong Playwright, vì sao tránh XPath theo vị trí?", tags: ["Locator", "Hay hỏi"] },
];

export default function Review() {
  const { state, today, gradeCardById, uid } = useApp();
  const due = useMemo(
    () => Object.entries(state.cards).filter(([, c]) => c.due <= today).sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due)).map(([id]) => id),
    // Hàng đợi cố định trong phiên ôn, không xếp lại sau mỗi lần chấm
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, Object.keys(state.cards).length],
  );
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const queue = due.filter((id) => (state.cards[id]?.due ?? "") <= today);
  const cardId = queue[pos % Math.max(1, queue.length)];
  const card = cardId ? getCard(cardId) : undefined;
  const cp = cardId ? state.cards[cardId] : undefined;
  const total = Object.keys(state.cards).length;

  const grade = (g: Grade) => {
    if (!cardId) return;
    gradeCardById(cardId, g);
    setFlipped(false);
    if (g !== "again") setPos((p) => p); // thẻ đã chấm rời khỏi hàng đợi
    else setPos((p) => p + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) grade(g.g);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const boxes = [1, 2, 3, 4, 5, 6].map((b) => Object.values(state.cards).filter((c) => c.box === b).length);
  const maxBox = Math.max(1, ...boxes);
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysIso(today, i);
    return { d, n: Object.values(state.cards).filter((c) => (i === 0 ? c.due <= d : c.due === d)).length };
  });
  const maxF = Math.max(1, ...forecast.map((f) => f.n));
  const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-6 sm:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Lặp lại ngắt quãng · thẻ tự mở khi bạn học xong mỗi bài</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Ôn tập &amp; Phỏng vấn</h1>
        </div>
        <span className="pill bg-brand-soft px-3.5 py-2 text-[13px] text-brand-dark">{queue.length} thẻ đến hạn hôm nay</span>
      </header>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <section aria-label="Thẻ ôn" className="flex w-full min-w-0 flex-1 flex-col gap-3.5">
          {!card ? (
            <div className="card flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="font-display text-xl font-bold">{total ? "Xong thẻ hôm nay rồi" : "Chưa có thẻ ôn nào"}</span>
              <span className="max-w-md text-sm text-muted">{total ? `Lần ôn tiếp theo: ${forecast.find((f, i) => i > 0 && f.n)?.d ?? "chưa có lịch"}. Nghỉ ngơi hoặc làm thêm một thử thách nhé.` : "Đọc xong một bài học (bấm “Đã hiểu” ở mọi phần) để mở thẻ ôn của bài đó."}</span>
              <Link href={total ? "/kata" : "/learn"} className="btn-primary">{total ? "Làm thử thách" : "Vào bài học"}</Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? "Úp thẻ" : "Lật thẻ"}
                className="relative flex min-h-[300px] flex-col gap-3.5 overflow-hidden rounded-[20px] border border-brand-edge bg-white p-7 text-left shadow-lift"
              >
                <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-16">
                  <circle cx="100" cy="100" r="98" fill="none" stroke="#D4E4FA" strokeWidth="2" />
                  <circle cx="100" cy="100" r="62" fill="#EEF5FE" />
                </svg>
                <span className="relative flex items-center gap-2">
                  <span className="pill bg-ai-tint text-ai-dark">{card.tag}</span>
                  <span className="text-xs text-muted">Bài {getLesson(card.lesson)?.n} · hộp {cp?.box ?? 1}</span>
                </span>
                <span className="relative max-w-[34ch] font-display text-2xl font-bold leading-snug">{card.q}</span>
                {flipped ? (
                  <span className="relative flex flex-col gap-2.5 border-t border-dashed border-brand-ring pt-3.5">
                    <span className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{card.a}</span>
                    {card.code && <code className="self-start rounded-lg bg-[#F5F8FC] px-3 py-2 font-mono text-[12.5px]">{card.code}</code>}
                  </span>
                ) : (
                  <span className="relative mt-auto text-[13px] font-semibold text-brand-dark">Nghĩ câu trả lời trong đầu rồi bấm (hoặc phím Space) để lật thẻ</span>
                )}
              </button>
              <div role="group" aria-label="Bạn nhớ thế nào" className="grid grid-cols-4 gap-2.5">
                {GRADES.map((g) => (
                  <button key={g.g} type="button" disabled={!flipped} onClick={() => grade(g.g)} className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-xl disabled:opacity-40 ${g.cls}`}>
                    <span className="text-sm font-bold">{g.label} <span className="font-mono text-[11px] opacity-60">{g.key}</span></span>
                    <span className="font-mono text-[11.5px] opacity-85">{nextIntervalLabel(cp, g.g)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="flex w-full flex-col gap-3.5 lg:w-[380px] lg:flex-none">
          <div className="card flex flex-col gap-3 p-4">
            <span className="text-sm font-bold">6 hộp ghi nhớ</span>
            <div className="grid h-[120px] grid-cols-6 items-end gap-1.5">
              {boxes.map((n, i) => (
                <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
                  <span className="font-mono text-[11px] font-bold text-ink-3">{n}</span>
                  <span className="w-full rounded-t-md" style={{ height: Math.max(3, (n / maxBox) * 82), background: ["#B9D3F5", "#8DB6EE", "#5B93E3", "#2563C9", "#1D4E9E", "#5B44B8"][i] }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1.5 text-center text-[10.5px] text-muted">
              <span>1 ngày</span><span>2 ngày</span><span>4 ngày</span><span>1 tuần</span><span>2 tuần</span><span>1 tháng</span>
            </div>
            <span className="text-xs text-muted">Nhớ thì thẻ lên hộp sau, quên thì về hộp 1. Tổng {total} thẻ.</span>
          </div>
          <div className="card flex flex-col gap-3 p-4">
            <span className="text-sm font-bold">Thẻ đến hạn 7 ngày tới</span>
            <div className="grid h-24 grid-cols-7 items-end gap-2 border-b border-line">
              {forecast.map((f, i) => (
                <div key={f.d} className="flex h-full flex-col items-center justify-end gap-1">
                  <span className="font-mono text-[11px] text-ink-3">{f.n}</span>
                  <span className="w-[70%] rounded-t-[5px]" style={{ height: Math.max(2, (f.n / maxF) * 64), background: i === 0 ? "#2563C9" : "#B9D3F5" }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-muted">
              {forecast.map((f, i) => <span key={f.d} className={i === 0 ? "font-bold text-brand-dark" : ""}>{i === 0 ? "Nay" : WD[new Date(f.d + "T00:00:00").getDay()]}</span>)}
            </div>
          </div>
        </aside>
      </div>

      <Interview uid={uid} />
    </div>
  );
}

function Interview({ uid }: { uid: string | null }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [res, setRes] = useState<{ busy: boolean; text: string; err: string }>({ busy: false, text: "", err: "" });
  const item = INTERVIEW[i % INTERVIEW.length];

  const grade = async () => {
    if (!answer.trim()) return;
    setRes({ busy: true, text: "", err: "" });
    try {
      const text = await askMentor({
        uid,
        mode: "full",
        topic: "Luyện phỏng vấn vị trí Automation Tester (Playwright, TypeScript)",
        question: `Câu hỏi phỏng vấn: "${item.q}"\nCâu trả lời của ứng viên: "${answer.trim()}"\n\nHãy chấm 3 tiêu chí (Đúng ý, Ví dụ cụ thể, Rõ ràng) mỗi tiêu chí trên thang 10, ghi dạng "Đúng ý: x/10". Sau đó 2–3 câu nhận xét và 1 gợi ý để câu trả lời ghi điểm hơn.`,
      });
      setRes({ busy: false, text, err: "" });
    } catch (e) {
      setRes({ busy: false, text: "", err: (e as Error).message });
    }
  };

  return (
    <section aria-label="Luyện phỏng vấn" className="card flex flex-col gap-5 p-5 sm:p-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="pill self-start bg-ok-soft text-ok-dark">Luyện phỏng vấn · {INTERVIEW.length} câu hay gặp</span>
        <h2 className="font-display text-xl font-bold">“{item.q}”</h2>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((t) => <span key={t} className="pill bg-chip font-medium text-ink-3">{t}</span>)}
        </div>
        <label htmlFor="iv-answer" className="text-[13px] font-semibold text-ink-3">Câu trả lời của bạn</label>
        <textarea id="iv-answer" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Trả lời như đang nói với người phỏng vấn…" className="w-full resize-y rounded-xl border border-line p-3.5 text-sm leading-relaxed" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={grade} disabled={res.busy || !answer.trim()}>
            {res.busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}Nhờ AI chấm
          </button>
          <button type="button" className="btn-ghost" onClick={() => { setI(i + 1); setAnswer(""); setRes({ busy: false, text: "", err: "" }); }}>Câu khác</button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-ai-edge bg-ai-soft p-4">
        <span className="text-[13px] font-bold text-ai-dark">Nhận xét của AI</span>
        {res.text ? (
          <div className="text-sm leading-relaxed text-ink-2"><MentorText text={res.text} /></div>
        ) : res.err ? (
          <p className="text-sm text-bad-dark">{res.err}</p>
        ) : (
          <p className="text-sm text-muted">Viết câu trả lời rồi bấm “Nhờ AI chấm”. AI chấm theo 3 tiêu chí: đúng ý, có ví dụ cụ thể, rõ ràng.</p>
        )}
      </div>
    </section>
  );
}
