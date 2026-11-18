"use client";

import { useCallback, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { CodeEditor } from "./editor";
import { OutputPanel } from "./output";
import { runCode, type RunOutcome } from "@/lib/runner/run";
import { useApp } from "@/lib/progress/store";

/** Khu chạy thử 1 file JS/TS: editor trên, kết quả dưới. */
export function Playground({ code, setCode, initial, fileName = "main.ts", height = 340 }: { code: string; setCode: (v: string) => void; initial: string; fileName?: string; height?: number }) {
  const { recordRun, state } = useApp();
  const [out, setOut] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const res = await runCode({ code });
    setOut(res);
    setRunning(false);
    recordRun();
  }, [code, recordRun]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3 py-1.5">
        <span className="font-mono text-xs text-muted">{fileName}</span>
        <div className="flex gap-1.5">
          <button type="button" className="btn-ghost min-h-[32px] px-2.5 text-xs" onClick={() => { setCode(initial); setOut(null); }} title="Khôi phục code mẫu">
            <RotateCcw size={13} />Code mẫu
          </button>
          <button type="button" className="btn-primary min-h-[32px] px-3 text-xs" onClick={run} disabled={running}>
            <Play size={12} fill="currentColor" />Chạy
          </button>
        </div>
      </div>
      <div style={{ height }}>
        <CodeEditor value={code} onChange={setCode} language={fileName.endsWith(".js") ? "javascript" : "typescript"} path={`file:///lesson/${fileName}`} onRun={run} errorLine={out?.error?.line} fontSize={state.settings.editorFont} />
      </div>
      <div className="max-h-[260px] min-h-[96px] overflow-auto border-t border-line bg-white">
        <OutputPanel out={out} running={running} />
      </div>
    </div>
  );
}
