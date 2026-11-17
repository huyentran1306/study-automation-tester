"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ACCOUNT_API, AUTH_USER_KEY, UID_KEY, UID_RE, type AccountUser } from "@/lib/account";
import { emptyState, mergeStates, normalizeState } from "@/lib/progress/state";

function read(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? normalizeState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

function Inner() {
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const uid = params.get("uid") ?? "";
    const err = params.get("error");
    if (err) return setError(decodeURIComponent(err));
    if (!UID_RE.test(uid)) return setError("Không nhận được mã người dùng từ Google.");
    fetch(`${ACCOUNT_API}/users/${uid}`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: Record<string, unknown> }) => {
        if (!res.success) throw new Error("Không lấy được thông tin tài khoản");
        const dn = params.get("display_name");
        const u: AccountUser = {
          id: uid,
          username: String(res.data.username ?? uid),
          display_name: dn ? decodeURIComponent(dn) : ((res.data.display_name as string) || null),
          email: (res.data.email as string) || null,
        };
        // Gộp tiến độ học thử vào tài khoản
        const merged = mergeStates(read(`pf-progress:${uid}`), read("pf-progress:guest"));
        localStorage.setItem(`pf-progress:${uid}`, JSON.stringify(merged));
        localStorage.removeItem("pf-progress:guest");
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
        localStorage.setItem(UID_KEY, uid);
        window.location.replace("/");
      })
      .catch((e: Error) => setError(e.message));
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card flex max-w-sm flex-col gap-3 p-6 text-center">
        {error ? (
          <>
            <h1 className="font-display text-lg font-bold">Đăng nhập chưa thành công</h1>
            <p className="text-sm text-muted">{error}</p>
            <Link href="/" className="btn-primary">Về trang chủ</Link>
          </>
        ) : (
          <p className="text-sm text-muted">Đang đăng nhập…</p>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
