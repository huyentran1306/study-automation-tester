"use client";

import { AUTH_USER_KEY } from "@/lib/account";
import { ACCOUNTS, type Customer } from "./seed";

// Client gọi /lab-api/v1 cho app Sổ Khách (cùng domain với PlayForge).

export const LAB_BASE = "/lab-api/v1";

/** Định danh dữ liệu luyện tập: id tài khoản PlayForge, hoặc mã khách lưu trên máy. */
export function getLabUser(): string {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    const id = raw ? (JSON.parse(raw) as { id?: string }).id : undefined;
    if (id && /^[A-Za-z0-9_-]{1,64}$/.test(id)) return id;
    let g = localStorage.getItem("pf-lab-id");
    if (!g) {
      g = "g-" + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("pf-lab-id", g);
    }
    return g;
  } catch {
    return "anon";
  }
}

export interface LabSession {
  email: string;
  token?: string;
}

function authHeader(s: LabSession | null): Record<string, string> {
  if (s?.token) return { Authorization: `Bearer ${s.token}` };
  // Phiên cũ không có token (ví dụ Locator Lab đăng nhập sẵn): dùng Basic auth của tài khoản mẫu
  const a = ACCOUNTS.find((x) => x.email === s?.email) ?? ACCOUNTS[0];
  return { Authorization: "Basic " + btoa(`${a.email}:${a.password}`) };
}

export class LabError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { session?: LabSession | null } = {}): Promise<T> {
  const { session, ...rest } = init;
  const res = await fetch(LAB_BASE + path, {
    ...rest,
    headers: { "x-lab-user": getLabUser(), ...(rest.body && typeof rest.body === "string" ? { "content-type": "application/json" } : {}), ...authHeader(session ?? null), ...(rest.headers as Record<string, string> | undefined) },
  });
  if (res.status === 204) return undefined as T;
  const j = (await res.json().catch(() => ({}))) as { message?: string; fields?: Record<string, string> };
  if (!res.ok) throw new LabError(res.status, j.message ?? `Lỗi ${res.status}`, j.fields);
  return j as T;
}

export async function labLogin(email: string, password: string) {
  return call<{ token: string; user: { email: string; name: string; role: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }), headers: {} });
}

export async function labListAll(session: LabSession | null): Promise<Customer[]> {
  const out: Customer[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await call<{ data: Customer[]; totalPages: number }>(`/customers?limit=50&page=${page}&sort=id`, { session });
    out.push(...r.data);
    if (page >= r.totalPages) break;
  }
  return out;
}

export const labCreate = (session: LabSession | null, c: Omit<Customer, "id" | "createdAt">) => call<Customer>("/customers", { method: "POST", body: JSON.stringify(c), session });
export const labUpdate = (session: LabSession | null, id: number, c: Partial<Customer>) => call<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(c), session });
export const labDelete = (session: LabSession | null, id: number) => call<void>(`/customers/${id}`, { method: "DELETE", session });
export const labReset = () => fetch(LAB_BASE + "/reset", { method: "POST", headers: { "x-lab-user": getLabUser() } }).then(() => undefined);
