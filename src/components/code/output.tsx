"use client";

import { Check, X } from "lucide-react";
import type { RunOutcome } from "@/lib/runner/run";

export function OutputPanel({ out, running, empty = "Bấm Chạy (Ctrl + Enter) để xem kết quả ở đây." }: { out: RunOutcome | null; running: boolean; empty?: string }) {
  if (running) return <div className="p-4 font-mono text-[12.5px] text-muted">Đang chạy…</div>;
  if (!out) return <div className="p-4 text-sm text-muted">{empty}</div>;
  return (
    <div className="flex flex-col gap-2 p-3 font-mono text-[12.5px] leading-relaxed">
      {out.violations.map((v) => (
        <div key={v} className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-warn-dark">Vi phạm luật: {v}</div>
      ))}
      {out.logs.length > 0 && (
        <div className="flex flex-col">
          {out.logs.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap break-words border-b border-line2 py-0.5 last:border-0 ${l.level === "error" ? "text-bad" : l.level === "warn" ? "text-warn" : l.level === "system" ? "text-muted" : "text-ink"}`}>
              {l.text}
            </div>
          ))}
        </div>
      )}
      {out.error && (
        <div className="whitespace-pre-wrap rounded-lg border border-bad-edge bg-bad-soft px-3 py-2 text-bad-dark">
          {out.error.name}: {out.error.message}
          {out.error.line ? `\n  ở dòng ${out.error.line}` : ""}
        </div>
      )}
      {!out.logs.length && !out.error && !out.results.length && <div className="text-muted">Chạy xong, không có gì in ra. Thử thêm console.log(...)</div>}
      {out.results.length > 0 && <TestList results={out.results} />}
      <div className="text-[11px] text-muted-2">Xong trong {out.ms} ms</div>
    </div>
  );
}

export function TestList({ results }: { results: RunOutcome["results"] }) {
  const pass = results.filter((r) => r.ok).length;
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Test ẩn</span>
        <span className={`pill ${pass === results.length ? "bg-ok-soft text-ok-dark" : "bg-bad-soft text-bad-dark"}`}>
          {pass}/{results.length} pass
        </span>
      </div>
      {results.map((r) => (
        <div key={r.name} className="flex flex-col gap-1">
          <div className="flex min-h-[30px] items-center gap-2.5 text-[13px]">
            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${r.ok ? "bg-ok" : "bg-bad"}`}>
              {r.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">{r.name}</span>
            <span className="font-mono text-[11px] text-muted">{r.ms}ms</span>
          </div>
          {!r.ok && r.error && <pre className="ml-7 whitespace-pre-wrap rounded-md bg-bad-soft px-2.5 py-1.5 font-mono text-[11.5px] text-bad-dark">{r.error}</pre>}
        </div>
      ))}
    </div>
  );
}
