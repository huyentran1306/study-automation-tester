"use client";

// Dữ liệu của app luyện tập "Sổ Khách" (CRM giả). Lưu trong localStorage với tiền tố "sokhach:" để
// bộ chạy test có thể xóa sạch giữa các test (giống mỗi test Playwright có context mới).

import { ACCOUNTS, seedCustomers, type Customer, type Tier } from "./seed";

export { ACCOUNTS, seedCustomers };
export type { Customer, Tier };

export const PREFIX = "sokhach:";
const K_CUSTOMERS = PREFIX + "customers";
const K_SESSION = PREFIX + "session";

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(K_CUSTOMERS);
    if (raw) return JSON.parse(raw) as Customer[];
  } catch {
    /* bỏ qua */
  }
  const s = seedCustomers();
  saveCustomers(s);
  return s;
}

export function saveCustomers(list: Customer[]) {
  try {
    localStorage.setItem(K_CUSTOMERS, JSON.stringify(list));
  } catch {
    /* bỏ qua */
  }
}

export interface Session {
  email: string;
  name: string;
  role: string;
  token?: string;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(K_SESSION);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(K_SESSION, JSON.stringify(s));
    else localStorage.removeItem(K_SESSION);
  } catch {
    /* bỏ qua */
  }
}

/** Xóa toàn bộ dữ liệu Sổ Khách (bộ chạy test gọi trước mỗi test). */
export function resetPractice() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  } catch {
    /* bỏ qua */
  }
}

// ---- Công tắc bug: máy chấm bật từng bug để kiểm tra test của học viên có bắt được không ----
export type Bug =
  | "login-no-error" // sai mật khẩu không báo lỗi
  | "login-wrong-redirect" // đăng nhập đúng nhưng chuyển sang trang khác
  | "login-always-enabled" // nút Đăng nhập không bị khóa khi trống email
  | "add-no-toast" // thêm khách xong không có thông báo
  | "add-wrong-name" // lưu sai tên (mất chữ cuối)
  | "search-broken" // ô tìm kiếm không lọc
  | "count-off" // số khách hiển thị lệch 1
  | "delete-wrong-row" // xóa nhầm dòng đầu tiên
  | "cart-wrong-total" // giỏ hàng cộng sai
  | "rating-off-by-one"; // đánh giá sao lệch 1

export const BUG_KEY = "pf-bug";

export function hasBug(b: Bug): boolean {
  try {
    return (localStorage.getItem(BUG_KEY) ?? "").split(",").includes(b);
  } catch {
    return false;
  }
}

/** Độ trễ giả lập mạng: lúc nhanh lúc chậm, để auto-wait có đất diễn. */
export function netDelay(min = 150, max = 700) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}
