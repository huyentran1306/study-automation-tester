import type { LessonContent } from "./types";

// Chương 2 · Playwright TypeScript + Locator (bài 11–17). Mọi đoạn code "Chạy thử" là file spec chạy trên app Sổ Khách.

const LOGIN = String.raw`import { test, expect } from '@playwright/test';

test('trang đăng nhập hiển thị đúng', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled();
});
`;

export const L11: LessonContent = {
  id: "l11",
  pw: true,
  summary: "Cài Playwright cho dự án TypeScript, hiểu từng thư mục được sinh ra, chạy test và đọc HTML report. Từ bài này, khu chạy thử bên phải là một trình duyệt thật đang mở app Sổ Khách.",
  starter: LOGIN,
  kata: ["k-l11-first"],
  sections: [
    {
      id: "install",
      title: "Cài Playwright bằng một lệnh",
      minutes: 5,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npm init playwright@latest\n# Chọn: TypeScript · thư mục tests · thêm GitHub Actions: có · cài trình duyệt: có" },
        { t: "p", md: "Lệnh này tạo dự án, cài `@playwright/test` và tải 3 trình duyệt Chromium, Firefox, WebKit. Trên máy mới, chạy thêm `npx playwright install --with-deps` nếu thiếu thư viện hệ thống." },
        { t: "callout", tone: "tip", title: "Kiểm tra phiên bản", md: "`npx playwright --version` in ra phiên bản. Cả team nên dùng cùng phiên bản (ghi trong package.json) để kết quả giống nhau." },
      ],
    },
    {
      id: "structure",
      title: "Cấu trúc dự án",
      minutes: 4,
      blocks: [
        { t: "code", lang: "text", title: "so-khach-tests/", code: "playwright.config.ts   ← cấu hình: thư mục test, trình duyệt, baseURL, timeout\npackage.json           ← thư viện + scripts\ntests/                 ← file *.spec.ts của bạn\ntests-examples/        ← ví dụ mẫu, xem xong có thể xóa\n.github/workflows/     ← chạy test trên GitHub Actions (chương 7)\nplaywright-report/     ← HTML report sau mỗi lần chạy (không commit)\ntest-results/          ← ảnh, video, trace khi test fail (không commit)" },
        { t: "p", md: "Trong PlayForge, `baseURL` là app Sổ Khách nên `page.goto('/login')` mở trang đăng nhập của Sổ Khách." },
      ],
    },
    {
      id: "run",
      title: "Chạy test",
      minutes: 6,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright test                       # chạy tất cả, không mở cửa sổ (headless)\nnpx playwright test tests/login.spec.ts   # chạy 1 file\nnpx playwright test -g \"đăng nhập\"          # chạy test có tên chứa chữ này\nnpx playwright test --project=chromium    # chỉ 1 trình duyệt\nnpx playwright test --headed              # mở cửa sổ trình duyệt để xem\nnpx playwright test --ui                  # UI Mode: chạy, xem từng bước (chương 7)" },
        { t: "p", md: "Test đầu tiên: mở trang đăng nhập, kiểm tra có tiêu đề và nút Đăng nhập đang bị khóa (vì chưa nhập email). Bấm **Chạy thử** rồi xem trình duyệt bên phải." },
        { t: "code", lang: "ts", run: true, code: LOGIN },
        { t: "callout", tone: "tip", title: "Xem từng bước", md: "Tick ô **chậm** ở khu chạy thử để thao tác chạy chậm lại, phần tử đang thao tác được tô viền xanh." },
      ],
    },
    {
      id: "report",
      title: "HTML report",
      minutes: 4,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright show-report" },
        { t: "p", md: "Report liệt kê từng test, thời gian, lỗi kèm dòng code, và (nếu bật) ảnh chụp, video, trace. Khi test đỏ trên CI, report là thứ đầu tiên bạn mở." },
        { t: "quiz", id: "q1", q: "Chạy test mà muốn nhìn thấy cửa sổ trình duyệt thì thêm cờ nào?", options: ["--debug-window", "--headed", "--show"], answer: 1, explain: "Mặc định Playwright chạy headless (không hiện cửa sổ); --headed để mở cửa sổ." },
      ],
    },
  ],
  cards: [
    { id: "c-l11-1", tag: "Playwright", q: "Lệnh tạo dự án Playwright mới?", a: "npm init playwright@latest", code: "npm init playwright@latest" },
    { id: "c-l11-2", tag: "Playwright", q: "Mở HTML report sau khi chạy test?", a: "npx playwright show-report" },
    { id: "c-l11-3", tag: "Playwright", q: "Chỉ chạy test có tên chứa \"đăng nhập\"?", a: "Dùng -g (grep).", code: "npx playwright test -g \"đăng nhập\"" },
  ],
};

const DESCRIBE = String.raw`import { test, expect } from '@playwright/test';

test.describe('Đăng nhập', () => {
  test('đăng nhập đúng vào trang Khách hàng', async ({ page }) => {
    await test.step('Mở trang đăng nhập', async () => {
      await page.goto('/login');
    });
    await test.step('Điền email và mật khẩu', async () => {
      await page.getByLabel('Email').fill('linh@sokhach.vn');
      await page.getByLabel('Mật khẩu').fill('Matkhau@123');
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
    });
    await test.step('Kiểm tra đã vào trang Khách hàng', async () => {
      await expect(page).toHaveURL(/customers/);
    });
  });

  test.fixme('quên mật khẩu gửi email', async ({ page }) => {
    // Tính năng chưa làm xong, đánh dấu fixme để không chạy
  });
});
`;

export const L12: LessonContent = {
  id: "l12",
  pw: true,
  summary: "Một file test gồm những gì: import, test, expect, gom nhóm bằng describe, chia bước bằng test.step, và các nhãn skip/only/fixme/fail/slow.",
  starter: DESCRIBE,
  kata: ["k-l12-steps"],
  sections: [
    {
      id: "anatomy",
      title: "Giải phẫu một file test",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`import { test, expect } from '@playwright/test'`: lấy hàm test và expect", "`test('tên', async ({ page }) => { ... })`: một test case; `page` là tab trình duyệt mới, sạch", "`await` trước mọi thao tác với trang", "`expect(...)`: kiểm tra kết quả; sai là test đỏ"] },
        { t: "callout", tone: "real", title: "Mỗi test một trình duyệt sạch", md: "Playwright tạo context mới cho từng test: không cookie, không đăng nhập sẵn. Test nào cũng phải tự `goto` và tự đăng nhập (hoặc dùng hook, fixture ở bài sau)." },
      ],
    },
    {
      id: "describe",
      title: "describe và test.step",
      minutes: 6,
      blocks: [
        { t: "p", md: "`test.describe` gom các test cùng chủ đề. `test.step` chia một test dài thành các bước có tên, hiện rõ trong report và trace." },
        { t: "code", lang: "ts", run: true, code: DESCRIBE },
      ],
    },
    {
      id: "annotations",
      title: "skip, only, fixme, fail, slow",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`test.skip(...)`: bỏ qua (có thể kèm điều kiện, ví dụ chỉ bỏ trên webkit)", "`test.only(...)`: chỉ chạy test này. **Đừng commit** only lên repo", "`test.fixme(...)`: tính năng đang hỏng/chưa làm, không chạy", "`test.fail(...)`: biết trước test sẽ fail (bug đã báo), test xanh nếu nó đúng là fail", "`test.slow()`: nhân 3 thời gian chờ cho test chậm"] },
        { t: "quiz", id: "q1", q: "Bạn lỡ commit test.only. Trên CI chuyện gì xảy ra?", options: ["Không sao cả", "CI chỉ chạy đúng test đó, các test khác bị bỏ qua", "CI báo lỗi cú pháp"], answer: 1, explain: "Có thể chặn bằng forbidOnly: !!process.env.CI trong playwright.config.ts." },
      ],
    },
  ],
  cards: [
    { id: "c-l12-1", tag: "Playwright", q: "test.fixme khác test.skip thế nào?", a: "fixme nói rõ là tính năng đang hỏng/cần sửa; skip là bỏ qua vì lý do khác (điều kiện môi trường...)." },
    { id: "c-l12-2", tag: "Playwright", q: "Chia một test thành các bước có tên trong report?", a: "Dùng test.step.", code: "await test.step('Điền form', async () => { ... });" },
  ],
};

const HOOKS = String.raw`import { test, expect } from '@playwright/test';

test.describe('Danh sách khách hàng', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('linh@sokhach.vn');
    await page.getByLabel('Mật khẩu').fill('Matkhau@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
  });

  test('hiển thị 25 khách @smoke', async ({ page }) => {
    await expect(page.getByTestId('customer-count')).toHaveText('25 khách');
  });

  test('có phân trang', { tag: '@regression' }, async ({ page }) => {
    await expect(page.getByTestId('page-info')).toHaveText('Trang 1 / 3');
  });
});
`;

export const L13: LessonContent = {
  id: "l13",
  pw: true,
  summary: "Hook giúp chuẩn bị và dọn dẹp cho nhiều test (đăng nhập, tạo dữ liệu). Tag giúp chạy đúng nhóm test: smoke trước mỗi lần deploy, regression mỗi đêm.",
  starter: HOOKS,
  kata: ["k-l13-hooks"],
  sections: [
    {
      id: "hooks",
      title: "beforeEach, afterEach, beforeAll, afterAll",
      minutes: 6,
      blocks: [
        { t: "list", items: ["`beforeEach`: chạy trước **mỗi** test (đăng nhập, mở trang)", "`afterEach`: sau mỗi test (dọn dữ liệu vừa tạo)", "`beforeAll` / `afterAll`: một lần cho cả nhóm (tạo dữ liệu dùng chung)"] },
        { t: "code", lang: "ts", run: true, code: HOOKS },
        { t: "callout", tone: "warn", title: "beforeAll không có page", md: "Mỗi test có page riêng, nên `beforeAll` không dùng được fixture `page`. Chuẩn bị dữ liệu qua API trong beforeAll (chương 6), còn thao tác trang thì để ở beforeEach." },
      ],
    },
    {
      id: "tags",
      title: "Tag và chạy theo nhóm",
      minutes: 5,
      blocks: [
        { t: "p", md: "Gắn tag bằng cách thêm `@smoke` vào tên test, hoặc dùng `{ tag: '@regression' }`. Rồi lọc khi chạy:" },
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright test --grep @smoke            # chỉ smoke\nnpx playwright test --grep-invert @slow       # bỏ các test chậm\nnpx playwright test --grep \"@smoke|@critical\"" },
        { t: "callout", tone: "tip", title: "Thử trong Xưởng Code", md: "Xưởng Code có ô `--grep`. Gõ `@smoke` rồi chạy để thấy chỉ test có tag đó chạy." },
        { t: "quiz", id: "q1", q: "Bước đăng nhập lặp lại ở 10 test. Nên đặt ở đâu?", options: ["beforeAll", "beforeEach", "afterEach"], answer: 1, explain: "Mỗi test có trình duyệt riêng nên phải đăng nhập lại trước mỗi test: beforeEach." },
      ],
    },
  ],
  cards: [
    { id: "c-l13-1", tag: "Playwright", q: "Vì sao beforeAll không dùng được fixture page?", a: "page được tạo riêng cho từng test; beforeAll chạy một lần cho cả nhóm." },
    { id: "c-l13-2", tag: "Playwright", q: "Chỉ chạy test có tag @smoke?", a: "Dùng --grep.", code: "npx playwright test --grep @smoke" },
  ],
};

const LOCATORS = String.raw`import { test, expect } from '@playwright/test';

test('các kiểu locator có sẵn', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');          // theo nhãn
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();   // theo vai trò + tên

  await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
  await page.getByPlaceholder('Tìm theo tên…').fill('Hà');          // theo placeholder
  await expect(page.getByTestId('customer-count')).toHaveText('1 khách'); // theo data-testid

  // Có 1 dòng nên chỉ có 1 nút Xóa. Thử xóa chữ 'Hà' ở trên rồi chạy lại để gặp strict mode!
  await expect(page.getByRole('button', { name: 'Xóa' })).toBeVisible();
});
`;

export const L14: LessonContent = {
  id: "l14",
  pw: true,
  summary: "Locator là cách chỉ cho Playwright phần tử cần thao tác. Ưu tiên locator theo cách người dùng nhìn trang: vai trò, nhãn, chữ. Hiểu lỗi strict mode và cách thu hẹp.",
  starter: LOCATORS,
  kata: ["k-l14-delete"],
  sections: [
    {
      id: "builtin",
      title: "Các locator có sẵn",
      minutes: 7,
      blocks: [
        { t: "list", items: ["`getByRole('button', { name: 'Lưu' })`: ưu tiên số 1 cho nút, link, ô, checkbox, tiêu đề…", "`getByLabel('Email')`: ô nhập có nhãn", "`getByPlaceholder('Tìm theo tên…')`: ô chỉ có chữ gợi ý", "`getByText('Đã lưu')`: chữ tĩnh như thông báo", "`getByAltText`, `getByTitle`: ảnh và phần tử có title", "`getByTestId('toast')`: phần tử dev gắn `data-testid`"] },
        { t: "code", lang: "ts", run: true, code: LOCATORS },
        { t: "callout", tone: "tip", title: "Mặc định khớp chuỗi con, không phân biệt hoa thường", md: "`getByLabel('Email')` khớp cả checkbox \"Nhận **email** khuyến mãi\". Thêm `{ exact: true }` khi cần khớp chính xác." },
      ],
    },
    {
      id: "strict",
      title: "Strict mode: khi locator khớp nhiều phần tử",
      minutes: 6,
      blocks: [
        { t: "p", md: "Thao tác (click, fill…) yêu cầu locator khớp **đúng 1** phần tử. Khớp nhiều là lỗi `strict mode violation`, Playwright cố ý dừng để bạn không click nhầm." },
        { t: "code", lang: "text", title: "lỗi thường gặp", code: "Error: strict mode violation: getByRole('button', { name: 'Xóa' }) resolved to 10 elements" },
        { t: "list", items: ["Thu hẹp theo vùng cha: `page.getByRole('dialog').getByRole('button', { name: 'Lưu' })`", "Lọc theo dòng: `page.getByRole('row').filter({ hasText: 'Trần Thu Hà' }).getByRole('button', { name: 'Xóa' })`", "Tên chính xác: `{ name: 'Xóa', exact: true }`", "`first()`, `nth(i)`: chỉ khi thứ tự thật sự là điều bạn muốn kiểm tra"] },
        { t: "callout", tone: "tip", title: "Luyện ở Locator Lab", md: "Locator Lab cho bạn gõ locator và thấy ngay nó khớp mấy phần tử, độ bền bao nhiêu điểm." },
        { t: "quiz", id: "q1", q: "Ô mật khẩu (type=password) nên tìm bằng gì?", options: ["getByRole('textbox', { name: 'Mật khẩu' })", "getByLabel('Mật khẩu')", "getByText('Mật khẩu')"], answer: 1, explain: "Ô password không có role textbox theo chuẩn ARIA. getByText trỏ vào chữ nhãn chứ không phải ô nhập." },
      ],
    },
  ],
  cards: [
    { id: "c-l14-1", tag: "Locator", q: "Thứ tự ưu tiên locator theo khuyến nghị của Playwright?", a: "getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS/XPath (hạn chế)." },
    { id: "c-l14-2", tag: "Locator", q: "strict mode violation nghĩa là gì?", a: "Locator khớp nhiều hơn 1 phần tử khi thao tác cần đúng 1; thu hẹp locator." },
    { id: "c-l14-3", tag: "Locator", q: "Click nút Xóa ở dòng của khách Trần Thu Hà?", a: "Lọc dòng rồi tìm nút trong dòng.", code: "page.getByRole('row').filter({ hasText: 'Trần Thu Hà' }).getByRole('button', { name: 'Xóa' })" },
  ],
};

const FILTERS = String.raw`import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
});

test('filter và XPath', async ({ page }) => {
  const rows = page.getByRole('row');
  // Dòng có chữ VIP (trang 1)
  const vipRows = rows.filter({ has: page.getByText('VIP', { exact: true }) });
  await expect(vipRows).toHaveCount(3);

  // Dòng KHÔNG có chữ VIP, bỏ dòng tiêu đề
  const others = rows.filter({ hasNot: page.getByText('VIP', { exact: true }) }).filter({ has: page.getByRole('cell') });
  await expect(others).toHaveCount(7);

  // XPath: dùng được nhưng hạn chế
  await expect(page.locator('//h1[text()="Khách hàng"]')).toBeVisible();
});
`;

export const L15: LessonContent = {
  id: "l15",
  pw: true,
  summary: "Khi locator có sẵn chưa đủ: lọc bằng filter (hasText, has, hasNot), nối locator, và XPath. Biết lúc nào dùng XPath và lúc nào tránh.",
  starter: FILTERS,
  kata: ["k-l15-filter"],
  sections: [
    {
      id: "xpath",
      title: "XPath căn bản",
      minutes: 6,
      blocks: [
        { t: "list", items: ["`//button`: mọi thẻ button", "`//input[@id='email']`: theo thuộc tính", "`//button[text()='Lưu']`, `//span[contains(text(),'khách')]`: theo chữ", "`//label[starts-with(.,'Họ')]`, `and` / `or`", "Quan hệ: `//td[text()='Hà Nội']/parent::tr`, `/following-sibling::td[1]`"] },
        { t: "callout", tone: "warn", title: "Tránh XPath theo vị trí", md: "`//table/tbody/tr[2]/td[7]/button[2]` gãy ngay khi thêm một khách hay đổi cột. Locator Lab chấm loại này chỉ khoảng 20 điểm." },
      ],
    },
    {
      id: "filter",
      title: "filter: hasText, has, hasNot",
      minutes: 7,
      blocks: [
        { t: "p", md: "`filter` giữ lại phần tử thỏa điều kiện. Rất hợp với bảng và danh sách:" },
        { t: "code", lang: "ts", run: true, code: FILTERS },
        { t: "quiz", id: "q1", q: "Lấy dòng có chứa nút \"Sửa\" và chữ \"TP.HCM\"?", options: ["rows.filter({ hasText: 'TP.HCM' }).filter({ has: page.getByRole('button', { name: 'Sửa' }) })", "page.getByText('TP.HCM').getByRole('row')", "rows.nth(2)"], answer: 0, explain: "Có thể nối nhiều filter; mỗi filter thu hẹp thêm." },
      ],
    },
  ],
  cards: [
    { id: "c-l15-1", tag: "Locator", q: "filter({ has }) khác filter({ hasText }) thế nào?", a: "hasText lọc theo chữ bên trong; has lọc theo việc chứa một locator con." },
    { id: "c-l15-2", tag: "XPath", q: "XPath tìm button có chữ đúng bằng \"Lưu\"?", a: "Dùng text().", code: "//button[text()='Lưu']" },
  ],
};

const ACTIONS = String.raw`import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByRole('link', { name: 'Thành phần' }).click();
});

test('chuột và bàn phím', async ({ page }) => {
  await page.getByRole('button', { name: 'Nhấn đúp để thích' }).dblclick();
  await expect(page.getByTestId('like-count')).toHaveText('1 lượt thích');

  await page.getByRole('button', { name: 'Tài khoản ▾' }).hover();
  await page.getByRole('menuitem', { name: 'Cài đặt' }).click();
  await expect(page.getByTestId('dialog-result')).toHaveText('Mở cài đặt');

  const note = page.getByLabel('Ghi chú nhanh (Enter để thêm)');
  await note.fill('Gọi lại khách lúc 15h');
  await note.press('Enter');
  await expect(page.getByRole('list', { name: 'Danh sách ghi chú' }).getByRole('listitem')).toHaveText(['Gọi lại khách lúc 15h']);

  // Đọc giá trị
  console.log('Số lượt thích:', await page.getByTestId('like-count').textContent());
});
`;

export const L16: LessonContent = {
  id: "l16",
  pw: true,
  summary: "Mọi thao tác người dùng làm được: click, nhấn đúp, chuột phải, rê chuột, kéo thả, gõ phím, phím tắt; và cách đọc chữ, giá trị, thuộc tính của phần tử.",
  starter: ACTIONS,
  kata: ["k-l16-actions"],
  sections: [
    {
      id: "mouse",
      title: "Chuột",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`click()`, `dblclick()`, `click({ button: 'right' })`", "`hover()`: rê chuột để mở menu", "`dragTo(target)`: kéo thả"] },
        { t: "code", lang: "ts", run: true, code: ACTIONS },
      ],
    },
    {
      id: "keyboard",
      title: "Bàn phím: fill, pressSequentially, press",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`fill('...')`: xóa rồi điền nhanh, dùng cho hầu hết ô nhập", "`pressSequentially('...')`: gõ từng ký tự, khi trang xử lý theo từng phím (gợi ý tìm kiếm)", "`press('Enter')`, `press('Control+A')`, `press('Escape')`"] },
        { t: "callout", tone: "tip", title: "fill đủ dùng", md: "90% trường hợp dùng `fill`. Chỉ dùng `pressSequentially` khi trang cần sự kiện từng phím." },
      ],
    },
    {
      id: "read",
      title: "Đọc dữ liệu từ trang",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`textContent()`: chữ gốc (kể cả phần ẩn)", "`innerText()`: chữ đang hiển thị", "`inputValue()`: giá trị trong ô nhập", "`getAttribute('href')`: thuộc tính"] },
        { t: "callout", tone: "warn", title: "Đọc xong rồi expect là dễ flaky", md: "`expect(await el.textContent()).toBe('1')` đọc đúng 1 lần, không chờ. Dùng `await expect(el).toHaveText('1')` để tự chờ (chương 3)." },
        { t: "quiz", id: "q1", q: "Lấy giá trị đang có trong ô Email?", options: ["textContent()", "inputValue()", "innerText()"], answer: 1, explain: "Giá trị ô nhập nằm ở thuộc tính value, đọc bằng inputValue()." },
      ],
    },
  ],
  cards: [
    { id: "c-l16-1", tag: "Thao tác", q: "Mở menu chỉ hiện khi rê chuột?", a: "Dùng hover() rồi click mục trong menu.", code: "await page.getByRole('button', { name: 'Tài khoản' }).hover();" },
    { id: "c-l16-2", tag: "Thao tác", q: "fill và pressSequentially khác gì?", a: "fill điền cả chuỗi một lần; pressSequentially gõ từng ký tự." },
  ],
};

const FORMS = String.raw`import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByRole('link', { name: 'Thành phần' }).click();
});

test('checkbox, radio, dropdown', async ({ page }) => {
  await page.getByLabel('Tôi đồng ý điều khoản').check();
  await page.getByRole('radio', { name: 'Nâng cao' }).check(); // getByLabel('Nâng cao') sẽ khớp cả nút "Thêm Gói Nâng cao vào giỏ"
  await page.getByLabel('Tỉnh/Thành').selectOption('HCM');           // theo value
  await page.getByRole('combobox', { name: 'Ngôn ngữ' }).click();    // dropdown tự làm
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByTestId('choice-summary')).toHaveText('Đã đồng ý · Gói Nâng cao · HCM · English');
});

test('upload và download', async ({ page }) => {
  await page.getByLabel('Tải hợp đồng lên').setInputFiles('fixtures/hop-dong.pdf');
  await expect(page.getByTestId('upload-result')).toContainText('hop-dong.pdf');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải báo cáo CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bao-cao-khach-hang.csv');
});
`;

export const L17: LessonContent = {
  id: "l17",
  pw: true,
  summary: "Làm việc với form: checkbox, radio, dropdown thật và dropdown tự làm, upload file và kiểm tra file tải về.",
  starter: FORMS,
  kata: ["k-l17-forms"],
  sections: [
    {
      id: "choices",
      title: "Checkbox, radio, select",
      minutes: 6,
      blocks: [
        { t: "list", items: ["`check()` / `uncheck()`: an toàn hơn click vì biết trạng thái mong muốn", "`selectOption('HCM')`: chọn theo value; `selectOption({ label: 'TP.HCM' })` theo chữ hiển thị", "Dropdown tự làm (không phải `<select>`): click mở rồi click `getByRole('option')`"] },
        { t: "code", lang: "ts", run: true, code: FORMS },
      ],
    },
    {
      id: "files",
      title: "Upload và download",
      minutes: 6,
      blocks: [
        { t: "p", md: "Upload: `setInputFiles(đường_dẫn)` vào `<input type=\"file\">`. Download: tạo Promise chờ sự kiện **trước** khi click, rồi await nó." },
        { t: "callout", tone: "warn", title: "Thứ tự quan trọng", md: "Viết `await click()` rồi mới `waitForEvent('download')` sẽ lỡ mất sự kiện và timeout. Luôn: tạo Promise → click → await Promise." },
        { t: "quiz", id: "q1", q: "Chọn mục \"TP.HCM\" của `<select>` theo chữ hiển thị?", options: ["selectOption('TP.HCM')", "selectOption({ label: 'TP.HCM' })", "click('TP.HCM')"], answer: 1, explain: "Chuỗi trơn được thử theo value trước; label rõ ràng hơn." },
      ],
    },
  ],
  cards: [
    { id: "c-l17-1", tag: "Form", q: "Chờ file tải về đúng cách?", a: "Tạo Promise trước rồi mới click.", code: "const p = page.waitForEvent('download');\nawait btn.click();\nconst d = await p;" },
    { id: "c-l17-2", tag: "Form", q: "Upload file vào input type=file?", a: "setInputFiles.", code: "await page.getByLabel('Tải hợp đồng lên').setInputFiles('hop-dong.pdf');" },
  ],
};
