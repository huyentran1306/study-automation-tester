import type { Kata } from "@/content/types";

export const KATA_TYPE_LABEL: Record<Kata["type"], string> = {
  js: "Code JS/TS",
  git: "Git",
  loc: "Locator",
  flaky: "Săn flaky",
  api: "API",
  pom: "Refactor POM",
};

export const KATA_TYPE_STYLE: Record<Kata["type"], string> = {
  js: "bg-brand-soft text-brand-dark",
  git: "bg-ai-tint text-ai-dark",
  loc: "bg-ok-soft text-ok-dark",
  flaky: "bg-warn-soft text-warn-dark",
  api: "bg-ai-tint text-ai-dark",
  pom: "bg-brand-soft text-brand-dark",
};

/** XP nhận được sau khi trừ gợi ý: bậc 1–2 trừ 10 XP mỗi bậc, mở lời giải (bậc 3) còn một nửa. */
export function earnedXp(k: Kata, hints: number) {
  if (hints >= 3) return Math.max(5, Math.floor(k.xp / 2) - 20);
  return Math.max(5, k.xp - 10 * hints);
}
