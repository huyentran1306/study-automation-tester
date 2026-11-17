// Dữ liệu mẫu Sổ Khách: dùng chung cho app (trình duyệt) và /lab-api (máy chủ). File thuần.

export type Tier = "VIP" | "Mới" | "Thường";

export interface Customer {
  id: number;
  name: string;
  email: string;
  tier: Tier;
  city: string;
  createdAt: string; // YYYY-MM-DD
  newsletter: boolean;
}

export const TIERS: Tier[] = ["VIP", "Mới", "Thường"];

export const ACCOUNTS = [
  { email: "linh@sokhach.vn", password: "Matkhau@123", name: "Trần Khánh Linh", role: "admin" },
  { email: "ha@sokhach.vn", password: "Matkhau@123", name: "Trần Thu Hà", role: "manager" },
  { email: "khach@sokhach.vn", password: "Matkhau@123", name: "Khách xem", role: "viewer" },
] as const;

export const API_KEY = "sk_test_sokhach_2026";

const SEED_NAMES = [
  ["Nguyễn Minh Anh", "VIP", "Hà Nội"], ["Trần Thu Hà", "Mới", "Đà Nẵng"], ["Lê Bảo Ngọc", "VIP", "TP.HCM"], ["Phạm Gia Hân", "Thường", "Huế"],
  ["Võ Ngọc Trâm", "Thường", "Cần Thơ"], ["Đặng Quỳnh Như", "Mới", "Hà Nội"], ["Bùi An Nhiên", "Thường", "Hải Phòng"], ["Hoàng Phương Mai", "VIP", "TP.HCM"],
  ["Lý Minh Châu", "Thường", "Đà Lạt"], ["Ngô Thảo Vy", "Mới", "Nha Trang"], ["Đỗ Khánh Vân", "Thường", "Hà Nội"], ["Dương Hải Yến", "Thường", "Vinh"],
  ["Huỳnh Mỹ Linh", "VIP", "Đà Nẵng"], ["Mai Tường Vi", "Thường", "Quy Nhơn"], ["Trịnh Bích Ngọc", "Mới", "TP.HCM"], ["Phan Thùy Dung", "Thường", "Hà Nội"],
  ["Tạ Ngọc Diệp", "Thường", "Huế"], ["Lâm Gia Linh", "Mới", "Cần Thơ"], ["Châu Kim Ngân", "VIP", "TP.HCM"], ["Vũ Hồng Nhung", "Thường", "Bắc Ninh"],
  ["Kiều Thanh Tâm", "Thường", "Hà Nội"], ["Tô Diễm Quỳnh", "Mới", "Đà Nẵng"], ["Lưu Phương Thảo", "Thường", "Vũng Tàu"], ["Quách Mỹ Duyên", "Thường", "Hà Nội"],
  ["Cao Ngọc Ánh", "VIP", "TP.HCM"],
] as const;

function slug(name: string) {
  const s = name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().split(" ");
  return s[s.length - 1] + "." + s[0];
}

export function seedCustomers(): Customer[] {
  return SEED_NAMES.map(([name, tier, city], i) => ({
    id: 101 + i,
    name,
    email: `${slug(name)}@mail.vn`,
    tier: tier as Tier,
    city,
    createdAt: `2026-${String(1 + (i % 11)).padStart(2, "0")}-${String(3 + ((i * 7) % 25)).padStart(2, "0")}`,
    newsletter: i % 3 === 0,
  }));
}
