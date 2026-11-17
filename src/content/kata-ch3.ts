import type { Kata } from "./types";

// Thử thách chương 3: assertion, chờ đúng cách, iframe/hộp thoại, bảng, review test do AI viết.

const LOGIN = `  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();`;

const NO_WAIT = { pattern: "waitForTimeout", message: "Không dùng waitForTimeout. Dùng assertion web-first để Playwright tự chờ." };
const NO_NTH = { pattern: "\\.(nth|first|last)\\(", message: "Không dùng nth/first/last ở bài này." };

export const KATA_CH3: Kata[] = [
  {
    id: "k-l18-soft",
    lesson: "l18",
    chapter: 3,
    type: "loc",
    runner: "pw",
    title: "Kiểm tra nhiều trường bằng soft assertion",
    difficulty: 2,
    xp: 80,
    prompt: "Thêm khách **Đinh Thảo Nguyên** (hạng **Mới**, thành phố **Huế**, email ngẫu nhiên). Sau đó dùng `expect.soft` kiểm tra: thông báo `Đã thêm khách hàng Đinh Thảo Nguyên`, và dòng của khách (tìm theo email) có đủ tên, hạng, thành phố.\n\nMáy chấm bật 2 bug: không hiện thông báo, và lưu sai tên.",
    starter: `import { test, expect } from '@playwright/test';\n\ntest('thêm khách và kiểm tra nhiều trường', async ({ page }) => {\n${LOGIN}\n  // viết tiếp ở đây\n});\n`,
    require: [{ pattern: "expect\\.soft\\([\\s\\S]*expect\\.soft\\(", message: "dùng ít nhất 2 expect.soft" }],
    forbid: [NO_WAIT],
    mutants: [
      { bug: "add-no-toast", label: "thêm xong không có thông báo" },
      { bug: "add-wrong-name", label: "lưu sai tên khách" },
    ],
    hints: [
      "Email ngẫu nhiên: 'nguyen' + Date.now() + '@mail.vn'. Lưu vào biến để tìm lại dòng.",
      "Tìm dòng theo email: page.getByRole('row').filter({ hasText: email }), rồi expect.soft(row).toContainText('Huế').",
      `import { test, expect } from '@playwright/test';\n\ntest('thêm khách và kiểm tra nhiều trường', async ({ page }) => {\n${LOGIN}\n  const email = 'nguyen' + Date.now() + '@mail.vn';\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Đinh Thảo Nguyên');\n  await dialog.getByLabel('Email', { exact: true }).fill(email);\n  await dialog.getByLabel('Hạng').selectOption('Mới');\n  await dialog.getByLabel('Thành phố').fill('Huế');\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect.soft(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Đinh Thảo Nguyên');\n  await page.getByPlaceholder('Tìm theo tên…').fill('Thảo');\n  const row = page.getByRole('row').filter({ hasText: email });\n  await expect.soft(row).toContainText('Đinh Thảo Nguyên');\n  await expect.soft(row).toContainText('Mới');\n  await expect.soft(row).toContainText('Huế');\n});`,
    ],
  },
  {
    id: "k-l19-flaky",
    lesson: "l19",
    chapter: 3,
    type: "flaky",
    runner: "pw",
    title: "Test “thêm vào giỏ” lúc xanh lúc đỏ",
    difficulty: 2,
    xp: 90,
    prompt: "Test dưới đây đọc số lượng giỏ hàng ngay sau khi bấm, trong khi máy chủ trả lời sau 0,2 – 1,2 giây. Sửa cho test **xanh 5 lần liên tiếp**.\n\nKhông được dùng `waitForTimeout`, không được tăng timeout. Máy chấm còn bật bug \"tổng tiền cộng sai\".",
    starter: `import { test, expect } from '@playwright/test';\n\ntest('thêm 2 gói vào giỏ', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  await page.getByRole('button', { name: 'Thêm Gói Cơ bản vào giỏ' }).click();\n  await page.getByRole('button', { name: 'Thêm Gói Nâng cao vào giỏ' }).click();\n\n  const count = await page.getByTestId('cart-count').textContent();\n  expect(count).toBe('2');\n  const total = await page.getByTestId('cart-total').textContent();\n  expect(total).toBe('298.000 ₫');\n});\n`,
    repeat: 5,
    forbid: [NO_WAIT, { pattern: "timeout\\s*:", message: "Không tăng timeout. Hãy chờ đúng điều kiện." }, { pattern: "\\.textContent\\(", message: "Đọc textContent() rồi so sánh là nguồn gốc flaky ở bài này." }],
    mutants: [{ bug: "cart-wrong-total", label: "tổng tiền cộng sai" }],
    hints: [
      "textContent() đọc đúng một lần, ngay lúc gọi. Giỏ hàng cập nhật sau đó vài trăm mili giây.",
      "Thay cặp textContent + toBe bằng assertion web-first tương ứng.",
      `import { test, expect } from '@playwright/test';\n\ntest('thêm 2 gói vào giỏ', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  await page.getByRole('button', { name: 'Thêm Gói Cơ bản vào giỏ' }).click();\n  await page.getByRole('button', { name: 'Thêm Gói Nâng cao vào giỏ' }).click();\n\n  await expect(page.getByTestId('cart-count')).toHaveText('2');\n  await expect(page.getByTestId('cart-total')).toHaveText('298.000 ₫');\n});`,
    ],
  },
  {
    id: "k-l20-frames",
    lesson: "l20",
    chapter: 3,
    type: "loc",
    runner: "pw",
    title: "Thanh toán trong iframe và hộp thoại nhập tên",
    difficulty: 3,
    xp: 100,
    prompt: "Trên trang **Thành phần**:\n\n- Trong iframe **Cổng thanh toán**: nhập số thẻ `1234`, bấm Thanh toán, kiểm tra báo lỗi `Số thẻ phải có 16 chữ số`; sửa thành `4111111111111111`, thanh toán lại, kiểm tra `Thanh toán thành công`\n- Bấm **Nhập tên**, trả lời hộp thoại bằng `Khánh Linh`, kiểm tra `Người nhận: Khánh Linh`",
    starter: `import { test, expect } from '@playwright/test';\n\ntest('iframe và hộp thoại', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  // viết tiếp ở đây\n});\n`,
    require: [{ pattern: "frameLocator\\(", message: "dùng page.frameLocator(...)" }, { pattern: "'dialog'|\"dialog\"", message: "xử lý hộp thoại bằng page.once('dialog', …)" }],
    forbid: [NO_WAIT],
    hints: [
      "const pay = page.frameLocator('iframe[title=\"Cổng thanh toán\"]'); thông báo trong iframe có role status.",
      "Đăng ký page.once('dialog', (d) => d.accept('Khánh Linh')) TRƯỚC khi bấm nút Nhập tên.",
      `import { test, expect } from '@playwright/test';\n\ntest('iframe và hộp thoại', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  const pay = page.frameLocator('iframe[title="Cổng thanh toán"]');\n  await pay.getByLabel('Số thẻ').fill('1234');\n  await pay.getByRole('button', { name: 'Thanh toán' }).click();\n  await expect(pay.getByRole('status')).toHaveText('Số thẻ phải có 16 chữ số');\n  await pay.getByLabel('Số thẻ').fill('4111111111111111');\n  await pay.getByRole('button', { name: 'Thanh toán' }).click();\n  await expect(pay.getByRole('status')).toHaveText('Thanh toán thành công');\n\n  page.once('dialog', (d) => d.accept('Khánh Linh'));\n  await page.getByRole('button', { name: 'Nhập tên' }).click();\n  await expect(page.getByTestId('dialog-result')).toHaveText('Người nhận: Khánh Linh');\n});`,
    ],
  },
  {
    id: "k-l21-table",
    lesson: "l21",
    chapter: 3,
    type: "loc",
    runner: "pw",
    title: "Sắp xếp bảng và chọn ngày hẹn",
    difficulty: 2,
    xp: 80,
    prompt: "- Ở trang Khách hàng, bấm tiêu đề cột **Họ tên** để sắp xếp tăng dần, kiểm tra dòng dữ liệu đầu tiên là **Bùi An Nhiên**\n- Sang trang Thành phần, chọn **Ngày hẹn** là 15 của tháng sau (lịch mở ở tháng 12/2026), kiểm tra ô hiển thị `15/01/2027`",
    starter: `import { test, expect } from '@playwright/test';\n\ntest('sắp xếp và chọn ngày', async ({ page }) => {\n${LOGIN}\n  // viết tiếp ở đây\n});\n`,
    require: [{ pattern: "gridcell", message: "chọn ngày bằng getByRole('gridcell', …)" }],
    forbid: [NO_WAIT, { pattern: "evaluate\\(", message: "Không dùng page.evaluate để thao tác ở bài này." }],
    hints: [
      "Tiêu đề cột là một nút: getByRole('button', { name: 'Họ tên' }). Dòng dữ liệu: rows.filter({ has: page.getByRole('cell') }).first().",
      "Ô Ngày hẹn là readonly, bấm vào để mở lịch; nút chuyển tháng có tên 'Tháng sau'; ngày dùng { name: '15', exact: true }.",
      `import { test, expect } from '@playwright/test';\n\ntest('sắp xếp và chọn ngày', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('button', { name: 'Họ tên' }).click();\n  const firstRow = page.getByRole('row').filter({ has: page.getByRole('cell') }).first();\n  await expect(firstRow).toContainText('Bùi An Nhiên');\n\n  await page.getByRole('link', { name: 'Thành phần' }).click();\n  await page.getByLabel('Ngày hẹn').click();\n  await page.getByRole('button', { name: 'Tháng sau' }).click();\n  await page.getByRole('gridcell', { name: '15', exact: true }).click();\n  await expect(page.getByLabel('Ngày hẹn')).toHaveValue('15/01/2027');\n});`,
    ],
  },
  {
    id: "k-l22-review",
    lesson: "l22",
    chapter: 3,
    type: "loc",
    runner: "pw",
    title: "Review test do AI viết",
    difficulty: 3,
    xp: 120,
    prompt: "Đây là test AI viết cho chức năng thêm khách hàng. Nó **chạy xanh**, nhưng không ai dám merge. Viết lại cho chuẩn:\n\n- Locator theo vai trò/nhãn, không XPath, không class CSS, không nth\n- Không waitForTimeout\n- Có expect kiểm tra đúng kết quả\n\nMáy chấm bật 2 bug: không hiện thông báo, và lưu sai tên.",
    starter: `import { test, expect } from '@playwright/test';\n\n// Test do AI viết. Chạy xanh, nhưng có vấn đề. Hãy review và viết lại.\ntest('add customer', async ({ page }) => {\n  await page.goto('/login');\n  await page.locator('#email').fill('linh@sokhach.vn');\n  await page.locator('#password').fill('Matkhau@123');\n  await page.locator('button[type=submit]').click();\n  await page.waitForTimeout(2000);\n  await page.locator('.btn.btn-primary').click();\n  await page.locator('//form//input').nth(0).fill('Đinh Thảo Nguyên');\n  await page.locator('//form//input').nth(1).fill('nguyen' + Date.now() + '@mail.vn');\n  await page.locator('button[type=submit]').click();\n  await page.waitForTimeout(2000);\n});\n`,
    forbid: [NO_WAIT, NO_NTH, { pattern: "locator\\(\\s*['\"](\\/\\/|xpath=)", message: "Không dùng XPath." }, { pattern: "locator\\(\\s*['\"][^'\"]*\\.btn", message: "Không dùng class CSS làm locator." }],
    mutants: [
      { bug: "add-no-toast", label: "thêm xong không có thông báo" },
      { bug: "add-wrong-name", label: "lưu sai tên khách" },
    ],
    hints: [
      "Đăng nhập: getByLabel('Email'), getByLabel('Mật khẩu'), getByRole('button', { name: 'Đăng nhập' }). Nút thêm: getByRole('button', { name: '+ Thêm khách hàng' }).",
      "Trong hộp thoại (role dialog): getByLabel('Họ tên'), getByLabel('Email', { exact: true }), nút Lưu. Cuối cùng kiểm tra toast có đúng tên.",
      `import { test, expect } from '@playwright/test';\n\ntest('thêm khách hàng', async ({ page }) => {\n${LOGIN}\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Đinh Thảo Nguyên');\n  await dialog.getByLabel('Email', { exact: true }).fill('nguyen' + Date.now() + '@mail.vn');\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Đinh Thảo Nguyên');\n});`,
    ],
  },
];
