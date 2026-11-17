"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/progress/store";
import { KATAS } from "@/content";
import { getLesson } from "@/lib/curriculum";
import { KATA_TYPE_LABEL, KATA_TYPE_STYLE } from "@/lib/kata";
import type { KataType } from "@/content/types";

function KataList() {
  const params = useSearchParams();
  const { state } = useApp();
  const [type, setType] = useState<KataType | "all">((params.get("type") as KataType) ?? "all");
  const chapter = params.get("chapter");
  const list = KATAS.filter((k) => (type === "all" || k.type === type) && (!chapter || String(k.chapter) === chapter));
  const pass = KATAS.filter((k) => state.kata[k.id]?.status === "pass").length;
  const open = KATAS.filter((k) => state.kata[k.id]?.status === "open").length;
  const types = (["all", "js", "git", "loc", "flaky", "api", "pom"] as const).filter((t) => t === "all" || KATAS.some((k) => k.type === t) || ["loc", "flaky", "api"].includes(t));

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-6 sm:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Chấm tự động bằng test ẩn · làm lại bao nhiêu lần cũng được</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Thử thách{chapter ? ` · Chương ${chapter}` : ""}</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="pill bg-ok-soft px-3.5 py-2 text-[13px] text-ok-dark">{pass} đã pass</span>
          <span className="pill bg-warn-soft px-3.5 py-2 text-[13px] text-warn-dark">{open} đang làm dở</span>
          <span className="pill border border-line bg-white px-3.5 py-2 text-[13px] text-ink-3">{KATAS.length - pass - open} chưa làm</span>
        </div>
      </header>

      <div role="group" aria-label="Lọc theo loại" className="flex flex-wrap gap-2">
        {types.map((t) => {
          const n = KATAS.filter((k) => t === "all" || k.type === t).length;
          return (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`min-h-[40px] rounded-full border px-4 text-[13px] font-semibold ${type === t ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-3"}`}>
              {t === "all" ? "Tất cả" : KATA_TYPE_LABEL[t]} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">Loại thử thách này mở cùng chương tương ứng (Locator: chương 2, Săn flaky: chương 3, API: chương 6).</div>
      ) : (
        <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((k) => {
            const p = state.kata[k.id];
            const st = p?.status === "pass" ? ["Đã pass", "bg-ok-soft text-ok-dark"] : p ? ["Đang làm", "bg-warn-soft text-warn-dark"] : ["Chưa làm", "bg-chip text-muted"];
            const l = getLesson(k.lesson)!;
            return (
              <Link key={k.id} href={`/kata/${k.id}`} className={`card flex min-h-[168px] flex-col gap-2 p-4 hover:border-brand-ring ${p?.status === "open" ? "border-2 border-brand" : ""}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className={`pill ${KATA_TYPE_STYLE[k.type]}`}>{KATA_TYPE_LABEL[k.type]}</span>
                  <span className={`pill ${st[1]}`}>{st[0]}</span>
                </span>
                <span className="text-[15px] font-bold leading-snug">{k.title}</span>
                <span className="text-xs text-muted">Bài {l.n} · {l.title}</span>
                <span className="mt-auto flex items-center justify-between pt-1.5 text-xs">
                  <span className="flex gap-1" aria-label={`Độ khó ${k.difficulty} trên 3`}>
                    {[1, 2, 3].map((n) => <span key={n} className={`h-2 w-2 rounded-full ${k.difficulty >= n ? "bg-brand" : "bg-line"}`} />)}
                  </span>
                  <span className="font-mono font-bold text-brand-dark">{p?.status === "pass" ? `+${p.xp} XP đã nhận` : `+${k.xp} XP`}</span>
                </span>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default function KataPage() {
  return (
    <Suspense fallback={null}>
      <KataList />
    </Suspense>
  );
}
