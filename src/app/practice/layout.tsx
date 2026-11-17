import type { Metadata } from "next";
import { HydratedMark } from "@/components/practice/hydrated";

export const metadata: Metadata = { title: "Sổ Khách · App luyện tập" };

// App CRM giả dùng làm "trang web cần test". Giao diện khác hẳn PlayForge để học viên thấy đây là sản phẩm khác.
export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans text-[#1F2A44]">
      <HydratedMark />
      {children}
    </div>
  );
}
