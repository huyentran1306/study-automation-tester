"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useApp } from "@/lib/progress/store";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export async function askMentor(input: { uid: string | null; mode: "hint" | "full"; topic?: string; question?: string; code?: string; error?: string; history?: Msg[] }): Promise<string> {
  const res = await fetch("/api/pf/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, uid: input.uid ?? undefined }) });
  const j = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
  if (!res.ok || !j.answer) throw new Error(j.error || "Mentor AI chưa trả lời được, thử lại sau.");
  return j.answer;
}

/** Hiển thị câu trả lời có khối ```code```. */
export function MentorText({ text }: { text: string }) {
  const parts = text.split(/```(?:\w+)?\n?([\s\S]*?)```/g);
  return (
    <div className="flex flex-col gap-2">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-[12px] leading-relaxed">{p.trim()}</pre>
        ) : p.trim() ? (
          <p key={i} className="whitespace-pre-wrap">{p.trim()}</p>
        ) : null,
      )}
    </div>
  );
}

export function MentorChat({ topic, getCode }: { topic: string; getCode?: () => string }) {
  const { uid, state } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [withCode, setWithCode] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || busy) return;
    const question = q.trim();
    setQ("");
    setErr("");
    const next = [...msgs, { role: "user" as const, content: question }];
    setMsgs(next);
    setBusy(true);
    try {
      const answer = await askMentor({ uid, mode: state.settings.mentor, topic, question, code: withCode ? getCode?.() : undefined, history: msgs });
      setMsgs([...next, { role: "assistant", content: answer }]);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {msgs.length === 0 && (
        <p className="rounded-xl bg-ai-soft px-3.5 py-3 text-sm leading-relaxed text-ink-2">
          Hỏi bất cứ điều gì về bài “{topic}”. Mentor trả lời bằng tiếng Việt{state.settings.mentor === "hint" ? ", và chỉ gợi ý chứ không đưa đáp án bài tập" : ""}.
        </p>
      )}
      {msgs.map((m, i) => (
        <div key={i} className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "self-end rounded-br-md bg-ink text-white" : "self-start rounded-bl-md bg-ai-soft text-ink"}`}>
          {m.role === "assistant" ? <MentorText text={m.content} /> : m.content}
        </div>
      ))}
      {busy && <div className="flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" />Mentor đang trả lời…</div>}
      {err && <div className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-dark" role="alert">{err}</div>}
      <form onSubmit={send} className="flex flex-col gap-2">
        <label htmlFor="mentor-q" className="sr-only">Câu hỏi cho Mentor</label>
        <div className="flex items-center gap-2 rounded-xl border border-line py-1.5 pl-3.5 pr-1.5">
          <input id="mentor-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hỏi về bài này…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button type="submit" className="btn min-h-[36px] bg-ai px-3 text-white hover:bg-ai-dark" disabled={busy || !q.trim()} aria-label="Gửi câu hỏi">
            <Send size={14} />Gửi
          </button>
        </div>
        {getCode && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={withCode} onChange={(e) => setWithCode(e.target.checked)} className="h-4 w-4 accent-[#5B44B8]" />
            Gửi kèm code đang viết
          </label>
        )}
      </form>
    </div>
  );
}
