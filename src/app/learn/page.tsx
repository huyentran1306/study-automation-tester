"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/progress/store";
import { LESSONS } from "@/lib/curriculum";

// /learn → mở bài đang học dở (hoặc bài đầu tiên chưa xong).
export default function LearnIndex() {
  const { state, ready } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const l = LESSONS.find((x) => !state.lessons[x.id]?.doneAt) ?? LESSONS[0];
    router.replace(`/learn/${l.id}`);
  }, [ready, state.lessons, router]);
  return <div className="p-8 text-sm text-muted">Đang mở bài học…</div>;
}
