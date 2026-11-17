import type { Kata } from "./types";
import { PW_PROJECT } from "./studio-projects";

// Thử thách chương 4: Page Object Model và fixture.

const FILES = { "pages/LoginPage.ts": PW_PROJECT["pages/LoginPage.ts"] };
const NO_WAIT = { pattern: "waitForTimeout", message: "Không dùng waitForTimeout." };

export const KATA_CH4: Kata[] = [
  {
    id: "k-l23-pom",
    lesson: "l23",
    chapter: 4,
    type: "pom",
    runner: "pw",
    title: "CustomersPage xóa đúng khách",
    difficulty: 2,
    xp: 100,
    prompt: "Dự án có sẵn `pages/LoginPage.ts` (import bằng `../pages/LoginPage`). Viết class `CustomersPage` có:\n\n- `row(name)` trả về locator dòng của khách\n- `deleteCustomer(name)` bấm Xóa ở dòng đó và xác nhận trong hộp thoại\n\nRồi viết test dùng `LoginPage` + `CustomersPage` xóa **Phạm Gia Hân** và kiểm tra dòng biến mất. Máy chấm bật bug \"xóa nhầm dòng\".",
    files: FILES,
    starter: "import { test, expect, type Page } from '@playwright/test';\nimport { LoginPage } from '../pages/LoginPage';\n\nclass CustomersPage {\n  constructor(private readonly page: Page) {}\n  // row(name) và deleteCustomer(name)\n}\n\ntest('xóa khách bằng Page Object', async ({ page }) => {\n  // dùng LoginPage và CustomersPage\n});\n",
    require: [
      { pattern: "class\\s+CustomersPage", message: "viết class CustomersPage" },
      { pattern: "deleteCustomer\\(", message: "có phương thức deleteCustomer" },
      { pattern: "new\\s+LoginPage\\(", message: "dùng LoginPage có sẵn" },
    ],
    forbid: [NO_WAIT, { pattern: "\\.(nth|first|last)\\(", message: "Không dùng nth/first/last." }],
    mutants: [{ bug: "delete-wrong-row", label: "xóa nhầm dòng đầu tiên" }],
    hints: [
      "row(name) { return this.page.getByRole('row').filter({ hasText: name }); }",
      "deleteCustomer: bấm row(name).getByRole('button', { name: 'Xóa' }) rồi page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }). Trong test kiểm tra expect(customers.row(...)).toHaveCount(0).",
      "import { test, expect, type Page } from '@playwright/test';\nimport { LoginPage } from '../pages/LoginPage';\n\nclass CustomersPage {\n  constructor(private readonly page: Page) {}\n  row(name: string) {\n    return this.page.getByRole('row').filter({ hasText: name });\n  }\n  async deleteCustomer(name: string) {\n    await this.row(name).getByRole('button', { name: 'Xóa' }).click();\n    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();\n  }\n}\n\ntest('xóa khách bằng Page Object', async ({ page }) => {\n  const login = new LoginPage(page);\n  await login.goto();\n  await login.login('linh@sokhach.vn', 'Matkhau@123');\n  const customers = new CustomersPage(page);\n  await customers.deleteCustomer('Phạm Gia Hân');\n  await expect(customers.row('Phạm Gia Hân')).toHaveCount(0);\n});",
    ],
  },
  {
    id: "k-l25-fixture",
    lesson: "l25",
    chapter: 4,
    type: "pom",
    runner: "pw",
    title: "Fixture đăng nhập sẵn",
    difficulty: 2,
    xp: 100,
    prompt: "Tạo fixture `customersPage` bằng `test.extend`: đăng nhập rồi đưa trang Khách hàng cho test. Viết 2 test dùng fixture đó:\n\n- Lọc hạng **VIP** → `6 khách`\n- Tìm `Ngọc` → `5 khách`\n\nKhông lặp code đăng nhập trong test. Máy chấm bật bug \"tìm kiếm không lọc\" và \"đếm lệch 1\".",
    files: FILES,
    starter: "import { test as base, expect, type Page } from '@playwright/test';\nimport { LoginPage } from '../pages/LoginPage';\n\n// const test = base.extend<{ customersPage: Page }>({ ... });\n",
    require: [{ pattern: "\\.extend\\s*<|\\.extend\\(", message: "tạo fixture bằng test.extend" }, { pattern: "use\\(", message: "trả fixture bằng await use(...)" }],
    forbid: [NO_WAIT, { pattern: "test\\((?:(?!extend)[\\s\\S])*getByLabel\\('Mật khẩu'\\)", message: "Không lặp bước đăng nhập trong test; đặt trong fixture." }],
    mutants: [
      { bug: "search-broken", label: "ô tìm kiếm không lọc" },
      { bug: "count-off", label: "số khách hiển thị lệch 1" },
    ],
    hints: [
      "Trong fixture: const login = new LoginPage(page); await login.goto(); await login.login(...); await use(page);",
      "Test nhận fixture qua tham số: async ({ customersPage }) => { await customersPage.getByLabel('Hạng').selectOption('VIP'); … }",
      "import { test as base, expect, type Page } from '@playwright/test';\nimport { LoginPage } from '../pages/LoginPage';\n\nconst test = base.extend<{ customersPage: Page }>({\n  customersPage: async ({ page }, use) => {\n    const login = new LoginPage(page);\n    await login.goto();\n    await login.login('linh@sokhach.vn', 'Matkhau@123');\n    await use(page);\n  },\n});\n\ntest('lọc VIP', async ({ customersPage }) => {\n  await customersPage.getByLabel('Hạng').selectOption('VIP');\n  await expect(customersPage.getByTestId('customer-count')).toHaveText('6 khách');\n});\n\ntest('tìm theo tên', async ({ customersPage }) => {\n  await customersPage.getByPlaceholder('Tìm theo tên…').fill('Ngọc');\n  await expect(customersPage.getByTestId('customer-count')).toHaveText('5 khách');\n});",
    ],
  },
  {
    id: "k-l27-pom",
    lesson: "l27",
    chapter: 4,
    type: "pom",
    runner: "pw",
    title: "Dự án POM nhỏ: thêm khách ngẫu nhiên",
    difficulty: 3,
    xp: 140,
    prompt: "Viết `CustomersPage` có `add({ name, email, city })` và fixture `customers` (đăng nhập sẵn). Test: sinh khách ngẫu nhiên bằng `faker`, thêm qua giao diện, kiểm tra thông báo đúng tên, tìm lại theo tên và kiểm tra dòng (lọc theo email) có đúng thành phố.\n\nMáy chấm bật bug \"không có thông báo\" và \"lưu sai tên\".",
    files: FILES,
    starter: "import { test as base, expect, type Page } from '@playwright/test';\nimport { faker } from '@faker-js/faker';\nimport { LoginPage } from '../pages/LoginPage';\n\n// class CustomersPage { ... }\n// const test = base.extend<{ customers: CustomersPage }>({ ... });\n",
    require: [
      { pattern: "class\\s+CustomersPage", message: "viết class CustomersPage" },
      { pattern: "\\.extend", message: "tạo fixture customers bằng test.extend" },
      { pattern: "faker\\.", message: "sinh dữ liệu bằng faker" },
    ],
    forbid: [NO_WAIT],
    mutants: [
      { bug: "add-no-toast", label: "thêm xong không có thông báo" },
      { bug: "add-wrong-name", label: "lưu sai tên" },
    ],
    hints: [
      "Dữ liệu: { name: faker.person.fullName(), email: faker.internet.email(), city: faker.location.city() }.",
      "Trong add(): mở hộp thoại, điền Họ tên, Email (exact: true), Thành phố rồi bấm Lưu. Tìm lại: getByPlaceholder('Tìm theo tên…').fill(c.name), dòng: getByRole('row').filter({ hasText: c.email }).",
      "import { test as base, expect, type Page, type Locator } from '@playwright/test';\nimport { faker } from '@faker-js/faker';\nimport { LoginPage } from '../pages/LoginPage';\n\nclass CustomersPage {\n  readonly toast: Locator;\n  constructor(readonly page: Page) {\n    this.toast = page.getByTestId('toast');\n  }\n  async add(c: { name: string; email: string; city: string }) {\n    await this.page.getByRole('button', { name: '+ Thêm khách hàng' }).click();\n    const d = this.page.getByRole('dialog');\n    await d.getByLabel('Họ tên').fill(c.name);\n    await d.getByLabel('Email', { exact: true }).fill(c.email);\n    await d.getByLabel('Thành phố').fill(c.city);\n    await d.getByRole('button', { name: 'Lưu' }).click();\n  }\n  row(text: string) {\n    return this.page.getByRole('row').filter({ hasText: text });\n  }\n}\n\nconst test = base.extend<{ customers: CustomersPage }>({\n  customers: async ({ page }, use) => {\n    const login = new LoginPage(page);\n    await login.goto();\n    await login.login('linh@sokhach.vn', 'Matkhau@123');\n    await use(new CustomersPage(page));\n  },\n});\n\ntest('thêm khách ngẫu nhiên', async ({ customers }) => {\n  const c = { name: faker.person.fullName(), email: faker.internet.email(), city: faker.location.city() };\n  await customers.add(c);\n  await expect(customers.toast).toHaveText('Đã thêm khách hàng ' + c.name);\n  await customers.page.getByPlaceholder('Tìm theo tên…').fill(c.name);\n  await expect(customers.row(c.email)).toContainText(c.city);\n  await expect(customers.row(c.email)).toContainText(c.name);\n});",
    ],
  },
];
