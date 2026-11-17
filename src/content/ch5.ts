import type { LessonContent } from "./types";

// Chương 5 · Config, Data-driven & Chạy song song (bài 28–34).
// Khu chạy thử có sẵn .env, data/customers.csv, data/users.json trong dự án mẫu.

const CONFIG_CODE = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['html'], ['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 15'] } },
  ],
});`;

const INFO = `import { test, expect } from '@playwright/test';

test('test biết mình chạy ở đâu', async ({ page, browserName, baseURL }) => {
  console.log('Trình duyệt:', browserName);
  console.log('baseURL:', baseURL);
  await page.goto('/login');
  await expect(page).toHaveURL(baseURL + '/login');
});
`;

export const L28: LessonContent = {
  id: "l28",
  pw: true,
  summary: "playwright.config.ts là bảng điều khiển của cả bộ test: thư mục, timeout, retry, reporter, và projects để chạy cùng bộ test trên nhiều trình duyệt, thiết bị.",
  starter: INFO,
  kata: [],
  sections: [
    {
      id: "config",
      title: "Các mục chính của config",
      minutes: 7,
      blocks: [
        { t: "code", lang: "ts", title: "playwright.config.ts", code: CONFIG_CODE },
        { t: "list", items: ["`testDir`, `testMatch`: tìm file test ở đâu", "`timeout`: thời gian tối đa của một test", "`retries`: chạy lại test đỏ (chỉ nên bật trên CI)", "`forbidOnly`: chặn lỡ commit `test.only`", "`projects`: mỗi project là một cấu hình chạy (trình duyệt, thiết bị, vai trò)"] },
      ],
    },
    {
      id: "cli",
      title: "Chọn project, file, test khi chạy",
      minutes: 4,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright test --project=chromium\nnpx playwright test --project=mobile tests/login.spec.ts\nnpx playwright test tests/login.spec.ts:12     # chỉ test ở dòng 12\nnpx playwright test --last-failed               # chỉ chạy lại test đỏ lần trước" },
        { t: "code", lang: "ts", run: true, code: INFO },
        { t: "quiz", id: "q1", q: "Muốn chạy cùng bộ test trên Chrome và Safari, khai báo ở đâu?", options: ["Viết 2 bộ test", "Hai mục trong projects của config", "Hai file .env"], answer: 1, explain: "Mỗi project là một cấu hình; Playwright chạy toàn bộ test cho từng project." },
      ],
    },
  ],
  cards: [
    { id: "c-l28-1", tag: "Config", q: "projects trong playwright.config.ts dùng để làm gì?", a: "Chạy cùng bộ test với nhiều cấu hình: trình duyệt, thiết bị, vai trò đăng nhập." },
    { id: "c-l28-2", tag: "Config", q: "Chặn việc lỡ commit test.only lên CI?", a: "forbidOnly.", code: "forbidOnly: !!process.env.CI" },
  ],
};

const USE_CODE = `use: {
  baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  headless: true,
  viewport: { width: 1366, height: 768 },
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
  actionTimeout: 10_000,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},`;

export const L29: LessonContent = {
  id: "l29",
  summary: "Khối use đặt mặc định cho mọi test: baseURL, kích thước màn hình, ngôn ngữ, múi giờ, và quan trọng nhất là khi nào chụp ảnh, quay video, ghi trace để điều tra lỗi.",
  starter: "// Bài này là cấu hình. Đọc kỹ khối use bên trái, rồi thử sửa ở Xưởng Code (playwright.config.ts).\nconsole.log('Mở Xưởng Code → playwright.config.ts để xem khối use');",
  kata: [],
  sections: [
    {
      id: "use",
      title: "Khối use",
      minutes: 7,
      blocks: [
        { t: "code", lang: "ts", title: "playwright.config.ts", code: USE_CODE },
        { t: "list", items: ["`baseURL`: cho phép viết `page.goto('/login')`", "`viewport`, `locale`, `timezoneId`: giống máy người dùng thật", "`screenshot: 'only-on-failure'`: ảnh lúc test đỏ", "`video: 'retain-on-failure'`: giữ video của test đỏ", "`trace: 'on-first-retry'`: ghi trace khi chạy lại, mở bằng Trace Viewer (chương 7)"] },
      ],
    },
    {
      id: "override",
      title: "Ghi đè cho từng file, từng nhóm",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", title: "tests/mobile.spec.ts", code: "test.use({ viewport: { width: 390, height: 844 }, locale: 'en-US' });\n\ntest('menu trên điện thoại', async ({ page }) => { /* ... */ });" },
        { t: "quiz", id: "q1", q: "Bật trace cho mọi lần chạy có vấn đề gì?", options: ["Không vấn đề", "Chậm và tốn dung lượng; nên dùng on-first-retry hoặc retain-on-failure", "Trace chỉ chạy trên Firefox"], answer: 1, explain: "Trace ghi rất chi tiết; chỉ bật khi cần điều tra." },
      ],
    },
  ],
  cards: [
    { id: "c-l29-1", tag: "Config", q: "Giữ video chỉ khi test đỏ?", a: "video: 'retain-on-failure'." },
    { id: "c-l29-2", tag: "Config", q: "Ghi đè viewport cho riêng một file test?", a: "test.use ở đầu file.", code: "test.use({ viewport: { width: 390, height: 844 } });" },
  ],
};

const ENV = `import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config(); // đọc tệp .env vào process.env

test('đăng nhập bằng tài khoản trong .env', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  console.log('Đăng nhập bằng', email); // không bao giờ in mật khẩu

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
});
`;

export const L30: LessonContent = {
  id: "l30",
  pw: true,
  summary: "Cùng bộ test chạy trên dev, staging, prod với URL và tài khoản khác nhau. Đọc cấu hình từ tệp .env bằng dotenv, không ghi mật khẩu vào code, có .env.example để người khác biết cần khai báo gì.",
  starter: ENV,
  kata: ["k-l30-env"],
  sections: [
    {
      id: "dotenv",
      title: "dotenv và process.env",
      minutes: 7,
      blocks: [
        { t: "code", lang: "text", title: ".env", code: "BASE_URL=https://staging.sokhach.vn\nADMIN_EMAIL=linh@sokhach.vn\nADMIN_PASSWORD=Matkhau@123" },
        { t: "code", lang: "ts", run: true, code: ENV },
        { t: "callout", tone: "warn", title: ".env không bao giờ được commit", md: "Thêm `.env` vào `.gitignore`. Commit `.env.example` chỉ có tên biến, không có giá trị. Trên CI, giá trị lấy từ GitHub Secrets." },
      ],
    },
    {
      id: "multi",
      title: "Nhiều môi trường",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", title: "playwright.config.ts", code: "import dotenv from 'dotenv';\nimport path from 'path';\n\nconst ENV = process.env.TEST_ENV ?? 'dev'; // dev | staging | prod\ndotenv.config({ path: path.resolve(__dirname, `.env.${ENV}`) });\n\nexport default defineConfig({ use: { baseURL: process.env.BASE_URL } });" },
        { t: "code", lang: "bash", title: "terminal", code: "TEST_ENV=staging npx playwright test        # macOS / Linux\n$env:TEST_ENV=\"staging\"; npx playwright test  # Windows PowerShell" },
        { t: "quiz", id: "q1", q: "Đồng nghiệp clone repo về, chạy test báo thiếu ADMIN_EMAIL. Thiếu gì trong repo?", options: [".env có mật khẩu thật", ".env.example liệt kê các biến cần khai báo", "node_modules"], answer: 1, explain: ".env.example cho biết cần tạo .env với những biến nào, mà không lộ giá trị." },
      ],
    },
  ],
  cards: [
    { id: "c-l30-1", tag: "Môi trường", q: "Vì sao không commit tệp .env?", a: "Chứa mật khẩu/token thật; commit .env.example chỉ có tên biến." },
    { id: "c-l30-2", tag: "Môi trường", q: "Nạp biến từ .env vào process.env?", a: "dotenv.config().", code: "import dotenv from 'dotenv';\ndotenv.config();" },
  ],
};

const STORAGE = `import { test, expect } from '@playwright/test';

test('lưu trạng thái đăng nhập', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();

  // Dự án thật: ghi ra tệp để các test sau dùng lại
  const state = await page.context().storageState({ path: '.auth/admin.json' });
  console.log('Đã lưu', state.origins[0].localStorage.length, 'mục localStorage');
});
`;

export const L31: LessonContent = {
  id: "l31",
  pw: true,
  summary: "Đăng nhập qua giao diện ở mọi test vừa chậm vừa lặp. storageState lưu cookie/localStorage sau khi đăng nhập một lần, project setup chạy trước để tạo tệp đó, và mỗi vai trò (admin, manager, viewer) có một tệp riêng.",
  starter: STORAGE,
  kata: [],
  sections: [
    {
      id: "save",
      title: "Lưu trạng thái đăng nhập",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", run: true, code: STORAGE },
        { t: "callout", tone: "warn", title: "Sandbox", md: "Khu chạy thử in ra trạng thái nhưng không ghi tệp và chưa nạp lại `storageState` cho test sau. Phần setup project bên dưới chạy trên Playwright thật ở máy bạn." },
      ],
    },
    {
      id: "setup",
      title: "Project setup và nhiều vai trò",
      minutes: 8,
      blocks: [
        { t: "code", lang: "ts", title: "tests/auth.setup.ts", code: "import { test as setup, expect } from '@playwright/test';\n\nconst roles = [\n  { name: 'admin', email: 'linh@sokhach.vn' },\n  { name: 'viewer', email: 'khach@sokhach.vn' },\n];\n\nfor (const r of roles) {\n  setup(`đăng nhập ${r.name}`, async ({ page }) => {\n    await page.goto('/login');\n    await page.getByLabel('Email').fill(r.email);\n    await page.getByLabel('Mật khẩu').fill(process.env.ADMIN_PASSWORD!);\n    await page.getByRole('button', { name: 'Đăng nhập' }).click();\n    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();\n    await page.context().storageState({ path: `.auth/${r.name}.json` });\n  });\n}" },
        { t: "code", lang: "ts", title: "playwright.config.ts", code: "projects: [\n  { name: 'setup', testMatch: /.*\\.setup\\.ts/ },\n  {\n    name: 'admin',\n    use: { storageState: '.auth/admin.json' },\n    dependencies: ['setup'],\n    testIgnore: /viewer/,\n  },\n  {\n    name: 'viewer',\n    use: { storageState: '.auth/viewer.json' },\n    dependencies: ['setup'],\n    testMatch: /viewer/,\n  },\n]," },
        { t: "callout", tone: "tip", title: "Thêm .auth vào .gitignore", md: "Tệp storageState chứa token đăng nhập, không được commit." },
        { t: "quiz", id: "q1", q: "dependencies: ['setup'] trong project admin nghĩa là gì?", options: ["Project admin chạy song song với setup", "Project setup phải chạy xong trước project admin", "Bỏ qua setup"], answer: 1, explain: "Project phụ thuộc chạy trước, tạo sẵn tệp storageState." },
      ],
    },
  ],
  cards: [
    { id: "c-l31-1", tag: "Đăng nhập", q: "storageState lưu những gì?", a: "Cookie và localStorage của context sau khi đăng nhập, để test sau khỏi đăng nhập lại." },
    { id: "c-l31-2", tag: "Đăng nhập", q: "Tạo storageState một lần trước mọi test bằng cách nào?", a: "Project setup (testMatch *.setup.ts) và các project khác khai báo dependencies: ['setup']." },
  ],
};

const DATA = `import { test, expect } from '@playwright/test';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import users from '../data/users.json';

const customers = parse(fs.readFileSync('data/customers.csv', 'utf-8'), { columns: true, skip_empty_lines: true });
console.log('Đọc được', customers.length, 'khách từ CSV và', users.length, 'tài khoản từ JSON');

test('dữ liệu từ CSV', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(users[0].email);
  await page.getByLabel('Mật khẩu').fill(users[0].password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  for (const c of customers) {
    await page.getByPlaceholder('Tìm theo tên…').fill(c.name);
    await expect(page.getByRole('row').filter({ hasText: c.name })).toContainText(c.city);
  }
});
`;

export const L32: LessonContent = {
  id: "l32",
  pw: true,
  summary: "Tách dữ liệu test ra khỏi code: tệp JSON import thẳng, CSV đọc bằng fs + csv-parse, Excel đọc bằng thư viện xlsx. Người không biết code cũng sửa được dữ liệu.",
  starter: DATA,
  kata: ["k-l32-csv"],
  sections: [
    {
      id: "files",
      title: "JSON và CSV",
      minutes: 7,
      blocks: [
        { t: "code", lang: "text", title: "data/customers.csv", code: "name,tier,city\nLê Bảo Ngọc,VIP,TP.HCM\nTrần Thu Hà,Mới,Đà Nẵng\nBùi An Nhiên,Thường,Hải Phòng" },
        { t: "code", lang: "ts", run: true, code: DATA },
      ],
    },
    {
      id: "excel",
      title: "Excel",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", title: "utils/excel.ts", code: "import * as XLSX from 'xlsx';\n\nexport function readSheet<T>(file: string, sheet = 0): T[] {\n  const wb = XLSX.readFile(file);\n  return XLSX.utils.sheet_to_json<T>(wb.Sheets[wb.SheetNames[sheet]]);\n}" },
        { t: "callout", tone: "warn", title: "Sandbox", md: "Khu chạy thử chưa đọc được tệp Excel. Hãy lưu sheet thành CSV, hoặc chạy đoạn trên với Playwright thật (`npm i -D xlsx`)." },
        { t: "quiz", id: "q1", q: "Đọc tệp CSV có dòng tiêu đề thành mảng object?", options: ["JSON.parse(csv)", "parse(text, { columns: true })", "fs.readCSV()"], answer: 1, explain: "columns: true dùng dòng đầu làm tên trường." },
      ],
    },
  ],
  cards: [
    { id: "c-l32-1", tag: "Dữ liệu", q: "Đọc CSV có tiêu đề thành object?", a: "csv-parse với columns: true.", code: "parse(fs.readFileSync('data.csv', 'utf-8'), { columns: true })" },
  ],
};

const DDT = `import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const cases = [
  { title: 'mật khẩu sai hoa/thường', email: 'linh@sokhach.vn', password: 'matkhau@123', error: 'Email hoặc mật khẩu không đúng' },
  { title: 'sai mật khẩu', email: 'linh@sokhach.vn', password: 'sai', error: 'Email hoặc mật khẩu không đúng' },
  { title: 'email không tồn tại', email: faker.internet.email(), password: 'Matkhau@123', error: 'Email hoặc mật khẩu không đúng' },
];

for (const c of cases) {
  test(\`đăng nhập thất bại: \${c.title}\`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(c.email);
    await page.getByLabel('Mật khẩu').fill(c.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByTestId('login-error')).toHaveText(c.error);
  });
}
`;

export const L33: LessonContent = {
  id: "l33",
  pw: true,
  summary: "Một kịch bản, nhiều bộ dữ liệu: sinh test từ mảng, JSON, CSV. Dùng Faker cho dữ liệu ngẫu nhiên để không trùng khi chạy lại, và giữ dữ liệu cố định cho các case cần tái hiện.",
  starter: DDT,
  kata: ["k-l33-ddt"],
  sections: [
    {
      id: "loop",
      title: "Sinh test từ mảng",
      minutes: 7,
      blocks: [
        { t: "code", lang: "ts", run: true, code: DDT },
        { t: "callout", tone: "tip", title: "Tên test phải khác nhau", md: "Mỗi test sinh ra cần tên riêng (chèn dữ liệu vào tên) để report dễ đọc và chạy lại đúng case bằng `-g`." },
        { t: "callout", tone: "warn", title: "Email sai định dạng không tới được máy chủ", md: "Ô `type=\"email\"` được trình duyệt kiểm tra trước: nhập \"linh\" rồi bấm Đăng nhập thì form không gửi đi, nên không có thông báo lỗi từ máy chủ. Case này cần kiểm tra khác (ví dụ ô Email ở trạng thái `:invalid`)." },
      ],
    },
    {
      id: "faker",
      title: "Faker và dữ liệu mặc định",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", title: "utils/data.ts", code: "import { faker } from '@faker-js/faker';\n\nexport function newCustomer(overrides: Partial<{ name: string; email: string; tier: string }> = {}) {\n  return {\n    name: faker.person.fullName(),\n    email: faker.internet.email(),\n    tier: 'Thường',\n    ...overrides, // test nào cần giá trị cụ thể thì ghi đè\n  };\n}" },
        { t: "quiz", id: "q1", q: "Vì sao không dùng email cố định 'test@mail.vn' khi tạo khách?", options: ["Vì Playwright cấm", "Lần chạy thứ hai sẽ bị trùng email (409)", "Vì chậm"], answer: 1, explain: "Dữ liệu ngẫu nhiên giúp test chạy lại nhiều lần không đụng nhau." },
      ],
    },
  ],
  cards: [
    { id: "c-l33-1", tag: "Data-driven", q: "Sinh nhiều test từ một mảng dữ liệu?", a: "Vòng for bao ngoài test(...), tên test chứa dữ liệu.", code: "for (const c of cases) {\n  test(`case: ${c.title}`, async ({ page }) => { ... });\n}" },
  ],
};

const PARALLEL = `import { test, expect } from '@playwright/test';

// Mặc định các file chạy song song; trong file, test chạy lần lượt.
// fullyParallel: true trong config cho test trong cùng file chạy song song.

test.describe('độc lập: chạy song song thoải mái', () => {
  test.describe.configure({ mode: 'parallel' });

  test('lọc VIP', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('linh@sokhach.vn');
    await page.getByLabel('Mật khẩu').fill('Matkhau@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.getByLabel('Hạng').selectOption('VIP');
    await expect(page.getByTestId('customer-count')).toHaveText('6 khách');
  });

  test('tìm theo tên', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('linh@sokhach.vn');
    await page.getByLabel('Mật khẩu').fill('Matkhau@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.getByPlaceholder('Tìm theo tên…').fill('Hà');
    await expect(page.getByTestId('customer-count')).toHaveText('1 khách');
  });
});
`;

export const L34: LessonContent = {
  id: "l34",
  pw: true,
  summary: "Chạy song song giúp 300 test xong trong vài phút. Hiểu workers, fullyParallel, chế độ serial/parallel, và nguyên tắc vàng: mỗi test tự chuẩn bị dữ liệu, không dựa vào test khác.",
  starter: PARALLEL,
  kata: ["k-l34-isolate"],
  sections: [
    {
      id: "workers",
      title: "Workers và fullyParallel",
      minutes: 6,
      blocks: [
        { t: "list", items: ["`workers`: số tiến trình chạy cùng lúc (mặc định bằng nửa số nhân CPU)", "Mặc định: các **file** chạy song song, test trong một file chạy lần lượt", "`fullyParallel: true`: test trong cùng file cũng song song", "`test.describe.configure({ mode: 'serial' })`: bắt nhóm chạy tuần tự, một test đỏ thì các test sau bị bỏ"] },
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright test --workers=4\nnpx playwright test --workers=1   # khi cần điều tra lỗi song song" },
        { t: "code", lang: "ts", run: true, code: PARALLEL },
      ],
    },
    {
      id: "independent",
      title: "Test độc lập",
      minutes: 6,
      blocks: [
        { t: "list", items: ["Không dùng biến dùng chung giữa các test (`let createdId` ở ngoài)", "Test nào cần dữ liệu thì tự tạo (nhanh nhất là qua API), tự dọn", "Dữ liệu ngẫu nhiên để hai test song song không đụng nhau", "Kiểm tra: chạy riêng từng test bằng `-g` vẫn phải xanh"] },
        { t: "callout", tone: "real", title: "Triệu chứng test phụ thuộc", md: "Chạy cả file thì xanh, chạy riêng 1 test thì đỏ; hoặc bật song song là đỏ lung tung." },
        { t: "quiz", id: "q1", q: "Test B dùng khách hàng do test A tạo. Chạy song song sẽ ra sao?", options: ["Luôn xanh", "Có lúc đỏ vì B có thể chạy trước hoặc cùng lúc A", "Playwright tự sắp xếp"], answer: 1, explain: "Thứ tự không được đảm bảo khi chạy song song; B phải tự tạo dữ liệu." },
      ],
    },
  ],
  cards: [
    { id: "c-l34-1", tag: "Song song", q: "Mặc định Playwright chạy song song theo đơn vị nào?", a: "Theo file; test trong cùng file chạy lần lượt trừ khi bật fullyParallel." },
    { id: "c-l34-2", tag: "Song song", q: "Dấu hiệu test phụ thuộc nhau?", a: "Chạy cả file thì xanh nhưng chạy riêng một test (-g) thì đỏ." },
  ],
};
