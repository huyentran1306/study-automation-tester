"use client";

import { useEffect, useMemo, useState } from "react";
import { PracticeHeader } from "@/components/practice/header";
import { getSession, hasBug, netDelay, type Customer, type Tier } from "@/lib/practice/store";
import { labCreate, labDelete, labListAll, labUpdate, LabError } from "@/lib/practice/api";

const PAGE = 10;
const TIERS: Tier[] = ["VIP", "Mới", "Thường"];
const TAG: Record<Tier, string> = { VIP: "bg-[#FFF4D6] text-[#7A4B00]", "Mới": "bg-[#E7F0FF] text-[#23468F]", "Thường": "bg-[#F0F2F6] text-[#4B5568]" };

type Draft = Omit<Customer, "id"> & { id?: number };
const EMPTY: Draft = { name: "", email: "", tier: "Thường", city: "", createdAt: new Date().toISOString().slice(0, 10), newsletter: false };

export default function Customers() {
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"" | Tier>("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<number[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Customer[] | null>(null);
  const [toast, setToast] = useState("");

  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    // Tải dữ liệu từ /lab-api (thêm độ trễ để thấy rõ auto-wait)
    netDelay(150, 500)
      .then(() => labListAll(getSession()))
      .then(setList)
      .catch((e: Error) => setLoadError(e.message));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const qq = hasBug("search-broken") ? "" : q;
    let r = (list ?? []).filter((c) => (!qq || c.name.toLowerCase().includes(qq.toLowerCase())) && (!tier || c.tier === tier));
    if (sortAsc !== null) r = [...r].sort((a, b) => a.name.localeCompare(b.name, "vi") * (sortAsc ? 1 : -1));
    return r;
  }, [list, q, tier, sortAsc]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE);


  const save = async () => {
    if (!draft || !list) return;
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) e.email = "Email không hợp lệ";
    else if (list.some((c) => c.email === draft.email.trim() && c.id !== draft.id)) e.email = "Email đã tồn tại";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    await netDelay(300, 900);
    try {
      if (draft.id) {
        const saved = await labUpdate(getSession(), draft.id, { name: draft.name.trim(), email: draft.email.trim(), tier: draft.tier, city: draft.city, newsletter: draft.newsletter });
        setList((cur) => (cur ?? []).map((c) => (c.id === saved.id ? saved : c)));
        setToast(`Đã cập nhật khách hàng ${saved.name}`);
      } else {
        const name = hasBug("add-wrong-name") ? draft.name.trim().split(" ").slice(0, -1).join(" ") || draft.name.trim() : draft.name.trim();
        const saved = await labCreate(getSession(), { name, email: draft.email.trim(), tier: draft.tier, city: draft.city, newsletter: draft.newsletter });
        setList((cur) => [saved, ...(cur ?? [])]);
        if (!hasBug("add-no-toast")) setToast(`Đã thêm khách hàng ${saved.name}`);
      }
      setDraft(null);
    } catch (e) {
      const le = e as LabError;
      if (le.status === 409) setErrors({ email: "Email đã tồn tại" });
      else if (le.fields) setErrors(le.fields);
      else setErrors({ name: le.message });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirm || !list) return;
    await netDelay(150, 400);
    const ids = hasBug("delete-wrong-row") ? [list[0].id] : confirm.map((c) => c.id);
    try {
      for (const id of ids) await labDelete(getSession(), id);
    } catch (e) {
      setToast((e as Error).message);
      setConfirm(null);
      return;
    }
    setList((cur) => (cur ?? []).filter((c) => !ids.includes(c.id)));
    setPicked((p) => p.filter((x) => !ids.includes(x)));
    setToast(confirm.length === 1 ? `Đã xóa khách hàng ${confirm[0].name}` : `Đã xóa ${confirm.length} khách hàng`);
    setConfirm(null);
  };

  return (
    <>
      <PracticeHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-extrabold">Khách hàng</h1>
            <span data-testid="customer-count" className="text-sm text-[#5A6478]">{list ? `${filtered.length + (hasBug("count-off") ? 1 : 0)} khách` : ""}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Tìm theo tên…" className="min-w-[200px] rounded-lg border border-[#DDE1EA] bg-white px-3 py-2 text-sm" />
            <label htmlFor="tier-filter" className="flex items-center gap-1.5 text-sm font-semibold">Hạng
              <select id="tier-filter" value={tier} onChange={(e) => { setTier(e.target.value as "" | Tier); setPage(1); }} className="rounded-lg border border-[#DDE1EA] bg-white px-2 py-2 font-normal">
                <option value="">Tất cả</option>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            {picked.length > 0 && (
              <button type="button" className="rounded-lg border border-[#F2B8B2] bg-[#FFECEC] px-3 py-2 text-sm font-bold text-[#A3241A]" onClick={() => setConfirm((list ?? []).filter((c) => picked.includes(c.id)))}>
                Xóa đã chọn ({picked.length})
              </button>
            )}
            <button type="button" disabled={!list} className="btn btn-primary rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-bold text-white disabled:opacity-50" onClick={() => { setErrors({}); setDraft({ ...EMPTY }); }}>
              + Thêm khách hàng
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] bg-white">
          {!list ? (
            <div className="p-8 text-center text-sm text-[#5A6478]" role="status">{loadError ? `Không tải được danh sách: ${loadError}` : "Đang tải danh sách…"}</div>
          ) : (
            <table data-testid="customer-table" className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#F4F6FA] text-left">
                  <th className="w-10 px-3 py-2.5"><span className="sr-only">Chọn</span></th>
                  <th className="px-3 py-2.5 font-semibold">
                    <button type="button" onClick={() => setSortAsc(sortAsc === null ? true : !sortAsc)} className="font-semibold">
                      Họ tên {sortAsc === null ? "" : sortAsc ? "▲" : "▼"}
                    </button>
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Email</th>
                  <th className="px-3 py-2.5 font-semibold">Hạng</th>
                  <th className="px-3 py-2.5 font-semibold">Thành phố</th>
                  <th className="px-3 py-2.5 font-semibold">Ngày tạo</th>
                  <th className="px-3 py-2.5 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-[#EEF0F5]">
                    <td className="px-3 py-2.5">
                      <input type="checkbox" aria-label={`Chọn ${c.name}`} checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} className="h-4 w-4 accent-[#0F766E]" />
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{c.name}</td>
                    <td className="px-3 py-2.5 text-[#5A6478]">{c.email}</td>
                    <td className="px-3 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TAG[c.tier]}`}>{c.tier}</span></td>
                    <td className="px-3 py-2.5">{c.city}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[#5A6478]">{c.createdAt.split("-").reverse().join("/")}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex gap-1.5">
                        <button type="button" className="rounded-md bg-[#F0F2F6] px-2.5 py-1 text-xs font-semibold" onClick={() => { setErrors({}); setDraft({ ...c }); }}>Sửa</button>
                        <button type="button" className="rounded-md bg-[#FFECEC] px-2.5 py-1 text-xs font-semibold text-[#A3241A]" onClick={() => setConfirm([c])}>Xóa</button>
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-[#5A6478]">Không tìm thấy khách hàng nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {list && (
          <nav aria-label="Phân trang" className="flex items-center justify-end gap-2 text-sm">
            <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="rounded-md border border-[#DDE1EA] bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Trang trước</button>
            <span data-testid="page-info">Trang {cur} / {pages}</span>
            <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="rounded-md border border-[#DDE1EA] bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Trang sau</button>
          </nav>
        )}
      </main>

      {draft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1F2A44]/40 p-4">
          <form role="dialog" aria-modal="true" aria-labelledby="dlg-title" onSubmit={(e) => { e.preventDefault(); void save(); }} className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-white p-6">
            <h2 id="dlg-title" className="text-lg font-bold">{draft.id ? "Sửa khách hàng" : "Thêm khách hàng"}</h2>
            <label htmlFor="c-name" className="flex flex-col gap-1 text-sm font-semibold">Họ tên
              <input id="c-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-lg border border-[#DDE1EA] px-3 py-2 font-normal" />
              {errors.name && <span className="text-xs font-normal text-[#A3241A]">{errors.name}</span>}
            </label>
            <label htmlFor="c-email" className="flex flex-col gap-1 text-sm font-semibold">Email
              <input id="c-email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="rounded-lg border border-[#DDE1EA] px-3 py-2 font-normal" />
              {errors.email && <span className="text-xs font-normal text-[#A3241A]">{errors.email}</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="c-tier" className="flex flex-col gap-1 text-sm font-semibold">Hạng
                <select id="c-tier" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value as Tier })} className="rounded-lg border border-[#DDE1EA] px-2 py-2 font-normal">
                  {TIERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label htmlFor="c-city" className="flex flex-col gap-1 text-sm font-semibold">Thành phố
                <input id="c-city" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="rounded-lg border border-[#DDE1EA] px-3 py-2 font-normal" />
              </label>
            </div>
            <label htmlFor="c-date" className="flex flex-col gap-1 text-sm font-semibold">Ngày tạo
              <input id="c-date" type="date" value={draft.createdAt} onChange={(e) => setDraft({ ...draft, createdAt: e.target.value })} className="rounded-lg border border-[#DDE1EA] px-3 py-2 font-normal" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.newsletter} onChange={(e) => setDraft({ ...draft, newsletter: e.target.checked })} className="h-4 w-4 accent-[#0F766E]" />
              Nhận email khuyến mãi
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className="rounded-lg border border-[#DDE1EA] px-4 py-2 text-sm font-semibold">Hủy</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? "Đang lưu…" : "Lưu"}</button>
            </div>
          </form>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1F2A44]/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="cf-title" className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-6">
            <h2 id="cf-title" className="text-lg font-bold">Xóa khách hàng?</h2>
            <p className="text-sm text-[#5A6478]">{confirm.length === 1 ? `Xóa ${confirm[0].name}. Không thể hoàn tác.` : `Xóa ${confirm.length} khách hàng đã chọn. Không thể hoàn tác.`}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-[#DDE1EA] px-4 py-2 text-sm font-semibold">Hủy</button>
              <button type="button" onClick={() => void doDelete()} className="rounded-lg bg-[#C0392B] px-4 py-2 text-sm font-bold text-white">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" data-testid="toast" className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#1F2A44] px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>
      )}
    </>
  );
}
