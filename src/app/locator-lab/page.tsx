"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, MousePointerClick, Target } from "lucide-react";
import { BrowserFrame } from "@/components/pw/browser-frame";
import { resolve } from "@/lib/pw/dom";
import { buildLocator, MISSIONS, PRESETS, scoreLocator, suggestFor, type Mission } from "@/lib/pw/locator-lab";
import { ACCOUNTS, setSession } from "@/lib/practice/store";
import { labReset } from "@/lib/practice/api";
import { useApp } from "@/lib/progress/store";

const PAGES = [
  ["/login", "Đăng nhập"],
  ["/customers", "Khách hàng"],
  ["/widgets", "Thành phần"],
] as const;

export default function LocatorLab() {
  const { state, update } = useApp();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [path, setPath] = useState("/customers");
  const [expr, setExpr] = useState(PRESETS[0]);
  const [count, setCount] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null);
  const [url, setUrl] = useState("https://sokhach.playforge.dev/customers");
  const [tick, setTick] = useState(0);

  // buildLocator dùng new Function: Cloudflare Workers chặn khi render phía server → chỉ dựng ở trình duyệt
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const built = useMemo(() => {
    if (!mounted) return { b: null, e: "" };
    try {
      return { b: buildLocator(expr), e: "" };
    } catch (e) {
      return { b: null, e: (e as Error).message };
    }
  }, [expr, mounted]);
  const score = built.b ? scoreLocator(built.b) : null;

  const doc = () => {
    try {
      return frameRef.current?.contentDocument ?? null;
    } catch {
      return null;
    }
  };

  // Đăng nhập sẵn cho iframe để mở được trang Khách hàng
  useEffect(() => {
    const a = ACCOUNTS[0];
    setSession({ email: a.email, name: a.name, role: a.role });
    // Dữ liệu luyện tập về trạng thái mẫu để nhiệm vụ khớp
    void labReset().then(() => {
      if (frameRef.current) frameRef.current.src = "/practice/customers";
    });
  }, []);

  const go = (p: string) => {
    setPath(p);
    if (frameRef.current) frameRef.current.src = "/practice" + p;
  };

  // Tô các phần tử khớp ngay trên trang
  const paint = useCallback(() => {
    const d = doc();
    if (!d?.body) return;
    d.getElementById("pf-ll")?.remove();
    try {
      setUrl("https://sokhach.playforge.dev" + (d.location.pathname.replace(/^\/practice/, "") || "/"));
    } catch {
      /* bỏ qua */
    }
    if (!built.b) {
      setCount(null);
      setErr(built.e);
      setSuggestion(null);
      return;
    }
    setErr("");
    let els: Element[] = [];
    try {
      els = resolve(built.b.steps, d);
    } catch (e) {
      setErr((e as Error).message);
    }
    setCount(els.length);
    const wrap = d.createElement("div");
    wrap.id = "pf-ll";
    wrap.setAttribute("aria-hidden", "true");
    els.slice(0, 40).forEach((el, i) => {
      let r = el.getBoundingClientRect();
      const ownerFrame = el.ownerDocument !== d ? (el.ownerDocument.defaultView?.frameElement as Element | null) : null;
      if (ownerFrame) {
        const fr = ownerFrame.getBoundingClientRect();
        r = new DOMRect(r.left + fr.left, r.top + fr.top, r.width, r.height);
      }
      const box = d.createElement("div");
      Object.assign(box.style, { position: "fixed", left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px`, border: `2px solid ${els.length === 1 ? "#2F7D6D" : "#2563C9"}`, background: els.length === 1 ? "rgba(47,125,109,0.12)" : "rgba(37,99,201,0.10)", borderRadius: "6px", zIndex: "2147483646", pointerEvents: "none", boxSizing: "border-box" });
      const tag = d.createElement("span");
      tag.textContent = String(i + 1);
      Object.assign(tag.style, { position: "absolute", left: "-2px", top: "-18px", background: els.length === 1 ? "#2F7D6D" : "#2563C9", color: "#fff", font: "700 10px/16px ui-monospace,monospace", padding: "0 5px", borderRadius: "4px" });
      box.appendChild(tag);
      wrap.appendChild(box);
    });
    d.body.appendChild(wrap);
    setSuggestion(els.length === 1 ? suggestFor(els[0], d) : null);
  }, [built]);

  useEffect(() => {
    paint();
  }, [paint, tick]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 900);
    const f = frameRef.current;
    const onLoad = () => setTick((x) => x + 1);
    f?.addEventListener("load", onLoad);
    return () => {
      clearInterval(t);
      f?.removeEventListener("load", onLoad);
    };
  }, []);

  // Chế độ chọn phần tử bằng chuột
  useEffect(() => {
    const d = doc();
    if (!picking || !d) return;
    let hoverBox: HTMLElement | null = null;
    const move = (e: MouseEvent) => {
      const el = e.target as Element;
      hoverBox?.remove();
      const r = el.getBoundingClientRect();
      hoverBox = d.createElement("div");
      Object.assign(hoverBox.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, background: "rgba(91,68,184,0.18)", outline: "2px dashed #5B44B8", zIndex: "2147483647", pointerEvents: "none" });
      d.body.appendChild(hoverBox);
    };
    const click = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.target as Element;
      const s = suggestFor(el, d);
      setExpr(s ?? `page.locator('${el.tagName.toLowerCase()}')`);
      setPicking(false);
    };
    d.addEventListener("mousemove", move, true);
    d.addEventListener("click", click, true);
    return () => {
      hoverBox?.remove();
      d.removeEventListener("mousemove", move, true);
      d.removeEventListener("click", click, true);
    };
  }, [picking]);

  const check = () => {
    if (!mission) return;
    const d = doc();
    if (!d || !built.b) return setVerdict({ ok: false, text: built.e || "Chưa có locator" });
    const target = resolve(buildLocator(mission.ref).steps, d);
    if (target.length !== 1) return setVerdict({ ok: false, text: mission.id === "m14" ? "Mở dropdown Ngôn ngữ trên trang trước đã." : "Trang chưa ở đúng trạng thái. Bấm lại nhiệm vụ để mở đúng trang." });
    const mine = resolve(built.b.steps, d);
    if (mine.length !== 1) return setVerdict({ ok: false, text: `Locator khớp ${mine.length} phần tử. Cần đúng 1.` });
    if (mine[0] !== target[0]) return setVerdict({ ok: false, text: "Locator trỏ vào phần tử khác. Nhìn ô được tô xanh trên trang." });
    if (mission.noNth && built.b.steps.some((s) => s.k === "nth")) return setVerdict({ ok: false, text: "Đúng phần tử, nhưng nhiệm vụ này không cho dùng nth/first/last." });
    if ((score?.score ?? 0) < mission.min) return setVerdict({ ok: false, text: `Đúng phần tử, nhưng độ bền ${score?.score} < ${mission.min}. ${mission.hint}` });
    update((s) => {
      const id = "loc-" + mission.id;
      if (s.kata[id]?.status === "pass") return;
      s.kata[id] = { status: "pass", attempts: (s.kata[id]?.attempts ?? 0) + 1, hints: 0, xp: mission.xp, passedAt: new Date().toISOString(), at: new Date().toISOString(), code: expr };
    });
    setVerdict({ ok: true, text: `Chuẩn! +${mission.xp} XP` });
  };

  const doneCount = MISSIONS.filter((m) => state.kata["loc-" + m.id]?.status === "pass").length;
  const strictOk = count === 1;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:py-6">
      <header className="flex flex-wrap items-end justify-between gap-3.5">
        <div className="flex max-w-[70ch] flex-col gap-1.5">
          <span className="text-[13px] text-muted">Dùng cho bài 14–15 · Trang luyện: Sổ Khách</span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Locator Lab</h1>
          <p className="text-sm leading-relaxed text-ink-3">Gõ locator, xem ngay nó trỏ vào đâu. Mục tiêu: khớp đúng 1 phần tử và vẫn chạy khi giao diện thay đổi.</p>
        </div>
        <span className="pill border border-line bg-white px-3.5 py-2 text-[13px] text-ink-3"><b className="text-ink">{doneCount}</b> / {MISSIONS.length} nhiệm vụ</span>
      </header>

      <div className="flex flex-col gap-4 xl:flex-row">
        <section aria-label="Trang luyện tập" className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div role="group" aria-label="Chọn trang" className="flex flex-wrap gap-1.5">
            {PAGES.map(([p, label]) => (
              <button key={p} type="button" aria-pressed={path === p} onClick={() => go(p)} className={`min-h-[36px] rounded-full border px-3.5 text-[13px] font-semibold ${path === p ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-3"}`}>{label}</button>
            ))}
            <button type="button" aria-pressed={picking} onClick={() => setPicking(!picking)} className={`ml-auto flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold ${picking ? "border-ai bg-ai text-white" : "border-ai-edge bg-ai-soft text-ai-dark"}`}>
              <MousePointerClick size={14} />{picking ? "Bấm vào phần tử trên trang…" : "Chọn phần tử trên trang"}
            </button>
          </div>
          <BrowserFrame frameRef={frameRef} url={url} height={620} initial="/practice/customers" onHome={() => go(path)} />
        </section>

        <section aria-label="Thử locator" className="flex flex-col gap-3.5 xl:w-[480px] xl:flex-none">
          <div className="card flex flex-col gap-2.5 p-4">
            <label htmlFor="loc" className="text-[13px] font-bold">Locator của bạn</label>
            <textarea id="loc" value={expr} onChange={(e) => setExpr(e.target.value)} rows={3} spellCheck={false} className="w-full resize-y rounded-[10px] border-[1.5px] border-brand-ring bg-paper p-3 font-mono text-[13px] leading-relaxed" />
            {(err || built.e) && <span className="text-[13px] text-bad-dark" role="alert">{err || built.e}</span>}
            <span className="text-xs text-muted">Thử nhanh một mẫu:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setExpr(p)} className={`max-w-full truncate rounded-full border px-2.5 py-1 font-mono text-[11.5px] ${expr === p ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-3"}`}>{p.replace(/^page\./, "").slice(0, 46)}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="card flex flex-col gap-1 p-3.5"><span className="text-xs text-muted">Số phần tử khớp</span><span className={`font-mono text-[26px] font-bold ${count === 1 ? "text-ok-dark" : "text-bad-dark"}`}>{count ?? "–"}</span></div>
            <div className="card flex flex-col gap-1 p-3.5"><span className="text-xs text-muted">Strict mode</span><span className={`text-xl font-extrabold ${strictOk ? "text-ok-dark" : "text-bad-dark"}`}>{count === null ? "–" : strictOk ? "Ổn" : count === 0 ? "Không thấy" : "Lỗi"}</span></div>
            <div className="card flex flex-col gap-1 p-3.5"><span className="text-xs text-muted">Độ bền</span><span className={`font-mono text-[26px] font-bold ${(score?.score ?? 0) >= 80 ? "text-ok-dark" : (score?.score ?? 0) >= 50 ? "text-warn-dark" : "text-bad-dark"}`}>{score?.score ?? "–"}</span><span className="text-xs font-semibold text-ink-3">{score?.grade}</span></div>
          </div>

          <div className="card flex flex-col gap-2.5 p-4">
            <span className="text-[13px] font-bold">Nhận xét</span>
            {count !== null && count > 1 && <p className="text-sm leading-relaxed text-ink-2">Khớp {count} phần tử nên click() sẽ báo <code className="code-inline">strict mode violation</code>. Thu hẹp theo dòng, vùng cha, hoặc tên chính xác.</p>}
            {count === 0 && <p className="text-sm leading-relaxed text-ink-2">Không có phần tử nào khớp trên trang hiện tại. Kiểm tra chữ, dấu tiếng Việt, hoặc mở đúng trang.</p>}
            {score?.notes.map((n) => <p key={n} className="text-sm leading-relaxed text-ink-2">{n}</p>)}
            {suggestion && suggestion !== expr.trim() && (
              <div className="flex flex-col gap-1.5 rounded-[10px] border border-ok-edge bg-ok-tint p-3">
                <span className="text-xs font-bold text-ok-dark">Gợi ý cách viết cho phần tử này</span>
                <code className="whitespace-pre-wrap break-all font-mono text-[12.5px] text-ok-dark">{suggestion}</code>
                <button type="button" className="btn-ghost min-h-[32px] self-start text-xs" onClick={() => setExpr(suggestion)}>Dùng gợi ý này</button>
              </div>
            )}
            <button type="button" className="btn-ghost min-h-[36px] self-start text-xs" onClick={() => navigator.clipboard?.writeText(expr).catch(() => {})}><Copy size={13} />Sao chép locator</button>
          </div>

          <div className="card flex flex-col gap-2 p-4">
            <span className="flex items-center gap-1.5 text-[13px] font-bold"><Target size={15} className="text-brand" />Nhiệm vụ</span>
            {mission && (
              <div className="flex flex-col gap-2 rounded-xl border border-brand-edge bg-brand-tint p-3.5">
                <span className="text-[15px] font-semibold">Tìm: {mission.title}</span>
                <span className="text-xs text-muted">Khớp đúng 1 phần tử · độ bền từ {mission.min}{mission.noNth ? " · không dùng nth" : ""} · +{mission.xp} XP</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary min-h-[36px] text-[13px]" onClick={check}>Kiểm tra</button>
                  <button type="button" className="btn-ghost min-h-[36px] text-[13px]" onClick={() => setVerdict({ ok: false, text: "Gợi ý: " + mission.hint })}>Gợi ý</button>
                </div>
                {verdict && <span className={`rounded-lg px-3 py-2 text-[13px] font-semibold ${verdict.ok ? "bg-ok-soft text-ok-dark" : "bg-white text-bad-dark"}`} role="status">{verdict.text}</span>}
              </div>
            )}
            <div className="flex max-h-[260px] flex-col gap-1 overflow-auto">
              {MISSIONS.map((m, i) => {
                const done = state.kata["loc-" + m.id]?.status === "pass";
                return (
                  <button key={m.id} type="button" onClick={() => { setMission(m); setVerdict(null); go(m.path); }} className={`flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] ${mission?.id === m.id ? "bg-brand-soft font-semibold text-brand-dark" : "hover:bg-ground"}`}>
                    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-ok text-white" : "bg-chip text-muted"}`}>{done ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                    <span className="min-w-0 flex-1">{m.title}</span>
                    <span className="font-mono text-[11px] text-muted">{PAGES.find((p) => p[0] === m.path)?.[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
