import type { LessonContent } from "./types";

// Chương 6 · API testing + kết hợp UI (bài 35–37). API luyện tập: https://sokhach.playforge.dev/lab-api/v1

const CRUD = `import { test, expect } from '@playwright/test';

test('vòng đời một khách hàng qua API', async ({ request }) => {
  // 1. Đăng nhập lấy token
  const login = await request.post('/lab-api/v1/auth/login', {
    data: { email: 'linh@sokhach.vn', password: 'Matkhau@123' },
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const auth = { Authorization: 'Bearer ' + token };

  // 2. Tạo mới
  const created = await request.post('/lab-api/v1/customers', {
    headers: auth,
    data: { name: 'Võ Ngọc Trâm', email: 'tram' + Date.now() + '@mail.vn', tier: 'VIP' },
  });
  expect(created.status()).toBe(201);
  const customer = await created.json();
  expect(customer).toMatchObject({ name: 'Võ Ngọc Trâm', tier: 'VIP' });
  console.log('Tạo khách #' + customer.id, created.headers()['location']);

  // 3. Đọc lại
  const got = await request.get('/lab-api/v1/customers/' + customer.id, { headers: auth });
  await expect(got).toBeOK();

  // 4. Xóa rồi đọc lại phải 404
  const del = await request.delete('/lab-api/v1/customers/' + customer.id, { headers: auth });
  expect(del.status()).toBe(204);
  const again = await request.get('/lab-api/v1/customers/' + customer.id, { headers: auth });
  expect(again.status()).toBe(404);
});
`;

export const L35: LessonContent = {
  id: "l35",
  pw: true,
  summary: "Kiểm thử API nhanh và ổn định hơn kiểm thử giao diện. Nắm HTTP căn bản (method, status, header, body) và dùng fixture request của Playwright để gọi GET/POST/PUT/DELETE.",
  starter: CRUD,
  kata: ["k-l35-crud"],
  sections: [
    {
      id: "http",
      title: "HTTP trong 5 phút",
      minutes: 6,
      blocks: [
        { t: "list", items: ["**Method**: `GET` đọc, `POST` tạo, `PUT` thay toàn bộ, `PATCH` sửa một phần, `DELETE` xóa", "**Status**: `2xx` thành công (200, 201 Created, 204 No Content), `4xx` lỗi phía người gọi (400 sai dữ liệu, 401 chưa xác thực, 403 không đủ quyền, 404 không có, 409 trùng), `5xx` lỗi máy chủ", "**Header**: thông tin kèm theo, ví dụ `Authorization`, `content-type`", "**Body**: dữ liệu, thường là JSON"] },
        { t: "callout", tone: "real", title: "401 hay 403?", md: "**401**: máy chủ không biết bạn là ai (thiếu hoặc sai token). **403**: biết bạn là ai nhưng bạn không có quyền. Thử đăng nhập bằng `khach@sokhach.vn` (viewer) rồi gọi DELETE để thấy 403." },
      ],
    },
    {
      id: "request",
      title: "Fixture request",
      minutes: 8,
      blocks: [
        { t: "p", md: "Lấy `request` từ tham số test như lấy `page`. Mỗi lệnh trả về response với `status()`, `ok()`, `headers()`, `json()`, `text()`." },
        { t: "code", lang: "ts", run: true, code: CRUD },
        { t: "callout", tone: "tip", title: "Assertion cho response", md: "`await expect(response).toBeOK()` kiểm tra status 2xx và in rõ URL khi sai. Kiểm tra body thì đọc `await response.json()` rồi dùng `toMatchObject` / `toEqual`." },
      ],
    },
    {
      id: "putpatch",
      title: "PUT khác PATCH",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", title: "ví dụ", code: "// PATCH: chỉ gửi trường cần đổi\nawait request.patch('/lab-api/v1/customers/101', { headers: auth, data: { tier: 'Thường' } });\n\n// PUT: phải gửi đủ name, email, tier, city — thiếu là 400\nawait request.put('/lab-api/v1/customers/101', { headers: auth, data: { name: 'A' } }); // 400" },
        { t: "quiz", id: "q1", q: "Gọi API tạo khách bằng email đã tồn tại thì status đúng nhất là?", options: ["200", "400", "409"], answer: 2, explain: "409 Conflict: dữ liệu xung đột với cái đã có. API luyện tập trả đúng 409 cho email trùng." },
      ],
    },
  ],
  cards: [
    { id: "c-l35-1", tag: "HTTP", q: "401 và 403 khác nhau thế nào?", a: "401: chưa xác thực (thiếu/sai token). 403: đã xác thực nhưng không đủ quyền." },
    { id: "c-l35-2", tag: "HTTP", q: "Status nào cho tạo mới thành công và xóa thành công?", a: "Tạo: 201 Created. Xóa: thường 204 No Content." },
    { id: "c-l35-3", tag: "API", q: "Kiểm tra response có status 2xx?", a: "Dùng toBeOK.", code: "await expect(response).toBeOK();" },
  ],
};

const AUTH = `import { test, expect } from '@playwright/test';

const BASE = '/lab-api/v1';

test('3 cách xác thực', async ({ request }) => {
  // Bearer token
  const { token } = await (await request.post(BASE + '/auth/login', { data: { email: 'linh@sokhach.vn', password: 'Matkhau@123' } })).json();
  await expect(await request.get(BASE + '/me', { headers: { Authorization: 'Bearer ' + token } })).toBeOK();

  // Basic Auth
  const basic = 'Basic ' + btoa('linh@sokhach.vn:Matkhau@123');
  await expect(await request.get(BASE + '/me', { headers: { Authorization: basic } })).toBeOK();

  // API key
  await expect(await request.get(BASE + '/me', { headers: { 'x-api-key': 'sk_test_sokhach_2026' } })).toBeOK();
});

test('phân trang lấy đủ 25 khách', async ({ request }) => {
  const headers = { 'x-api-key': 'sk_test_sokhach_2026' };
  const all: { id: number }[] = [];
  let page = 1;
  while (true) {
    const res = await request.get(BASE + '/customers', { headers, params: { page, limit: 10 } });
    const body = await res.json();
    all.push(...body.data);
    if (page >= body.totalPages) break;
    page++;
  }
  expect(all).toHaveLength(25);
  expect(new Set(all.map((c) => c.id)).size).toBe(25);
});

test('upload file', async ({ request }) => {
  const res = await request.post(BASE + '/files', {
    headers: { 'x-api-key': 'sk_test_sokhach_2026' },
    multipart: { file: { name: 'hop-dong.pdf', mimeType: 'application/pdf', buffer: 'noi dung' }, note: 'Hợp đồng 12/2026' },
  });
  expect(res.status()).toBe(201);
  expect(await res.json()).toMatchObject({ name: 'hop-dong.pdf', note: 'Hợp đồng 12/2026' });
});
`;

export const L36: LessonContent = {
  id: "l36",
  pw: true,
  summary: "Xác thực bằng token, Basic Auth, API key; truyền query/params và đi hết các trang dữ liệu; gửi form và upload file; tổ chức code API theo lớp client – service – data – test.",
  starter: AUTH,
  kata: ["k-l36-paging"],
  sections: [
    {
      id: "auth",
      title: "Token, Basic Auth, API key",
      minutes: 6,
      blocks: [
        { t: "code", lang: "ts", run: true, code: AUTH },
        { t: "callout", tone: "warn", title: "Đừng ghi mật khẩu thật vào code", md: "Đọc từ biến môi trường: `process.env.ADMIN_PASSWORD` (chương 5), lưu trong GitHub Secrets khi chạy CI (chương 7)." },
      ],
    },
    {
      id: "paging",
      title: "Query, phân trang, form, multipart",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`params: { page: 2, limit: 10, q: 'Ngọc' }`: Playwright tự ghép thành `?page=2&limit=10&q=...`", "Phân trang: lặp tới khi `page >= totalPages`; kiểm tra không thiếu, không trùng", "`form: { ... }`: gửi `application/x-www-form-urlencoded`", "`multipart: { file: { name, mimeType, buffer } }`: upload file"] },
      ],
    },
    {
      id: "framework",
      title: "Cấu trúc API framework",
      minutes: 6,
      blocks: [
        { t: "code", lang: "text", title: "api/", code: "api/\n  client.ts            ← tạo request context: baseURL, header xác thực\n  customers.service.ts ← hàm nghiệp vụ: create(), get(), remove()\n  data/customer.ts     ← sinh dữ liệu test (Faker)\ntests/api/\n  customers.spec.ts    ← test chỉ gọi service, đọc như kịch bản" },
        { t: "code", lang: "ts", title: "api/customers.service.ts", code: "import type { APIRequestContext } from '@playwright/test';\n\nexport class CustomersService {\n  constructor(private api: APIRequestContext, private auth: Record<string, string>) {}\n  create(data: { name: string; email: string; tier?: string }) {\n    return this.api.post('/lab-api/v1/customers', { headers: this.auth, data });\n  }\n  get(id: number) {\n    return this.api.get(`/lab-api/v1/customers/${id}`, { headers: this.auth });\n  }\n}" },
        { t: "quiz", id: "q1", q: "Lặp phân trang dừng khi nào?", options: ["Khi data rỗng hoặc page >= totalPages", "Sau đúng 3 trang", "Khi status là 404"], answer: 0, explain: "Dựa vào totalPages (hoặc data rỗng) để không thiếu và không gọi thừa." },
      ],
    },
  ],
  cards: [
    { id: "c-l36-1", tag: "API", q: "Gửi query ?page=2&limit=10 với request.get?", a: "Dùng params.", code: "request.get('/customers', { params: { page: 2, limit: 10 } })" },
    { id: "c-l36-2", tag: "API", q: "Upload file qua API trong Playwright?", a: "Dùng multipart.", code: "request.post(url, { multipart: { file: { name, mimeType, buffer } } })" },
  ],
};

const MOCK = `import { test, expect, type Page } from '@playwright/test';

const LOGIN = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
};

test('mock danh sách rỗng', async ({ page }) => {
  await page.route('**/lab-api/v1/customers*', (route) =>
    route.fulfill({ json: { data: [], page: 1, limit: 50, total: 0, totalPages: 1 } }),
  );
  await LOGIN(page);
  await expect(page.getByText('Không tìm thấy khách hàng nào')).toBeVisible();
  await expect(page.getByTestId('customer-count')).toHaveText('0 khách');
});

test('tạo bằng API, kiểm tra trên UI', async ({ page, request }) => {
  const name = 'Hà Mỹ Tiên';
  const res = await request.post('/lab-api/v1/customers', {
    headers: { 'x-api-key': 'sk_test_sokhach_2026' },
    data: { name, email: 'tien' + Date.now() + '@mail.vn', tier: 'VIP', city: 'Huế' },
  });
  expect(res.status()).toBe(201);

  const listLoaded = page.waitForResponse('**/lab-api/v1/customers*');
  await LOGIN(page);
  await listLoaded;
  await page.getByPlaceholder('Tìm theo tên…').fill('Mỹ Tiên');
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText('Huế');
});
`;

export const L37: LessonContent = {
  id: "l37",
  pw: true,
  summary: "Chặn và giả lập mạng bằng page.route để test các trường hợp khó tạo (danh sách rỗng, lỗi 500), chờ đúng response, và kết hợp API + UI: tạo dữ liệu nhanh bằng API rồi kiểm tra trên giao diện.",
  starter: MOCK,
  kata: ["k-l37-mock"],
  sections: [
    {
      id: "route",
      title: "page.route: chặn và giả lập",
      minutes: 7,
      blocks: [
        { t: "list", items: ["`route.fulfill({ json })`: trả dữ liệu giả, không gọi máy chủ", "`route.fulfill({ status: 500 })`: giả lỗi để test thông báo lỗi", "`route.abort()`: giả mất mạng", "`route.continue()`: cho đi tiếp (có thể sửa header)"] },
        { t: "code", lang: "ts", run: true, code: MOCK },
        { t: "callout", tone: "tip", title: "Đăng ký trước khi trang gọi", md: "Gọi `page.route` **trước** `goto`/thao tác làm trang gọi API, nếu không request đã đi mất." },
      ],
    },
    {
      id: "wait",
      title: "waitForResponse và waitForRequest",
      minutes: 4,
      blocks: [
        { t: "p", md: "Tạo Promise chờ trước, làm thao tác, rồi await, giống cách chờ download. Hợp khi muốn chắc trang đã nhận dữ liệu, hoặc muốn kiểm tra body mà trang gửi lên." },
        { t: "code", lang: "ts", title: "ví dụ", code: "const saved = page.waitForRequest('**/lab-api/v1/customers');\nawait dialog.getByRole('button', { name: 'Lưu' }).click();\nconst req = await saved;\nexpect(req.postDataJSON()).toMatchObject({ tier: 'VIP' });" },
      ],
    },
    {
      id: "apiui",
      title: "API + UI",
      minutes: 5,
      blocks: [
        { t: "p", md: "Tạo 10 khách bằng giao diện mất cả phút; bằng API chỉ vài trăm mili giây. Quy tắc: **chuẩn bị dữ liệu bằng API, kiểm tra hành vi người dùng bằng UI**." },
        { t: "quiz", id: "q1", q: "Muốn test màn hình khi máy chủ lỗi 500 mà không làm hỏng máy chủ thật?", options: ["Tắt máy chủ", "page.route(...) rồi route.fulfill({ status: 500 })", "Sửa database"], answer: 1, explain: "Giả lập lỗi bằng route chỉ ảnh hưởng đúng test đó." },
      ],
    },
  ],
  cards: [
    { id: "c-l37-1", tag: "Mạng", q: "Trả dữ liệu giả cho request danh sách khách?", a: "page.route + route.fulfill.", code: "await page.route('**/customers*', (r) => r.fulfill({ json: { data: [] } }));" },
    { id: "c-l37-2", tag: "API+UI", q: "Quy tắc khi kết hợp API và UI trong test?", a: "Chuẩn bị dữ liệu bằng API (nhanh, ổn định), kiểm tra hành vi người dùng bằng UI." },
  ],
};
