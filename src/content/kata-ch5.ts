import type { Kata } from "./types";
import { PW_PROJECT } from "./studio-projects";

// Thử thách chương 5: môi trường, dữ liệu ngoài, data-driven, test độc lập.

const NO_WAIT = { pattern: "waitForTimeout", message: "Không dùng waitForTimeout." };
const LOGIN = `  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();`;

export const KATA_CH5: Kata[] = [
  {
    id: "k-l30-env",
    lesson: "l30",
    chapter: 5,
    type: "pom",
    runner: "pw",
    title: "Không ghi cứng mật khẩu",
    difficulty: 1,
    xp: 60,
    prompt: "Dự án có tệp `.env` với `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Viết test đăng nhập dùng `dotenv` và `process.env`, kiểm tra đã vào trang **Khách hàng** (URL chứa `customers`).\n\nTrong code **không được** xuất hiện email hay mật khẩu. Máy chấm bật bug \"đăng nhập xong chuyển nhầm trang\".",
    files: { ".env": PW_PROJECT[".env"] },
    starter: "import { test, expect } from '@playwright/test';\nimport dotenv from 'dotenv';\n\n// nạp .env rồi viết test\n",
    require: [{ pattern: "dotenv\\.config\\(|dotenv/config", message: "nạp .env bằng dotenv" }, { pattern: "process\\.env\\.ADMIN_PASSWORD", message: "đọc mật khẩu từ process.env.ADMIN_PASSWORD" }],
    forbid: [NO_WAIT, { pattern: "Matkhau@123|linh@sokhach\\.vn", message: "Không ghi cứng email/mật khẩu trong code." }],
    mutants: [{ bug: "login-wrong-redirect", label: "đăng nhập xong chuyển nhầm trang" }],
    hints: [
      "dotenv.config(); rồi const email = process.env.ADMIN_EMAIL!;",
      "Kiểm tra URL bằng await expect(page).toHaveURL(/customers/).",
      "import { test, expect } from '@playwright/test';\nimport dotenv from 'dotenv';\n\ndotenv.config();\n\ntest('đăng nhập bằng .env', async ({ page }) => {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);\n  await page.getByLabel('Mật khẩu').fill(process.env.ADMIN_PASSWORD!);\n  await page.getByRole('button', { name: 'Đăng nhập' }).click();\n  await expect(page).toHaveURL(/customers/);\n});",
    ],
  },
  {
    id: "k-l32-csv",
    lesson: "l32",
    chapter: 5,
    type: "pom",
    runner: "pw",
    title: "Sinh test từ tệp CSV",
    difficulty: 2,
    xp: 100,
    prompt: "Tệp `data/vip.csv` có cột `name,city`. Đọc tệp bằng `fs` + `csv-parse`, sinh **một test cho mỗi dòng**: tìm khách theo tên, kiểm tra còn đúng `1 khách` và dòng của khách có đúng thành phố.\n\nMáy chấm bật bug \"tìm kiếm không lọc\" và \"đếm lệch 1\".",
    files: { "data/vip.csv": "name,city\nNguyễn Minh Anh,Hà Nội\nHuỳnh Mỹ Linh,Đà Nẵng\nCao Ngọc Ánh,TP.HCM\n" },
    starter: "import { test, expect } from '@playwright/test';\nimport fs from 'fs';\nimport { parse } from 'csv-parse/sync';\n\n// const rows = parse(...)\n",
    require: [{ pattern: "readFileSync\\(", message: "đọc tệp bằng fs.readFileSync" }, { pattern: "for\\s*\\([\\s\\S]*test\\(|forEach\\([\\s\\S]*test\\(", message: "sinh test trong vòng lặp" }],
    forbid: [NO_WAIT, { pattern: "Huỳnh Mỹ Linh|Cao Ngọc Ánh", message: "Dữ liệu phải đọc từ CSV, không ghi cứng trong code." }],
    mutants: [
      { bug: "search-broken", label: "tìm kiếm không lọc" },
      { bug: "count-off", label: "số khách hiển thị lệch 1" },
    ],
    hints: [
      "const rows: { name: string; city: string }[] = parse(fs.readFileSync('data/vip.csv', 'utf-8'), { columns: true, skip_empty_lines: true });",
      "for (const r of rows) { test(`tìm ${r.name}`, async ({ page }) => { … }); }",
      `import { test, expect } from '@playwright/test';\nimport fs from 'fs';\nimport { parse } from 'csv-parse/sync';\n\nconst rows: { name: string; city: string }[] = parse(fs.readFileSync('data/vip.csv', 'utf-8'), { columns: true, skip_empty_lines: true });\n\nfor (const r of rows) {\n  test(\`tìm \${r.name}\`, async ({ page }) => {\n${LOGIN.replace(/^ {2}/gm, "    ")}\n    await page.getByPlaceholder('Tìm theo tên…').fill(r.name);\n    await expect(page.getByTestId('customer-count')).toHaveText('1 khách');\n    await expect(page.getByRole('row').filter({ hasText: r.name })).toContainText(r.city);\n  });\n}`,
    ],
  },
  {
    id: "k-l33-ddt",
    lesson: "l33",
    chapter: 5,
    type: "pom",
    runner: "pw",
    title: "Data-driven cho màn đăng nhập",
    difficulty: 2,
    xp: 110,
    prompt: "Viết **một mảng** các trường hợp đăng nhập và sinh test từ mảng đó:\n\n- Email + mật khẩu đúng → vào trang có URL chứa `customers`\n- Mật khẩu sai → thông báo `Email hoặc mật khẩu không đúng`\n- Để trống email → nút Đăng nhập bị khóa\n\nMáy chấm bật 3 bug, mỗi bug làm hỏng một trường hợp.",
    starter: "import { test, expect } from '@playwright/test';\n\nconst cases = [\n  // { title: '...', email: '...', password: '...', expect: 'ok' | 'error' | 'disabled' },\n];\n\n// sinh test từ cases\n",
    require: [{ pattern: "for\\s*\\([\\s\\S]*test\\(|forEach\\([\\s\\S]*test\\(", message: "sinh test trong vòng lặp" }],
    forbid: [NO_WAIT],
    mutants: [
      { bug: "login-no-error", label: "sai mật khẩu không báo lỗi" },
      { bug: "login-wrong-redirect", label: "đăng nhập đúng nhưng chuyển nhầm trang" },
      { bug: "login-always-enabled", label: "nút không bị khóa khi trống email" },
    ],
    hints: [
      "Mỗi phần tử có trường expect cho biết cần kiểm tra gì. Trong test dùng if/else theo c.expect.",
      "Trường hợp trống email: không bấm nút, chỉ kiểm tra toBeDisabled(). Hai trường hợp kia bấm Đăng nhập rồi kiểm tra.",
      "import { test, expect } from '@playwright/test';\n\nconst cases = [\n  { title: 'đúng tài khoản', email: 'linh@sokhach.vn', password: 'Matkhau@123', expect: 'ok' },\n  { title: 'sai mật khẩu', email: 'linh@sokhach.vn', password: 'sai', expect: 'error' },\n  { title: 'trống email', email: '', password: 'Matkhau@123', expect: 'disabled' },\n] as const;\n\nfor (const c of cases) {\n  test(`đăng nhập: ${c.title}`, async ({ page }) => {\n    await page.goto('/login');\n    if (c.email) await page.getByLabel('Email').fill(c.email);\n    await page.getByLabel('Mật khẩu').fill(c.password);\n    const btn = page.getByRole('button', { name: 'Đăng nhập' });\n    if (c.expect === 'disabled') {\n      await expect(btn).toBeDisabled();\n      return;\n    }\n    await btn.click();\n    if (c.expect === 'ok') await expect(page).toHaveURL(/customers/);\n    else await expect(page.getByTestId('login-error')).toHaveText('Email hoặc mật khẩu không đúng');\n  });\n}",
    ],
  },
  {
    id: "k-l34-isolate",
    lesson: "l34",
    chapter: 5,
    type: "flaky",
    runner: "pw",
    title: "Chạy chung thì xanh, chạy riêng thì đỏ",
    difficulty: 3,
    xp: 130,
    prompt: "Hai test dưới đây chạy cả file thì xanh. Nhưng chạy riêng test thứ hai (`-g \"tìm thấy\"`) hoặc bật song song là đỏ: nó dựa vào khách do test đầu tạo và biến `email` dùng chung.\n\nSửa để **mỗi test tự chuẩn bị dữ liệu của mình**. Máy chấm chạy cả file, rồi chạy riêng từng test.",
    starter: `import { test, expect } from '@playwright/test';\n\nlet email = '';\n\ntest.beforeEach(async ({ page }) => {\n${LOGIN}\n});\n\ntest('tạo khách mới', async ({ page }) => {\n  email = 'dl' + Date.now() + '@mail.vn';\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Khách Độc Lập');\n  await dialog.getByLabel('Email', { exact: true }).fill(email);\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Khách Độc Lập');\n});\n\ntest('tìm thấy khách vừa tạo', async ({ page }) => {\n  await page.getByPlaceholder('Tìm theo tên…').fill('Độc Lập');\n  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();\n});\n`,
    isolate: true,
    forbid: [NO_WAIT, { pattern: "(^|\\n)(let|var)\\s+\\w+", message: "Không dùng biến dùng chung ở cấp file giữa các test." }, { pattern: "serial", message: "Không giải quyết bằng chế độ serial; hãy làm test độc lập." }],
    hints: [
      "Test thứ hai cần có khách của riêng nó. Cách nhanh nhất: tạo bằng API qua fixture request (x-api-key: sk_test_sokhach_2026) trước khi tải trang.",
      "Bỏ biến email ở cấp file; mỗi test tự sinh email. Nhớ: tạo bằng API TRƯỚC khi đăng nhập để danh sách tải ra đã có khách.",
      `import { test, expect } from '@playwright/test';\n\nasync function login(page: import('@playwright/test').Page) {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill('linh@sokhach.vn');\n  await page.getByLabel('Mật khẩu').fill('Matkhau@123');\n  await page.getByRole('button', { name: 'Đăng nhập' }).click();\n}\n\ntest('tạo khách mới', async ({ page }) => {\n  const email = 'dl' + Date.now() + '@mail.vn';\n  await login(page);\n  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n  const dialog = page.getByRole('dialog');\n  await dialog.getByLabel('Họ tên').fill('Khách Độc Lập');\n  await dialog.getByLabel('Email', { exact: true }).fill(email);\n  await dialog.getByRole('button', { name: 'Lưu' }).click();\n  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Khách Độc Lập');\n});\n\ntest('tìm thấy khách vừa tạo', async ({ page, request }) => {\n  const email = 'tk' + Date.now() + '@mail.vn';\n  const res = await request.post('/lab-api/v1/customers', {\n    headers: { 'x-api-key': 'sk_test_sokhach_2026' },\n    data: { name: 'Khách Tự Tạo', email },\n  });\n  expect(res.status()).toBe(201);\n  await login(page);\n  await page.getByPlaceholder('Tìm theo tên…').fill('Tự Tạo');\n  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();\n});`,
    ],
  },
];
