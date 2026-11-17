import type { Card, Kata, LessonContent } from "./types";
import { L01, L02, L03, L04, L05 } from "./ch1a";
import { L06, L07, L08, L09, L10 } from "./ch1b";
import { KATA_CH1 } from "./kata-ch1";
import { L11, L12, L13, L14, L15, L16, L17 } from "./ch2";
import { KATA_CH2 } from "./kata-ch2";
import { L18, L19, L20, L21, L22 } from "./ch3";
import { KATA_CH3 } from "./kata-ch3";
import { L35, L36, L37 } from "./ch6";
import { KATA_CH6 } from "./kata-ch6";
import { L23, L24, L25, L26, L27 } from "./ch4";
import { KATA_CH4 } from "./kata-ch4";
import { L28, L29, L30, L31, L32, L33, L34 } from "./ch5";
import { KATA_CH5 } from "./kata-ch5";
import { L38, L39, L40, L41 } from "./ch7";
import { KATA_CH7 } from "./kata-ch7";

// Nội dung đã viết. Bài chưa có nội dung sẽ hiện dàn ý và ngày mở.
const LESSON_CONTENT: Record<string, LessonContent> = Object.fromEntries(
  [L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, L14, L15, L16, L17, L18, L19, L20, L21, L22, L23, L24, L25, L26, L27, L28, L29, L30, L31, L32, L33, L34, L35, L36, L37, L38, L39, L40, L41].map((l) => [l.id, l]),
);

export const KATAS: Kata[] = [...KATA_CH1, ...KATA_CH2, ...KATA_CH3, ...KATA_CH4, ...KATA_CH5, ...KATA_CH6, ...KATA_CH7];

export function getLessonContent(id: string): LessonContent | undefined {
  return LESSON_CONTENT[id];
}

export function hasContent(id: string) {
  return id in LESSON_CONTENT;
}

export function getKata(id: string): Kata | undefined {
  return KATAS.find((k) => k.id === id);
}

export function katasOfLesson(lessonId: string): Kata[] {
  return KATAS.filter((k) => k.lesson === lessonId);
}

/** Toàn bộ thẻ ôn, kèm bài nguồn. */
export const ALL_CARDS: (Card & { lesson: string })[] = Object.values(LESSON_CONTENT).flatMap((l) =>
  l.cards.map((c) => ({ ...c, lesson: l.id })),
);

export function getCard(id: string) {
  return ALL_CARDS.find((c) => c.id === id);
}
