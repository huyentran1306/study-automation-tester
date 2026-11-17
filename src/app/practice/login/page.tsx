"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasBug, netDelay, setSession } from "@/lib/practice/store";
import { labLogin } from "@/lib/practice/api";

export default function PracticeLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    await netDelay(200, 600);
    let acc: { email: string; name: string; role: string; token: string } | null = null;
    try {
      const r = await labLogin(email.trim().toLowerCase(), password);
      acc = { ...r.user, token: r.token };
    } catch (e) {
      setBusy(false);
      if (!hasBug("login-no-error")) setError((e as Error).message || "Email hoặc mật khẩu không đúng");
      return;
    }
    setBusy(false);
    setSession(acc);
    router.push(hasBug("login-wrong-redirect") ? "/practice/widgets" : "/practice/customers");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgba(31,42,68,0.08)]" aria-labelledby="login-heading">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-extrabold text-[#0F766E]">Sổ Khách</span>
          <h1 id="login-heading" className="text-lg font-bold">Đăng nhập</h1>
          <p className="text-sm text-[#5A6478]">App CRM luyện tập. Tài khoản mẫu: linh@sokhach.vn / Matkhau@123</p>
        </div>
        <label htmlFor="email" className="flex flex-col gap-1 text-sm font-semibold">Email
          <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.vn" autoComplete="username" className="rounded-lg border border-[#DDE1EA] px-3 py-2.5 font-normal" />
        </label>
        <label htmlFor="password" className="flex flex-col gap-1 text-sm font-semibold">Mật khẩu
          <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="rounded-lg border border-[#DDE1EA] px-3 py-2.5 font-normal" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#0F766E]" />
          Ghi nhớ đăng nhập
        </label>
        {error && <p data-testid="login-error" role="alert" className="rounded-lg bg-[#FFECEC] px-3 py-2 text-sm font-semibold text-[#A3241A]">{error}</p>}
        <button type="submit" disabled={(!email.trim() && !hasBug("login-always-enabled")) || busy} className="rounded-lg bg-[#0F766E] py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <a href="#" className="text-center text-sm font-semibold text-[#0F766E]" onClick={(e) => { e.preventDefault(); setError("Liên hệ quản trị viên để đặt lại mật khẩu"); }}>Quên mật khẩu?</a>
      </form>
    </main>
  );
}
