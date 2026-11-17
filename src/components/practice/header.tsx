"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, setSession, type Session } from "@/lib/practice/store";

/** Đầu trang Sổ Khách. Chưa đăng nhập thì chuyển về /practice/login. */
export function PracticeHeader() {
  const router = useRouter();
  const path = usePathname();
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => {
    const cur = getSession();
    if (!cur) router.replace("/practice/login");
    else setS(cur);
  }, [router]);
  const nav = [
    ["/practice/customers", "Khách hàng"],
    ["/practice/widgets", "Thành phần"],
  ];
  return (
    <header className="border-b border-[#E3E6EE] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-lg font-extrabold text-[#0F766E]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E] text-sm text-white">SK</span>Sổ Khách
          </span>
          <nav aria-label="Menu chính" className="flex gap-1">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${path === href ? "bg-[#E6F4F1] text-[#0F766E]" : "text-[#5A6478] hover:text-[#1F2A44]"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {s && (
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="current-user" className="text-[#5A6478]">{s.name} · {s.role}</span>
            <button type="button" className="rounded-md border border-[#DDE1EA] px-3 py-1.5 font-semibold" onClick={() => { setSession(null); router.push("/practice/login"); }}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
