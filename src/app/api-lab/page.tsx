"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { getLabUser, LAB_BASE } from "@/lib/practice/api";
import { API_KEY } from "@/lib/practice/seed";
import { PW_PROJECT } from "@/content/studio-projects";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthKind = "none" | "bearer" | "basic" | "apikey";
interface KV { k: string; v: string; on: boolean }

interface Endpoint {
  m: Method;
  path: string;
  label: string;
  body?: string;
  params?: KV[];
  auth?: AuthKind;
}

const EPS: Endpoint[] = [
  { m: "POST", path: "/auth/login", label: "Đăng nhập lấy token", body: '{\n  "email": "linh@sokhach.vn",\n  "password": "Matkhau@123"\n}', auth: "none" },
  { m: "GET", path: "/customers", label: "Danh sách (phân trang)", params: [{ k: "page", v: "1", on: true }, { k: "limit", v: "10", on: true }, { k: "q", v: "", on: false }, { k: "tier", v: "VIP", on: false }, { k: "sort", v: "name", on: false }] },
  { m: "GET", path: "/customers/101", label: "Xem 1 khách" },
  { m: "POST", path: "/customers", label: "Tạo khách", body: '{\n  "name": "Võ Ngọc Trâm",\n  "email": "tram@mail.vn",\n  "tier": "VIP",\n  "city": "Cần Thơ"\n}' },
  { m: "PUT", path: "/customers/101", label: "Thay toàn bộ", body: '{\n  "name": "Nguyễn Minh Anh",\n  "email": "anh.nguyen@mail.vn",\n  "tier": "VIP",\n  "city": "Hà Nội"\n}' },
  { m: "PATCH", path: "/customers/101", label: "Sửa một phần", body: '{\n  "tier": "Thường"\n}' },
  { m: "DELETE", path: "/customers/101", label: "Xóa khách" },
  { m: "GET", path: "/me", label: "Tôi là ai" },
  { m: "GET", path: "/health", label: "Kiểm tra máy chủ", auth: "none" },
  { m: "POST", path: "/reset", label: "Đặt lại 25 khách mẫu", auth: "none" },
];

const MC: Record<Method, string> = {
  GET: "bg-ok-soft text-ok-dark",
  POST: "bg-brand-soft text-brand-dark",
  PUT: "bg-ai-tint text-ai-dark",
  PATCH: "bg-warn-soft text-warn-dark",
  DELETE: "bg-bad-soft text-bad-dark",
};

interface Resp {
  status: number;
  statusText: string;
  ms: number;
  size: number;
  headers: [string, string][];
  body: string;
  json: unknown;
}

const q = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

function KVEditor({ rows, set }: { rows: KV[]; set: (r: KV[]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="checkbox" aria-label="Bật" checked={r.on} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} className="h-4 w-4 accent-[#2563C9]" />
          <input aria-label="Tên" value={r.k} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} placeholder="tên" className="w-32 rounded-lg border border-line px-2 py-1.5 font-mono text-[12.5px]" />
          <input aria-label="Giá trị" value={r.v} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} placeholder="giá trị" className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 font-mono text-[12.5px]" />
          <button type="button" aria-label="Xóa dòng" onClick={() => set(rows.filter((_, j) => j !== i))} className="rounded p-1 text-muted hover:text-bad"><Trash2 size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={() => set([...rows, { k: "", v: "", on: true }])} className="flex items-center gap-1 self-start text-[13px] font-semibold text-brand"><Plus size={14} />Thêm dòng</button>
    </div>
  );
}

export default function ApiLab() {
  const router = useRouter();
  const [ep, setEp] = useState(1);
  const [method, setMethod] = useState<Method>(EPS[1].m);
  const [path, setPath] = useState(EPS[1].path);
  const [params, setParams] = useState<KV[]>(EPS[1].params ?? []);
  const [headers, setHeaders] = useState<KV[]>([]);
  const [body, setBody] = useState("");
  const [auth, setAuth] = useState<AuthKind>("bearer");
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"params" | "headers" | "body" | "auth">("params");
  const [chaos, setChaos] = useState<"" | "slow" | "error" | "flaky">("");
  const [res, setRes] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [codeTab, setCodeTab] = useState<"ts" | "curl">("ts");
  const [history, setHistory] = useState<{ m: Method; path: string; status: number; ms: number }[]>([]);

  const pick = (i: number) => {
    const e = EPS[i];
    setEp(i);
    setMethod(e.m);
    setPath(e.path);
    setParams(e.params ?? []);
    setBody(e.body ?? "");
    setAuth(e.auth ?? (token ? "bearer" : "basic"));
    setTab(e.body ? "body" : e.params ? "params" : "auth");
    setRes(null);
    setErr("");
  };

  const fullPath = useMemo(() => {
    const on = params.filter((p) => p.on && p.k);
    const qs = on.map((p) => `${encodeURIComponent(p.k)}=${encodeURIComponent(p.v)}`).join("&");
    return path + (qs ? (path.includes("?") ? "&" : "?") + qs : "");
  }, [path, params]);

  const authHeaders = (): Record<string, string> => {
    if (auth === "bearer") return token ? { Authorization: `Bearer ${token}` } : {};
    if (auth === "basic") return { Authorization: "Basic " + btoa("linh@sokhach.vn:Matkhau@123") };
    if (auth === "apikey") return { "x-api-key": API_KEY };
    return {};
  };

  const send = async () => {
    setBusy(true);
    setErr("");
    const h: Record<string, string> = { "x-lab-user": getLabUser(), ...authHeaders() };
    headers.filter((x) => x.on && x.k).forEach((x) => { h[x.k] = x.v; });
    if (chaos) h["x-chaos"] = chaos;
    const hasBody = method !== "GET" && method !== "DELETE" && body.trim();
    if (hasBody) {
      try {
        JSON.parse(body);
      } catch {
        setBusy(false);
        setErr("Body không phải JSON hợp lệ");
        return;
      }
      h["content-type"] = "application/json";
    }
    const t0 = performance.now();
    try {
      const r = await fetch(LAB_BASE + fullPath, { method, headers: h, body: hasBody ? body : undefined });
      const txt = await r.text();
      const ms = Math.round(performance.now() - t0);
      let json: unknown = null;
      try {
        json = txt ? JSON.parse(txt) : null;
      } catch {
        /* không phải JSON */
      }
      const hs: [string, string][] = [];
      r.headers.forEach((v, k) => hs.push([k, v]));
      setRes({ status: r.status, statusText: r.statusText, ms, size: txt.length, headers: hs, body: txt, json });
      setHistory((cur) => [{ m: method, path: fullPath, status: r.status, ms }, ...cur].slice(0, 12));
      if (path === "/auth/login" && r.ok && json && typeof json === "object" && "token" in json) setToken(String((json as { token: string }).token));
      const auto: Record<string, boolean> = { status: true };
      setPicked(auto);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Assertion gợi ý theo response thật
  const asserts = useMemo(() => {
    if (!res) return [] as { id: string; code: string }[];
    const out = [{ id: "status", code: `expect(res.status()).toBe(${res.status});` }];
    if (res.status >= 200 && res.status < 300) out.push({ id: "ok", code: "await expect(res).toBeOK();" });
    const j = res.json as Record<string, unknown> | null;
    if (j && typeof j === "object" && !Array.isArray(j)) {
      out.push({ id: "json", code: "const body = await res.json();" });
      for (const [k, v] of Object.entries(j).slice(0, 6)) {
        if (typeof v === "string" && k !== "token" && k !== "time") out.push({ id: "f:" + k, code: `expect(body.${k}).toBe(${q(v)});` });
        else if (typeof v === "number" || typeof v === "boolean") out.push({ id: "f:" + k, code: `expect(body.${k}).toBe(${v});` });
        else if (Array.isArray(v)) out.push({ id: "f:" + k, code: `expect(body.${k}).toHaveLength(${v.length});` });
        else if (k === "token") out.push({ id: "f:token", code: "expect(body.token).toBeTruthy();" });
      }
    }
    const ct = res.headers.find(([k]) => k === "content-type")?.[1];
    if (ct?.includes("json")) out.push({ id: "ct", code: "expect(res.headers()['content-type']).toContain('application/json');" });
    return out;
  }, [res]);

  const optsCode = () => {
    const o: string[] = [];
    const h = { ...authHeaders() };
    headers.filter((x) => x.on && x.k).forEach((x) => { h[x.k] = x.v; });
    if (Object.keys(h).length) {
      const hs = Object.entries(h).map(([k, v]) => `${/^[a-zA-Z_]\w*$/.test(k) ? k : q(k)}: ${k === "Authorization" && auth === "bearer" ? "'Bearer ' + token" : q(v)}`);
      o.push(`headers: { ${hs.join(", ")} }`);
    }
    const on = params.filter((p) => p.on && p.k);
    if (on.length) o.push(`params: { ${on.map((p) => `${p.k}: ${/^\d+$/.test(p.v) ? p.v : q(p.v)}`).join(", ")} }`);
    if (method !== "GET" && method !== "DELETE" && body.trim()) {
      try {
        o.push(`data: ${JSON.stringify(JSON.parse(body), null, 2).replace(/\n/g, "\n    ").replace(/"([a-zA-Z_]\w*)":/g, "$1:").replace(/"/g, "'")}`);
      } catch {
        /* bỏ qua */
      }
    }
    return o;
  };

  const tsCode = useMemo(() => {
    const o = optsCode();
    const call = `const res = await request.${method.toLowerCase()}(${q(LAB_BASE + path)}${o.length ? `, {\n    ${o.join(",\n    ")},\n  }` : ""});`;
    const as = asserts.filter((a) => picked[a.id] || a.id === "json" && asserts.some((x) => x.id.startsWith("f:") && picked[x.id])).map((a) => "  " + a.code);
    const pre = auth === "bearer" ? "  const login = await request.post('/lab-api/v1/auth/login', {\n    data: { email: 'linh@sokhach.vn', password: 'Matkhau@123' },\n  });\n  const { token } = await login.json();\n\n" : "";
    return `import { test, expect } from '@playwright/test';\n\ntest('${method} ${path}', async ({ request }) => {\n${pre}  ${call}\n${as.join("\n")}\n});\n`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, path, params, headers, body, auth, asserts, picked]);

  const curl = useMemo(() => {
    const h: Record<string, string> = { ...authHeaders(), "x-lab-user": "<id của bạn>" };
    headers.filter((x) => x.on && x.k).forEach((x) => { h[x.k] = x.v; });
    const parts = [`curl -X ${method} 'https://sokhach.playforge.dev${LAB_BASE}${fullPath}'`, ...Object.entries(h).map(([k, v]) => `  -H '${k}: ${v}'`)];
    if (method !== "GET" && method !== "DELETE" && body.trim()) parts.push(`  -H 'content-type: application/json'`, `  -d '${body.replace(/\s+/g, " ")}'`);
    return parts.join(" \\\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, fullPath, headers, body, auth, token]);

  const sendToStudio = () => {
    try {
      const key = "pf-studio-pw:v1";
      const raw = localStorage.getItem(key);
      const p = raw ? JSON.parse(raw) : null;
      const name = `tests/api-${Date.now().toString(36)}.spec.ts`;
      const files = { ...(p?.files ?? PW_PROJECT), [name]: tsCode };
      localStorage.setItem(key, JSON.stringify({ files, active: name, entry: name }));
      localStorage.setItem("pf-studio-mode", "pw");
      router.push("/studio");
    } catch {
      /* bỏ qua */
    }
  };

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:py-6">
      <header className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Dùng cho bài 35–37 · API luyện tập chạy trên Cloudflare Worker, dữ liệu riêng của bạn</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">API Lab</h1>
        </div>
        <div role="group" aria-label="Giả lập sự cố" className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-3">Giả lập sự cố:</span>
          {([["", "Không"], ["slow", "Chậm 3 giây"], ["error", "Lỗi 500"], ["flaky", "Lúc được lúc không"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={chaos === k} onClick={() => setChaos(k)} className={`min-h-[36px] rounded-full border px-3 text-[12.5px] font-semibold ${chaos === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-3"}`}>{l}</button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-4 xl:flex-row">
        <nav aria-label="Danh sách endpoint" className="card flex flex-col gap-1 p-2.5 xl:w-[250px] xl:flex-none">
          <span className="px-2 pb-1 font-mono text-[11px] font-bold text-muted">{LAB_BASE}</span>
          {EPS.map((e, i) => (
            <button key={i} type="button" onClick={() => pick(i)} className={`flex min-h-[44px] flex-col items-start justify-center gap-0.5 rounded-lg px-2 text-left ${ep === i ? "bg-brand-soft" : "hover:bg-ground"}`}>
              <span className="flex items-center gap-2"><span className={`w-[52px] rounded-md py-0.5 text-center font-mono text-[10.5px] font-bold ${MC[e.m]}`}>{e.m}</span><span className="font-mono text-[12px]">{e.path}</span></span>
              <span className="pl-[60px] text-[11px] text-muted">{e.label}</span>
            </button>
          ))}
          <div className="mt-2 rounded-lg bg-[#F5F8FC] p-2.5 text-[11.5px] leading-relaxed text-ink-3">Tài khoản: linh@sokhach.vn (admin), khach@sokhach.vn (viewer), mật khẩu Matkhau@123. API key: <code className="font-mono">{API_KEY}</code></div>
        </nav>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="card flex flex-col gap-3 p-4">
            <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <label htmlFor="api-method" className="sr-only">Method</label>
              <select id="api-method" value={method} onChange={(e) => setMethod(e.target.value as Method)} className={`min-h-[44px] rounded-[10px] border-0 px-3 font-mono text-[13px] font-bold ${MC[method]}`}>
                {(["GET", "POST", "PUT", "PATCH", "DELETE"] as Method[]).map((m) => <option key={m}>{m}</option>)}
              </select>
              <label htmlFor="api-url" className="flex min-h-[44px] min-w-[240px] flex-1 items-center rounded-[10px] border border-line bg-paper px-3 font-mono text-[13px]">
                <span className="text-muted">{LAB_BASE}</span>
                <input id="api-url" value={path} onChange={(e) => setPath(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
              <button type="submit" className="btn-primary min-h-[44px] px-5" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}Gửi</button>
            </form>
            <div role="tablist" className="flex flex-wrap gap-4 border-b border-line text-[13px] font-semibold">
              {([["params", `Params (${params.filter((p) => p.on).length})`], ["headers", `Headers (${headers.filter((p) => p.on).length})`], ["body", "Body"], ["auth", `Auth · ${{ none: "Không", bearer: "Bearer", basic: "Basic", apikey: "API key" }[auth]}`]] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`py-1.5 ${tab === k ? "text-brand-dark shadow-[inset_0_-2px_0_#2563C9]" : "text-muted"}`}>{l}</button>
              ))}
            </div>
            {tab === "params" && <KVEditor rows={params} set={setParams} />}
            {tab === "headers" && <KVEditor rows={headers} set={setHeaders} />}
            {tab === "body" && (
              <textarea aria-label="Body JSON" value={body} onChange={(e) => setBody(e.target.value)} rows={7} spellCheck={false} placeholder={method === "GET" || method === "DELETE" ? `${method} không có body` : '{ "name": "…" }'} className="w-full rounded-[10px] border border-line bg-paper p-3 font-mono text-[12.5px] leading-relaxed" />
            )}
            {tab === "auth" && (
              <div className="flex flex-col gap-2 text-[13px]">
                {([["none", "Không xác thực"], ["bearer", "Bearer token (lấy từ POST /auth/login)"], ["basic", "Basic Auth (linh@sokhach.vn)"], ["apikey", "API key (x-api-key)"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2"><input type="radio" name="auth" checked={auth === k} onChange={() => setAuth(k)} className="accent-[#2563C9]" />{l}</label>
                ))}
                {auth === "bearer" && <span className={`font-mono text-[11.5px] ${token ? "text-ok-dark" : "text-warn-dark"}`}>{token ? `token: ${token.slice(0, 32)}…` : "Chưa có token. Gửi POST /auth/login trước."}</span>}
              </div>
            )}
            {err && <span className="text-sm text-bad-dark" role="alert">{err}</span>}
          </div>

          <div className="card flex flex-col gap-2.5 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] font-bold">Response</span>
              {res ? (
                <>
                  <span className={`pill font-mono ${res.status < 300 ? "bg-ok-soft text-ok-dark" : res.status < 500 ? "bg-warn-soft text-warn-dark" : "bg-bad-soft text-bad-dark"}`}>{res.status} {res.statusText}</span>
                  <span className="font-mono text-xs text-muted">{res.ms} ms</span>
                  <span className="font-mono text-xs text-muted">{res.size} B</span>
                </>
              ) : <span className="text-xs text-muted">Bấm Gửi để xem kết quả</span>}
            </div>
            {res && (
              <>
                <pre className="max-h-[320px] overflow-auto rounded-[10px] bg-[#F5F8FC] p-3 font-mono text-[12.5px] leading-relaxed">{res.json !== null ? JSON.stringify(res.json, null, 2) : res.body || "(không có nội dung)"}</pre>
                <details className="text-xs text-ink-3">
                  <summary className="cursor-pointer font-semibold">Headers ({res.headers.length})</summary>
                  <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono">{res.headers.flatMap(([k, v]) => [<span key={k + "k"} className="text-muted">{k}</span>, <span key={k + "v"} className="break-all">{v}</span>])}</div>
                </details>
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 xl:w-[420px] xl:flex-none">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-[#F5F8FC] px-3.5 py-2">
              <span className="text-[13px] font-bold">Chuyển thành code</span>
              <div className="flex gap-1 text-xs">
                {(["ts", "curl"] as const).map((k) => <button key={k} type="button" onClick={() => setCodeTab(k)} className={`rounded-md px-2.5 py-1 font-semibold ${codeTab === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>{k === "ts" ? "Playwright TS" : "cURL"}</button>)}
              </div>
            </div>
            <pre className="max-h-[380px] overflow-auto bg-paper p-3.5 font-mono text-[12px] leading-relaxed">{codeTab === "ts" ? tsCode : curl}</pre>
            <div className="flex flex-wrap gap-2 border-t border-line px-3.5 py-2.5">
              {codeTab === "ts" && <button type="button" onClick={sendToStudio} className="btn-dark min-h-[36px] text-[13px]">Mở trong Xưởng Code</button>}
              <button type="button" onClick={() => navigator.clipboard?.writeText(codeTab === "ts" ? tsCode : curl).catch(() => {})} className="btn-ghost min-h-[36px] text-[13px]"><Copy size={13} />Sao chép</button>
            </div>
          </div>
          {asserts.length > 0 && (
            <div className="card flex flex-col gap-1.5 p-4">
              <span className="text-[13px] font-bold">Assertion gợi ý · chọn để thêm vào code</span>
              {asserts.filter((a) => a.id !== "json").map((a) => (
                <label key={a.id} className="flex min-h-[32px] items-center gap-2.5 text-[12.5px]">
                  <input type="checkbox" checked={!!picked[a.id]} onChange={(e) => setPicked({ ...picked, [a.id]: e.target.checked })} className="h-4 w-4 accent-[#2563C9]" />
                  <code className="font-mono">{a.code}</code>
                </label>
              ))}
            </div>
          )}
          <div className="card flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between"><span className="text-[13px] font-bold">Lịch sử</span>{history.length > 0 && <button type="button" onClick={() => setHistory([])} className="text-xs text-muted hover:text-brand"><RotateCcw size={12} className="inline" /> Xóa</button>}</div>
            {history.length === 0 && <span className="text-xs text-muted">Chưa gửi request nào.</span>}
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-[11.5px]">
                <span className={`w-[52px] rounded py-0.5 text-center font-bold ${MC[h.m]}`}>{h.m}</span>
                <span className="min-w-0 flex-1 truncate">{h.path}</span>
                <span className={h.status < 300 ? "text-ok-dark" : h.status < 500 ? "text-warn-dark" : "text-bad-dark"}>{h.status}</span>
                <span className="text-muted">{h.ms}ms</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
