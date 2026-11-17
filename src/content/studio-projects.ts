// Dự án mẫu cho Xưởng Code.

export const JS_PROJECT: Record<string, string> = {
  "main.ts": `import { customers, uniqueEmail } from './src/data';
import { summarize } from './src/report';

console.log('Email mới:', uniqueEmail('signup'));

const vip = customers.filter((c) => c.tier === 'VIP');
console.log('Khách VIP:', vip.map((c) => c.name));

console.log(summarize([true, true, false, true]));
`,
  "src/data.ts": `export interface Customer {
  id: number;
  name: string;
  tier: 'VIP' | 'Mới' | 'Thường';
}

export const customers: Customer[] = [
  { id: 1, name: 'Nguyễn Minh Anh', tier: 'VIP' },
  { id: 2, name: 'Trần Thu Hà', tier: 'Mới' },
  { id: 3, name: 'Lê Bảo Ngọc', tier: 'VIP' },
];

export const uniqueEmail = (prefix = 'qa') => \`\${prefix}+\${Date.now()}@sokhach.vn\`;
`,
  "src/report.ts": `export function summarize(results: boolean[]) {
  const pass = results.filter(Boolean).length;
  const rate = results.length ? Math.round((pass / results.length) * 100) : 0;
  return \`\${pass}/\${results.length} pass (\${rate}%)\`;
}
`,
};

export const PW_PROJECT: Record<string, string> = {
  ".env": `# Biến môi trường cho dự án test (KHÔNG commit tệp này, chỉ commit .env.example)
BASE_URL=https://sokhach.playforge.dev
ADMIN_EMAIL=linh@sokhach.vn
ADMIN_PASSWORD=Matkhau@123
VIEWER_EMAIL=khach@sokhach.vn
`,
  ".env.example": `BASE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
VIEWER_EMAIL=
`,
  "data/customers.csv": `name,tier,city
Lê Bảo Ngọc,VIP,TP.HCM
Trần Thu Hà,Mới,Đà Nẵng
Bùi An Nhiên,Thường,Hải Phòng
`,
  "data/users.json": `[
  { "email": "linh@sokhach.vn", "password": "Matkhau@123", "role": "admin", "canAdd": true },
  { "email": "ha@sokhach.vn", "password": "Matkhau@123", "role": "manager", "canAdd": true },
  { "email": "khach@sokhach.vn", "password": "Matkhau@123", "role": "viewer", "canAdd": false }
]
`,
  "playwright.config.ts": `import { defineConfig } from '@playwright/test';

// Trong sandbox, baseURL luôn là app luyện tập Sổ Khách.
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'https://sokhach.playforge.dev',
    trace: 'on-first-retry',
  },
});
`,
  "pages/LoginPage.ts": `import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Mật khẩu');
    this.submitButton = page.getByRole('button', { name: 'Đăng nhập' });
    this.errorMessage = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
`,
  "fixtures/base.ts": `import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect };
`,
  "tests/login.spec.ts": `import { test, expect } from '../fixtures/base';

test.describe('Đăng nhập Sổ Khách', () => {
  test('đăng nhập đúng thì vào trang Khách hàng @smoke', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('linh@sokhach.vn', 'Matkhau@123');
    await expect(page).toHaveURL(/customers/);
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
  });

  test('bỏ trống email thì nút bị khóa', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.password.fill('Matkhau@123');
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('sai mật khẩu thì báo lỗi', async ({ loginPage }) => {
    // TODO: test này đang fail. Còn thiếu gì ở đây?
    await loginPage.login('linh@sokhach.vn', 'sai-mat-khau');
    await expect(loginPage.errorMessage).toHaveText('Email hoặc mật khẩu không đúng');
  });
});
`,
  "tests/customers.spec.ts": `import { test, expect } from '../fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('linh@sokhach.vn', 'Matkhau@123');
});

test('thêm khách hàng mới @smoke', async ({ page }) => {
  await page.getByRole('button', { name: '+ Thêm khách hàng' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Họ tên').fill('Võ Ngọc Trâm');
  // exact: true vì checkbox "Nhận email khuyến mãi" cũng chứa chữ "email"
  await dialog.getByLabel('Email', { exact: true }).fill('tram' + Date.now() + '@mail.vn');
  await dialog.getByLabel('Hạng').selectOption('VIP');
  await dialog.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByTestId('toast')).toHaveText('Đã thêm khách hàng Võ Ngọc Trâm');
});

test('tìm khách theo tên', async ({ page }) => {
  await page.getByPlaceholder('Tìm theo tên…').fill('Hà');
  await expect(page.getByRole('row').filter({ hasText: 'Trần Thu Hà' })).toBeVisible();
  await expect(page.getByTestId('customer-count')).toHaveText('1 khách');
});
`,
};
