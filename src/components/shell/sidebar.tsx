"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Crosshair, Home, Layers, LogIn, Package, Repeat, Route, Star, Terminal, User, ArrowLeftRight } from "lucide-react";
import { useApp } from "@/lib/progress/store";
import { computeXp, levelOf, streakOf } from "@/lib/progress/state";
import { SyncBadge } from "./sync-badge";

const GROUPS = [
  {
    label: "Học",
    items: [
      { href: "/", label: "Trang chủ", icon: Home },
      { href: "/roadmap", label: "Lộ trình 16 tuần", icon: Route },
      { href: "/learn", label: "Bài học", icon: BookOpen },
    ],
  },
  {
    label: "Thực hành",
    items: [
      { href: "/studio", label: "Xưởng Code", icon: Code2 },
      { href: "/locator-lab", label: "Locator Lab", icon: Crosshair },
      { href: "/api-lab", label: "API Lab", icon: ArrowLeftRight },
      { href: "/kata", label: "Thử thách", icon: Star },
    ],
  },
  {
    label: "Củng cố",
    items: [
      { href: "/review", label: "Ôn tập", icon: Layers },
      { href: "/project", label: "Dự án cuối khóa", icon: Package },
      { href: "/profile", label: "Hồ sơ", icon: User },
    ],
  },
];

export function Sidebar({ onLogin }: { onLogin: () => void }) {
  const pathname = usePathname() ?? "/";
  const { state, today, user } = useApp();
  const xp = computeXp(state);
  const lv = levelOf(xp);
  const streak = streakOf(state, today);
  const pct = Math.round(((xp - lv.from) / (lv.to - lv.from)) * 100);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Điều hướng chính" className="flex h-full flex-col gap-4 overflow-y-auto border-r border-line bg-white px-3.5 py-5">
      <Link href="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand text-white">
          <Terminal size={19} strokeWidth={2.2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-[19px] font-extrabold tracking-tight">PlayForge</span>
          <span className="text-[11px] text-muted">Xưởng luyện Automation</span>
        </span>
      </Link>

      {GROUPS.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <span className="eyebrow px-2.5 py-1 text-[11px] text-muted-2">{g.label}</span>
          {g.items.map((it) => {
            const on = isActive(it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[40px] items-center gap-2.5 rounded-lg px-2.5 text-sm ${on ? "bg-brand-soft font-bold text-brand-dark" : "font-medium text-ink-3 hover:bg-ground"}`}
              >
                <Icon size={18} />
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-2.5 rounded-xl border border-line bg-[#F3F7FC] p-3.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5"><Repeat size={13} />Chuỗi ngày học</span>
          <span className="font-mono font-bold text-brand">{streak} ngày</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#DCE7F5]">
          <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-muted tabular">
          Cấp {lv.level} · {xp.toLocaleString("vi-VN")} / {lv.to.toLocaleString("vi-VN")} XP
        </span>
        {user ? (
          <SyncBadge />
        ) : (
          <button type="button" onClick={onLogin} className="btn-primary min-h-[36px] text-xs">
            <LogIn size={14} />Đăng nhập để lưu lên máy chủ
          </button>
        )}
      </div>
    </nav>
  );
}
