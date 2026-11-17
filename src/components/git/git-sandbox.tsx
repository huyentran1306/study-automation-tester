"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileText, GitBranch, RotateCcw } from "lucide-react";
import { graph, run, status, type Repo } from "@/lib/git/sim";
import { buildScenario, SCENARIOS } from "@/lib/git/scenarios";
import type { GitGoal } from "@/content/types";

interface Line {
  kind: "cmd" | "out" | "err";
  text: string;
}

export function GitSandbox({ scenario, goals, onChange, hint }: { scenario: string; goals?: GitGoal[]; onChange?: (r: Repo) => void; hint?: (r: Repo) => string }) {
  const sc = SCENARIOS[scenario] ?? SCENARIOS.blank;
  const [repo, setRepo] = useState<Repo>(() => buildScenario(scenario));
  const [lines, setLines] = useState<Line[]>([{ kind: "out", text: sc.intro + "\nGõ help để xem các lệnh." }]);
  const [cmd, setCmd] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const [editFile, setEditFile] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight });
  }, [lines]);
  useEffect(() => onChange?.(repo), [repo, onChange]);

  const exec = (line: string) => {
    if (!line.trim()) return;
    const res = run(repo, line);
    setRepo(res.repo);
    setHist((h) => [...h, line]);
    setHi(-1);
    if (res.clear) setLines([]);
    else setLines((ls) => [...ls, { kind: "cmd", text: line }, ...(res.out ? [{ kind: res.ok ? "out" : "err", text: res.out } as Line] : [])]);
    setCmd("");
  };

  const reset = () => {
    setRepo(buildScenario(scenario));
    setLines([{ kind: "out", text: sc.intro + "\nGõ help để xem các lệnh." }]);
    setEditFile(null);
  };

  const nodes = useMemo(() => graph(repo), [repo]);
  const st = status(repo);
  const branchCols = useMemo(() => {
    const names = Object.keys(repo.branches);
    return Object.fromEntries(names.map((b, i) => [b, i]));
  }, [repo.branches]);
  const files = Object.keys(repo.work).sort();
  const done = goals?.map((g) => g.check(repo)) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {goals && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3.5">
          <span className="text-[13px] font-bold">Nhiệm vụ · {done.filter(Boolean).length}/{goals.length}</span>
          {goals.map((g, i) => (
            <div key={g.label} className={`flex items-center gap-2 text-[13px] ${done[i] ? "text-ok-dark" : "text-ink-3"}`}>
              {done[i] ? <Check size={16} strokeWidth={2.5} /> : <span className="h-3.5 w-3.5 rounded border-2 border-muted-2" />}
              {g.label}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5 rounded-xl bg-[#F5F8FC] p-3.5">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-[11px] text-muted">Đồ thị commit</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted"><GitBranch size={12} />{repo.inited ? repo.head : "chưa có repo"}</span>
        </div>
        {nodes.length === 0 ? (
          <span className="text-xs text-muted">Chưa có commit nào.</span>
        ) : (
          <div className="flex max-h-[180px] flex-col-reverse gap-2 overflow-auto font-mono text-xs">
            {nodes.map((n) => {
              const owner = n.branches[0] ?? "";
              const col = branchCols[owner] ?? 0;
              return (
                <div key={n.id} className="flex flex-wrap items-center gap-2">
                  <span className={`h-3 w-3 flex-none rounded-full ${n.parent2 ? "bg-warn" : col === 0 ? "bg-ai" : "bg-brand"}`} />
                  <span className="text-muted">{n.id}</span>
                  <span className="min-w-0">{n.msg}</span>
                  {n.branches.map((b) => (
                    <span key={b} className={`rounded-full px-2 py-0.5 font-bold ${b === repo.head ? "bg-brand-soft text-brand-dark" : "bg-ai-tint text-ai-dark"}`}>
                      {b === repo.head ? `HEAD → ${b}` : b}
                    </span>
                  ))}
                  {n.remotes.map((b) => (
                    <span key={"o" + b} className="rounded-full bg-ok-soft px-2 py-0.5 font-bold text-ok-dark">origin/{b}</span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line bg-[#F3F6FA] px-3 py-1.5">
          <span className="font-mono text-xs text-muted">~/so-khach-tests</span>
          <span className="text-[11px] text-muted">Git mô phỏng · không cần cài gì</span>
        </div>
        <div ref={termRef} className="h-[220px] overflow-auto bg-paper px-3.5 py-3 font-mono text-[12.5px] leading-[1.7]" onClick={() => inputRef.current?.focus()}>
          {lines.map((l, i) =>
            l.kind === "cmd" ? (
              <div key={i} className="whitespace-pre-wrap"><span className="text-brand">$</span> {l.text}</div>
            ) : (
              <div key={i} className={`whitespace-pre-wrap ${l.kind === "err" ? "text-bad" : "text-muted"}`}>{l.text}</div>
            ),
          )}
        </div>
        <form
          className="flex items-center gap-2 border-t border-line px-3.5 py-2.5 font-mono text-[13px] text-brand"
          onSubmit={(e) => {
            e.preventDefault();
            exec(cmd);
          }}
        >
          <label htmlFor={`git-cmd-${scenario}`}>$</label>
          <input
            id={`git-cmd-${scenario}`}
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && hist.length) {
                e.preventDefault();
                const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1);
                setHi(n);
                setCmd(hist[n]);
              } else if (e.key === "ArrowDown" && hi >= 0) {
                e.preventDefault();
                const n = hi + 1;
                if (n >= hist.length) { setHi(-1); setCmd(""); } else { setHi(n); setCmd(hist[n]); }
              }
            }}
            placeholder="git status"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none"
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-[13px]" onClick={() => exec(cmd)}>Chạy lệnh (Enter)</button>
        {hint && (
          <button type="button" className="btn-ghost text-[13px]" onClick={() => setLines((ls) => [...ls, { kind: "out", text: "Gợi ý: " + hint(repo) }])}>
            Gợi ý lệnh tiếp theo
          </button>
        )}
        <button type="button" className="btn-ghost text-[13px]" onClick={reset}><RotateCcw size={14} />Làm lại từ đầu</button>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold">Tệp trong thư mục</span>
          <span className="text-[11px] text-muted">
            {st.staged.length} đã add · {st.unstaged.length + st.untracked.length} chưa add{repo.conflicts.length ? ` · ${repo.conflicts.length} conflict` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {files.map((f) => {
            const conflict = repo.conflicts.includes(f);
            const changed = st.unstaged.some((x) => x.file === f) || st.untracked.includes(f);
            const staged = st.staged.some((x) => x.file === f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => { setEditFile(f); setDraft(repo.work[f] ?? ""); }}
                className={`flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 font-mono text-xs ${editFile === f ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white text-ink-3"}`}
              >
                <FileText size={12} />
                {f}
                {conflict ? <span className="text-bad">!</span> : changed ? <span className="text-warn">M</span> : staged ? <span className="text-ok">A</span> : null}
              </button>
            );
          })}
        </div>
        {editFile && (
          <div className="flex flex-col gap-2">
            <label htmlFor="git-edit" className="text-xs text-muted">Sửa {editFile} (giống mở file trong VS Code)</label>
            <textarea id="git-edit" value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} spellCheck={false} className="w-full rounded-lg border border-line bg-paper p-3 font-mono text-[12.5px] leading-relaxed" />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-dark min-h-[34px] text-xs"
                onClick={() => {
                  const r = JSON.parse(JSON.stringify(repo)) as Repo;
                  r.work[editFile] = draft;
                  setRepo(r);
                  setLines((ls) => [...ls, { kind: "out", text: `(đã lưu ${editFile})` }]);
                }}
              >
                Lưu tệp
              </button>
              <button type="button" className="btn-ghost min-h-[34px] text-xs" onClick={() => setEditFile(null)}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
