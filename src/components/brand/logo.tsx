// Logo PlayForge: nút Play (Playwright) chứa dấu tích (test pass), tia lửa rèn ở góc (Forge).

export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="PlayForge" className={className}>
      <rect width="64" height="64" rx="17" fill="#2563C9" />
      <rect x="1.5" y="1.5" width="61" height="61" rx="15.5" fill="none" stroke="#1D4E9E" strokeOpacity="0.35" strokeWidth="1" />
      {/* Nút Play bo góc */}
      <path d="M21.5 17.8c0-2.4 2.6-3.9 4.7-2.7l21.3 12.4c2.1 1.2 2.1 4.2 0 5.4L26.2 45.3c-2.1 1.2-4.7-.3-4.7-2.7z" fill="#FFFFFF" />
      {/* Dấu tích: test pass */}
      <path d="M27.3 31.4l4.2 4.3 7.6-8" fill="none" stroke="#2563C9" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Tia lửa rèn */}
      <path d="M49.5 7.5c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" fill="#FCD34D" />
      <circle cx="57" cy="24" r="1.5" fill="#FCD34D" fillOpacity="0.85" />
    </svg>
  );
}

export function Logo({ size = 34, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[19px] font-extrabold tracking-tight">
          Play<span className="text-brand">Forge</span>
        </span>
        {sub && <span className="text-[11px] text-muted">Xưởng luyện Automation</span>}
      </span>
    </span>
  );
}
