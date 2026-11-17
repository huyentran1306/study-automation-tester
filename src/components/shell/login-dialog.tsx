"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useApp } from "@/lib/progress/store";

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const { login, register, loginGoogle } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) return setError("Nhập tên đăng nhập và mật khẩu");
    setBusy(true);
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password, name.trim() || username.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi, thử lại nhé");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <form onSubmit={submit} className="card relative flex w-full max-w-sm flex-col gap-4 p-6 shadow-lift">
        <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:bg-ground">
          <X size={18} />
        </button>
        <div className="flex flex-col gap-1">
          <h2 id="login-title" className="font-display text-xl font-extrabold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
          <p className="text-sm text-muted">Dùng chung tài khoản với web học tiếng Anh. Tiến độ học thử trên máy này sẽ được gộp vào.</p>
        </div>
        <button type="button" onClick={loginGoogle} className="btn-ghost w-full">Tiếp tục với Google</button>
        <div className="flex items-center gap-3 text-xs text-muted-2"><span className="h-px flex-1 bg-line" />hoặc<span className="h-px flex-1 bg-line" /></div>
        {mode === "register" && (
          <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="pf-name">Tên hiển thị
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="min-h-[44px] rounded-[10px] border border-line px-3" autoComplete="nickname" />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="pf-user">Tên đăng nhập
          <input id="pf-user" ref={first} value={username} onChange={(e) => setUsername(e.target.value)} className="min-h-[44px] rounded-[10px] border border-line px-3" autoComplete="username" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="pf-pass">Mật khẩu
          <input id="pf-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-[44px] rounded-[10px] border border-line px-3" autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm font-medium text-bad-dark" role="alert">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
        <button type="button" className="text-sm font-semibold text-brand" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Chưa có tài khoản? Tạo mới" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
