"use client";

import { useApp } from "@/lib/progress/store";

const LABEL: Record<string, [string, string]> = {
  local: ["Chỉ lưu trên máy này", "#8A93A3"],
  loading: ["Đang tải tiến độ…", "#8A93A3"],
  saving: ["Đang lưu…", "#2563C9"],
  saved: ["Đã đồng bộ với máy chủ", "#2F7D6D"],
  offline: ["Mất mạng · sẽ lưu khi có mạng lại", "#A35B00"],
  error: ["Chưa lưu được · sẽ thử lại", "#B42318"],
};

export function SyncBadge() {
  const { sync, savedAt } = useApp();
  const [text, color] = LABEL[sync];
  const time = sync === "saved" && savedAt ? " · " + new Date(savedAt.replace(" ", "T") + (savedAt.includes("Z") ? "" : "Z")).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color }} role="status">
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      {text}
      {time}
    </span>
  );
}
