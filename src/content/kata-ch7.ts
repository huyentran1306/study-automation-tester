import type { Kata } from "./types";

// Thử thách chương 7: debug test hỏng, viết workflow CI.

export const KATA_CH7: Kata[] = [
  {
    id: "k-l38-debug",
    lesson: "l38",
    chapter: 7,
    type: "flaky",
    runner: "pw",
    title: "Sửa test hỏng nhờ Trace",
    difficulty: 2,
    xp: 100,
    prompt: "Test dưới đây có **4 lỗi**. Chạy thử, mở tab **Trace**, đọc bước đỏ và thông báo lỗi để sửa từng chỗ. Mục tiêu của test giữ nguyên: thêm khách **Phan Diệu Linh** và thấy thông báo đúng.\n\nMáy chấm bật bug \"lưu sai tên\" để chắc test của bạn vẫn kiểm tra đúng.",
    starter: "import { test, expect } from '@playwright/test';\n\ntest('thêm khách và thấy thông báo', async ({ page }) => {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill('linh@sokhach.vn');\n  await page.getByLabel('Mật khẩu').fill('Matkhau@123');\n  await page.getByRole('button', { name: 'Đăng Nhập', exact: true }).click();\n  await expect(page.getByRole('heading', { name: 'Danh sách khách hàng' })).toBeVisible();\n\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Phan Diệu Linh');\n  await dialog.getByLabel('Email').fill('dieulinh' + Date.now() + '@mail.vn');\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng: Phan Diệu Linh');\n});\n",
    forbid: [{ pattern: "waitForTimeout", message: "Không dùng waitForTimeout." }, { pattern: "\\.(nth|first|last)\\(", message: "Không sửa strict mode bằng nth/first/last; dùng tên chính xác." }],
    mutants: [{ bug: "add-wrong-name", label: "lưu sai tên" }],
    hints: [
      "Lỗi 1: exact: true phân biệt hoa thường, chữ trên nút là 'Đăng nhập'. Lỗi 2: tiêu đề trang chỉ là 'Khách hàng'.",
      "Lỗi 3: getByLabel('Email') trong hộp thoại khớp 2 phần tử (có checkbox \"Nhận email khuyến mãi\"), cần { exact: true }. Lỗi 4: thông báo thật không có dấu hai chấm.",
      "import { test, expect } from '@playwright/test';\n\ntest('thêm khách và thấy thông báo', async ({ page }) => {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill('linh@sokhach.vn');\n  await page.getByLabel('Mật khẩu').fill('Matkhau@123');\n  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();\n  await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();\n\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Phan Diệu Linh');\n  await dialog.getByLabel('Email', { exact: true }).fill('dieulinh' + Date.now() + '@mail.vn');\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Phan Diệu Linh');\n});",
    ],
  },
  {
    id: "k-l40-ci",
    lesson: "l40",
    chapter: 7,
    type: "js",
    title: "Viết workflow GitHub Actions",
    difficulty: 2,
    xp: 90,
    prompt: "Hoàn thành mảng `lines` để tạo tệp `.github/workflows/e2e.yml` (mỗi phần tử là một dòng YAML). Yêu cầu:\n\n- Chạy khi **push** vào `main`, khi mở **pull_request**, và **mỗi đêm** lúc 2:00 giờ Việt Nam (cron theo UTC)\n- Chạy trên `ubuntu-latest`: checkout, setup Node 24, `npm ci`, cài trình duyệt **kèm thư viện hệ thống**, chạy test\n- Truyền mật khẩu bằng `secrets.ADMIN_PASSWORD` (không ghi mật khẩu thật)\n- Luôn lưu thư mục `playwright-report/` kể cả khi test đỏ\n\nDùng chuỗi thường (nháy đơn), không dùng template literal vì `${{ }}` sẽ bị JavaScript hiểu nhầm.",
    starter: "const lines = [\n  'name: e2e',\n  'on:',\n  '  push:',\n  '    branches: [main]',\n  // viết tiếp các dòng còn lại\n];\n\nconst yaml = lines.join('\\n');\nconsole.log(yaml);\n",
    tests: `const y = typeof yaml === 'string' ? yaml : '';
test('trigger push main, pull_request', () => { expect(y).toMatch(/push:\\s*\\n\\s+branches:\\s*\\[\\s*main\\s*\\]/); expect(y).toMatch(/\\bpull_request:/); });
test('lịch chạy đêm 2:00 giờ Việt Nam (19:00 UTC)', () => { expect(y).toMatch(/schedule:\\s*\\n\\s*-\\s*cron:\\s*['"]0 19 \\* \\* \\*['"]/); });
test('runs-on ubuntu-latest', () => { expect(y).toMatch(/runs-on:\\s*ubuntu-latest/); });
test('checkout và setup-node 24', () => { expect(y).toMatch(/uses:\\s*actions\\/checkout@v\\d/); expect(y).toMatch(/uses:\\s*actions\\/setup-node@v\\d/); expect(y).toMatch(/node-version:\\s*['"]?24/); });
test('npm ci và cài trình duyệt kèm thư viện', () => { expect(y).toMatch(/run:\\s*npm ci/); expect(y).toMatch(/npx playwright install --with-deps/); });
test('chạy test', () => { expect(y).toMatch(/run:\\s*npx playwright test/); });
test('mật khẩu lấy từ secrets', () => { expect(y).toMatch(/ADMIN_PASSWORD:\\s*\\$\\{\\{\\s*secrets\\.ADMIN_PASSWORD\\s*\\}\\}/); expect(y).not.toMatch(/Matkhau@123/); });
test('luôn lưu report kể cả khi đỏ', () => { expect(y).toMatch(/actions\\/upload-artifact@v\\d/); expect(y).toMatch(/if:\\s*(\\$\\{\\{\\s*)?(always\\(\\)|!cancelled\\(\\))/); expect(y).toMatch(/path:\\s*playwright-report\\/?/); });`,
    hints: [
      "Cấu trúc: on (push, pull_request, schedule) → jobs → test → runs-on → steps. Thụt lề 2 dấu cách mỗi cấp, YAML rất nhạy thụt lề.",
      "2:00 sáng Việt Nam = 19:00 UTC hôm trước: cron '0 19 * * *'. Bước lưu report: uses: actions/upload-artifact@v4, if: always(), with: path: playwright-report/.",
      "const lines = [\n  'name: e2e',\n  'on:',\n  '  push:',\n  '    branches: [main]',\n  '  pull_request:',\n  '  schedule:',\n  \"    - cron: '0 19 * * *'\",\n  'jobs:',\n  '  test:',\n  '    runs-on: ubuntu-latest',\n  '    steps:',\n  '      - uses: actions/checkout@v4',\n  '      - uses: actions/setup-node@v4',\n  '        with:',\n  '          node-version: 24',\n  '      - run: npm ci',\n  '      - run: npx playwright install --with-deps',\n  '      - run: npx playwright test',\n  '        env:',\n  '          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}',\n  '      - uses: actions/upload-artifact@v4',\n  '        if: always()',\n  '        with:',\n  '          name: playwright-report',\n  '          path: playwright-report/',\n];\n\nconst yaml = lines.join('\\n');\nconsole.log(yaml);",
    ],
  },
];
