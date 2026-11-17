"use client";

import { useState } from "react";
import { Check, Loader2, Minus, Play, RotateCcw, Send, Square, X } from "lucide-react";
import type { Kata } from "@/content/types";
import { CodeEditor } from "@/components/code/editor";
import { BrowserFrame } from "./browser-frame";
import { TestStatusList, TraceView } from "./results";
import { usePwRunner } from "./use-pw-runner";
import type { PwOutcome } from "@/lib/runner/run";

type St = "idle" | "running" | "ok" | "fail";
interface Item {
  label: string;
  st: St;
  detail?: string;
}

function allGreen(o: PwOutcome) {
  const real = o.results.filter((r) => !r.skipped);
  return !o.error && !o.violations.length && real.length > 0 && real.every((r) => r.ok);
}

/** Thử thách Playwright: chạy thử + chấm nhiều lượt (lặp chống flaky, bật bug kiểm tra test có bắt được không). */
export function PwKata({ kata, code, onCode, fontSize, onGraded, onFail }: { kata: Kata; code: string; onCode: (v: string) => void; fontSize: number; onGraded: () => void; onFail?: (o: PwOutcome) => void }) {
  const pw = usePwRunner();
  const [items, setItems] = useState<Item[]>([]);
  const [grading, setGrading] = useState(false);
  const [tab, setTab] = useState<"result" | "trace">("result");
  const files = kata.files ?? {};

  const plan = (): Item[] => [
    { label: (kata.repeat ?? 1) > 1 ? `Xanh ${kata.repeat} lần liên tiếp trên app chuẩn` : "Test chạy xanh trên app chuẩn", st: "idle" },
    ...(kata.isolate ? [{ label: "Mỗi test chạy riêng lẻ vẫn xanh", st: "idle" as St }] : []),
    ...(kata.mutants ?? []).map((m) => ({ label: `Bắt được bug: ${m.label}`, st: "idle" as St })),
  ];

  const set = (i: number, patch: Partial<Item>) => setItems((cur) => cur.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const grade = async () => {
    setGrading(true);
    setTab("result");
    const list = plan();
    setItems(list);
    let ok = true;
    const missing = (kata.require ?? []).filter((r) => !new RegExp(r.pattern).test(code.replace(/\/\/.*$/gm, "")));
    if (missing.length) {
      set(0, { st: "fail", detail: "Yêu cầu của đề: " + missing.map((m) => m.message).join("; ") });
      setGrading(false);
      return;
    }
    set(0, { st: "running" });
    const n = kata.repeat ?? 1;
    let last: PwOutcome | null = null;
    for (let r = 1; r <= n; r++) {
      set(0, { detail: n > 1 ? `Lượt ${r}/${n}` : undefined });
      const o = await pw.run({ code, files, extraTests: kata.tests, forbid: kata.forbid });
      last = o;
      if (!allGreen(o)) {
        ok = false;
        const why = o.violations[0] ?? (o.error ? `${o.error.name}: ${o.error.message}` : o.results.length === 0 ? "Chưa có test nào. Viết test bằng test('…', async ({ page }) => { … })" : `Test đỏ ở lượt ${r}/${n}: ${o.results.find((x) => !x.ok)?.name}`);
        set(0, { st: "fail", detail: why });
        onFail?.(o);
        break;
      }
    }
    if (ok) set(0, { st: "ok", detail: n > 1 ? `${n}/${n} lượt xanh` : undefined });
    const off = kata.isolate ? 2 : 1;
    if (ok && kata.isolate) {
      set(1, { st: "running" });
      // Dùng kết quả trả về trực tiếp (state pw.out trong hàm async là giá trị cũ)
      const names = (last?.results ?? []).filter((r) => !r.skipped).map((r) => r.name);
      const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const name of names) {
        set(1, { detail: `Chạy riêng: ${name}` });
        const o = await pw.run({ code, files, extraTests: kata.tests, grep: new RegExp("^" + esc(name.split(" › ").join(" ")) + "( |$)") });
        if (!allGreen(o)) {
          ok = false;
          set(1, { st: "fail", detail: `“${name}” chạy một mình thì đỏ: test đang phụ thuộc test khác (dữ liệu hoặc biến dùng chung).` });
          break;
        }
      }
      if (ok) set(1, { st: "ok", detail: `${names.length} test, test nào chạy riêng cũng xanh` });
    }
    if (ok) {
      for (let i = 0; i < (kata.mutants ?? []).length; i++) {
        const m = kata.mutants![i];
        set(i + off, { st: "running" });
        const o = await pw.run({ code, files, extraTests: kata.tests, bug: m.bug });
        const caught = !!o.error || o.results.some((x) => !x.ok);
        if (!caught) ok = false;
        set(i + off, { st: caught ? "ok" : "fail", detail: caught ? "Test đỏ khi app có bug, đúng ý" : "App có bug mà test vẫn xanh. Thêm expect kiểm tra đúng chỗ này." });
      }
    }
    setGrading(false);
    if (ok) onGraded();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3 py-2">
          <span className="font-mono text-xs text-muted">tests/{kata.id}.spec.ts</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-ink-3"><input type="checkbox" checked={pw.slowMo > 0} onChange={(e) => pw.setSlowMo(e.target.checked ? 450 : 0)} className="h-3.5 w-3.5 accent-[#2563C9]" />Xem từng bước</label>
            <button type="button" className="btn-ghost min-h-[36px] text-xs" onClick={() => { onCode(kata.starter ?? ""); setItems([]); }} disabled={grading}><RotateCcw size={13} />Làm lại</button>
            {pw.running && !grading ? (
              <button type="button" className="btn-dark min-h-[36px] text-xs" onClick={pw.stop}><Square size={11} fill="currentColor" />Dừng</button>
            ) : (
              <button type="button" className="btn-ghost min-h-[36px] text-xs" onClick={() => { setTab("result"); void pw.run({ code, files }); }} disabled={grading}><Play size={12} fill="currentColor" />Chạy thử</button>
            )}
            <button type="button" className="btn-primary min-h-[36px] text-xs" onClick={grade} disabled={grading || pw.running}>
              {grading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}Nộp bài
            </button>
          </div>
        </div>
        <div className="h-[380px]">
          <CodeEditor value={code} onChange={onCode} path={`file:///kata-pw/${kata.id}.spec.ts`} onRun={() => void pw.run({ code, files })} errorLine={pw.out?.error?.line ?? pw.out?.results.find((r) => !r.ok && r.line)?.line} fontSize={fontSize} />
        </div>
      </div>

      {items.length > 0 && (
        <div className="card flex flex-col gap-2 p-4">
          <span className="text-[13px] font-bold">Chấm bài</span>
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px]">
              <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${it.st === "ok" ? "bg-ok text-white" : it.st === "fail" ? "bg-bad text-white" : it.st === "running" ? "text-brand" : "bg-chip text-muted"}`}>
                {it.st === "ok" ? <Check size={12} strokeWidth={3} /> : it.st === "fail" ? <X size={12} strokeWidth={3} /> : it.st === "running" ? <Loader2 size={14} className="animate-spin" /> : <Minus size={12} />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{it.label}</span>
                {it.detail && <span className={`whitespace-pre-wrap text-xs ${it.st === "fail" ? "text-bad-dark" : "text-muted"}`}>{it.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 2xl:grid-cols-2">
        <BrowserFrame frameRef={pw.frameRef} url={pw.url} height={360} onHome={() => pw.navigate("/login")} />
        <div className="card flex flex-col overflow-hidden">
          <div role="tablist" className="flex gap-1 border-b border-line bg-[#F5F8FC] p-1">
            {([["result", "Kết quả"], ["trace", "Trace"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[30px] rounded-md px-3 text-xs font-semibold ${tab === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>{l}</button>
            ))}
          </div>
          <div className="max-h-[360px] overflow-auto">
            {tab === "result" ? <div className="p-3"><TestStatusList tests={pw.tests} out={pw.out} running={pw.running} /></div> : <TraceView steps={pw.steps} />}
          </div>
        </div>
      </div>
    </div>
  );
}
