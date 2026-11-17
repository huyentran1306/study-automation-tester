"use client";

import { useState } from "react";
import { AlertTriangle, Check, Circle, Loader2, Minus, X } from "lucide-react";
import type { TraceStep } from "@/lib/pw/host";
import type { LiveTest } from "./use-pw-runner";
import type { PwOutcome } from "@/lib/runner/run";

export function TestStatusList({ tests, out, running }: { tests: LiveTest[]; out: PwOutcome | null; running: boolean }) {
  const res = out?.results ?? [];
  const pass = res.filter((r) => r.ok && !r.skipped).length;
  const fail = res.filter((r) => !r.ok).length;
  const skip = res.filter((r) => r.skipped).length;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold">Kết quả test</span>
        {out ? (
          <span className={`pill ${fail || out.error ? "bg-bad-soft text-bad-dark" : "bg-ok-soft text-ok-dark"}`}>
            {pass} pass{fail ? ` · ${fail} fail` : ""}{skip ? ` · ${skip} skip` : ""} · {(out.ms / 1000).toFixed(1)}s
          </span>
        ) : (
          <span className="pill bg-chip text-muted">{running ? "Đang chạy…" : "Chưa chạy"}</span>
        )}
      </div>
      {out?.violations.map((v) => <div key={v} className="rounded-lg bg-warn-soft px-2.5 py-1.5 text-xs text-warn-dark">Vi phạm luật: {v}</div>)}
      {out?.error && <pre className="whitespace-pre-wrap rounded-lg bg-bad-soft px-2.5 py-2 font-mono text-[11.5px] text-bad-dark">{out.error.name}: {out.error.message}{out.error.line ? `\n  ở dòng ${out.error.line}` : ""}</pre>}
      {tests.length === 0 && !running && !out && <span className="text-xs text-muted">Bấm Chạy để xem từng test pass hay fail.</span>}
      {out && !out.error && out.total === 0 && <span className="text-xs text-warn-dark">Không có test nào. Viết test bằng <code className="code-inline">{"test('tên', async ({ page }) => { ... })"}</code>.</span>}
      {tests.map((t) => {
        const r = res.find((x) => x.name === t.name);
        return (
          <div key={t.name} className="flex flex-col gap-1">
            <div className="flex min-h-[30px] items-center gap-2.5 text-[13px]">
              <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${t.status === "passed" ? "bg-ok text-white" : t.status === "failed" ? "bg-bad text-white" : t.status === "skipped" ? "bg-line text-muted" : "text-brand"}`}>
                {t.status === "passed" ? <Check size={12} strokeWidth={3} /> : t.status === "failed" ? <X size={12} strokeWidth={3} /> : t.status === "skipped" ? <Minus size={12} /> : <Loader2 size={14} className="animate-spin" />}
              </span>
              <span className="min-w-0 flex-1">{t.name}</span>
              {r && <span className="font-mono text-[11px] text-muted">{(r.ms / 1000).toFixed(1)}s</span>}
            </div>
            {r && !r.ok && r.error && <pre className="ml-7 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-bad-soft px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-bad-dark">{r.error}{r.line ? `\n    ở dòng ${r.line}` : ""}</pre>}
          </div>
        );
      })}
    </div>
  );
}

export function TraceView({ steps }: { steps: TraceStep[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!steps.length) return <div className="p-4 text-sm text-muted">Chạy test để xem từng bước: mở trang, click, fill, expect… cùng thời gian của mỗi bước.</div>;
  const max = Math.max(500, ...steps.map((s) => s.ms));
  let lastTest = "";
  return (
    <div className="flex flex-col gap-0.5 overflow-x-auto p-3">
      {steps.map((s) => {
        const head = s.test && s.test !== lastTest ? s.test : null;
        if (head) lastTest = s.test;
        const color = !s.ok ? "#B42318" : s.kind === "warn" ? "#A35B00" : s.kind === "expect" ? "#5B44B8" : s.kind === "context" ? "#8A93A3" : "#2F7D6D";
        return (
          <div key={s.id}>
            {head && <div className="mb-1 mt-2 text-[12px] font-bold text-ink-3 first:mt-0">{head}</div>}
            <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} className="grid w-full min-w-[520px] grid-cols-[18px_minmax(200px,1.6fr)_minmax(120px,1fr)_64px] items-center gap-3 rounded-md px-1.5 py-1 text-left text-[12px] hover:bg-ground">
              {s.kind === "warn" ? <AlertTriangle size={13} color={color} /> : <Circle size={9} fill={color} color={color} className="ml-0.5" />}
              <span className={`truncate font-mono ${s.kind === "step" || s.kind === "hook" ? "font-semibold" : ""} ${s.ok ? "text-ink" : "text-bad-dark"}`}>{s.name}</span>
              <span className="relative h-2 overflow-hidden rounded-full bg-line2"><span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(3, (s.ms / max) * 100)}%`, background: s.ok ? "#9FD0C3" : "#F0A39B" }} /></span>
              <span className="text-right font-mono text-[11px] text-muted">{s.ms}ms</span>
            </button>
            {open === s.id && (
              <div className="mb-1 ml-8 flex flex-col gap-1 rounded-md bg-ground px-3 py-2 font-mono text-[11px] text-ink-3">
                {s.url && <span>URL: {s.url}</span>}
                {s.error && <pre className="whitespace-pre-wrap text-bad-dark">{s.error}</pre>}
                {!s.error && !s.url && <span>Không có chi tiết thêm.</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Kết quả dạng terminal giống `npx playwright test`. */
export function TerminalView({ out, file, logs }: { out: PwOutcome | null; file: string; logs: { level: string; text: string }[] }) {
  if (!out) return <div className="p-4 font-mono text-[12.5px] text-muted">$ npx playwright test {file}</div>;
  const res = out.results;
  return (
    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] text-ink">
      <span className="text-brand">$</span> npx playwright test {file} --project=chromium{"\n"}
      Running {res.length} test{res.length === 1 ? "" : "s"} using 1 worker{"\n"}
      {logs.map((l, i) => <span key={"l" + i} className={l.level === "error" ? "text-bad" : "text-muted"}>{l.text}{"\n"}</span>)}
      {res.map((r, i) => (
        <span key={r.name}>
          {"  "}<span className={r.skipped ? "text-muted" : r.ok ? "text-ok" : "text-bad"}>{r.skipped ? "-" : r.ok ? "✓" : "✘"}</span> {i + 1} [chromium] › {file} › {r.name} <span className="text-muted">({(r.ms / 1000).toFixed(1)}s)</span>{"\n"}
        </span>
      ))}
      {"\n"}
      {res.some((r) => !r.ok) && <span className="text-bad">  {res.filter((r) => !r.ok).length} failed{"\n"}</span>}
      {res.some((r) => r.ok && !r.skipped) && <span className="text-ok">  {res.filter((r) => r.ok && !r.skipped).length} passed</span>}
      {res.some((r) => r.skipped) && <span className="text-muted">{"\n"}  {res.filter((r) => r.skipped).length} skipped</span>}
      <span className="text-muted"> ({(out.ms / 1000).toFixed(1)}s)</span>
    </pre>
  );
}
