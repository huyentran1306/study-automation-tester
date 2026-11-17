import type { Kata } from "./types";

// Thử thách chương 2: viết test Playwright thật, chạy trên app Sổ Khách.
// Chấm bằng mutation testing: bật từng bug trong app, test của học viên phải đỏ.

const SKELETON = (title: string, extra = "") => `import { test, expect } from '@playwright/test';

test('${title}', async ({ page }) => {
  await page.goto('/login');
  // viết tiếp ở đây${extra}
});
`;

const LOGIN_STEPS = `  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();`;

const NO_NTH = { pattern: "\\.(nth|first|last)\\(", message: "Không dùng nth/first/last. Lọc theo nội dung để test bền hơn." };
const NO_WAIT = { pattern: "waitForTimeout", message: "Không dùng waitForTimeout. Dùng assertion web-first để Playwright tự chờ." };

export const KATA_CH2: Kata[] = [
  {
    id: "k-l11-first",
    lesson: "l11",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Test đầu tiên: trang đăng nhập",
    difficulty: 1,
    xp: 50,
    prompt: "Viết test kiểm tra trang `/login`:\n\n- Có tiêu đề **Đăng nhập**\n- Nút **Đăng nhập** bị khóa khi chưa nhập email\n- Nhập email xong thì nút mở khóa\n\nMáy chấm sẽ bật một bug \"nút không bao giờ bị khóa\". Test của bạn phải bắt được bug đó.",
    starter: SKELETON("trang đăng nhập"),
    forbid: [NO_WAIT],
    mutants: [{ bug: "login-always-enabled", label: "nút Đăng nhập không bị khóa khi trống email" }],
    hints: [
      "Dùng getByRole('heading', …) cho tiêu đề và getByRole('button', …) cho nút. Kiểm tra trạng thái bằng toBeDisabled / toBeEnabled.",
      "Lưu nút vào biến: const btn = page.getByRole('button', { name: 'Đăng nhập' }); rồi expect(btn).toBeDisabled(); sau khi fill email thì expect(btn).toBeEnabled().",
      "import { test, expect } from '@playwright/test';\n\ntest('trang đăng nhập', async ({ page }) => {\n  await page.goto('/login');\n  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();\n  const btn = page.getByRole('button', { name: 'Đăng nhập' });\n  await expect(btn).toBeDisabled();\n  await page.getByLabel('Email').fill('linh@sokhach.vn');\n  await expect(btn).toBeEnabled();\n});",
    ],
  },
  {
    id: "k-l12-steps",
    lesson: "l12",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Đăng nhập có các bước rõ ràng",
    difficulty: 1,
    xp: 50,
    prompt: "Trong `test.describe('Đăng nhập', …)`, viết test đăng nhập bằng `linh@sokhach.vn` / `Matkhau@123`, chia thành 3 `test.step`: mở trang, điền thông tin, kiểm tra đã vào trang **Khách hàng** (URL chứa `customers`).\n\nMáy chấm bật bug \"đăng nhập xong chuyển nhầm trang\".",
    starter: "import { test, expect } from '@playwright/test';\n\ntest.describe('Đăng nhập', () => {\n  test('đăng nhập đúng', async ({ page }) => {\n    // dùng test.step cho từng bước\n  });\n});\n",
    require: [{ pattern: "test\\.step\\([\\s\\S]*test\\.step\\([\\s\\S]*test\\.step\\(", message: "dùng ít nhất 3 test.step" }, { pattern: "test\\.describe\\(", message: "gom test trong test.describe" }],
    forbid: [NO_WAIT],
    mutants: [{ bug: "login-wrong-redirect", label: "đăng nhập xong chuyển nhầm sang trang khác" }],
    hints: [
      "Mỗi bước: await test.step('Tên bước', async () => { … });",
      "Bước cuối kiểm tra URL bằng await expect(page).toHaveURL(/customers/).",
      "import { test, expect } from '@playwright/test';\n\ntest.describe('Đăng nhập', () => {\n  test('đăng nhập đúng', async ({ page }) => {\n    await test.step('Mở trang', async () => {\n      await page.goto('/login');\n    });\n    await test.step('Điền thông tin', async () => {\n      await page.getByLabel('Email').fill('linh@sokhach.vn');\n      await page.getByLabel('Mật khẩu').fill('Matkhau@123');\n      await page.getByRole('button', { name: 'Đăng nhập' }).click();\n    });\n    await test.step('Kiểm tra', async () => {\n      await expect(page).toHaveURL(/customers/);\n    });\n  });\n});",
    ],
  },
  {
    id: "k-l13-hooks",
    lesson: "l13",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Lọc khách hàng với beforeEach",
    difficulty: 2,
    xp: 70,
    prompt: "Viết 2 test trong cùng một `describe`, phần đăng nhập đặt trong `beforeEach`:\n\n- Chọn **Hạng = VIP** thì số khách hiển thị là `6 khách`\n- Gõ `Ngọc` vào ô tìm kiếm thì còn `5 khách`\n\nMáy chấm bật 2 bug: ô tìm kiếm không lọc, và số khách hiển thị lệch 1.",
    starter: "import { test, expect } from '@playwright/test';\n\ntest.describe('Lọc khách hàng', () => {\n  // beforeEach đăng nhập\n\n  test('lọc hạng VIP', async ({ page }) => {\n  });\n\n  test('tìm theo tên', async ({ page }) => {\n  });\n});\n",
    require: [{ pattern: "beforeEach", message: "đặt bước đăng nhập trong test.beforeEach" }],
    forbid: [NO_WAIT],
    mutants: [
      { bug: "search-broken", label: "ô tìm kiếm không lọc" },
      { bug: "count-off", label: "số khách hiển thị lệch 1" },
    ],
    hints: [
      "Ô Hạng là <select> có nhãn: getByLabel('Hạng').selectOption('VIP'). Số khách có data-testid customer-count.",
      "Ô tìm kiếm chỉ có placeholder: getByPlaceholder('Tìm theo tên…'). Kiểm tra bằng toHaveText('5 khách').",
      `import { test, expect } from '@playwright/test';\n\ntest.describe('Lọc khách hàng', () => {\n  test.beforeEach(async ({ page }) => {\n${LOGIN_STEPS.replace(/^ {2}/gm, "    ")}\n  });\n\n  test('lọc hạng VIP', async ({ page }) => {\n    await page.getByLabel('Hạng').selectOption('VIP');\n    await expect(page.getByTestId('customer-count')).toHaveText('6 khách');\n  });\n\n  test('tìm theo tên', async ({ page }) => {\n    await page.getByPlaceholder('Tìm theo tên…').fill('Ngọc');\n    await expect(page.getByTestId('customer-count')).toHaveText('5 khách');\n  });\n});`,
    ],
  },
  {
    id: "k-l14-delete",
    lesson: "l14",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Xóa đúng khách hàng",
    difficulty: 2,
    xp: 80,
    prompt: "Đăng nhập rồi xóa khách **Phạm Gia Hân**: bấm Xóa ở đúng dòng, xác nhận trong hộp thoại, kiểm tra thông báo `Đã xóa khách hàng Phạm Gia Hân` và dòng đó biến mất.\n\nCẩn thận: hộp thoại xác nhận cũng có nút **Xóa**. Máy chấm bật bug \"xóa nhầm dòng đầu tiên\" (thông báo vẫn đúng tên!).",
    starter: SKELETON("xóa khách hàng"),
    forbid: [NO_WAIT, NO_NTH],
    mutants: [{ bug: "delete-wrong-row", label: "xóa nhầm dòng đầu tiên nhưng vẫn báo đúng tên" }],
    hints: [
      "Lưu dòng vào biến: const row = page.getByRole('row').filter({ hasText: 'Phạm Gia Hân' }).",
      "Nút Xóa thứ hai nằm trong hộp thoại có role alertdialog. Bug làm thông báo vẫn đúng, nên phải kiểm tra row không còn: await expect(row).toHaveCount(0).",
      `import { test, expect } from '@playwright/test';\n\ntest('xóa khách hàng', async ({ page }) => {\n${LOGIN_STEPS}\n  const row = page.getByRole('row').filter({ hasText: 'Phạm Gia Hân' });\n  await row.getByRole('button', { name: 'Xóa' }).click();\n  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã xóa khách hàng Phạm Gia Hân');\n  await expect(row).toHaveCount(0);\n});`,
    ],
  },
  {
    id: "k-l15-filter",
    lesson: "l15",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Đếm khách VIP ở TP.HCM",
    difficulty: 2,
    xp: 60,
    prompt: "Ở trang 1 danh sách khách hàng, dùng `filter` để lấy các dòng vừa có hạng **VIP** vừa ở **TP.HCM**, rồi kiểm tra có đúng **2** dòng. Sau đó kiểm tra dòng đầu tiên trong số đó là của **Lê Bảo Ngọc**.\n\nKhông dùng XPath theo vị trí.",
    starter: SKELETON("đếm khách VIP ở TP.HCM"),
    require: [{ pattern: "\\.filter\\(", message: "dùng .filter(...)" }, { pattern: "toHaveCount\\(\\s*2\\s*\\)", message: "kiểm tra bằng toHaveCount(2)" }],
    forbid: [NO_WAIT, { pattern: "tr\\[\\d+\\]|td\\[\\d+\\]", message: "Không dùng XPath theo vị trí (tr[2], td[5]…)." }],
    hints: [
      "Nối 2 filter: rows.filter({ hasText: 'TP.HCM' }).filter({ has: page.getByText('VIP', { exact: true }) }).",
      "Dòng đầu tiên trong nhóm: toHaveText với mảng, hoặc kiểm tra nhóm có chứa 'Lê Bảo Ngọc' bằng toContainText.",
      `import { test, expect } from '@playwright/test';\n\ntest('đếm khách VIP ở TP.HCM', async ({ page }) => {\n${LOGIN_STEPS}\n  const rows = page.getByRole('row')\n    .filter({ hasText: 'TP.HCM' })\n    .filter({ has: page.getByText('VIP', { exact: true }) });\n  await expect(rows).toHaveCount(2);\n  await expect(rows.getByRole('cell', { name: 'Lê Bảo Ngọc' })).toBeVisible();\n});`,
    ],
  },
  {
    id: "k-l16-actions",
    lesson: "l16",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Kéo thả và chuột phải",
    difficulty: 2,
    xp: 70,
    prompt: "Vào trang **Thành phần**:\n\n- Kéo việc **Cập nhật hợp đồng** lên vị trí đầu danh sách \"Việc ưu tiên\" và kiểm tra thứ tự mới là `1. Cập nhật hợp đồng`, `2. Gọi lại khách VIP`, `3. Gửi báo giá`\n- Nhấn chuột phải vào ô \"Nhấn chuột phải vào đây\", chọn **Lưu trữ**, kiểm tra kết quả `Đã chọn: Lưu trữ`",
    starter: SKELETON("kéo thả và chuột phải"),
    require: [{ pattern: "dragTo\\(", message: "dùng dragTo" }, { pattern: "button:\\s*['\"]right['\"]", message: "dùng click({ button: 'right' })" }],
    forbid: [NO_WAIT],
    hints: [
      "Danh sách có tên: page.getByRole('list', { name: 'Việc ưu tiên' }). Mỗi việc là listitem.",
      "Kéo: await item.dragTo(firstItem). Kiểm tra thứ tự: await expect(list.getByRole('listitem')).toHaveText([...]). Kết quả chuột phải có data-testid dialog-result.",
      `import { test, expect } from '@playwright/test';\n\ntest('kéo thả và chuột phải', async ({ page }) => {\n${LOGIN_STEPS}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  const list = page.getByRole('list', { name: 'Việc ưu tiên' });\n  await list.getByText('Cập nhật hợp đồng').dragTo(list.getByText('Gọi lại khách VIP'));\n  await expect(list.getByRole('listitem')).toHaveText(['1. Cập nhật hợp đồng', '2. Gọi lại khách VIP', '3. Gửi báo giá']);\n  await page.getByText('Nhấn chuột phải vào đây').click({ button: 'right' });\n  await page.getByRole('menuitem', { name: 'Lưu trữ' }).click();\n  await expect(page.getByTestId('dialog-result')).toHaveText('Đã chọn: Lưu trữ');\n});`,
    ],
  },
  {
    id: "k-l17-forms",
    lesson: "l17",
    chapter: 2,
    type: "loc",
    runner: "pw",
    title: "Điền form lựa chọn và đánh giá",
    difficulty: 2,
    xp: 80,
    prompt: "Vào trang **Thành phần**:\n\n- Tick **Tôi đồng ý điều khoản**, chọn gói **Doanh nghiệp**, chọn Tỉnh/Thành **Đà Nẵng** (theo chữ hiển thị)\n- Kiểm tra dòng tóm tắt là `Đã đồng ý · Gói Doanh nghiệp · DN · Tiếng Việt`\n- Đánh giá dịch vụ **4 sao** (nằm trong Shadow DOM) và kiểm tra `Bạn chọn: 4 sao`\n\nMáy chấm bật bug \"đánh giá lệch 1 sao\".",
    starter: SKELETON("form lựa chọn"),
    require: [{ pattern: "\\.check\\(", message: "dùng check() cho checkbox/radio" }, { pattern: "selectOption\\(", message: "dùng selectOption" }],
    forbid: [NO_WAIT],
    mutants: [{ bug: "rating-off-by-one", label: "đánh giá lệch 1 sao" }],
    hints: [
      "Chọn theo chữ hiển thị: selectOption({ label: 'Đà Nẵng' }). Dòng tóm tắt có data-testid choice-summary.",
      "Playwright tự xuyên Shadow DOM: page.getByRole('button', { name: '4 sao' }). Kết quả có data-testid rating-result.",
      `import { test, expect } from '@playwright/test';\n\ntest('form lựa chọn', async ({ page }) => {\n${LOGIN_STEPS}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  await page.getByLabel('Tôi đồng ý điều khoản').check();\n  await page.getByLabel('Doanh nghiệp').check();\n  await page.getByLabel('Tỉnh/Thành').selectOption({ label: 'Đà Nẵng' });\n  await expect(page.getByTestId('choice-summary')).toHaveText('Đã đồng ý · Gói Doanh nghiệp · DN · Tiếng Việt');\n  await page.getByRole('button', { name: '4 sao' }).click();\n  await expect(page.getByTestId('rating-result')).toHaveText('Bạn chọn: 4 sao');\n});`,
    ],
  },
];
