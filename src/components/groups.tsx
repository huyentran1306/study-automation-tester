"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, LogOut, Users } from "lucide-react";
import { useApp } from "@/lib/progress/store";

interface Member { uid: string; name: string; xp: number; lessons: number; kata: number; streak: number; week: number; me: boolean }
interface Group { id: string; name: string; code: string; isOwner: boolean; members: Member[] }

const COLORS = ["#2563C9", "#5B44B8", "#2F7D6D", "#A35B00", "#5B93E3", "#7A66C9"];

/** Nhóm học + bảng xếp hạng (trang Hồ sơ). */
export function Groups({ onLogin }: { onLogin: () => void }) {
  const { uid, user, sync } = useApp();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [range, setRange] = useState<"week" | "all">("week");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const r = await fetch(`/api/pf/groups?uid=${encodeURIComponent(uid)}`, { cache: "no-store" });
    const j = (await r.json().catch(() => ({}))) as { groups?: Group[] };
    setGroups(j.groups ?? []);
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load, sync]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/pf/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, displayName: user?.display_name || user?.username, ...body }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string; code?: string; name?: string };
      if (!r.ok) throw new Error(j.error || "Có lỗi, thử lại sau");
      if (body.action === "create") setMsg(`Đã tạo nhóm. Gửi mã ${j.code} cho bạn cùng lớp.`);
      if (body.action === "join") setMsg(`Đã vào nhóm ${j.name}.`);
      setName("");
      setCode("");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!uid)
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
        Đăng nhập để tạo nhóm học, gửi mã mời cho bạn cùng lớp và thi đua XP theo tuần.
        <button type="button" className="btn-primary min-h-[36px] text-[13px]" onClick={onLogin}>Đăng nhập</button>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {groups?.map((g) => {
        const sorted = [...g.members].sort((a, b) => (range === "week" ? b.week - a.week : b.xp - a.xp) || b.xp - a.xp);
        return (
          <div key={g.id} className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold">{g.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  {g.members.length} thành viên · mã mời <code className="font-mono font-bold text-ink">{g.code}</code>
                  <button type="button" aria-label="Sao chép mã mời" className="rounded p-1 hover:text-brand" onClick={() => navigator.clipboard?.writeText(g.code).catch(() => {})}><Copy size={12} /></button>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div role="group" aria-label="Khoảng thời gian" className="flex rounded-[10px] bg-chip p-[3px]">
                  {([["week", "Tuần này"], ["all", "Từ đầu khóa"]] as const).map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={range === k} onClick={() => setRange(k)} className={`min-h-[32px] rounded-lg px-3 text-xs font-semibold ${range === k ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>{l}</button>
                  ))}
                </div>
                <button type="button" title="Rời nhóm" aria-label={`Rời nhóm ${g.name}`} className="btn-ghost min-h-[32px] px-2.5" onClick={() => window.confirm(`Rời nhóm ${g.name}?`) && void post({ action: "leave", groupId: g.id })}><LogOut size={14} /></button>
              </div>
            </div>
            {sorted.map((m, i) => (
              <div key={m.uid} className={`flex min-h-[52px] items-center gap-3 rounded-xl px-2.5 py-1.5 ${m.me ? "border border-brand-edge bg-brand-tint" : ""}`}>
                <span className="w-5 font-mono text-[13px] font-bold text-muted">{i + 1}</span>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] text-xs font-extrabold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {m.name.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{m.name}{m.me ? " (bạn)" : ""}</span>
                  <span className="text-xs text-muted">{m.lessons} bài · {m.kata} thử thách · chuỗi {m.streak} ngày</span>
                </span>
                <span className="text-right font-mono text-sm font-bold tabular">{range === "week" ? `${m.week} điểm` : `${m.xp.toLocaleString("vi-VN")} XP`}</span>
              </div>
            ))}
          </div>
        );
      })}
      {groups?.length === 0 && <p className="text-sm text-muted">Bạn chưa ở nhóm nào. Tạo nhóm mới hoặc nhập mã mời.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void post({ action: "create", name }); }}>
          <label htmlFor="g-name" className="text-xs font-semibold text-ink-3">Tạo nhóm mới</label>
          <div className="flex gap-2">
            <input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lớp Playwright T11" className="min-h-[38px] min-w-0 flex-1 rounded-lg border border-line px-3 text-sm" />
            <button type="submit" className="btn-primary min-h-[38px] text-[13px]" disabled={busy || name.trim().length < 2}><Users size={14} />Tạo</button>
          </div>
        </form>
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void post({ action: "join", code }); }}>
          <label htmlFor="g-code" className="text-xs font-semibold text-ink-3">Vào nhóm bằng mã mời</label>
          <div className="flex gap-2">
            <input id="g-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PF-7Q2K" className="min-h-[38px] min-w-0 flex-1 rounded-lg border border-line px-3 font-mono text-sm uppercase" />
            <button type="submit" className="btn-ghost min-h-[38px] text-[13px]" disabled={busy || code.trim().length < 4}>Vào nhóm</button>
          </div>
        </form>
      </div>
      {msg && <p className="text-sm text-ink-2" role="status">{msg}</p>}
      <p className="text-[11.5px] text-muted">Điểm tuần = đọc bài × 5 + thẻ ôn × 2 + lượt chạy code, tính 7 ngày gần nhất.</p>
    </div>
  );
}
