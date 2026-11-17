"use client";

import Link from "next/link";
import { Check, Flag } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import {
  CHAPTERS,
  COURSE_START,
  LESSONS,
  TOTAL_LESSONS,
  addDays,
  currentSession,
  currentWeek,
  diffDays,
  fmtDateVi,
  lessonAtSession,
  milestoneSession,
  sessionDate,
  sessionWeek,
  weekdayOf,
} from "@/lib/curriculum";
import { getLessonContent, katasOfLesson } from "@/content";
import type { PFState } from "@/lib/progress/state";

function nextLesson(s: PFState) {
  return LESSONS.find((l) => !s.lessons[l.id]?.doneAt) ?? LESSONS[LESSONS.length - 1];
}

export default function Home() {
  const { state, today, user, toggleTick, ready } = useApp();
  const start = state.startDate ?? COURSE_START;
  const week = currentWeek(today, start);
  const sess = currentSession(today, start);
  const lesson = nextLesson(state);
  const content = getLessonContent(lesson.id);
  const lp = state.lessons[lesson.id];
  const totalSec = content?.sections.length ?? 0;
  const doneSec = lp?.sections.length ?? 0;
  const pct = totalSec ? Math.round((doneSec / totalSec) * 100) : 0;
  const nextSection = content?.sections.find((s) => !lp?.sections.includes(s.id));
  const minutesLeft = content?.sections.filter((s) => !lp?.sections.includes(s.id)).reduce((a, s) => a + s.minutes, 0) ?? 0;

  const dueCards = Object.values(state.cards).filter((c) => c.due <= today).length;
  const lessonsDone = Object.values(state.lessons).filter((l) => l.doneAt).length;
  const kataPass = Object.values(state.kata).filter((k) => k.status === "pass").length;
  const kataOpen = Object.values(state.kata).filter((k) => k.status === "open").length;
  const runs7 = Array.from({ length: 7 }, (_, i) => state.days[addDays(today, -i)]?.runs ?? 0).reduce((a, b) => a + b, 0);

  const wd = weekdayOf(today);
  const classDay = (wd === 1 || wd === 3 || wd === 5) && diffDays(today, start) >= 0 && week <= 16;
  const beforeStart = diffDays(today, start) < 0;
  const kata = katasOfLesson(lesson.id).find((k) => state.kata[k.id]?.status !== "pass");
  const ticks = state.ticks[today] ?? [];

  const tasks = [
    { id: "read", title: `Đọc bài ${lesson.n}${nextSection ? `, phần “${nextSection.title}”` : ""}`, meta: content ? `${minutesLeft || 0} phút · trước 19:00` : "Nội dung mở trước buổi học", done: !!lp?.doneAt, href: `/learn/${lesson.id}`, manual: false },
    beforeStart
      ? { id: "start", title: `Khai giảng ${fmtDateVi(start)}, 19:00`, meta: `Còn ${diffDays(start, today)} ngày · học trước chương 1 cho quen`, done: ticks.includes("start"), manual: true }
      : classDay
        ? { id: "class", title: "Vào lớp online 19:00–21:30", meta: "Lịch lớp T2 / T4 / T6", done: ticks.includes("class"), manual: true }
        : { id: "rest", title: "Hôm nay không có lớp", meta: "Làm thêm thử thách hoặc ôn bài cũ", done: ticks.includes("rest"), manual: true },
    kata
      ? { id: "kata", title: `Thử thách: “${kata.title}”`, meta: `${kata.difficulty * 10 + 10} phút · +${kata.xp} XP`, done: false, href: `/kata/${kata.id}`, manual: false }
      : { id: "kata", title: "Thử thách của bài đã xong hết", meta: "Xem kho thử thách", done: true, href: "/kata", manual: false },
    { id: "review", title: dueCards ? `Ôn ${dueCards} thẻ đến hạn` : "Không còn thẻ đến hạn", meta: Object.keys(state.cards).length ? "5 phút · lặp lại ngắt quãng" : "Học xong bài đầu tiên để mở thẻ ôn", done: dueCards === 0 && Object.keys(state.cards).length > 0, href: "/review", manual: false },
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  // Lịch học dạng ô màu 16 tuần từ ngày khai giảng
  const heat = Array.from({ length: 16 * 7 }, (_, i) => {
    const d = addDays(start, i);
    const x = state.days[d];
    const v = x ? x.act + x.rev + x.runs : 0;
    const lv = v === 0 ? 0 : v < 4 ? 1 : v < 10 ? 2 : 3;
    const dow = i % 7;
    return { d, lv, cls: dow === 0 || dow === 2 || dow === 4, today: d === today, future: d > today };
  });
  const COLORS = ["#EBEFF5", "#B9DCD1", "#6FAF9C", "#2F7D6D"];

  // Lịch tuần này
  const weekNo = Math.max(1, week);
  const weekSessions = [0, 1, 2].map((i) => (weekNo - 1) * 3 + i + 1).filter((k) => k <= 48);

  const upcoming = CHAPTERS.map((c) => ({ c, k: milestoneSession(c.n) }))
    .filter(({ k }) => k >= Math.max(1, sess))
    .slice(0, 3);

  const name = user?.display_name || user?.username;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-6 sm:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">
            {fmtDateVi(today)} · {beforeStart ? `Còn ${diffDays(start, today)} ngày tới khai giảng` : `Tuần ${week} / 16${sess ? ` · buổi ${sess}` : ""}`}
          </span>
          <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
            {name ? `Chào ${name}` : "Chào bạn"}
            {classDay ? ", tối nay có lớp lúc 19:00" : beforeStart ? ", sẵn sàng cho khóa Playwright?" : ""}
          </h1>
        </div>
        {!user && ready && <span className="pill bg-ai-tint text-ai-dark">Đang học thử · tiến độ chỉ lưu trên máy này</span>}
      </header>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-brand-edge bg-brand-tint p-6 lg:col-span-2">
          <svg width="260" height="260" viewBox="0 0 260 260" aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24">
            <circle cx="130" cy="130" r="128" fill="none" stroke="#D4E4FA" strokeWidth="2" />
            <circle cx="130" cy="130" r="92" fill="none" stroke="#E1EAF8" strokeWidth="2" />
            <circle cx="130" cy="130" r="56" fill="#DCEAFC" />
          </svg>
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex max-w-[60ch] flex-col gap-1.5">
              <span className="eyebrow text-brand">
                {lp?.sections.length ? "Học tiếp" : "Bài tiếp theo"} · Chương {lesson.chapter} · Bài {lesson.n} / {TOTAL_LESSONS}
              </span>
              <h2 className="font-display text-2xl font-bold leading-snug sm:text-[28px]">{lesson.title}</h2>
              <p className="text-sm text-muted">{content?.summary ?? "Nội dung bài này sẽ mở trước buổi học trên lớp."}</p>
            </div>
            {content && (
              <div className="flex flex-col items-center rounded-xl border border-brand-edge bg-white px-3.5 py-2.5">
                <span className="font-mono text-[26px] font-bold">{pct}%</span>
                <span className="text-[11px] text-muted">bài này</span>
              </div>
            )}
          </div>
          {content && (
            <div className="relative flex gap-1.5" aria-label={`Đã đọc ${doneSec} trên ${totalSec} phần`}>
              {content.sections.map((s) => (
                <span key={s.id} className={`h-1.5 flex-1 rounded-full ${lp?.sections.includes(s.id) ? "bg-ok" : s.id === nextSection?.id ? "bg-brand" : "bg-[#DCE7F5]"}`} />
              ))}
            </div>
          )}
          <div className="relative flex flex-wrap gap-2.5">
            <Link href={`/learn/${lesson.id}${nextSection ? `#${nextSection.id}` : ""}`} className="btn-primary min-h-[44px] px-5">
              {nextSection && doneSec ? `Học tiếp: ${nextSection.title}` : "Bắt đầu học"}
            </Link>
            <Link href="/studio" className="btn-ghost min-h-[44px]">Mở Xưởng Code</Link>
            <Link href="/roadmap" className="btn min-h-[44px] text-muted hover:text-brand">Xem lộ trình</Link>
          </div>
        </article>

        <article className="card flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">Kế hoạch hôm nay</h2>
            <span className="font-mono text-[13px] text-muted">{doneCount}/{tasks.length}</span>
          </div>
          {tasks.map((t) => {
            const inner = (
              <>
                <span className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md ${t.done ? "bg-ok text-white" : "border-2 border-muted-2"}`}>
                  {t.done && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                  <span className={`text-sm font-semibold ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                  <span className="text-xs text-muted">{t.meta}</span>
                </span>
              </>
            );
            const cls = `flex min-h-[52px] w-full items-center gap-3 rounded-[10px] border px-2.5 py-2 ${t.done ? "border-ok-edge bg-[#F1F8F5]" : "border-line2 bg-white hover:border-brand-ring"}`;
            return t.manual ? (
              <button key={t.id} type="button" className={cls} onClick={() => toggleTick(today, t.id)} aria-pressed={t.done}>{inner}</button>
            ) : (
              <Link key={t.id} href={t.href!} className={cls}>{inner}</Link>
            );
          })}
        </article>
      </section>

      <section aria-label="Chỉ số" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Bài đã xong" value={<>{lessonsDone}<span className="text-base text-muted"> / {TOTAL_LESSONS}</span></>} note={sess && lessonsDone >= Math.min(sess, TOTAL_LESSONS) - 1 ? "Đúng tiến độ lớp" : sess ? `Lớp đang ở buổi ${sess}` : "Học trước được"} good={!!sess && lessonsDone >= Math.min(sess, TOTAL_LESSONS) - 1} />
        <Stat label="Thử thách đã pass" value={kataPass} note={kataOpen ? `${kataOpen} thử thách đang làm dở` : "Mỗi bài có 2 thử thách"} />
        <Stat label="Lượt chạy code 7 ngày" value={runs7} note="Càng chạy nhiều càng nhớ lâu" />
        <Stat label="Thẻ đến hạn" value={dueCards} note={<Link href="/review" className="font-semibold text-brand">Ôn ngay (5 phút)</Link>} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-bold">Tiến độ 7 chương</h2>
            <Link href="/roadmap" className="text-[13px] font-semibold text-brand">Lộ trình chi tiết</Link>
          </div>
          {CHAPTERS.map((c) => {
            const done = c.lessons.filter((l) => state.lessons[l.id]?.doneAt).length;
            const active = c.n === lesson.chapter;
            return (
              <div key={c.n} className="grid grid-cols-[28px_minmax(0,1fr)_54px] items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[13px] font-bold ${active ? "bg-brand text-white" : "bg-chip text-muted"}`}>{c.n}</span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line2">
                    <div className={`h-full ${active ? "bg-brand" : "bg-ok"}`} style={{ width: `${(done / c.lessons.length) * 100}%` }} />
                  </div>
                </div>
                <span className="text-right font-mono text-xs text-muted">{done}/{c.lessons.length}</span>
              </div>
            );
          })}
        </article>

        <article className="card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-bold">Nhịp học 16 tuần</h2>
            <span className="text-xs text-muted">Mỗi ô 1 ngày, từ {fmtDateVi(start, false)}</span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid w-max grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: "26px repeat(16, 18px)" }}>
              {["T2", "", "T4", "", "T6", "", "CN"].map((d, i) => (
                <span key={i} className="text-[10px] leading-[18px] text-muted">{d}</span>
              ))}
              {heat.map((h) => (
                <span
                  key={h.d}
                  title={`${fmtDateVi(h.d)}${h.cls ? " · có lớp" : ""}`}
                  className="h-[18px] w-[18px] rounded box-border"
                  style={{
                    background: h.future ? "#F3F6FA" : COLORS[h.lv],
                    border: h.today ? "2px solid #2563C9" : h.cls ? "2px solid rgba(37,99,201,0.3)" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] border-2 border-brand/40" />Ngày có lớp</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-ok" />Học nhiều</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-[#B9DCD1]" />Học ít</span>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-3.5">
        <h2 className="text-[17px] font-bold">Phòng thực hành</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Lab href="/studio" code="npx playwright test" title="Xưởng Code" desc="IDE nhiều file chạy test Playwright ngay trên app Sổ Khách, xem trace từng bước." />
          <Lab href="/locator-lab" code="getByRole('button')" title="Locator Lab" desc="Gõ locator, thấy ngay phần tử nào khớp, có lỗi strict mode không." />
          <Lab href="/api-lab" code="POST /lab-api/customers" title="API Lab" desc="Gửi request tới API luyện tập, giả lập lỗi, chuyển thành code Playwright." />
          <Lab href="/kata" code="5/5 xanh" title="Thử thách" desc="Bài tập chấm tự động bằng test ẩn, có 3 bậc gợi ý." />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card flex flex-col gap-3 p-5">
          <h2 className="text-[17px] font-bold">Lịch lớp tuần {weekNo}</h2>
          {weekSessions.map((k) => {
            const l = lessonAtSession(k);
            const d = sessionDate(k, start);
            const past = d < today;
            const isToday = d === today;
            return (
              <div key={k} className={`flex items-center gap-3.5 rounded-xl border px-3 py-2.5 ${isToday ? "border-brand-edge bg-brand-tint" : "border-line2"}`}>
                <span className={`flex-none rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold ${isToday ? "bg-brand text-white" : "bg-chip text-ink-3"}`}>{fmtDateVi(d).replace(/\/\d{4}$/, "")}</span>
                <div className="flex min-w-0 flex-col">
                  <span className={`text-sm font-semibold ${past ? "text-muted" : ""}`}>{l ? `Bài ${l.n}: ${l.title}` : "Buổi cột mốc / ôn tập chương"}</span>
                  <span className="text-xs text-muted">Buổi {k} · 19:00–21:30</span>
                </div>
              </div>
            );
          })}
        </article>
        <article className="card flex flex-col gap-3.5 p-5">
          <h2 className="text-[17px] font-bold">Cột mốc sắp tới</h2>
          {upcoming.map(({ c, k }, i) => (
            <div key={c.n} className="flex items-start gap-3.5">
              <span className={`flex-none rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold ${i === 0 ? "bg-brand-soft text-brand-dark" : "bg-chip text-ink-3"}`}>Tuần {sessionWeek(k)}</span>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold"><Flag size={14} className="text-brand" />{c.milestone.title}</span>
                <span className="text-[13px] text-muted">{c.milestone.detail} · {fmtDateVi(sessionDate(k, start))}</span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}

function Stat({ label, value, note, good }: { label: string; value: React.ReactNode; note: React.ReactNode; good?: boolean }) {
  return (
    <div className="card flex flex-col gap-1.5 p-4">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-mono text-[28px] font-bold tabular">{value}</span>
      <span className={`text-xs ${good ? "font-semibold text-ok" : "text-muted"}`}>{note}</span>
    </div>
  );
}

function Lab({ href, code, title, desc }: { href: string; code: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card flex flex-col gap-2.5 p-5 transition-colors hover:border-brand-ring">
      <span className="font-mono text-xs font-bold text-brand">{code}</span>
      <span className="text-base font-bold">{title}</span>
      <span className="text-[13px] leading-relaxed text-muted">{desc}</span>
    </Link>
  );
}
