"use client";

import type { MutableRefObject } from "react";
import { Lock, RotateCw } from "lucide-react";

/** Khung "trình duyệt" chứa app Sổ Khách. */
export function BrowserFrame({ frameRef, url, height = 420, onHome, initial = "/practice/login" }: { frameRef: MutableRefObject<HTMLIFrameElement | null>; url: string; height?: number | string; onHome?: () => void; initial?: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 border-b border-line bg-[#F5F8FC] px-2.5 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#B9D3F5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#D9CFF3]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#BFE0D6]" />
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 font-mono text-[11.5px] text-ink-3">
          <Lock size={11} className="flex-none text-ok" />
          <span className="truncate">{url}</span>
        </span>
        {onHome && (
          <button type="button" onClick={onHome} className="rounded-md p-1.5 text-muted hover:bg-white hover:text-brand" aria-label="Mở lại trang đăng nhập">
            <RotateCw size={13} />
          </button>
        )}
      </div>
      <iframe ref={frameRef} title="Trình duyệt luyện tập: Sổ Khách" src={initial} className="w-full bg-white" style={{ height }} />
    </div>
  );
}
