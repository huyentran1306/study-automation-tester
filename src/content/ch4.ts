import type { LessonContent } from "./types";

// Chương 4 · Page Object Model & Fixture (bài 23–27).
// Trong khu chạy thử, class được viết chung file spec cho gọn; dự án thật tách ra thư mục pages/ và fixtures/.

const POM = `import { test, expect, type Page, type Locator } from '@playwright/test';

// pages/LoginPage.ts
class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Mật khẩu');
    this.submit = page.getByRole('button', { name: 'Đăng nhập' });
    this.error = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

// tests/login.spec.ts
test('đăng nhập sai báo lỗi', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('linh@sokhach.vn', 'sai');
  await expect(login.error).toHaveText('Email hoặc mật khẩu không đúng');
});
`;

export const L23: LessonContent = {
  id: "l23",
  pw: true,
  summary: "Page Object Model gom locator và thao tác của một trang vào một class. Test đọc như kịch bản nghiệp vụ, và khi giao diện đổi chỉ cần sửa một chỗ.",
  starter: POM,
  kata: ["k-l23-pom"],
  sections: [
    {
      id: "why",
      title: "Vì sao cần POM",
      minutes: 5,
      blocks: [
        { t: "p", md: "Không có POM, 30 test cùng viết `page.getByLabel('Email').fill(...)`. Dev đổi nhãn thành \"Địa chỉ email\" là sửa 30 chỗ. Có POM, sửa 1 dòng trong `LoginPage`." },
        { t: "list", items: ["**Locator**: khai báo một lần trong constructor", "**Hành động**: phương thức tên theo nghiệp vụ (`login`, `addCustomer`, `search`)", "**Kiểm tra**: để trong test, hoặc phương thức tên rõ như `expectLoggedIn()`"] },
      ],
    },
    {
      id: "class",
      title: "LoginPage cho Sổ Khách",
      minutes: 8,
      blocks: [
        { t: "code", lang: "ts", run: true, code: POM },
        { t: "callout", tone: "tip", title: "Locator là lazy", md: "Khai báo `page.getByLabel('Email')` trong constructor chưa tìm phần tử nào. Playwright chỉ tìm khi bạn `fill`, `click`, `expect`, nên khai báo sớm hoàn toàn an toàn." },
      ],
    },
    {
      id: "folders",
      title: "Cấu trúc thư mục",
      minutes: 4,
      blocks: [
        { t: "code", lang: "text", title: "so-khach-tests/", code: "pages/\n  LoginPage.ts\n  CustomersPage.ts\n  components/\n    CustomerDialog.ts\ntests/\n  login.spec.ts\n  customers.spec.ts" },
        { t: "quiz", id: "q1", q: "Dev đổi chữ nút từ \"Đăng nhập\" thành \"Vào hệ thống\". Với POM, cần sửa ở đâu?", options: ["Mọi file test có đăng nhập", "Một dòng trong LoginPage", "playwright.config.ts"], answer: 1, explain: "Locator chỉ khai báo ở Page Object, test gọi login() nên không phải sửa." },
      ],
    },
  ],
  cards: [
    { id: "c-l23-1", tag: "POM", q: "Page Object gồm 3 phần nào?", a: "Locator (khai báo trong constructor), hành động (phương thức nghiệp vụ), và đôi khi phương thức kiểm tra tên rõ ràng." },
    { id: "c-l23-2", tag: "POM", q: "Khai báo locator trong constructor có làm chậm/lỗi khi trang chưa tải không?", a: "Không, locator là lazy: chỉ tìm phần tử khi thao tác hoặc expect." },
  ],
};

const BASE = `import { test, expect, type Page, type Locator } from '@playwright/test';

// pages/BasePage.ts: phần chung của mọi trang
class BasePage {
  readonly toast: Locator;
  constructor(protected readonly page: Page) {
    this.toast = page.getByTestId('toast');
  }
  async open(path: string) {
    await this.page.goto(path);
  }
  async expectToast(text: string) {
    await expect(this.toast).toHaveText(text);
  }
}

// pages/components/CustomerDialog.ts: Component Object cho hộp thoại
class CustomerDialog {
  readonly root: Locator;
  constructor(page: Page) {
    this.root = page.getByRole('dialog');
  }
  async fill(name: string, email: string, tier: 'VIP' | 'Mới' | 'Thường' = 'Thường') {
    await this.root.getByLabel('Họ tên').fill(name);
    await this.root.getByLabel('Email', { exact: true }).fill(email);
    await this.root.getByLabel('Hạng').selectOption(tier);
  }
  async save() {
    await this.root.getByRole('button', { name: 'Lưu' }).click();
  }
}

// pages/CustomersPage.ts
class CustomersPage extends BasePage {
  readonly addButton = this.page.getByRole('button', { name: '+ Thêm khách hàng' });
  readonly dialog = new CustomerDialog(this.page);
  row(name: string) {
    return this.page.getByRole('row').filter({ hasText: name });
  }
}

test('thêm khách bằng Page Object', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  const customers = new CustomersPage(page);
  await customers.addButton.click();
  await customers.dialog.fill('Hà Mỹ Tiên', 'tien' + Date.now() + '@mail.vn', 'VIP');
  await customers.dialog.save();
  await customers.expectToast('Đã thêm khách hàng Hà Mỹ Tiên');
});
`;

export const L24: LessonContent = {
  id: "l24",
  pw: true,
  summary: "BasePage chứa phần chung (mở trang, toast), Component Object mô tả một khối dùng lại nhiều nơi (hộp thoại, bảng, menu), thư mục utils cho hàm tiện ích. Và câu hỏi muôn thuở: assertion đặt ở đâu?",
  starter: BASE,
  kata: [],
  sections: [
    {
      id: "basepage",
      title: "BasePage và Component Object",
      minutes: 8,
      blocks: [
        { t: "code", lang: "ts", run: true, code: BASE },
        { t: "callout", tone: "real", title: "Component Object", md: "Hộp thoại khách hàng xuất hiện ở trang Khách hàng lẫn trang Đơn hàng. Viết `CustomerDialog` một lần, trang nào cần thì `new CustomerDialog(page)`." },
      ],
    },
    {
      id: "asserts",
      title: "Assertion đặt ở đâu",
      minutes: 4,
      blocks: [
        { t: "list", items: ["Mặc định: **trong test**, để người đọc thấy test kiểm tra gì", "Kiểm tra lặp lại nhiều nơi: phương thức `expectXxx()` trong Page Object, tên nói rõ là kiểm tra", "Không giấu `expect` trong phương thức hành động như `login()`: test thất bại sẽ khó hiểu"] },
        { t: "code", lang: "text", title: "utils/", code: "utils/\n  data.ts      ← uniqueEmail(), randomCustomer()\n  format.ts    ← formatMoney(), parsePrice()" },
        { t: "quiz", id: "q1", q: "Đặt expect(page).toHaveURL(/customers/) bên trong LoginPage.login() có ổn không?", options: ["Ổn, càng nhiều kiểm tra càng tốt", "Không nên: login() còn dùng cho case đăng nhập sai, khi đó URL không đổi", "Bắt buộc phải làm vậy"], answer: 1, explain: "Hành động nên trung lập; kiểm tra nằm ở test hoặc phương thức expect riêng." },
      ],
    },
  ],
  cards: [
    { id: "c-l24-1", tag: "POM", q: "Component Object là gì?", a: "Class mô tả một khối giao diện dùng lại nhiều nơi (hộp thoại, bảng, menu), được các Page Object dùng chung." },
    { id: "c-l24-2", tag: "POM", q: "BasePage thường chứa gì?", a: "Phần chung của mọi trang: mở đường dẫn, toast, header/menu, chờ trang sẵn sàng." },
  ],
};

const FIXTURE = `import { test as base, expect, type Page, type Locator } from '@playwright/test';

class CustomersPage {
  readonly count: Locator;
  constructor(readonly page: Page) {
    // Gán trong constructor: field khai báo kiểu "count = this.page..." sẽ chạy trước khi page được gán
    this.count = page.getByTestId('customer-count');
  }
  async filterTier(tier: string) {
    await this.page.getByLabel('Hạng').selectOption(tier);
  }
}

// fixtures/base.ts
const test = base.extend<{ customersPage: CustomersPage }>({
  customersPage: async ({ page }, use) => {
    // setup: đăng nhập và mở trang
    await page.goto('/login');
    await page.getByLabel('Email').fill('linh@sokhach.vn');
    await page.getByLabel('Mật khẩu').fill('Matkhau@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await use(new CustomersPage(page));
    // teardown: chạy sau khi test xong
    console.log('Dọn dẹp sau test');
  },
});

test('lọc VIP bằng fixture', async ({ customersPage }) => {
  await customersPage.filterTier('VIP');
  await expect(customersPage.count).toHaveText('6 khách');
});
`;

export const L25: LessonContent = {
  id: "l25",
  pw: true,
  summary: "Fixture là cách Playwright chuẩn bị “đồ nghề” cho test: page, context, request là fixture có sẵn; bạn tự tạo fixture riêng bằng test.extend, với phần setup trước use() và teardown sau use().",
  starter: FIXTURE,
  kata: ["k-l25-fixture"],
  sections: [
    {
      id: "builtin",
      title: "Fixture có sẵn",
      minutes: 4,
      blocks: [
        { t: "list", items: ["`page`: tab mới, sạch cho từng test", "`context`: phiên trình duyệt (cookie, storage)", "`browser`: trình duyệt đang chạy", "`request`: gọi API (chương 6)", "`browserName`, `baseURL`: thông tin cấu hình"] },
      ],
    },
    {
      id: "extend",
      title: "Tự tạo fixture với test.extend",
      minutes: 8,
      blocks: [
        { t: "code", lang: "ts", run: true, code: FIXTURE },
        { t: "callout", tone: "tip", title: "use() là ranh giới", md: "Code trước `await use(giá_trị)` là setup, test chạy trong lúc `use` đang chờ, code sau `use` là teardown (luôn chạy kể cả test đỏ)." },
        { t: "quiz", id: "q1", q: "Fixture chỉ được tạo khi nào?", options: ["Luôn tạo cho mọi test", "Khi test (hoặc fixture khác) khai báo dùng nó trong tham số", "Khi gọi new"], answer: 1, explain: "Playwright đọc tham số { customersPage } và chỉ dựng fixture được yêu cầu." },
      ],
    },
  ],
  cards: [
    { id: "c-l25-1", tag: "Fixture", q: "Phần nào của fixture là setup, phần nào là teardown?", a: "Trước await use(...) là setup; sau use là teardown." },
    { id: "c-l25-2", tag: "Fixture", q: "Tạo fixture riêng bằng gì?", a: "test.extend.", code: "const test = base.extend<{ loginPage: LoginPage }>({ loginPage: async ({ page }, use) => { await use(new LoginPage(page)); } });" },
  ],
};

const CHAIN = `import { test as base, expect, mergeTests, type Page } from '@playwright/test';

// fixtures/auth.ts: fixture loggedIn dựa trên page
const authTest = base.extend<{ loggedIn: Page }>({
  loggedIn: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('linh@sokhach.vn');
    await page.getByLabel('Mật khẩu').fill('Matkhau@123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('heading', { name: 'Khách hàng' })).toBeVisible();
    await use(page);
  },
});

// fixtures/data.ts: fixture newEmail độc lập
const dataTest = base.extend<{ newEmail: string }>({
  newEmail: async ({}, use) => {
    await use('qa' + Date.now() + '@mail.vn');
  },
});

// Gộp 2 nhóm fixture
const test = mergeTests(authTest, dataTest);

test('dùng cả 2 fixture', async ({ loggedIn, newEmail }) => {
  await loggedIn.getByRole('button', { name: '+ Thêm khách hàng' }).click();
  const dialog = loggedIn.getByRole('dialog');
  await dialog.getByLabel('Họ tên').fill('Fixture Gộp');
  await dialog.getByLabel('Email', { exact: true }).fill(newEmail);
  await dialog.getByRole('button', { name: 'Lưu' }).click();
  await expect(loggedIn.getByTestId('toast')).toHaveText('Đã thêm khách hàng Fixture Gộp');
});
`;

export const L26: LessonContent = {
  id: "l26",
  pw: true,
  summary: "Vòng đời fixture theo test và theo worker, fixture dựa trên fixture khác (chaining), và gộp nhiều nhóm fixture bằng mergeTests để dự án lớn vẫn gọn.",
  starter: CHAIN,
  kata: [],
  sections: [
    {
      id: "scope",
      title: "Phạm vi test và worker",
      minutes: 5,
      blocks: [
        { t: "list", items: ["Mặc định `scope: 'test'`: dựng lại cho mỗi test", "`scope: 'worker'`: dựng 1 lần cho mỗi worker, dùng cho thứ đắt và dùng chung được (tài khoản test, kết nối DB)", "`auto: true`: tự chạy cho mọi test dù không khai báo (ghi log, chụp ảnh khi lỗi)"] },
        { t: "code", lang: "ts", title: "ví dụ", code: "const test = base.extend<{}, { account: { email: string } }>({\n  account: [async ({}, use) => {\n    const acc = await createAccountViaApi();\n    await use(acc);\n    await deleteAccountViaApi(acc);\n  }, { scope: 'worker' }],\n});" },
      ],
    },
    {
      id: "chain",
      title: "Chaining và mergeTests",
      minutes: 7,
      blocks: [
        { t: "code", lang: "ts", run: true, code: CHAIN },
        { t: "quiz", id: "q1", q: "Fixture loggedIn khai báo ({ page }, use). Điều đó nghĩa là gì?", options: ["loggedIn tạo page mới", "loggedIn dùng fixture page; Playwright dựng page trước", "Không hợp lệ"], answer: 1, explain: "Fixture có thể phụ thuộc fixture khác qua tham số, gọi là chaining." },
      ],
    },
  ],
  cards: [
    { id: "c-l26-1", tag: "Fixture", q: "Khi nào dùng scope: 'worker'?", a: "Khi thứ cần chuẩn bị đắt và dùng chung được giữa các test trong cùng worker." },
    { id: "c-l26-2", tag: "Fixture", q: "Gộp hai test đã extend fixture khác nhau?", a: "mergeTests.", code: "const test = mergeTests(authTest, dataTest);" },
  ],
};

const PROJECT = `import { test as base, expect, type Page, type Locator } from '@playwright/test';
import { faker } from '@faker-js/faker';

class LoginPage {
  constructor(private page: Page) {}
  async login(email = 'linh@sokhach.vn', password = 'Matkhau@123') {
    await this.page.goto('/login');
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Mật khẩu').fill(password);
    await this.page.getByRole('button', { name: 'Đăng nhập' }).click();
  }
}

class CustomersPage {
  readonly toast: Locator;
  constructor(private page: Page) {
    this.toast = page.getByTestId('toast');
  }
  async add(c: { name: string; email: string; city: string }) {
    await this.page.getByRole('button', { name: '+ Thêm khách hàng' }).click();
    const d = this.page.getByRole('dialog');
    await d.getByLabel('Họ tên').fill(c.name);
    await d.getByLabel('Email', { exact: true }).fill(c.email);
    await d.getByLabel('Thành phố').fill(c.city);
    await d.getByRole('button', { name: 'Lưu' }).click();
  }
  row(text: string) {
    return this.page.getByRole('row').filter({ hasText: text });
  }
  async search(q: string) {
    await this.page.getByPlaceholder('Tìm theo tên…').fill(q);
  }
}

const test = base.extend<{ customers: CustomersPage }>({
  customers: async ({ page }, use) => {
    await new LoginPage(page).login();
    await use(new CustomersPage(page));
  },
});

test('thêm khách ngẫu nhiên rồi tìm lại', async ({ customers }) => {
  const c = { name: faker.person.fullName(), email: faker.internet.email(), city: faker.location.city() };
  await customers.add(c);
  await expect(customers.toast).toHaveText('Đã thêm khách hàng ' + c.name);
  await customers.search(c.name);
  await expect(customers.row(c.email)).toContainText(c.city);
});
`;

export const L27: LessonContent = {
  id: "l27",
  pw: true,
  summary: "Ghép POM + fixture + dữ liệu ngẫu nhiên thành bộ test thật cho Sổ Khách. Dùng AI để sinh khung, rồi tự chạy, đọc lỗi và sửa.",
  starter: PROJECT,
  kata: ["k-l27-pom"],
  sections: [
    {
      id: "project",
      title: "Dự án POM hoàn chỉnh",
      minutes: 10,
      blocks: [
        { t: "code", lang: "ts", run: true, code: PROJECT },
        { t: "callout", tone: "tip", title: "Nhờ AI sinh khung", md: "Prompt mẫu: *\"Viết Page Object TypeScript cho trang Khách hàng (HTML đính kèm). Locator dùng getByRole/getByLabel. Phương thức: add, search, row, deleteCustomer. Không có expect trong phương thức hành động.\"* Rồi chạy thử, đọc lỗi, sửa." },
      ],
    },
    {
      id: "extend",
      title: "Mở rộng sang module khác",
      minutes: 4,
      blocks: [
        { t: "list", items: ["Viết `WidgetsPage` cho trang Thành phần: giỏ hàng, đánh giá, form lựa chọn", "Thêm fixture `widgets` dùng lại `LoginPage`", "Thử thách cuối chương: viết `CustomersPage.deleteCustomer(name)` và test xóa đúng dòng"] },
        { t: "quiz", id: "q1", q: "Dữ liệu ngẫu nhiên bằng Faker giúp gì?", options: ["Test chạy nhanh hơn", "Tránh trùng dữ liệu khi chạy lại nhiều lần và phát hiện lỗi với dữ liệu lạ", "Không cần expect"], answer: 1, explain: "Email cố định chạy lần 2 sẽ trùng; Faker sinh mới mỗi lần." },
      ],
    },
  ],
  cards: [
    { id: "c-l27-1", tag: "Faker", q: "Sinh tên và email ngẫu nhiên bằng Faker?", a: "faker.person.fullName(), faker.internet.email().", code: "import { faker } from '@faker-js/faker';" },
  ],
};
