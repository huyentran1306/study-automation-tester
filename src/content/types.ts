import type { Repo } from "@/lib/git/sim";
import type { Bug } from "@/lib/practice/store";

// Nội dung bài học viết bằng dữ liệu TS (không dùng MDX) để render thống nhất và gắn được quiz, code chạy thử.
// md: markdown rút gọn, hỗ trợ `code`, **đậm**, *nghiêng*.

export type Block =
  | { t: "p"; md: string }
  | { t: "h"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "code"; lang: "ts" | "js" | "bash" | "json" | "text"; code: string; title?: string; run?: boolean }
  | { t: "callout"; tone: "tip" | "warn" | "real"; title: string; md: string }
  | { t: "quiz"; id: string; q: string; options: string[]; answer: number; explain: string };

export interface Section {
  id: string;
  title: string;
  minutes: number;
  blocks: Block[];
}

export interface Card {
  id: string;
  tag: string;
  q: string;
  a: string;
  code?: string;
}

export interface LessonContent {
  id: string; // "l07"
  summary: string;
  sections: Section[];
  cards: Card[];
  kata: string[]; // id thử thách của bài
  /** Code mở sẵn trong khu chạy thử bên phải (bài JS/TS, hoặc file spec với bài Playwright). */
  starter?: string;
  /** Bài Playwright: khu chạy thử là trình duyệt Sổ Khách. */
  pw?: boolean;
  /** Kịch bản Git Sandbox (bài Git). */
  git?: string;
}

export type KataType = "js" | "git" | "loc" | "flaky" | "api" | "pom";

export interface GitGoal {
  label: string;
  check: (r: Repo) => boolean;
}

export interface Kata {
  id: string;
  lesson: string; // "l04"
  chapter: number;
  type: KataType;
  title: string;
  difficulty: 1 | 2 | 3;
  xp: number;
  prompt: string; // các đoạn cách nhau bằng dòng trống
  starter?: string;
  /** Test ẩn (JS) chạy sau code của học viên, dùng test() / expect(). */
  tests?: string;
  /** Luật cấm, ví dụ không dùng any, không dùng waitForTimeout. */
  forbid?: { pattern: string; message: string }[];
  /** Kịch bản Git + mục tiêu (bài Git). */
  git?: { scenario: string; goals: GitGoal[] };
  /** "pw": code học viên là file spec Playwright, chạy bằng pw-lite trên app Sổ Khách. */
  runner?: "js" | "pw";
  /** Tệp có sẵn trong dự án (page object, fixture…) để học viên import. */
  files?: Record<string, string>;
  /** Mutation testing: bật từng bug, test của học viên phải fail ít nhất 1 test. */
  mutants?: { bug: Bug; label: string }[];
  /** Chống flaky: phải pass N lượt liên tiếp. */
  repeat?: number;
  /** Mỗi test phải xanh khi chạy riêng lẻ (phát hiện test phụ thuộc nhau). */
  isolate?: boolean;
  /** Bắt buộc dùng (ví dụ test.step, beforeEach). */
  require?: { pattern: string; message: string }[];
  hints: [string, string, string];
}
