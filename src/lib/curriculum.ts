// Chương trình 16 tuần / 48 buổi, bám theo lịch lớp T2 – T4 – T6 (19:00), khai giảng 23/11/2026.
// Buổi thứ k: bài n của chương c rơi vào buổi n + (c - 1) (mỗi chương có thêm 1 buổi cột mốc ở cuối).

export type PracticeKind = "js" | "git" | "pw" | "api";

export interface LessonMeta {
  n: number; // 1..41
  id: string; // "l07"
  chapter: number; // 1..7
  title: string;
  practice: PracticeKind;
}

export interface ChapterMeta {
  n: number;
  name: string;
  short: string;
  goal: string;
  color: string;
  milestone: { title: string; detail: string; href: string };
  lessons: LessonMeta[];
}

const C: Array<Omit<ChapterMeta, "lessons" | "n"> & { lessons: Array<[string, PracticeKind]> }> = [
  {
    name: "JavaScript & TypeScript cho tester + Git",
    short: "JS/TS + Git",
    goal: "Đọc hiểu và tự viết được code JS/TS dùng trong test: biến, mảng, object, hàm, class, async.",
    color: "#2563C9",
    milestone: { title: "Trạm kiểm tra JS/TS", detail: "20 câu hỏi + 3 bài code, cần 70% để qua.", href: "/kata?chapter=1" },
    lessons: [
      ["Cài Node.js, VS Code và dùng AI trợ giúp đúng cách", "js"],
      ["Biến, kiểu dữ liệu, toán tử, template literal", "js"],
      ["Rẽ nhánh: if/else, ternary, switch, bẫy truthy/falsy", "js"],
      ["Vòng lặp và mảng: map, filter, find, retry có giới hạn", "js"],
      ["Object và JSON: destructuring, spread, ?. và ??", "js"],
      ["Hàm, arrow function, callback, phạm vi biến", "js"],
      ["Git & GitHub: commit, branch, Pull Request, conflict", "git"],
      ["Class và OOP: bước đầu tới Page Object", "js"],
      ["Bất đồng bộ: Promise, async/await, module, try/catch", "js"],
      ["TypeScript cho automation: type, interface, readonly", "js"],
    ],
  },
  {
    name: "Playwright TypeScript + Locator",
    short: "Playwright & Locator",
    goal: "Cài Playwright, viết test đầu tiên và tìm phần tử chính xác bằng locator bền.",
    color: "#5B44B8",
    milestone: { title: "Dự án nhỏ 1", detail: "8 test đăng nhập Sổ Khách trên 3 trình duyệt.", href: "/project" },
    lessons: [
      ["Cài Playwright TS, chạy test mẫu, đọc HTML report", "pw"],
      ["Cấu trúc test: describe, step, skip/only/fixme", "pw"],
      ["Hook, tag và chạy nhóm smoke / regression", "pw"],
      ["Locator có sẵn: getByRole, getByLabel, getByTestId…", "pw"],
      ["XPath và filter: hasText, has, hasNot", "pw"],
      ["Chuột, bàn phím và đọc giá trị phần tử", "pw"],
      ["Checkbox, radio, dropdown, upload và download file", "pw"],
    ],
  },
  {
    name: "Assertion & Auto-waiting",
    short: "Assertion & chờ",
    goal: "Kiểm tra kết quả đúng cách và viết test không flaky.",
    color: "#2F7D6D",
    milestone: { title: "Săn 5 bug flaky", detail: "Mỗi test phải xanh 5 lần liên tiếp.", href: "/kata?type=flaky" },
    lessons: [
      ["Assertion web-first và soft assertion", "pw"],
      ["Auto-waiting, các loại timeout, vì sao bỏ waitForTimeout", "pw"],
      ["Dialog, tab mới, popup, iframe, Shadow DOM", "pw"],
      ["Bảng dữ liệu, date picker, page.evaluate()", "pw"],
      ["Test CRM hoàn chỉnh: tự viết, Codegen, AI viết rồi mình review", "pw"],
    ],
  },
  {
    name: "Page Object Model & Fixture",
    short: "POM & Fixture",
    goal: "Tổ chức code test như dự án thật: dễ đọc, dễ sửa, dùng lại được.",
    color: "#A35B00",
    milestone: { title: "Dự án nhỏ 2", detail: "POM + fixture cho module Khách hàng.", href: "/project" },
    lessons: [
      ["Cấu trúc POM: locator, action, check trong LoginPage", "pw"],
      ["BasePage, thư mục utils, Component Object", "pw"],
      ["Custom fixture với test.extend", "pw"],
      ["Fixture theo test và worker, chaining, mergeTests", "pw"],
      ["Dự án POM cho Sổ Khách có AI hỗ trợ", "pw"],
    ],
  },
  {
    name: "Config, Data-driven & Chạy song song",
    short: "Config & Data",
    goal: "Một bộ test chạy được nhiều môi trường, nhiều bộ dữ liệu, nhiều trình duyệt cùng lúc.",
    color: "#2563C9",
    milestone: { title: "60 test, 3 trình duyệt, dưới 2 phút", detail: "Chạy song song không test nào phụ thuộc nhau.", href: "/kata?chapter=5" },
    lessons: [
      ["playwright.config.ts và projects đa trình duyệt", "pw"],
      ["Khối use: baseURL, viewport, screenshot, video, trace", "pw"],
      ["Đa môi trường dev / staging / prod với .env", "pw"],
      ["storageState: đăng nhập 1 lần, nhiều vai trò", "pw"],
      ["Đọc dữ liệu test từ JSON, CSV, Excel", "pw"],
      ["Data-driven test và dữ liệu ngẫu nhiên với Faker", "pw"],
      ["Workers, fullyParallel, serial và test độc lập", "pw"],
    ],
  },
  {
    name: "API testing + kết hợp UI",
    short: "API testing",
    goal: "Test API bằng request fixture và dùng API để tạo dữ liệu cho test UI.",
    color: "#5B44B8",
    milestone: { title: "Bộ 20 test API", detail: "Cho /lab-api có auth và phân trang.", href: "/api-lab" },
    lessons: [
      ["HTTP căn bản, GET/POST/PUT/DELETE với request fixture", "api"],
      ["Token, Basic Auth, API key, phân trang, upload; cấu trúc API framework", "api"],
      ["Chặn và mock mạng với route/fulfill; tạo dữ liệu bằng API rồi kiểm tra trên UI", "api"],
    ],
  },
  {
    name: "Debug, Report, CI/CD & Framework",
    short: "Report & CI",
    goal: "Sửa lỗi nhanh, có báo cáo đẹp, tự chạy trên GitHub Actions.",
    color: "#2F7D6D",
    milestone: { title: "Dự án cuối khóa", detail: "Framework hoàn chỉnh + portfolio GitHub.", href: "/project" },
    lessons: [
      ["UI Mode, Trace Viewer, Inspector, page.pause()", "pw"],
      ["HTML report và Allure: đính kèm ảnh, video, trace", "pw"],
      ["CI/CD với GitHub Actions: push, PR, lịch chạy, secrets", "pw"],
      ["Dựng framework hoàn chỉnh cùng AI", "pw"],
    ],
  },
];

let counter = 0;
export const CHAPTERS: ChapterMeta[] = C.map((c, i) => ({
  ...c,
  n: i + 1,
  lessons: c.lessons.map(([title, practice]) => {
    counter += 1;
    return { n: counter, id: lessonId(counter), chapter: i + 1, title, practice };
  }),
}));

export const LESSONS: LessonMeta[] = CHAPTERS.flatMap((c) => c.lessons);
export const TOTAL_LESSONS = LESSONS.length; // 41
export const TOTAL_SESSIONS = TOTAL_LESSONS + CHAPTERS.length; // 48
export const TOTAL_WEEKS = 16;

export function lessonId(n: number) {
  return "l" + String(n).padStart(2, "0");
}

export function getLesson(id: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getChapter(n: number): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.n === n);
}

/** Buổi học (1..48) của một bài. */
export function sessionOfLesson(l: LessonMeta) {
  return l.n + (l.chapter - 1);
}

/** Buổi cột mốc (1..48) của một chương. */
export function milestoneSession(chapter: number) {
  const ch = getChapter(chapter)!;
  return sessionOfLesson(ch.lessons[ch.lessons.length - 1]) + 1;
}

/** Khoảng buổi [đầu, cuối] của một chương, tính cả buổi cột mốc. */
export function chapterSessions(chapter: number): [number, number] {
  const ch = getChapter(chapter)!;
  return [sessionOfLesson(ch.lessons[0]), milestoneSession(chapter)];
}

// ---- Lịch ----
export const COURSE_START = "2026-11-23"; // Thứ Hai
const OFFSETS = [0, 2, 4]; // T2, T4, T6

function parseDay(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function fmtDay(d: Date) {
  return d.toISOString().slice(0, 10);
}
export function addDays(s: string, n: number) {
  const d = parseDay(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDay(d);
}
export function diffDays(a: string, b: string) {
  return Math.round((parseDay(a).getTime() - parseDay(b).getTime()) / 86400000);
}

/** Ngày (YYYY-MM-DD) của buổi k (1..48). */
export function sessionDate(k: number, start = COURSE_START) {
  const week = Math.floor((k - 1) / 3);
  return addDays(start, week * 7 + OFFSETS[(k - 1) % 3]);
}

/** Tuần (1..16) của buổi k. */
export function sessionWeek(k: number) {
  return Math.floor((k - 1) / 3) + 1;
}

/** Buổi học gần nhất đã diễn ra hoặc diễn ra hôm nay (0 nếu chưa khai giảng). */
export function currentSession(today: string, start = COURSE_START) {
  let k = 0;
  for (let i = 1; i <= TOTAL_SESSIONS; i++) {
    if (diffDays(sessionDate(i, start), today) <= 0) k = i;
    else break;
  }
  return k;
}

/** Tuần hiện tại (0 nếu chưa khai giảng, tối đa 16). */
export function currentWeek(today: string, start = COURSE_START) {
  const d = diffDays(today, start);
  if (d < 0) return 0;
  return Math.min(TOTAL_WEEKS, Math.floor(d / 7) + 1);
}

/** Bài học được dạy ở buổi k (hoặc null nếu là buổi cột mốc). */
export function lessonAtSession(k: number): LessonMeta | null {
  return LESSONS.find((l) => sessionOfLesson(l) === k) ?? null;
}

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export function fmtDateVi(s: string, withWeekday = true) {
  const d = parseDay(s);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const base = `${dd}/${mm}/${d.getUTCFullYear()}`;
  return withWeekday ? `${WEEKDAY[d.getUTCDay()]}, ${base}` : base;
}
export function weekdayOf(s: string) {
  return parseDay(s).getUTCDay();
}
