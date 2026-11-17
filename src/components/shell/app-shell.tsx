"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LoginDialog } from "./login-dialog";
import { Logo } from "@/components/brand/logo";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  // Trang luyện tập Sổ Khách (dùng làm mục tiêu test) hiển thị riêng, không có khung PlayForge.
  if (pathname?.startsWith("/practice") || pathname === "/auth-callback") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
        <Logo size={30} sub={false} />
        <button type="button" aria-label={open ? "Đóng menu" : "Mở menu"} className="btn-ghost h-11 w-11 px-0" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>
      <div className={`${open ? "block" : "hidden"} fixed inset-0 z-20 bg-ink/30 lg:hidden`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-30 w-[248px] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}
      >
        <Sidebar onLogin={() => setLogin(true)} />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      {login && <LoginDialog onClose={() => setLogin(false)} />}
    </div>
  );
}
