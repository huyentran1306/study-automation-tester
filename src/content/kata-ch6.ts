import type { Kata } from "./types";

// Thử thách chương 6: API testing và API + UI.

export const KATA_CH6: Kata[] = [
  {
    id: "k-l35-crud",
    lesson: "l35",
    chapter: 6,
    type: "api",
    runner: "pw",
    title: "Vòng đời khách hàng qua API",
    difficulty: 2,
    xp: 90,
    prompt: "Dùng fixture `request` và API key `sk_test_sokhach_2026` (header `x-api-key`):\n\n- Tạo khách mới (email ngẫu nhiên) → kiểm tra **201** và body có đúng tên\n- Sửa hạng bằng **PATCH** → kiểm tra **200** và hạng mới\n- Xóa → **204**, đọc lại → **404**\n- Tạo lại với cùng email trước khi xóa phải nhận **409**",
    starter: "import { test, expect } from '@playwright/test';\n\nconst BASE = '/lab-api/v1';\nconst headers = { 'x-api-key': 'sk_test_sokhach_2026' };\n\ntest('vòng đời khách hàng', async ({ request }) => {\n  // viết ở đây\n});\n",
    require: [
      { pattern: "request\\.post\\(", message: "tạo bằng request.post" },
      { pattern: "request\\.patch\\(", message: "sửa bằng request.patch" },
      { pattern: "request\\.delete\\(", message: "xóa bằng request.delete" },
      { pattern: "409", message: "kiểm tra email trùng trả 409" },
      { pattern: "404", message: "kiểm tra đọc lại sau khi xóa trả 404" },
    ],
    hints: [
      "Lưu email vào biến để dùng lại cho lần tạo trùng. Lấy id từ await res.json().",
      "expect(res.status()).toBe(201); PATCH gửi data: { tier: 'Thường' } rồi kiểm tra (await res.json()).tier.",
      "import { test, expect } from '@playwright/test';\n\nconst BASE = '/lab-api/v1';\nconst headers = { 'x-api-key': 'sk_test_sokhach_2026' };\n\ntest('vòng đời khách hàng', async ({ request }) => {\n  const email = 'kh' + Date.now() + '@mail.vn';\n  const created = await request.post(BASE + '/customers', { headers, data: { name: 'Khách API', email, tier: 'VIP' } });\n  expect(created.status()).toBe(201);\n  const c = await created.json();\n  expect(c.name).toBe('Khách API');\n\n  const dup = await request.post(BASE + '/customers', { headers, data: { name: 'Trùng', email } });\n  expect(dup.status()).toBe(409);\n\n  const patched = await request.patch(BASE + '/customers/' + c.id, { headers, data: { tier: 'Thường' } });\n  expect(patched.status()).toBe(200);\n  expect((await patched.json()).tier).toBe('Thường');\n\n  const del = await request.delete(BASE + '/customers/' + c.id, { headers });\n  expect(del.status()).toBe(204);\n  const again = await request.get(BASE + '/customers/' + c.id, { headers });\n  expect(again.status()).toBe(404);\n});",
    ],
  },
  {
    id: "k-l36-paging",
    lesson: "l36",
    chapter: 6,
    type: "api",
    runner: "pw",
    title: "Phân trang đủ 25 khách và quyền viewer",
    difficulty: 3,
    xp: 110,
    prompt: "- Đăng nhập bằng `linh@sokhach.vn` lấy token, đi hết các trang `/customers` với `limit: 7`, kiểm tra thu được đúng **25** khách và không trùng id\n- Đăng nhập bằng `khach@sokhach.vn` (viewer), thử tạo khách → phải nhận **403**\n- Gọi `/customers` không có token → **401**",
    starter: "import { test, expect } from '@playwright/test';\n\nconst BASE = '/lab-api/v1';\n\ntest('phân trang', async ({ request }) => {\n  // viết ở đây\n});\n\ntest('quyền truy cập', async ({ request }) => {\n  // viết ở đây\n});\n",
    require: [
      { pattern: "Bearer", message: "dùng header Authorization: Bearer <token>" },
      { pattern: "limit:\\s*7", message: "phân trang với limit: 7" },
      { pattern: "403", message: "kiểm tra viewer bị 403" },
      { pattern: "401", message: "kiểm tra thiếu token bị 401" },
    ],
    hints: [
      "Viết hàm nhỏ login(email) trả về token để dùng cho cả 2 tài khoản.",
      "Lặp while (true) { … if (page >= body.totalPages) break; page++ }. Kiểm tra new Set(ids).size.",
      "import { test, expect, type APIRequestContext } from '@playwright/test';\n\nconst BASE = '/lab-api/v1';\nconst login = async (request: APIRequestContext, email: string) =>\n  (await (await request.post(BASE + '/auth/login', { data: { email, password: 'Matkhau@123' } })).json()).token as string;\n\ntest('phân trang', async ({ request }) => {\n  const headers = { Authorization: 'Bearer ' + (await login(request, 'linh@sokhach.vn')) };\n  const ids: number[] = [];\n  let page = 1;\n  while (true) {\n    const body = await (await request.get(BASE + '/customers', { headers, params: { page, limit: 7 } })).json();\n    ids.push(...body.data.map((c: { id: number }) => c.id));\n    if (page >= body.totalPages) break;\n    page++;\n  }\n  expect(ids).toHaveLength(25);\n  expect(new Set(ids).size).toBe(25);\n});\n\ntest('quyền truy cập', async ({ request }) => {\n  const headers = { Authorization: 'Bearer ' + (await login(request, 'khach@sokhach.vn')) };\n  const res = await request.post(BASE + '/customers', { headers, data: { name: 'X', email: 'x' + Date.now() + '@mail.vn' } });\n  expect(res.status()).toBe(403);\n  expect((await request.get(BASE + '/customers')).status()).toBe(401);\n});",
    ],
  },
  {
    id: "k-l37-mock",
    lesson: "l37",
    chapter: 6,
    type: "api",
    runner: "pw",
    title: "Giả lập lỗi máy chủ và API + UI",
    difficulty: 3,
    xp: 120,
    prompt: "- Dùng `page.route` giả lập API danh sách khách trả **500**. Đăng nhập, kiểm tra trang hiện chữ `Không tải được danh sách`\n- Test thứ hai: tạo khách **Lạc Thùy Chi** (thành phố **Vinh**) bằng API, rồi đăng nhập UI, tìm `Thùy Chi` và kiểm tra dòng đó có chữ **Vinh**",
    starter: "import { test, expect } from '@playwright/test';\n\ntest('máy chủ lỗi 500', async ({ page }) => {\n  // viết ở đây\n});\n\ntest('tạo bằng API, kiểm tra trên UI', async ({ page, request }) => {\n  // viết ở đây\n});\n",
    require: [
      { pattern: "page\\.route\\(", message: "giả lập bằng page.route" },
      { pattern: "status:\\s*500", message: "trả status: 500" },
      { pattern: "request\\.post\\(", message: "tạo dữ liệu bằng request.post" },
    ],
    hints: [
      "page.route('**/lab-api/v1/customers*', (r) => r.fulfill({ status: 500, json: { message: 'Lỗi máy chủ' } })) phải gọi TRƯỚC khi đăng nhập.",
      "Tạo khách với header x-api-key. Sau khi đăng nhập UI: getByPlaceholder('Tìm theo tên…').fill('Thùy Chi') rồi kiểm tra row.",
      "import { test, expect, type Page } from '@playwright/test';\n\nasync function login(page: Page) {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill('linh@sokhach.vn');\n  await page.getByLabel('Mật khẩu').fill('Matkhau@123');\n  await page.getByRole('button', { name: 'Đăng nhập' }).click();\n}\n\ntest('máy chủ lỗi 500', async ({ page }) => {\n  await page.route('**/lab-api/v1/customers*', (r) => r.fulfill({ status: 500, json: { message: 'Lỗi máy chủ' } }));\n  await login(page);\n  await expect(page.getByText(/Không tải được danh sách/)).toBeVisible();\n});\n\ntest('tạo bằng API, kiểm tra trên UI', async ({ page, request }) => {\n  const res = await request.post('/lab-api/v1/customers', {\n    headers: { 'x-api-key': 'sk_test_sokhach_2026' },\n    data: { name: 'Lạc Thùy Chi', email: 'chi' + Date.now() + '@mail.vn', city: 'Vinh' },\n  });\n  expect(res.status()).toBe(201);\n  await login(page);\n  await page.getByPlaceholder('Tìm theo tên…').fill('Thùy Chi');\n  await expect(page.getByRole('row').filter({ hasText: 'Lạc Thùy Chi' })).toContainText('Vinh');\n});",
    ],
  },
];
