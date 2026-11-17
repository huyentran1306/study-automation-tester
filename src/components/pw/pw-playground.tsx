"use client";

import { useState } from "react";
import { Play, RotateCcw, Square } from "lucide-react";
import { CodeEditor } from "@/components/code/editor";
import { BrowserFrame } from "./browser-frame";
import { TestStatusList, TraceView } from "./results";
import { usePwRunner } from "./use-pw-runner";
import { useApp } from "@/lib/progress/store";
import { PW_PROJECT } from "@/content/studio-projects";

/** Khu chạy thử Playwright trong trang bài học: editor spec + trình duyệt + kết quả. */
export function PwPlayground({ code, setCode, initial, fileName = "tests/bai.spec.ts" }: { code: string; setCode: (v: string) => void; initial: string; fileName?: string }) {
  const { recordRun, state } = useApp();
  const pw = usePwRunner();
  const [tab, setTab] = useState<"result" | "trace">("result");
  const files = Object.fromEntries(Object.entries(PW_PROJECT).filter(([k]) => !k.endsWith(".spec.ts")));
  const run = async () => {
    setTab("result");
    await pw.run({ code, files });
    recordRun(1);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3 py-1.5">
          <span className="font-mono text-xs text-muted">{fileName}</span>
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 text-[11.5px] text-ink-3" title="Chạy chậm để nhìn rõ từng thao tác">
              <input type="checkbox" checked={pw.slowMo > 0} onChange={(e) => pw.setSlowMo(e.target.checked ? 450 : 0)} className="h-3.5 w-3.5 accent-[#2563C9]" />chậm
            </label>
            <button type="button" className="btn-ghost min-h-[32px] px-2.5 text-xs" onClick={() => setCode(initial)} title="Khôi phục code mẫu"><RotateCcw size={13} />Code mẫu</button>
            {pw.running ? (
              <button type="button" className="btn-dark min-h-[32px] px-3 text-xs" onClick={pw.stop}><Square size={11} fill="currentColor" />Dừng</button>
            ) : (
              <button type="button" className="btn-primary min-h-[32px] px-3 text-xs" onClick={run}><Play size={12} fill="currentColor" />Chạy test</button>
            )}
          </div>
        </div>
        <div className="h-[300px]">
          <CodeEditor value={code} onChange={setCode} path={`file:///lesson-pw/${fileName}`} onRun={run} errorLine={pw.out?.error?.line ?? pw.out?.results.find((r) => !r.ok && r.line)?.line} fontSize={state.settings.editorFont} />
        </div>
      </div>
      <BrowserFrame frameRef={pw.frameRef} url={pw.url} height={300} onHome={() => pw.navigate("/login")} />
      <div className="flex flex-col overflow-hidden rounded-xl border border-line">
        <div role="tablist" className="flex gap-1 border-b border-line bg-[#F5F8FC] p-1">
          {([["result", "Kết quả"], ["trace", "Trace"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[30px] rounded-md px-3 text-xs font-semibold ${tab === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>{l}</button>
          ))}
        </div>
        <div className="max-h-[280px] overflow-auto">
          {tab === "result" ? <div className="p-3"><TestStatusList tests={pw.tests} out={pw.out} running={pw.running} /></div> : <TraceView steps={pw.steps} />}
        </div>
      </div>
    </div>
  );
}
