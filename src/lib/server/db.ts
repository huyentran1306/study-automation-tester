import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ACCOUNT_API } from "@/lib/account";

export interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface D1Like {
  prepare(sql: string): D1Stmt;
}

export interface ServerEnv {
  DB?: D1Like;
  AI?: { run(model: string, input: unknown): Promise<unknown> };
}

export async function getEnv(): Promise<ServerEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as unknown as ServerEnv;
  } catch {
    return {};
  }
}

export async function getDb(): Promise<D1Like | null> {
  return (await getEnv()).DB ?? null;
}

// Cache trong isolate: user id đã xác minh tồn tại.
const knownUsers = new Map<string, number>();
const KNOWN_TTL = 6 * 60 * 60 * 1000;

/** Chỉ nhận ghi cho user có thật trên máy chủ tài khoản. Máy chủ tài khoản không liên lạc được thì cho qua. */
export async function userExists(uid: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" && uid.startsWith("local-test-")) return true;
  const t = knownUsers.get(uid);
  if (t && Date.now() - t < KNOWN_TTL) return true;
  try {
    const res = await fetch(`${ACCOUNT_API}/users/${encodeURIComponent(uid)}`, { signal: AbortSignal.timeout(4000) });
    if (res.status === 404) return false;
    const j = (await res.json().catch(() => null)) as { success?: boolean } | null;
    if (j && j.success === false && res.status < 500) return false;
  } catch {
    return true;
  }
  knownUsers.set(uid, Date.now());
  return true;
}
