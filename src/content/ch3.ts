import type { LessonContent } from "./types";

// Chương 3 · Assertion & Auto-waiting (bài 18–22).

const LOGIN = `  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();`;

const ASSERT = `import { test, expect } from '@playwright/test';

test('assertion web-first và soft', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('sai');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  // Web-first: tự thử lại tới khi đúng (mặc định 5 giây)
  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page.getByTestId('login-error')).toHaveText('Email hoặc mật khẩu không đúng');
  await expect(page).toHaveURL(/login/);

  // Soft: ghi nhận lỗi rồi chạy tiếp, cuối test mới báo đỏ
  await expect.soft(page.getByLabel('Email')).toHaveValue('linh@sokhach.vn');
  await expect.soft(page.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled();

  // Assertion thường: so sánh giá trị đã có, KHÔNG chờ
  const title = await page.title();
  expect(title).toContain('Sổ Khách');
});
`;

export const L18: LessonContent = {
  id: "l18",
  pw: true,
  summary: "Assertion quyết định test xanh hay đỏ. Phân biệt assertion web-first (tự chờ) với assertion thường (không chờ), và dùng soft assertion để thấy hết lỗi trong một lần chạy.",
  starter: ASSERT,
  kata: ["k-l18-soft"],
  sections: [
    {
      id: "webfirst",
      title: "Assertion web-first",
      minutes: 6,
      blocks: [
        { t: "p", md: "`await expect(locator).toHaveText(...)` hỏi lại trang liên tục cho tới khi đúng hoặc hết thời gian (mặc định 5 giây). Đây là cách Playwright chống flaky." },
        { t: "list", items: ["Hiển thị: `toBeVisible`, `toBeHidden`", "Trạng thái: `toBeEnabled`, `toBeDisabled`, `toBeChecked`, `toBeEditable`, `toBeFocused`", "Nội dung: `toHaveText`, `toContainText`, `toHaveValue`, `toHaveAttribute`, `toHaveClass`", "Số lượng: `toHaveCount`", "Trang: `expect(page).toHaveURL(...)`, `toHaveTitle(...)`", "Phủ định: thêm `.not`, ví dụ `expect(toast).not.toBeVisible()`"] },
        { t: "code", lang: "ts", run: true, code: ASSERT },
      ],
    },
    {
      id: "generic",
      title: "Assertion thường và soft assertion",
      minutes: 5,
      blocks: [
        { t: "p", md: "`expect(giá_trị).toBe(...)` so sánh ngay giá trị đã lấy ra, không chờ. Dùng cho dữ liệu đã có (biến, response API), không dùng cho chữ trên trang." },
        { t: "p", md: "`expect.soft(...)` không dừng test khi sai. Hợp khi kiểm tra nhiều trường của một form: chạy 1 lần thấy hết trường sai." },
        { t: "quiz", id: "q1", q: "Toast hiện sau 1 giây. Assertion nào đúng?", options: ["expect(await toast.textContent()).toBe('Đã lưu')", "await expect(toast).toHaveText('Đã lưu')", "await page.waitForTimeout(1000) rồi so sánh"], answer: 1, explain: "toHaveText tự chờ tới khi chữ khớp; textContent đọc ngay lập tức nên dễ ra chuỗi rỗng." },
      ],
    },
  ],
  cards: [
    { id: "c-l18-1", tag: "Assertion", q: "Assertion web-first là gì?", a: "Assertion trên locator/page tự thử lại tới khi đúng hoặc hết timeout, ví dụ toHaveText, toBeVisible." },
    { id: "c-l18-2", tag: "Assertion", q: "Khi nào dùng expect.soft?", a: "Khi muốn kiểm tra nhiều điểm trong một test và thấy hết lỗi, không dừng ở lỗi đầu tiên." },
  ],
};

const WAIT = `import { test, expect } from '@playwright/test';

test('auto-waiting: không cần sleep', async ({ page }) => {
${LOGIN}
  await page.getByRole('link', { name: 'Thành phần' }).click();

  await page.getByRole('button', { name: 'Thêm Gói Cơ bản vào giỏ' }).click();
  // Máy chủ trả lời sau 0,2 – 1,2 giây. toHaveText tự chờ.
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // Đổi timeout cho riêng một assertion
  await expect(page.getByTestId('cart-total')).toHaveText('99.000 ₫', { timeout: 10_000 });
});
`;

export const L19: LessonContent = {
  id: "l19",
  pw: true,
  summary: "Playwright tự chờ trước mỗi thao tác và trong mỗi assertion web-first. Hiểu các loại timeout, vì sao test flaky, và vì sao waitForTimeout là thói quen xấu.",
  starter: WAIT,
  kata: ["k-l19-flaky"],
  sections: [
    {
      id: "autowait",
      title: "Auto-waiting làm gì",
      minutes: 6,
      blocks: [
        { t: "p", md: "Trước khi click, Playwright chờ phần tử: có trong trang, đang hiển thị, đứng yên, không bị che, không disabled. Bạn không cần tự viết vòng chờ." },
        { t: "code", lang: "ts", run: true, code: WAIT },
        { t: "callout", tone: "tip", title: "Thử xem bị che", md: "Bấm nút Xóa ở một dòng khi hộp thoại xác nhận đang mở: Playwright báo phần tử khác \"intercepts pointer events\" và chờ, đúng như người dùng không bấm được." },
      ],
    },
    {
      id: "timeouts",
      title: "Các loại timeout",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`timeout` của test (mặc định 30 giây): cả test phải xong trong khoảng này", "`expect.timeout` (5 giây): mỗi assertion web-first", "`actionTimeout`, `navigationTimeout`: mặc định không giới hạn riêng, nên đặt trong config", "`waitUntil` của goto: `load` (mặc định), `domcontentloaded`, `networkidle` (không khuyến khích)"] },
        { t: "code", lang: "ts", title: "playwright.config.ts", code: "export default defineConfig({\n  timeout: 30_000,\n  expect: { timeout: 5_000 },\n  use: { actionTimeout: 10_000, navigationTimeout: 15_000 },\n});" },
      ],
    },
    {
      id: "flaky",
      title: "Test flaky và waitForTimeout",
      minutes: 6,
      blocks: [
        { t: "p", md: "Test **flaky** là test lúc xanh lúc đỏ dù code không đổi. Nguyên nhân hay gặp:" },
        { t: "list", items: ["Đọc giá trị ngay (`textContent()` rồi `toBe`) thay vì assertion web-first", "Chờ cứng `waitForTimeout(2000)`: máy chậm thì vẫn thiếu, máy nhanh thì phí thời gian", "Test phụ thuộc nhau, phụ thuộc thứ tự chạy, dùng chung dữ liệu", "Locator bám vị trí (nth, XPath tr[2]) khi dữ liệu thay đổi"] },
        { t: "callout", tone: "warn", title: "Tăng timeout không phải là sửa", md: "Nếu test cần 6 giây mới xanh, hãy tìm thứ cần chờ và chờ nó bằng assertion. Tăng timeout chỉ giấu vấn đề." },
        { t: "quiz", id: "q1", q: "Test đỏ 1/5 lần ở dòng expect(await count.textContent()).toBe('2'). Sửa thế nào?", options: ["Thêm waitForTimeout(3000) phía trước", "await expect(count).toHaveText('2')", "Tăng retries lên 3"], answer: 1, explain: "Assertion web-first chờ đúng lúc giá trị đổi. Retries chỉ che giấu test flaky." },
      ],
    },
  ],
  cards: [
    { id: "c-l19-1", tag: "Chờ", q: "Vì sao tránh waitForTimeout?", a: "Chờ cứng: máy chậm vẫn thiếu, máy nhanh phí thời gian. Dùng assertion web-first để chờ đúng điều kiện." },
    { id: "c-l19-2", tag: "Chờ", q: "Trước khi click, Playwright chờ những gì?", a: "Phần tử có trong trang, hiển thị, đứng yên, nhận được click (không bị che), enabled." },
    { id: "c-l19-3", tag: "Chờ", q: "Đổi timeout cho riêng 1 assertion?", a: "Truyền tùy chọn timeout.", code: "await expect(el).toHaveText('Xong', { timeout: 10_000 });" },
  ],
};

const FRAMES = `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
${LOGIN}
  await page.getByRole('link', { name: 'Thành phần' }).click();
});

test('hộp thoại trình duyệt', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Hỏi xác nhận' }).click();
  await expect(page.getByTestId('dialog-result')).toHaveText('Đã hủy đơn');

  page.once('dialog', (dialog) => dialog.accept('Trần Khánh Linh'));
  await page.getByRole('button', { name: 'Nhập tên' }).click();
  await expect(page.getByTestId('dialog-result')).toHaveText('Người nhận: Trần Khánh Linh');
});

test('iframe và Shadow DOM', async ({ page }) => {
  const pay = page.frameLocator('iframe[title="Cổng thanh toán"]');
  await pay.getByLabel('Số thẻ').fill('4111 1111 1111 1111');
  await pay.getByRole('button', { name: 'Thanh toán' }).click();
  await expect(pay.getByRole('status')).toHaveText('Thanh toán thành công');

  // Shadow DOM mở: locator tự xuyên qua
  await page.getByRole('button', { name: '5 sao' }).click();
  await expect(page.getByTestId('rating-result')).toHaveText('Bạn chọn: 5 sao');
});
`;

export const L20: LessonContent = {
  id: "l20",
  pw: true,
  summary: "Những thứ nằm ngoài trang chính: alert/confirm/prompt của trình duyệt, tab và popup mới, iframe, Shadow DOM.",
  starter: FRAMES,
  kata: ["k-l20-frames"],
  sections: [
    {
      id: "dialogs",
      title: "alert, confirm, prompt",
      minutes: 6,
      blocks: [
        { t: "p", md: "Mặc định Playwright tự **bấm Hủy** mọi hộp thoại. Muốn đồng ý hoặc nhập chữ, đăng ký xử lý **trước** khi bấm nút mở hộp thoại:" },
        { t: "code", lang: "ts", run: true, code: FRAMES },
        { t: "callout", tone: "tip", title: "once hay on", md: "`page.once('dialog', …)` chỉ xử lý hộp thoại kế tiếp. `page.on` xử lý mọi hộp thoại về sau, dễ gây bất ngờ ở bước khác." },
      ],
    },
    {
      id: "tabs",
      title: "Tab mới và popup",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", title: "tests/help.spec.ts", code: "const popupPromise = page.waitForEvent('popup');\nawait page.getByRole('link', { name: 'Mở hướng dẫn' }).click();\nconst popup = await popupPromise;\nawait expect(popup).toHaveTitle(/Hướng dẫn/);" },
        { t: "callout", tone: "warn", title: "Sandbox", md: "Khu chạy thử trên web chưa mở được tab mới. Đoạn này chạy được với Playwright thật trên máy bạn." },
      ],
    },
    {
      id: "iframe",
      title: "iframe và Shadow DOM",
      minutes: 5,
      blocks: [
        { t: "list", items: ["iframe là một trang nằm trong trang: dùng `page.frameLocator('iframe[title=\"...\"]')` rồi tìm tiếp như bình thường", "Shadow DOM **mở**: locator của Playwright tự xuyên qua, không cần làm gì thêm", "Shadow DOM **đóng**: không truy cập được, nhờ dev thêm cách kiểm thử"] },
        { t: "quiz", id: "q1", q: "Ô \"Số thẻ\" nằm trong iframe thanh toán. page.getByLabel('Số thẻ') sẽ…", options: ["Tìm thấy bình thường", "Không tìm thấy, phải dùng frameLocator trước", "Báo lỗi cú pháp"], answer: 1, explain: "Locator của page không đi vào iframe; cần page.frameLocator(...)." },
      ],
    },
  ],
  cards: [
    { id: "c-l20-1", tag: "Hộp thoại", q: "Đồng ý hộp thoại confirm sắp hiện?", a: "Đăng ký trước khi click.", code: "page.once('dialog', (d) => d.accept());" },
    { id: "c-l20-2", tag: "iframe", q: "Điền ô trong iframe?", a: "Dùng frameLocator.", code: "page.frameLocator('iframe[title=\"Cổng thanh toán\"]').getByLabel('Số thẻ').fill('...')" },
  ],
};

const TABLES = `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
${LOGIN}
});

test('đọc bảng', async ({ page }) => {
  const rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
  await expect(rows).toHaveCount(10);

  // Lấy cả cột tên
  const names = await rows.getByRole('cell').nth(1).allTextContents();
  console.log('Tên dòng đầu:', names);

  // Ô ở dòng có điều kiện
  const row = rows.filter({ hasText: 'Trần Thu Hà' });
  await expect(row.getByRole('cell').nth(4)).toHaveText('Đà Nẵng');

  // page.evaluate: chạy JS ngay trong trang
  const tierCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
  expect(tierCount).toBe(10);
});
`;

export const L21: LessonContent = {
  id: "l21",
  pw: true,
  summary: "Bảng dữ liệu (dòng, cột, ô theo điều kiện), date picker tự làm, và page.evaluate để chạy JavaScript ngay trong trang khi thật sự cần.",
  starter: TABLES,
  kata: ["k-l21-table"],
  sections: [
    {
      id: "table",
      title: "Bảng: dòng, cột, ô",
      minutes: 7,
      blocks: [
        { t: "list", items: ["Dòng: `getByRole('row')`, lọc dòng dữ liệu bằng `filter({ has: page.getByRole('cell') })`", "Ô trong dòng: `row.getByRole('cell', { name: 'Đà Nẵng' })` hoặc theo vị trí cột khi tên cột ổn định", "Cả cột: `allTextContents()` rồi xử lý bằng mảng (bài 4)"] },
        { t: "code", lang: "ts", run: true, code: TABLES },
      ],
    },
    {
      id: "datepicker",
      title: "Date picker tự làm",
      minutes: 5,
      blocks: [
        { t: "p", md: "Date picker tự làm không phải `<input type=\"date\">` nên không `fill` được. Làm như người dùng: mở lịch, chuyển tháng, bấm ngày." },
        { t: "code", lang: "ts", title: "ví dụ", code: "await page.getByLabel('Ngày hẹn').click();\nawait page.getByRole('button', { name: 'Tháng sau' }).click();\nawait expect(page.getByTestId('cal-month')).toHaveText('Tháng 1/2027');\nawait page.getByRole('gridcell', { name: '15', exact: true }).click();\nawait expect(page.getByLabel('Ngày hẹn')).toHaveValue('15/01/2027');" },
      ],
    },
    {
      id: "evaluate",
      title: "page.evaluate",
      minutes: 4,
      blocks: [
        { t: "p", md: "`page.evaluate(() => ...)` chạy code trong trình duyệt và trả kết quả về test. Hợp để đọc dữ liệu đặc biệt (localStorage, biến toàn cục)." },
        { t: "callout", tone: "warn", title: "Đừng dùng để click", md: "`evaluate(() => button.click())` bỏ qua auto-wait và kiểm tra hiển thị, test xanh mà người dùng thật không bấm được." },
        { t: "quiz", id: "q1", q: "Đọc giá trị trong localStorage của trang?", options: ["page.localStorage('key')", "await page.evaluate(() => localStorage.getItem('key'))", "page.getByTestId('localStorage')"], answer: 1, explain: "evaluate chạy trong trang nên truy cập được localStorage." },
      ],
    },
  ],
  cards: [
    { id: "c-l21-1", tag: "Bảng", q: "Lọc các dòng dữ liệu (bỏ dòng tiêu đề)?", a: "Lọc dòng có cell.", code: "page.getByRole('row').filter({ has: page.getByRole('cell') })" },
    { id: "c-l21-2", tag: "evaluate", q: "Vì sao không dùng page.evaluate để click?", a: "Bỏ qua auto-wait và kiểm tra hiển thị nên test có thể xanh dù người dùng không bấm được." },
  ],
};

const FULL = `import { test, expect } from '@playwright/test';

test.describe('Khách hàng', () => {
  test.beforeEach(async ({ page }) => {
${LOGIN.replace(/^ {2}/gm, "    ")}
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
  });

  test('thêm khách mới rồi tìm thấy', async ({ page }) => {
    const name = 'Đinh Thảo Nguyên';
    await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Họ tên').fill(name);
    await dialog.getByLabel('Email', { exact: true }).fill('nguyen' + Date.now() + '@mail.vn');
    await dialog.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng ' + name);

    await page.getByPlaceholder('Tìm theo tên…').fill('Thảo Nguyên');
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
  });
});
`;

export const L22: LessonContent = {
  id: "l22",
  pw: true,
  summary: "Ghép mọi thứ thành test CRM hoàn chỉnh theo 3 cách: tự viết, ghi lại bằng Codegen, nhờ AI viết. Quan trọng nhất là biết review code do máy sinh ra.",
  starter: FULL,
  kata: ["k-l22-review"],
  sections: [
    {
      id: "manual",
      title: "Tự viết",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", run: true, code: FULL },
      ],
    },
    {
      id: "codegen",
      title: "Codegen: ghi lại thao tác",
      minutes: 5,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright codegen https://sokhach.playforge.dev/login" },
        { t: "p", md: "Codegen mở trình duyệt, bạn bấm tới đâu nó sinh code tới đó, và chọn locator khá tốt. Nhưng nó **không biết bạn muốn kiểm tra gì**: phải tự thêm `expect`, đặt tên test, bỏ thao tác thừa." },
      ],
    },
    {
      id: "ai",
      title: "AI viết, bạn review",
      minutes: 6,
      blocks: [
        { t: "p", md: "Claude Code, ChatGPT viết test rất nhanh. Checklist review trước khi nhận code:" },
        { t: "list", ordered: true, items: ["Mỗi test có `expect` kiểm tra đúng điều quan trọng chưa?", "Có `waitForTimeout`, XPath theo vị trí, `nth()` vô lý không?", "Locator có theo vai trò/nhãn không, hay bám class CSS?", "Dữ liệu có cố định gây trùng (email đã tồn tại) khi chạy lần 2 không?", "Test có độc lập, chạy riêng lẻ được không?"] },
        { t: "callout", tone: "tip", title: "Hỏi AI đúng cách", md: "Đưa AI: mô tả chức năng, HTML/ảnh trang, quy ước của dự án (POM, fixture). Yêu cầu: *dùng getByRole/getByLabel, không waitForTimeout, có expect cho từng bước quan trọng*." },
        { t: "quiz", id: "q1", q: "Codegen sinh ra test chạy xanh. Đã đủ chưa?", options: ["Đủ rồi, commit luôn", "Chưa: phải thêm expect kiểm tra kết quả và dọn thao tác thừa", "Chưa: phải đổi hết sang XPath"], answer: 1, explain: "Test không có expect chỉ chứng minh trang không bị lỗi khi bấm, không chứng minh chức năng đúng." },
      ],
    },
  ],
  cards: [
    { id: "c-l22-1", tag: "Codegen", q: "Mở Codegen ghi lại thao tác trên trang đăng nhập?", a: "npx playwright codegen <url>", code: "npx playwright codegen https://sokhach.playforge.dev/login" },
    { id: "c-l22-2", tag: "Review", q: "3 điều phải soát trong test AI viết?", a: "Có expect đúng chỗ; không waitForTimeout/XPath vị trí/nth vô lý; locator theo vai trò hoặc nhãn." },
  ],
};
