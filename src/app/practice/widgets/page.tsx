"use client";

import { useEffect, useRef, useState } from "react";
import { PracticeHeader } from "@/components/practice/header";
import { hasBug, netDelay } from "@/lib/practice/store";

// Trang "Thành phần" của Sổ Khách: đủ loại phần tử để luyện bài 16, 17, 20, 21.

const Card = ({ title, children, id }: { title: string; children: React.ReactNode; id: string }) => (
  <section aria-labelledby={id} className="flex flex-col gap-3 rounded-xl border border-[#E3E6EE] bg-white p-5">
    <h2 id={id} className="text-base font-bold">{title}</h2>
    {children}
  </section>
);

const PAY_FRAME = `<!doctype html><html lang="vi"><body style="font-family:system-ui;margin:0;padding:14px;background:#F8FAFC">
<form id="f" style="display:flex;flex-direction:column;gap:8px">
<label for="card">Số thẻ</label><input id="card" style="padding:8px;border:1px solid #CBD5E1;border-radius:6px">
<label for="cvv">CVV</label><input id="cvv" style="padding:8px;border:1px solid #CBD5E1;border-radius:6px;width:80px">
<button type="submit" style="padding:8px;background:#0F766E;color:#fff;border:0;border-radius:6px;font-weight:700">Thanh toán</button>
<p id="msg" role="status" style="margin:0;font-weight:600"></p></form>
<script>document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();var n=document.getElementById('card').value.replace(/\\s/g,'');var m=document.getElementById('msg');setTimeout(function(){m.textContent=n.length===16?'Thanh toán thành công':'Số thẻ phải có 16 chữ số';m.style.color=n.length===16?'#0F766E':'#A3241A';},400);});</script>
</body></html>`;

function useRatingElement() {
  useEffect(() => {
    if (customElements.get("sk-rating")) return;
    class Rating extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = `<style>button{font:inherit;padding:4px 8px;margin-right:4px;border:1px solid #DDE1EA;border-radius:6px;background:#fff;cursor:pointer}p{margin:8px 0 0}</style>
          <div role="group" aria-label="Đánh giá dịch vụ">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}">${n} sao</button>`).join("")}</div><p data-testid="rating-result">Chưa đánh giá</p>`;
        root.querySelectorAll("button").forEach((b) =>
          b.addEventListener("click", () => {
            const n = Number(b.getAttribute("data-n")) - (hasBug("rating-off-by-one") ? 1 : 0);
            (root.querySelector("p") as HTMLElement).textContent = `Bạn chọn: ${n} sao`;
          }),
        );
      }
    }
    customElements.define("sk-rating", Rating);
  }, []);
}

export default function Widgets() {
  useRatingElement();
  const [likes, setLikes] = useState(0);
  const [ctx, setCtx] = useState(false);
  const [hover, setHover] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [plan, setPlan] = useState("Cơ bản");
  const [city, setCity] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("Tiếng Việt");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [dlgResult, setDlgResult] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(2026, 11, 1));
  const [date, setDate] = useState("");
  const [order, setOrder] = useState(["Gọi lại khách VIP", "Gửi báo giá", "Cập nhật hợp đồng"]);
  const dragIdx = useRef<number | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [adding, setAdding] = useState(0);
  const PRODUCTS = [
    { name: "Gói Cơ bản", price: 99000 },
    { name: "Gói Nâng cao", price: 199000 },
  ];
  const addToCart = async (price: number) => {
    setAdding((n) => n + 1);
    // Giả lập máy chủ: lúc nhanh lúc chậm
    await netDelay(200, 1200);
    setCart((c) => [...c, price]);
    setAdding((n) => n - 1);
  };
  const total = cart.reduce((a, b) => a + b, 0) + (hasBug("cart-wrong-total") && cart.length > 1 ? 1000 : 0);

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthLabel = `Tháng ${month.getMonth() + 1}/${month.getFullYear()}`;

  const download = () => {
    const blob = new Blob(["id,ten,hang\n101,Nguyễn Minh Anh,VIP\n"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bao-cao-khach-hang.csv";
    a.click();
  };

  return (
    <>
      <PracticeHeader />
      <main className="mx-auto grid max-w-6xl gap-4 px-5 py-6 md:grid-cols-2">
        <h1 className="text-2xl font-extrabold md:col-span-2">Thành phần</h1>

        <Card title="Giỏ hàng" id="w-cart">
          <ul aria-label="Sản phẩm" className="flex flex-col gap-2 text-sm">
            {PRODUCTS.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#E3E6EE] px-3 py-2">
                <span><b>{p.name}</b> · {p.price.toLocaleString("vi-VN")} ₫</span>
                <button type="button" onClick={() => void addToCart(p.price)} aria-label={`Thêm ${p.name} vào giỏ`} className="rounded-md bg-[#0F766E] px-3 py-1.5 text-xs font-bold text-white">Thêm vào giỏ</button>
              </li>
            ))}
          </ul>
          <p className="text-sm">Giỏ hàng: <b data-testid="cart-count">{cart.length}</b> món · Tổng <b data-testid="cart-total">{total.toLocaleString("vi-VN")} ₫</b>{adding > 0 && <span className="ml-2 text-[#5A6478]">(đang cập nhật…)</span>}</p>
        </Card>

        <Card title="Chuột" id="w-mouse">
          <div className="flex flex-wrap gap-2">
            <button type="button" onDoubleClick={() => setLikes(likes + 1)} className="rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm font-semibold">Nhấn đúp để thích</button>
            <span data-testid="like-count" className="self-center text-sm">{likes} lượt thích</span>
          </div>
          <div onContextMenu={(e) => { e.preventDefault(); setCtx(true); }} className="rounded-lg border border-dashed border-[#B8C0CF] p-3 text-sm text-[#5A6478]">Nhấn chuột phải vào đây</div>
          {ctx && (
            <ul role="menu" aria-label="Menu ngữ cảnh" className="w-48 rounded-lg border border-[#DDE1EA] bg-white p-1 text-sm shadow">
              {["Sao chép", "Đổi tên", "Lưu trữ"].map((m) => <li key={m} role="menuitem" tabIndex={-1} className="cursor-pointer rounded px-2 py-1.5 hover:bg-[#F4F6FA]" onClick={() => { setCtx(false); setDlgResult(`Đã chọn: ${m}`); }}>{m}</li>)}
            </ul>
          )}
          <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <button type="button" className="rounded-lg bg-[#F0F2F6] px-3 py-2 text-sm font-semibold">Tài khoản ▾</button>
            {hover && (
              <div role="menu" aria-label="Tài khoản" className="absolute left-0 top-full z-10 mt-1 w-44 rounded-lg border border-[#DDE1EA] bg-white p-1 text-sm shadow">
                <button type="button" role="menuitem" className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#F4F6FA]" onClick={() => setDlgResult("Mở hồ sơ")}>Hồ sơ của tôi</button>
                <button type="button" role="menuitem" className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#F4F6FA]" onClick={() => setDlgResult("Mở cài đặt")}>Cài đặt</button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Bàn phím" id="w-key">
          <label htmlFor="quick-note" className="text-sm font-semibold">Ghi chú nhanh (Enter để thêm)</label>
          <input
            id="quick-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && note.trim()) {
                setNotes([...notes, note.trim()]);
                setNote("");
              }
              if (e.key === "Escape") setNote("");
            }}
            className="rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm"
          />
          <ul aria-label="Danh sách ghi chú" className="list-disc pl-5 text-sm">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </Card>

        <Card title="Lựa chọn" id="w-choice">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 accent-[#0F766E]" />Tôi đồng ý điều khoản</label>
          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1 font-semibold">Gói dịch vụ</legend>
            {["Cơ bản", "Nâng cao", "Doanh nghiệp"].map((p) => (
              <label key={p} className="flex items-center gap-2"><input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="accent-[#0F766E]" />{p}</label>
            ))}
          </fieldset>
          <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold">Tỉnh/Thành
            <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-[#DDE1EA] px-2 py-1.5 font-normal">
              <option value="">-- Chọn --</option>
              <option value="HN">Hà Nội</option>
              <option value="DN">Đà Nẵng</option>
              <option value="HCM">TP.HCM</option>
            </select>
          </label>
          <div className="relative text-sm">
            <span id="lang-label" className="font-semibold">Ngôn ngữ</span>
            <button type="button" role="combobox" aria-labelledby="lang-label" aria-expanded={langOpen} aria-controls="lang-list" onClick={() => setLangOpen(!langOpen)} className="ml-2 rounded-lg border border-[#DDE1EA] px-3 py-1.5">{lang} ▾</button>
            {langOpen && (
              <ul id="lang-list" role="listbox" aria-label="Ngôn ngữ" className="absolute z-10 mt-1 w-44 rounded-lg border border-[#DDE1EA] bg-white p-1 shadow">
                {["Tiếng Việt", "English", "日本語"].map((l) => (
                  <li key={l} role="option" aria-selected={lang === l} className="cursor-pointer rounded px-2 py-1.5 hover:bg-[#F4F6FA]" onClick={() => { setLang(l); setLangOpen(false); }}>{l}</li>
                ))}
              </ul>
            )}
          </div>
          <p data-testid="choice-summary" className="text-sm text-[#5A6478]">{agree ? "Đã đồng ý" : "Chưa đồng ý"} · Gói {plan} · {city || "chưa chọn tỉnh"} · {lang}</p>
        </Card>

        <Card title="Tệp" id="w-file">
          <label htmlFor="contract" className="text-sm font-semibold">Tải hợp đồng lên</label>
          <input id="contract" type="file" accept=".pdf,.png,.jpg" onChange={(e) => { const f = e.target.files?.[0]; setFile(f ? { name: f.name, size: f.size } : null); }} className="text-sm" />
          <p data-testid="upload-result" className="text-sm">{file ? `Đã chọn: ${file.name} (${Math.round(file.size / 1024)} KB)` : "Chưa chọn tệp"}</p>
          <button type="button" onClick={download} className="self-start rounded-lg bg-[#0F766E] px-3 py-2 text-sm font-bold text-white">Tải báo cáo CSV</button>
        </Card>

        <Card title="Hộp thoại trình duyệt" id="w-dialog">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm font-semibold" onClick={() => { window.alert("Phiên làm việc sắp hết hạn"); setDlgResult("Đã đóng thông báo"); }}>Hiện thông báo</button>
            <button type="button" className="rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm font-semibold" onClick={() => setDlgResult(window.confirm("Bạn chắc chắn muốn hủy đơn?") ? "Đã hủy đơn" : "Giữ đơn")}>Hỏi xác nhận</button>
            <button type="button" className="rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm font-semibold" onClick={() => { const n = window.prompt("Nhập tên người nhận"); setDlgResult(n ? `Người nhận: ${n}` : "Chưa nhập tên"); }}>Nhập tên</button>
          </div>
          <p data-testid="dialog-result" role="status" className="text-sm">{dlgResult || "Chưa có thao tác"}</p>
        </Card>

        <Card title="Iframe thanh toán" id="w-iframe">
          <iframe title="Cổng thanh toán" srcDoc={PAY_FRAME} className="h-[230px] w-full rounded-lg border border-[#E3E6EE]" />
        </Card>

        <Card title="Shadow DOM" id="w-shadow">
          {/* @ts-expect-error: custom element */}
          <sk-rating></sk-rating>
        </Card>

        <Card title="Chọn ngày" id="w-date">
          <label htmlFor="appt" className="text-sm font-semibold">Ngày hẹn</label>
          <input id="appt" readOnly value={date} placeholder="dd/mm/yyyy" onClick={() => setCalOpen(true)} className="w-44 cursor-pointer rounded-lg border border-[#DDE1EA] px-3 py-2 text-sm" />
          {calOpen && (
            <div role="dialog" aria-label="Lịch" className="w-72 rounded-xl border border-[#DDE1EA] bg-white p-3 shadow">
              <div className="mb-2 flex items-center justify-between text-sm font-bold">
                <button type="button" aria-label="Tháng trước" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded px-2 hover:bg-[#F4F6FA]">‹</button>
                <span data-testid="cal-month">{monthLabel}</span>
                <button type="button" aria-label="Tháng sau" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded px-2 hover:bg-[#F4F6FA]">›</button>
              </div>
              <div role="grid" className="grid grid-cols-7 gap-1 text-center text-sm">
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                  <button key={d} type="button" role="gridcell" onClick={() => { setDate(`${String(d).padStart(2, "0")}/${String(month.getMonth() + 1).padStart(2, "0")}/${month.getFullYear()}`); setCalOpen(false); }} className="rounded py-1 hover:bg-[#E6F4F1]">{d}</button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Kéo thả" id="w-drag">
          <ol aria-label="Việc ưu tiên" className="flex flex-col gap-1.5 text-sm">
            {order.map((t, i) => (
              <li
                key={t}
                draggable
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIdx.current;
                  if (from === null || from === i) return;
                  const next = [...order];
                  const [m] = next.splice(from, 1);
                  next.splice(i, 0, m);
                  setOrder(next);
                }}
                className="cursor-grab rounded-lg border border-[#DDE1EA] bg-[#F8FAFC] px-3 py-2"
              >
                {i + 1}. {t}
              </li>
            ))}
          </ol>
        </Card>
      </main>
    </>
  );
}
