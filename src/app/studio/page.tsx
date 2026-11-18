"use client";

import { useCallback, useEffect, useState } from "react";
import { FilePlus2, FileCode2, Play, RotateCcw, Trash2, Pencil, Square, Settings2 } from "lucide-react";
import { CodeEditor } from "@/components/code/editor";
import { OutputPanel } from "@/components/code/output";
import { runCode, type RunOutcome, type PwOutcome } from "@/lib/runner/run";
import { useApp } from "@/lib/progress/store";
import { usePwRunner } from "@/components/pw/use-pw-runner";
import { BrowserFrame } from "@/components/pw/browser-frame";
import { TerminalView, TestStatusList, TraceView } from "@/components/pw/results";
import { JS_PROJECT, PW_PROJECT } from "@/content/studio-projects";

type Mode = "js" | "pw";

interface Project {
  files: Record<string, string>;
  active: string;
  entry: string;
}

const KEY: Record<Mode, string> = { js: "pf-studio:v1", pw: "pf-studio-pw:v1" };
const DEFAULTS: Record<Mode, Project> = {
  js: { files: JS_PROJECT, active: "main.ts", entry: "main.ts" },
  pw: { files: PW_PROJECT, active: "tests/login.spec.ts", entry: "tests/login.spec.ts" },
};

function load(mode: Mode): Project {
  try {
    const raw = localStorage.getItem(KEY[mode]);
    if (raw) {
      const p = JSON.parse(raw) as Project;
      if (p.files && Object.keys(p.files).length) return p;
    }
  } catch {
    /* bỏ qua */
  }
  return { ...DEFAULTS[mode], files: { ...DEFAULTS[mode].files } };
}

const VALID = /^[A-Za-z0-9_\-./]+\.(ts|js|json|csv|env|example|txt)$|^\.env(\.[a-z]+)?$/;

export default function Studio() {
  const { recordRun, state } = useApp();
  const [mode, setMode] = useState<Mode>("pw");
  const [p, setP] = useState<Project>(DEFAULTS.pw);
  const [out, setOut] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const [grep, setGrep] = useState("");
  const [bottom, setBottom] = useState<"trace" | "term" | "console">("trace");
  const [lastFile, setLastFile] = useState("");
  // Kết quả "Chạy tất cả spec": mỗi file một dòng tổng hợp (pw.out chỉ giữ lượt cuối)
  const [allRun, setAllRun] = useState<{ file: string; pass: number; fail: number; skip: number; error: boolean }[] | null>(null);
  const pw = usePwRunner();

  const [ready, setReady] = useState(false);
  useEffect(() => {
    let m: Mode = "pw";
    try {
      m = (localStorage.getItem("pf-studio-mode") as Mode) || "pw";
    } catch {
      /* bỏ qua */
    }
    setMode(m);
    setP(load(m));
    setReady(true);
  }, []);
  useEffect(() => {
    // Chỉ lưu sau khi đã đọc dự án từ máy (tránh ghi đè bằng dự án mặc định lúc vừa mở trang)
    if (!ready) return;
    try {
      localStorage.setItem(KEY[mode], JSON.stringify(p));
      localStorage.setItem("pf-studio-mode", mode);
    } catch {
      /* bỏ qua */
    }
  }, [p, mode, ready]);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setP(load(m));
    setOut(null);
  };

  const specs = Object.keys(p.files).filter((f) => /\.spec\.(ts|js)$/.test(f)).sort();

  const runJs = useCallback(async () => {
    setRunning(true);
    const others = Object.fromEntries(Object.entries(p.files).filter(([k]) => k !== p.entry));
    const res = await runCode({ code: p.files[p.entry] ?? "", files: others });
    setOut(res);
    setRunning(false);
    recordRun();
  }, [p, recordRun]);

  const runPw = useCallback(
    async (file?: string) => {
      const target = file ?? (/\.spec\.(ts|js)$/.test(p.active) ? p.active : p.entry);
      if (!p.files[target]) return;
      setLastFile(target);
      const others = Object.fromEntries(Object.entries(p.files).filter(([k]) => k !== target));
      let re: RegExp | undefined;
      try {
        re = grep.trim() ? new RegExp(grep.trim()) : undefined;
      } catch {
        setMsg("Biểu thức --grep không hợp lệ");
        return;
      }
      setMsg("");
      if (!file) setAllRun(null);
      const res = await pw.run({ code: p.files[target], files: others, grep: re });
      recordRun(2);
      return res;
    },
    [p, grep, pw, recordRun],
  );

  const run = mode === "js" ? runJs : () => runPw();

  const addFile = () => {
    const name = window.prompt("Tên tệp mới (ví dụ: tests/cart.spec.ts)", mode === "pw" ? "tests/new.spec.ts" : "src/utils.ts")?.trim();
    if (!name) return;
    if (!VALID.test(name)) return setMsg("Tên tệp chỉ gồm chữ, số, - _ . / và kết thúc bằng .ts hoặc .js");
    if (p.files[name] !== undefined) return setMsg("Đã có tệp này");
    const body = /\.spec\.ts$/.test(name) ? "import { test, expect } from '@playwright/test';\n\ntest('tên test', async ({ page }) => {\n  await page.goto('/login');\n});\n" : "export {};\n";
    setP({ ...p, files: { ...p.files, [name]: body }, active: name });
    setMsg("");
  };
  const renameFile = (f: string) => {
    const name = window.prompt("Đổi tên tệp", f)?.trim();
    if (!name || name === f) return;
    if (!VALID.test(name)) return setMsg("Tên tệp chỉ gồm chữ, số, - _ . / và kết thúc bằng .ts hoặc .js");
    if (p.files[name] !== undefined) return setMsg("Đã có tệp này");
    const files = Object.fromEntries(Object.entries(p.files).map(([k, v]) => [k === f ? name : k, v]));
    setP({ files, active: p.active === f ? name : p.active, entry: p.entry === f ? name : p.entry });
  };
  const removeFile = (f: string) => {
    if (Object.keys(p.files).length <= 1) return;
    if (!window.confirm(`Xóa ${f}?`)) return;
    const files = { ...p.files };
    delete files[f];
    const first = Object.keys(files)[0];
    setP({ files, active: p.active === f ? first : p.active, entry: p.entry === f ? first : p.entry });
  };

  const names = Object.keys(p.files).sort((a, b) => (a.includes("/") === b.includes("/") ? a.localeCompare(b) : a.includes("/") ? -1 : 1));
  const busy = mode === "js" ? running : pw.running;
  const errLine = mode === "js" ? (p.active === p.entry ? out?.error?.line : null) : pw.out && lastFile === p.active ? pw.out.error?.line ?? pw.out.results.find((r) => !r.ok && r.line)?.line : null;

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex flex-col">
            <span className="font-display text-base font-extrabold">Xưởng Code</span>
            <span className="text-xs text-muted">{mode === "pw" ? "so-khach-tests · Playwright chạy ngay trên trình duyệt" : "Dự án JS/TS"} · lưu trên máy này</span>
          </span>
          <div role="group" aria-label="Chế độ" className="flex rounded-[10px] bg-chip p-[3px]">
            {(["pw", "js"] as Mode[]).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)} className={`min-h-[34px] rounded-lg px-3 text-[12.5px] font-semibold ${mode === m ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                {m === "pw" ? "Playwright" : "JS / TS"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "pw" ? (
            <>
              <label htmlFor="grep" className="flex items-center gap-1.5 font-mono text-[12.5px] text-ink-3">--grep
                <input id="grep" value={grep} onChange={(e) => setGrep(e.target.value)} placeholder="@smoke" className="w-24 rounded-lg border border-line px-2 py-1.5" />
              </label>
              <label className="flex items-center gap-1.5 text-[12.5px] text-ink-3" title="Chạy chậm để nhìn rõ từng thao tác">
                <input type="checkbox" checked={pw.slowMo > 0} onChange={(e) => pw.setSlowMo(e.target.checked ? 450 : 0)} className="h-4 w-4 accent-[#2563C9]" />
                Xem từng bước
              </label>
              {specs.length > 1 && (
                <button type="button" className="btn-ghost min-h-[40px] text-[13px]" disabled={busy} onClick={async () => {
                  const rows: { file: string; pass: number; fail: number; skip: number; error: boolean }[] = [];
                  setAllRun([]);
                  for (const f of specs) {
                    const r = await runPw(f);
                    if (!r) continue;
                    rows.push({ file: f, pass: r.results.filter((x) => x.ok && !x.skipped).length, fail: r.results.filter((x) => !x.ok).length, skip: r.results.filter((x) => x.skipped).length, error: !!r.error });
                    setAllRun([...rows]);
                  }
                }}>
                  Chạy tất cả spec
                </button>
              )}
            </>
          ) : (
            <label htmlFor="entry" className="flex items-center gap-1.5 text-[13px] text-ink-3">
              Chạy tệp
              <select id="entry" value={p.entry} onChange={(e) => setP({ ...p, entry: e.target.value })} className="min-h-[36px] rounded-lg border border-line bg-white px-2 font-mono text-[13px]">
                {names.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="btn-ghost min-h-[40px] text-[13px]" onClick={() => { if (window.confirm("Khôi phục dự án mẫu? Code hiện tại sẽ mất.")) setP({ ...DEFAULTS[mode], files: { ...DEFAULTS[mode].files } }); }}>
            <RotateCcw size={14} />Dự án mẫu
          </button>
          {busy && mode === "pw" ? (
            <button type="button" className="btn-dark min-h-[40px]" onClick={pw.stop}><Square size={12} fill="currentColor" />Dừng</button>
          ) : (
            <button type="button" className="btn-primary min-h-[40px]" onClick={run} disabled={busy}>
              <Play size={13} fill="currentColor" />{mode === "pw" ? `Chạy ${/\.spec\./.test(p.active) ? p.active.split("/").pop() : "test"}` : "Chạy"} (Ctrl Enter)
            </button>
          )}
        </div>
      </div>
      {msg && <div className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn-dark" role="alert">{msg}</div>}

      <div className="flex flex-col gap-3 xl:flex-row">
        <nav aria-label="Cây thư mục" className="card flex flex-col gap-0.5 p-2 font-mono text-[12.5px] xl:w-[220px] xl:flex-none">
          <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
            <span className="eyebrow font-sans text-[11px] text-muted">Tệp</span>
            <button type="button" onClick={addFile} className="rounded-md p-1.5 text-brand hover:bg-brand-soft" aria-label="Tạo tệp mới"><FilePlus2 size={15} /></button>
          </div>
          {names.map((f) => (
            <div key={f} className={`group flex items-center rounded-md ${p.active === f ? "bg-brand-soft text-brand-dark" : "hover:bg-ground"}`}>
              <button type="button" onClick={() => setP({ ...p, active: f })} className="flex min-h-[32px] min-w-0 flex-1 items-center gap-1.5 px-2 text-left">
                {/config/.test(f) ? <Settings2 size={13} className="flex-none text-warn" /> : <FileCode2 size={13} className="flex-none text-ai" />}
                <span className={`truncate ${p.active === f ? "font-bold" : ""}`}>{f}</span>
                {mode === "js" && p.entry === f && <span className="ml-auto flex-none rounded bg-ok-soft px-1 text-[10px] font-bold text-ok-dark">chạy</span>}
              </button>
              <button type="button" onClick={() => renameFile(f)} className="hidden p-1 text-muted hover:text-brand group-hover:block" aria-label={`Đổi tên ${f}`}><Pencil size={12} /></button>
              <button type="button" onClick={() => removeFile(f)} className="hidden p-1 pr-2 text-muted hover:text-bad group-hover:block" aria-label={`Xóa ${f}`}><Trash2 size={12} /></button>
            </div>
          ))}
          {mode === "pw" && <p className="mt-2 px-2 font-sans text-[11px] leading-relaxed text-muted">Tệp *.spec.ts là file test. Mở một spec rồi bấm Chạy. Các tệp khác được import qua lại như dự án thật. Dự án mẫu có 1 test cố ý fail trong login.spec.ts để bạn tập sửa.</p>}
        </nav>

        <section className="card flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex gap-0.5 overflow-x-auto border-b border-line bg-[#F5F8FC] px-1.5 pt-1.5">
            <span className="whitespace-nowrap rounded-t-[9px] border border-b-0 border-line bg-white px-3.5 py-2 font-mono text-[12.5px] font-semibold">{p.active}</span>
          </div>
          <div className="h-[calc(100vh-430px)] min-h-[380px]">
            <CodeEditor
              value={p.files[p.active] ?? ""}
              onChange={(v) => setP((cur) => ({ ...cur, files: { ...cur.files, [cur.active]: v } }))}
              path={`file:///studio-${mode}/${p.active}`}
              language={/\.json$/.test(p.active) ? "json" : /\.ts$/.test(p.active) ? "typescript" : /\.js$/.test(p.active) ? "javascript" : "plaintext"}
              onRun={run}
              errorLine={errLine}
              fontSize={state.settings.editorFont}
            />
          </div>
        </section>

        {mode === "pw" ? (
          <section aria-label="Trình duyệt và kết quả" className="flex flex-col gap-3 xl:w-[460px] xl:flex-none">
            <BrowserFrame frameRef={pw.frameRef} url={pw.url} height={340} onHome={() => pw.navigate("/login")} />
            <div className="card max-h-[300px] overflow-auto p-3.5">
              {allRun && (
                <div className="mb-3 flex flex-col gap-1 border-b border-line2 pb-3">
                  <span className="text-[13px] font-bold">Chạy tất cả spec</span>
                  {allRun.map((r) => (
                    <button key={r.file} type="button" onClick={() => setP({ ...p, active: r.file })} className="flex min-h-[28px] items-center justify-between gap-2 rounded-md px-1.5 text-left font-mono text-[12px] hover:bg-ground">
                      <span className="truncate">{r.file}</span>
                      <span className={`flex-none font-sans text-[11.5px] font-semibold ${r.fail || r.error ? "text-bad-dark" : "text-ok-dark"}`}>{r.error ? "lỗi" : `${r.pass} pass${r.fail ? ` · ${r.fail} fail` : ""}${r.skip ? ` · ${r.skip} skip` : ""}`}</span>
                    </button>
                  ))}
                  {pw.running && <span className="px-1.5 text-[11.5px] text-muted">Đang chạy {lastFile}…</span>}
                </div>
              )}
              <TestStatusList tests={pw.tests} out={pw.out} running={pw.running} file={lastFile} stale={!!lastFile && !pw.running && lastFile !== p.active && /\.spec\./.test(p.active)} />
            </div>
          </section>
        ) : (
          <section aria-label="Kết quả" className="card flex flex-col overflow-hidden xl:w-[380px] xl:flex-none">
            <div className="border-b border-line bg-[#F5F8FC] px-3.5 py-2 text-[13px] font-bold">Console</div>
            <div className="min-h-[200px] flex-1 overflow-auto">
              <OutputPanel out={out} running={running} />
            </div>
          </section>
        )}
      </div>

      {mode === "pw" && (
        <section aria-label="Bảng dưới" className="card overflow-hidden">
          <div role="tablist" aria-label="Bảng dưới" className="flex flex-wrap gap-1 border-b border-line bg-[#F5F8FC] p-1.5">
            {([["trace", "Trace từng bước"], ["term", "Terminal"], ["console", `Console (${pw.logs.length})`]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={bottom === k} onClick={() => setBottom(k)} className={`min-h-[34px] rounded-lg px-3 text-[12.5px] font-semibold ${bottom === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="max-h-[320px] overflow-auto">
            {bottom === "trace" && <TraceView steps={pw.steps} />}
            {bottom === "term" && <TerminalView out={pw.out as PwOutcome | null} file={lastFile} logs={pw.logs} />}
            {bottom === "console" && (
              <div className="p-3 font-mono text-[12.5px]">
                {pw.logs.length ? pw.logs.map((l, i) => <div key={i} className={`whitespace-pre-wrap border-b border-line2 py-0.5 ${l.level === "error" ? "text-bad" : l.level === "warn" ? "text-warn" : ""}`}>{l.text}</div>) : <span className="text-muted">console.log trong test hiện ở đây.</span>}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
