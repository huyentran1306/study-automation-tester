"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { KATAS } from "@/content";
import { MISSIONS } from "@/lib/pw/locator-lab";
import type { PFState } from "@/lib/progress/state";

const pass = (s: PFState, id: string) => s.kata[id]?.status === "pass";
const done = (s: PFState, id: string) => !!s.lessons[id]?.doneAt;
const frac = (xs: boolean[]) => (xs.length ? xs.filter(Boolean).length / xs.length : 0);

const MILESTONES: { title: string; desc: string; check: (s: PFState, t: string[]) => boolean; href: string }[] = [
  { title: "Khung dự án", desc: "config, .env, cấu trúc thư mục", check: (s) => done(s, "l11") && done(s, "l28") && done(s, "l30"), href: "/learn/l28" },
  { title: "POM + fixture", desc: "BasePage, LoginPage, test.extend", check: (s) => pass(s, "k-l23-pom") && pass(s, "k-l25-fixture"), href: "/kata/k-l23-pom" },
  { title: "Dữ liệu & đăng nhập", desc: "CSV, Faker, storageState", check: (s) => pass(s, "k-l32-csv") && pass(s, "k-l33-ddt") && done(s, "l31"), href: "/kata/k-l32-csv" },
  { title: "API + UI", desc: "request fixture, mock, tạo dữ liệu bằng API", check: (s) => pass(s, "k-l35-crud") && pass(s, "k-l37-mock"), href: "/kata/k-l35-crud" },
  { title: "Báo cáo", desc: "HTML report, Allure, đính kèm", check: (s) => done(s, "l39"), href: "/learn/l39" },
  { title: "CI", desc: "GitHub Actions: push, PR, chạy đêm", check: (s) => pass(s, "k-l40-ci"), href: "/kata/k-l40-ci" },
  { title: "README + demo", desc: "hướng dẫn chạy, video 2 phút", check: (_s, t) => t.includes("readme") && t.includes("video"), href: "#nop-bai" },
];

const SUBMIT = [
  { id: "repo", label: "Repo GitHub công khai, có .gitignore (không lộ .env, .auth)" },
  { id: "readme", label: "README: người lạ đọc là cài và chạy được trong 5 phút" },
  { id: "ci", label: "Workflow CI chạy xanh trên Pull Request gần nhất" },
  { id: "flaky", label: "Chạy toàn bộ 3 lần liên tiếp, không test nào lúc xanh lúc đỏ" },
  { id: "video", label: "Video demo 2 phút: cấu trúc, chạy test, mở report" },
];

export default function Project() {
  const { state, toggleTick, setNote } = useApp();
  const ticks = state.ticks.project ?? [];
  const [repo, setRepo] = useState(state.notes["project:repo"]?.text ?? "");
  const [ci, setCi] = useState({ push: true, pr: true, nightly: true, matrix: true, report: true, secrets: true });

  const ms = MILESTONES.map((m) => m.check(state, ticks));
  const firstOpen = ms.findIndex((x) => !x);

  const byChapter = (ch: number, type?: string) => KATAS.filter((k) => k.chapter === ch && (!type || k.type === type)).map((k) => pass(state, k.id));
  const rubric = [
    { name: "Cấu trúc & POM", max: 20, got: frac(byChapter(4)) * 20, how: "Thử thách chương 4: Page Object, fixture, dự án POM." },
    { name: "Locator bền", max: 15, got: (frac(byChapter(2)) * 0.6 + frac(MISSIONS.map((m) => pass(state, "loc-" + m.id))) * 0.4) * 15, how: "Thử thách chương 2 và nhiệm vụ Locator Lab." },
    { name: "Không flaky", max: 20, got: frac(["k-l19-flaky", "k-l34-isolate", "k-l38-debug"].map((id) => pass(state, id))) * 20, how: "Săn flaky, test độc lập, sửa test hỏng." },
    { name: "Dữ liệu & môi trường", max: 15, got: frac(byChapter(5)) * 15, how: ".env, CSV, data-driven (chương 5)." },
    { name: "API + UI", max: 10, got: frac(byChapter(6)) * 10, how: "CRUD, phân trang, mock và API + UI (chương 6)." },
    { name: "Báo cáo & CI", max: 15, got: (pass(state, "k-l40-ci") ? 10 : 0) + (done(state, "l39") ? 5 : 0), how: "Workflow GitHub Actions và report." },
    { name: "README & nộp bài", max: 5, got: frac(SUBMIT.map((x) => ticks.includes(x.id))) * 5, how: "Checklist nộp bài bên dưới." },
  ];
  const total = Math.round(rubric.reduce((a, r) => a + r.got, 0));

  const yaml = useMemo(() => {
    const gh = (x: string) => "$" + "{{ " + x + " }}";
    const y = ["name: e2e", "on:"];
    if (ci.push) y.push("  push:", "    branches: [main]");
    if (ci.pr) y.push("  pull_request:");
    if (ci.nightly) y.push("  schedule:", "    - cron: '0 19 * * *'   # 2:00 giờ Việt Nam");
    if (!ci.push && !ci.pr && !ci.nightly) y.push("  workflow_dispatch:");
    y.push("jobs:", "  test:", "    runs-on: ubuntu-latest", "    timeout-minutes: 30");
    if (ci.matrix) y.push("    strategy:", "      fail-fast: false", "      matrix:", "        project: [chromium, firefox, webkit]");
    y.push("    steps:", "      - uses: actions/checkout@v4", "      - uses: actions/setup-node@v4", "        with:", "          node-version: 24", "          cache: npm", "      - run: npm ci");
    y.push("      - run: npx playwright install --with-deps" + (ci.matrix ? " " + gh("matrix.project") : ""));
    y.push("      - run: npx playwright test" + (ci.matrix ? " --project=" + gh("matrix.project") : ""));
    if (ci.secrets) y.push("        env:", "          BASE_URL: " + gh("vars.STAGING_URL"), "          ADMIN_EMAIL: " + gh("vars.ADMIN_EMAIL"), "          ADMIN_PASSWORD: " + gh("secrets.ADMIN_PASSWORD"));
    if (ci.report) y.push("      - uses: actions/upload-artifact@v4", "        if: " + gh("!cancelled()"), "        with:", "          name: report" + (ci.matrix ? "-" + gh("matrix.project") : ""), "          path: playwright-report/", "          retention-days: 14");
    return y.join("\n");
  }, [ci]);

  const TREE: [string, number][] = [
    ["playwright.config.ts", 0], [".env.example", 0], ["fixtures/", 1], ["pages/", 1], ["test-data/", 2], ["tests/auth.setup.ts", 2], ["api/", 3], ["tests/api/", 3], ["playwright-report/ (bỏ qua)", 4], [".github/workflows/e2e.yml", 5], ["README.md", 6],
  ];

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-6 sm:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[72ch] flex-col gap-1.5">
          <span className="text-[13px] text-muted">Tuần 15–16 · làm dần từ tuần 9, mỗi chương góp một mảnh</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Dự án cuối khóa: framework kiểm thử Sổ Khách</h1>
          <p className="text-sm leading-relaxed text-ink-3">Kết quả là một repo GitHub công khai: POM, fixture, đa môi trường, dữ liệu ngoài, test API + UI, báo cáo và CI chạy mỗi đêm. Dùng làm portfolio khi đi xin việc.</p>
        </div>
        <div className="card flex flex-col items-center px-5 py-3">
          <span className="font-mono text-3xl font-bold">{total}</span>
          <span className="text-xs text-muted">/ 100 điểm tạm tính</span>
        </div>
      </header>

      <section aria-label="Các mốc" className="card flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold">7 mốc</h2>
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {MILESTONES.map((m, i) => {
            const st = ms[i] ? "done" : i === firstOpen ? "now" : "next";
            return (
              <li key={m.title}>
                <Link href={m.href} className={`flex h-full flex-col gap-1.5 rounded-xl border p-3.5 ${st === "now" ? "border-2 border-brand bg-brand-tint" : st === "done" ? "border-ok-edge bg-[#F1F8F5]" : "border-line2 bg-white hover:border-brand-ring"}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${st === "done" ? "bg-ok text-white" : st === "now" ? "bg-brand text-white" : "bg-chip text-muted"}`}>{st === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                  <span className="text-[13px] font-bold leading-snug">{m.title}</span>
                  <span className="text-[11.5px] leading-snug text-muted">{m.desc}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-label="Tiêu chí chấm" className="card flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between"><h2 className="text-base font-bold">Tiêu chí chấm · 100 điểm</h2><span className="font-mono text-[13px] text-muted">tạm tính {total}</span></div>
          {rubric.map((r) => (
            <div key={r.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-[13px]"><span className="font-semibold">{r.name}</span><span className="font-mono text-ink-3">{Math.round(r.got)} / {r.max}</span></div>
              <div className="h-[7px] overflow-hidden rounded-full bg-line2"><div className="h-full rounded-full bg-brand" style={{ width: `${(r.got / r.max) * 100}%` }} /></div>
              <span className="text-xs text-muted">{r.how}</span>
            </div>
          ))}
        </section>

        <section aria-label="Cấu trúc thư mục" className="card flex flex-col gap-3 p-5">
          <h2 className="text-base font-bold">Cấu trúc chuẩn</h2>
          <div className="flex flex-col gap-1 rounded-[10px] border border-line2 bg-paper p-3.5 font-mono text-[12.5px]">
            <span className="font-bold">so-khach-tests/</span>
            {TREE.map(([f, m]) => (
              <span key={f} className="flex items-center gap-2 pl-3">
                <span className={ms[m] ? "text-ok" : m === firstOpen ? "text-warn" : "text-muted-2"}>{ms[m] ? "✓" : m === firstOpen ? "…" : "○"}</span>{f}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted">✓ đã học xong phần đó · … đang làm · ○ chưa tới</span>
          <label htmlFor="repo" className="mt-1 text-[13px] font-semibold">Link repo GitHub của bạn</label>
          <div className="flex gap-2">
            <input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} onBlur={() => setNote("project:repo", repo.trim())} placeholder="https://github.com/ten-ban/so-khach-tests" className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-line px-3 font-mono text-[13px]" />
            {/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(repo) && <a href={repo} target="_blank" rel="noreferrer" className="btn-ghost min-h-[40px] px-3" aria-label="Mở repo"><ExternalLink size={14} /></a>}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-label="Tạo workflow GitHub Actions" className="card flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-bold">Tạo tệp CI GitHub Actions</h2><span className="font-mono text-xs text-muted">.github/workflows/e2e.yml</span></div>
          <div role="group" aria-label="Tùy chọn CI" className="flex flex-wrap gap-2">
            {([["push", "Chạy khi push"], ["pr", "Chạy khi mở PR"], ["nightly", "Chạy mỗi đêm 2:00"], ["matrix", "3 trình duyệt"], ["secrets", "Dùng secrets"], ["report", "Lưu báo cáo"]] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={ci[k]} onClick={() => setCi({ ...ci, [k]: !ci[k] })} className={`min-h-[36px] rounded-full border px-3 text-[12.5px] font-semibold ${ci[k] ? "border-brand-ring bg-brand-soft text-brand-dark" : "border-line bg-white text-muted"}`}>{ci[k] ? "✓ " : ""}{l}</button>
            ))}
          </div>
          <pre className="max-h-[420px] overflow-auto rounded-[10px] border border-line2 bg-paper p-3.5 font-mono text-[12.5px] leading-relaxed">{yaml}</pre>
          <button type="button" className="btn-dark self-start text-[13px]" onClick={() => navigator.clipboard?.writeText(yaml).catch(() => {})}><Copy size={14} />Sao chép YAML</button>
        </section>

        <section id="nop-bai" aria-label="Checklist nộp bài" className="card flex scroll-mt-6 flex-col gap-2.5 p-5">
          <h2 className="text-base font-bold">Checklist nộp bài</h2>
          {SUBMIT.map((x) => {
            const on = ticks.includes(x.id);
            return (
              <button key={x.id} type="button" aria-pressed={on} onClick={() => toggleTick("project", x.id)} className={`flex min-h-[48px] items-center gap-3 rounded-[10px] border px-3 py-2 text-left text-[13.5px] ${on ? "border-ok-edge bg-[#F1F8F5]" : "border-line2 hover:border-brand-ring"}`}>
                <span className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md ${on ? "bg-ok text-white" : "border-2 border-muted-2"}`}>{on && <Check size={14} strokeWidth={3} />}</span>
                {x.label}
              </button>
            );
          })}
          <p className="text-xs text-muted">Mốc 7 hoàn thành khi tick README và video demo.</p>
        </section>
      </div>
    </div>
  );
}
