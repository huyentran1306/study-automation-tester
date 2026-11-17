import type { Kata } from "./types";
import { headCommit, isClean } from "@/lib/git/sim";

// Thử thách chương 1. Test ẩn chạy sau code học viên bằng test() / expect() của runner.

export const KATA_CH1: Kata[] = [
  {
    id: "k-l01-greet",
    lesson: "l01",
    chapter: 1,
    type: "js",
    title: "Lời chào cho tester",
    difficulty: 1,
    xp: 30,
    prompt: "Viết hàm `greet(name)` trả về `Xin chào, <name>!`.\n\nNếu không truyền tên hoặc tên chỉ toàn khoảng trắng, trả về `Xin chào, bạn!`. Nhớ bỏ khoảng trắng thừa hai đầu tên.",
    starter: "function greet(name) {\n  // viết code ở đây\n}\n\nconsole.log(greet('Linh'));",
    tests: `test('chào theo tên', () => { expect(greet('Linh')).toBe('Xin chào, Linh!'); });
test('bỏ khoảng trắng', () => { expect(greet('  Hà ')).toBe('Xin chào, Hà!'); });
test('không có tên', () => { expect(greet()).toBe('Xin chào, bạn!'); });
test('tên rỗng', () => { expect(greet('   ')).toBe('Xin chào, bạn!'); });`,
    hints: [
      "Tách 2 trường hợp: có tên hợp lệ và không có tên.",
      "Dùng (name ?? '').trim() để vừa xử lý undefined vừa bỏ khoảng trắng.",
      "const n = (name ?? '').trim();\nreturn `Xin chào, ${n || 'bạn'}!`;",
    ],
  },
  {
    id: "k-l01-scripts",
    lesson: "l01",
    chapter: 1,
    type: "js",
    title: "Liệt kê lệnh test trong package.json",
    difficulty: 1,
    xp: 30,
    prompt: "Viết hàm `testScripts(pkg)` nhận object package.json, trả về mảng tên các script **bắt đầu bằng** `test` theo thứ tự xuất hiện.\n\nNếu không có mục `scripts` thì trả về mảng rỗng.",
    starter: "function testScripts(pkg) {\n  // viết code ở đây\n}\n\nconsole.log(testScripts({ scripts: { dev: 'next dev', test: 'playwright test', 'test:smoke': 'playwright test --grep @smoke' } }));",
    tests: `test('lọc đúng script test', () => {
  expect(testScripts({ scripts: { dev: 'x', test: 'a', 'test:ui': 'b', lint: 'c' } })).toEqual(['test', 'test:ui']);
});
test('không có scripts', () => { expect(testScripts({ name: 'x' })).toEqual([]); });
test('không lấy tên chỉ chứa chữ test ở giữa', () => {
  expect(testScripts({ scripts: { 'e2e:test': 'x', 'test-api': 'y' } })).toEqual(['test-api']);
});`,
    hints: [
      "Object.keys(pkg.scripts) cho mảng tên script.",
      "Dùng pkg.scripts ?? {} để không lỗi khi thiếu scripts, rồi filter với startsWith('test').",
      "return Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('test'));",
    ],
  },
  {
    id: "k-l02-price",
    lesson: "l02",
    chapter: 1,
    type: "js",
    title: "Làm sạch giá tiền cào từ web",
    difficulty: 1,
    xp: 40,
    prompt: "Ô giá trên trang hiển thị chuỗi như `\"  1.250.000 ₫ \"`. Viết hàm `parsePrice(text)` trả về **số** `1250000`.\n\nNếu chuỗi không có chữ số nào (ví dụ `\"Liên hệ\"`), trả về `0`.",
    starter: "function parsePrice(text) {\n  // viết code ở đây\n}\n\nconsole.log(parsePrice('  1.250.000 ₫ '));",
    tests: `test('giá có dấu chấm và ký hiệu', () => { expect(parsePrice('  1.250.000 ₫ ')).toBe(1250000); });
test('giá có chữ VND', () => { expect(parsePrice('Tổng: 99.000 VND')).toBe(99000); });
test('trả về kiểu number', () => { expect(typeof parsePrice('5.000đ')).toBe('number'); });
test('không có số', () => { expect(parsePrice('Liên hệ')).toBe(0); });`,
    hints: [
      "Bỏ hết ký tự không phải chữ số rồi đổi sang số.",
      "text.replace(/[^0-9]/g, '') giữ lại toàn chữ số. Chuỗi rỗng thì Number('') là 0.",
      "return Number(text.replace(/[^0-9]/g, ''));",
    ],
  },
  {
    id: "k-l02-report",
    lesson: "l02",
    chapter: 1,
    type: "js",
    title: "Dòng báo cáo kết quả",
    difficulty: 2,
    xp: 50,
    prompt: "Viết hàm `reportLine(title, passed, total)` trả về:\n\n- `\"✓ <title>: <passed>/<total> (100%)\"` nếu pass hết\n- `\"✗ <title>: <passed>/<total> (<pct>%)\"` nếu còn test đỏ, pct làm tròn tới số nguyên\n\nNếu `total` là 0 thì pct là 0 và dùng dấu ✗.",
    starter: "function reportLine(title, passed, total) {\n  // dùng template literal\n}\n\nconsole.log(reportLine('đăng nhập', 7, 8));",
    tests: `test('pass hết', () => { expect(reportLine('đăng nhập', 8, 8)).toBe('✓ đăng nhập: 8/8 (100%)'); });
test('còn đỏ, làm tròn', () => { expect(reportLine('giỏ hàng', 7, 8)).toBe('✗ giỏ hàng: 7/8 (88%)'); });
test('total bằng 0', () => { expect(reportLine('API', 0, 0)).toBe('✗ API: 0/0 (0%)'); });`,
    hints: [
      "Tính pct trước, chọn dấu ✓ hay ✗ sau.",
      "pct = total === 0 ? 0 : Math.round(passed / total * 100). Dấu ✓ chỉ khi total > 0 và passed === total.",
      "const pct = total === 0 ? 0 : Math.round((passed / total) * 100);\nconst mark = total > 0 && passed === total ? '✓' : '✗';\nreturn `${mark} ${title}: ${passed}/${total} (${pct}%)`;",
    ],
  },
  {
    id: "k-l03-status",
    lesson: "l03",
    chapter: 1,
    type: "js",
    title: "Phân loại mã HTTP",
    difficulty: 1,
    xp: 40,
    prompt: "Viết hàm `statusGroup(code)` trả về:\n\n- `'success'` với 200–299\n- `'redirect'` với 300–399\n- `'client'` với 400–499\n- `'server'` với 500–599\n- `'unknown'` với mọi giá trị khác",
    starter: "function statusGroup(code) {\n  // viết code ở đây\n}\n\nconsole.log(statusGroup(201), statusGroup(404));",
    tests: `test('2xx', () => { expect(statusGroup(200)).toBe('success'); expect(statusGroup(204)).toBe('success'); });
test('3xx', () => { expect(statusGroup(302)).toBe('redirect'); });
test('4xx', () => { expect(statusGroup(401)).toBe('client'); expect(statusGroup(499)).toBe('client'); });
test('5xx', () => { expect(statusGroup(503)).toBe('server'); });
test('khác', () => { expect(statusGroup(99)).toBe('unknown'); expect(statusGroup(600)).toBe('unknown'); });`,
    hints: [
      "Dùng chuỗi if / else if theo khoảng.",
      "if (code >= 200 && code < 300) return 'success'; ... Cuối cùng return 'unknown'.",
      "if (code >= 200 && code < 300) return 'success';\nif (code >= 300 && code < 400) return 'redirect';\nif (code >= 400 && code < 500) return 'client';\nif (code >= 500 && code < 600) return 'server';\nreturn 'unknown';",
    ],
  },
  {
    id: "k-l03-timeout",
    lesson: "l03",
    chapter: 1,
    type: "js",
    title: "Timeout mặc định không nuốt số 0",
    difficulty: 2,
    xp: 50,
    prompt: "Viết hàm `resolveTimeout(value)`:\n\n- Nếu `value` là `undefined` hoặc `null`, trả về `30000`\n- Nếu là số âm, ném lỗi `new Error('timeout phải >= 0')`\n- Còn lại trả về đúng `value` (kể cả `0`)",
    starter: "function resolveTimeout(value) {\n  // viết code ở đây\n}\n\nconsole.log(resolveTimeout(), resolveTimeout(0));",
    tests: `test('mặc định', () => { expect(resolveTimeout()).toBe(30000); expect(resolveTimeout(null)).toBe(30000); });
test('giữ số 0', () => { expect(resolveTimeout(0)).toBe(0); });
test('giữ giá trị', () => { expect(resolveTimeout(5000)).toBe(5000); });
test('số âm báo lỗi', () => { expect(() => resolveTimeout(-1)).toThrow('timeout phải >= 0'); });`,
    hints: [
      "Toán tử || sẽ biến 0 thành 30000. Cần toán tử khác.",
      "Dùng ?? cho giá trị mặc định, kiểm tra số âm trước khi trả về.",
      "const t = value ?? 30000;\nif (t < 0) throw new Error('timeout phải >= 0');\nreturn t;",
    ],
  },
  {
    id: "k-l04-locked",
    lesson: "l04",
    chapter: 1,
    type: "js",
    title: "Lọc tài khoản bị khóa",
    difficulty: 1,
    xp: 40,
    prompt: "Mỗi người dùng có dạng `{ username, failedAttempts }`. Tài khoản bị khóa khi `failedAttempts >= 3`.\n\nViết hàm `lockedUsers(users)` trả về mảng **username** bị khóa, sắp xếp theo thứ tự chữ cái.",
    starter: "function lockedUsers(users) {\n  // filter, map, sort\n}\n\nconsole.log(lockedUsers([{ username: 'ha', failedAttempts: 3 }, { username: 'an', failedAttempts: 5 }, { username: 'linh', failedAttempts: 1 }]));",
    tests: `test('lọc và sắp xếp', () => {
  expect(lockedUsers([{ username: 'ha', failedAttempts: 3 }, { username: 'an', failedAttempts: 5 }, { username: 'linh', failedAttempts: 1 }])).toEqual(['an', 'ha']);
});
test('không ai bị khóa', () => { expect(lockedUsers([{ username: 'x', failedAttempts: 2 }])).toEqual([]); });
test('không sửa mảng gốc', () => {
  const list = [{ username: 'b', failedAttempts: 9 }, { username: 'a', failedAttempts: 9 }];
  lockedUsers(list);
  expect(list[0].username).toBe('b');
});`,
    hints: [
      "Ba bước: giữ người có failedAttempts >= 3, lấy username, sắp xếp.",
      "filter rồi map tạo ra mảng mới, nên sort trên mảng đó không ảnh hưởng mảng gốc.",
      "return users.filter((u) => u.failedAttempts >= 3).map((u) => u.username).sort();",
    ],
  },
  {
    id: "k-l04-summary",
    lesson: "l04",
    chapter: 1,
    type: "js",
    title: "Tổng kết lượt đăng nhập",
    difficulty: 2,
    xp: 50,
    prompt: "Viết hàm `summarize(results)` nhận mảng boolean (true = đăng nhập thành công), trả về `{ pass, fail, rate }`.\n\n`rate` là phần trăm thành công làm tròn tới số nguyên; mảng rỗng thì rate = 0.",
    starter: "function summarize(results) {\n  // viết code ở đây\n}\n\nconsole.log(summarize([true, false, true]));",
    tests: `test('đếm đúng', () => { expect(summarize([true, false, true])).toEqual({ pass: 2, fail: 1, rate: 67 }); });
test('mảng rỗng', () => { expect(summarize([])).toEqual({ pass: 0, fail: 0, rate: 0 }); });
test('tất cả lỗi', () => { expect(summarize([false, false])).toEqual({ pass: 0, fail: 2, rate: 0 }); });`,
    hints: [
      "Đếm số phần tử true trước, số lỗi là phần còn lại.",
      "pass = results.filter(Boolean).length. Cẩn thận chia cho 0 khi mảng rỗng.",
      "const pass = results.filter(Boolean).length;\nconst fail = results.length - pass;\nconst rate = results.length ? Math.round((pass / results.length) * 100) : 0;\nreturn { pass, fail, rate };",
    ],
  },
  {
    id: "k-l05-config",
    lesson: "l05",
    chapter: 1,
    type: "js",
    title: "Gộp cấu hình cho CI",
    difficulty: 2,
    xp: 60,
    prompt: "Viết hàm `mergeConfig(base, override)` trả về config mới:\n\n- Thuộc tính của `override` ghi đè `base`\n- Riêng `use` thì gộp thêm một tầng: `{ ...base.use, ...override.use }`\n- Không được sửa `base`",
    starter: "function mergeConfig(base, override) {\n  // dùng spread\n}\n\nconst base = { timeout: 30000, retries: 0, use: { headless: true, baseURL: 'http://localhost:3000' } };\nconsole.log(mergeConfig(base, { retries: 2, use: { baseURL: 'https://staging.sokhach.vn' } }));",
    tests: `const base = () => ({ timeout: 30000, retries: 0, use: { headless: true, baseURL: 'http://localhost:3000' } });
test('ghi đè tầng ngoài', () => { expect(mergeConfig(base(), { retries: 2 }).retries).toBe(2); });
test('gộp use', () => {
  expect(mergeConfig(base(), { use: { baseURL: 'https://x' } }).use).toEqual({ headless: true, baseURL: 'https://x' });
});
test('override không có use', () => { expect(mergeConfig(base(), {}).use).toEqual({ headless: true, baseURL: 'http://localhost:3000' }); });
test('không sửa base', () => { const b = base(); mergeConfig(b, { retries: 3, use: { headless: false } }); expect(b).toEqual(base()); });`,
    hints: [
      "Spread tầng ngoài trước, rồi viết lại riêng thuộc tính use.",
      "override.use có thể không có, spread undefined vẫn an toàn: { ...undefined } là {}.",
      "return { ...base, ...override, use: { ...base.use, ...override.use } };",
    ],
  },
  {
    id: "k-l05-city",
    lesson: "l05",
    chapter: 1,
    type: "js",
    title: "Đọc thành phố an toàn",
    difficulty: 1,
    xp: 30,
    prompt: "Response người dùng có thể thiếu `address` hoặc `address.city`. Viết hàm `cityOf(user)` trả về `user.address.city`, nếu thiếu ở bất kỳ tầng nào (kể cả `user` là `null`) thì trả về `'Chưa rõ'`.",
    starter: "function cityOf(user) {\n  // dùng ?. và ??\n}\n\nconsole.log(cityOf({ address: { city: 'Đà Nẵng' } }), cityOf({}));",
    tests: `test('có city', () => { expect(cityOf({ address: { city: 'Đà Nẵng' } })).toBe('Đà Nẵng'); });
test('thiếu address', () => { expect(cityOf({})).toBe('Chưa rõ'); });
test('address null', () => { expect(cityOf({ address: null })).toBe('Chưa rõ'); });
test('user null', () => { expect(cityOf(null)).toBe('Chưa rõ'); });`,
    hints: [
      "Chuỗi optional chaining: user?.address?.city.",
      "Thêm ?? 'Chưa rõ' ở cuối.",
      "return user?.address?.city ?? 'Chưa rõ';",
    ],
  },
  {
    id: "k-l06-user",
    lesson: "l06",
    chapter: 1,
    type: "js",
    title: "Hàm tạo tài khoản test",
    difficulty: 1,
    xp: 40,
    prompt: "Viết hàm `makeUser(overrides)` trả về tài khoản mặc định `{ email: 'qa@sokhach.vn', role: 'viewer', active: true }`, ghi đè bởi `overrides` nếu có.\n\nMỗi lần gọi phải trả về **object mới** (sửa object này không ảnh hưởng lần gọi sau).",
    starter: "function makeUser(overrides = {}) {\n  // viết code ở đây\n}\n\nconsole.log(makeUser({ role: 'admin' }));",
    tests: `test('mặc định', () => { expect(makeUser()).toEqual({ email: 'qa@sokhach.vn', role: 'viewer', active: true }); });
test('ghi đè', () => { expect(makeUser({ role: 'admin', active: false })).toEqual({ email: 'qa@sokhach.vn', role: 'admin', active: false }); });
test('object mới mỗi lần', () => { const a = makeUser(); a.role = 'x'; expect(makeUser().role).toBe('viewer'); });`,
    hints: [
      "Khai báo object mặc định bên trong hàm, không đặt ngoài.",
      "Dùng spread: { ...mặcĐịnh, ...overrides }.",
      "return { email: 'qa@sokhach.vn', role: 'viewer', active: true, ...overrides };",
    ],
  },
  {
    id: "k-l06-retry",
    lesson: "l06",
    chapter: 1,
    type: "js",
    title: "Thử lại với callback",
    difficulty: 2,
    xp: 60,
    prompt: "Viết hàm `retry(fn, times)` gọi `fn()` cho tới khi nó trả về `true`, tối đa `times` lần.\n\n- Thành công thì trả về số lần đã gọi\n- Hết lượt mà chưa được thì ném `new Error('Hết lượt thử')`",
    starter: "function retry(fn, times) {\n  // viết code ở đây\n}\n\nlet n = 0;\nconsole.log(retry(() => ++n === 2, 3));",
    tests: `test('thành công ở lần 2', () => { let n = 0; expect(retry(() => ++n === 2, 3)).toBe(2); });
test('thành công ngay', () => { expect(retry(() => true, 5)).toBe(1); });
test('hết lượt', () => { let calls = 0; expect(() => retry(() => { calls++; return false; }, 3)).toThrow('Hết lượt thử'); expect(calls).toBe(3); });`,
    hints: [
      "Vòng for từ 1 tới times, gọi fn() trong mỗi vòng.",
      "Trong vòng: if (fn()) return i; Ra khỏi vòng tức là đã hết lượt.",
      "for (let i = 1; i <= times; i++) {\n  if (fn()) return i;\n}\nthrow new Error('Hết lượt thử');",
    ],
  },
  {
    id: "k-l07-pr",
    lesson: "l07",
    chapter: 1,
    type: "git",
    title: "Nhánh mới, commit, push và mở Pull Request",
    difficulty: 1,
    xp: 60,
    prompt: "Bạn vừa clone repo của team. Thêm một test vào `tests/login.spec.ts` trên nhánh riêng và mở Pull Request vào `main`.\n\nGợi ý sửa file nhanh: `echo \"test('sai mật khẩu', ...)\" >> tests/login.spec.ts`.",
    git: {
      scenario: "cloned",
      goals: [
        { label: "Tạo nhánh test/login-negative", check: (r) => "test/login-negative" in r.branches },
        { label: "Có commit mới trên nhánh đó sửa tests/login.spec.ts", check: (r) => {
          const id = r.branches["test/login-negative"];
          const main = r.branches.main;
          if (!id || id === main) return false;
          const c = r.commits[id];
          const parent = c.parent ? r.commits[c.parent] : null;
          return !!parent && c.tree["tests/login.spec.ts"] !== parent.tree["tests/login.spec.ts"];
        } },
        { label: "Đã push nhánh lên origin", check: (r) => !!r.remote["test/login-negative"] && r.remote["test/login-negative"] === r.branches["test/login-negative"] },
        { label: "Đã mở Pull Request vào main", check: (r) => r.prs.some((p) => p.from === "test/login-negative" && p.to === "main") },
      ],
    },
    hints: [
      "Thứ tự: tạo nhánh → sửa file → add → commit → push → mở PR.",
      "git switch -c test/login-negative; sửa file bằng echo ... >> tests/login.spec.ts; git add rồi git commit -m.",
      "git switch -c test/login-negative\necho \"test('sai mật khẩu', async () => {});\" >> tests/login.spec.ts\ngit add tests/login.spec.ts\ngit commit -m \"test(login): thêm case sai mật khẩu\"\ngit push -u origin test/login-negative\ngh pr create --title \"Thêm case sai mật khẩu\"",
    ],
  },
  {
    id: "k-l07-conflict",
    lesson: "l07",
    chapter: 1,
    type: "git",
    title: "Sửa merge conflict trong config",
    difficulty: 2,
    xp: 80,
    prompt: "Bạn ở nhánh `test/slow-network` với `timeout: 60000`. Main vừa đổi thành `45000`. Gộp `main` vào nhánh của bạn, **giữ 60000** vì test mạng chậm cần nó, và hoàn tất merge.\n\nSửa file bằng ô chỉnh sửa trong sandbox hoặc `echo \"...\" > playwright.config.ts`.",
    git: {
      scenario: "conflict",
      goals: [
        { label: "Chạy git merge main", check: (r) => r.history.some((h) => /^git merge (origin\/)?main\b/.test(h)) },
        { label: "playwright.config.ts không còn dấu conflict và giữ timeout 60000", check: (r) => {
          const f = r.work["playwright.config.ts"] ?? "";
          return !/<<<<<<<|=======|>>>>>>>/.test(f) && f.includes("60000") && !f.includes("45000");
        } },
        { label: "Commit merge có 2 cha (main + nhánh của bạn)", check: (r) => {
          const c = headCommit(r);
          return r.head === "test/slow-network" && !!c?.parent2 && c.parent2 === r.branches.main;
        } },
        { label: "Working tree sạch", check: (r) => isClean(r) && !r.merging },
      ],
    },
    hints: [
      "git merge main sẽ báo CONFLICT. Đó là bình thường.",
      "Viết lại file chỉ còn một dòng đúng, sau đó git add playwright.config.ts rồi git commit.",
      "git merge main\necho \"export default { timeout: 60000 };\" > playwright.config.ts\ngit add playwright.config.ts\ngit commit -m \"merge main, giữ timeout 60000 cho mạng chậm\"",
    ],
  },
  {
    id: "k-l08-loginpage",
    lesson: "l08",
    chapter: 1,
    type: "js",
    title: "Viết class LoginPage đầu tiên",
    difficulty: 2,
    xp: 60,
    prompt: "Viết class `LoginPage`:\n\n- `constructor(page)` lưu `page`\n- `async goto()` gọi `page.goto('/login')`\n- `async login(email, password)` gọi lần lượt `page.fill('Email', email)`, `page.fill('Mật khẩu', password)`, `page.click('Đăng nhập')`\n\nTest ẩn dùng một `page` giả lập ghi lại thao tác.",
    starter: "class LoginPage {\n  // viết code ở đây\n}",
    tests: `function fakePage() { const log = []; return { log, async goto(u) { log.push('goto ' + u); }, async fill(f, v) { log.push('fill ' + f + '=' + v); }, async click(b) { log.push('click ' + b); } }; }
test('goto', async () => { const p = fakePage(); await new LoginPage(p).goto(); expect(p.log).toEqual(['goto /login']); });
test('login đúng thứ tự', async () => {
  const p = fakePage();
  await new LoginPage(p).login('linh@sokhach.vn', 'Matkhau@123');
  expect(p.log).toEqual(['fill Email=linh@sokhach.vn', 'fill Mật khẩu=Matkhau@123', 'click Đăng nhập']);
});
test('login có await (chờ xong mới trả về)', async () => {
  const log = [];
  const slow = { async fill(f, v) { await new Promise((r) => setTimeout(r, 20)); log.push(f); }, async click(b) { await new Promise((r) => setTimeout(r, 20)); log.push(b); } };
  await new LoginPage(slow).login('a', 'b');
  expect(log).toHaveLength(3);
});`,
    hints: [
      "constructor(page) { this.page = page; } rồi viết 2 phương thức async.",
      "Mỗi lệnh page.* đều cần await, nếu không login() trả về trước khi thao tác xong.",
      "class LoginPage {\n  constructor(page) { this.page = page; }\n  async goto() { await this.page.goto('/login'); }\n  async login(email, password) {\n    await this.page.fill('Email', email);\n    await this.page.fill('Mật khẩu', password);\n    await this.page.click('Đăng nhập');\n  }\n}",
    ],
  },
  {
    id: "k-l08-extends",
    lesson: "l08",
    chapter: 1,
    type: "js",
    title: "Trang Khách hàng kế thừa BasePage",
    difficulty: 2,
    xp: 60,
    prompt: "Có sẵn `BasePage`. Viết `CustomersPage extends BasePage`:\n\n- `async open()` mở `/customers` bằng `super.open(...)`\n- `async search(name)` gọi `this.page.fill('Tìm theo tên…', name)`",
    starter: "class BasePage {\n  constructor(page) { this.page = page; }\n  async open(path) { await this.page.goto(path); }\n}\n\nclass CustomersPage extends BasePage {\n  // viết code ở đây\n}",
    tests: `function fakePage() { const log = []; return { log, async goto(u) { log.push('goto ' + u); }, async fill(f, v) { log.push('fill ' + f + '=' + v); } }; }
test('kế thừa BasePage', () => { expect(new CustomersPage(fakePage()) instanceof BasePage).toBe(true); });
test('open', async () => { const p = fakePage(); await new CustomersPage(p).open(); expect(p.log).toEqual(['goto /customers']); });
test('search', async () => { const p = fakePage(); await new CustomersPage(p).search('Hà'); expect(p.log).toEqual(['fill Tìm theo tên…=Hà']); });`,
    hints: [
      "Không cần viết constructor nếu không thêm gì: lớp con tự dùng constructor của cha.",
      "Trong open(): await super.open('/customers').",
      "class CustomersPage extends BasePage {\n  async open() { await super.open('/customers'); }\n  async search(name) { await this.page.fill('Tìm theo tên…', name); }\n}",
    ],
  },
  {
    id: "k-l09-retry",
    lesson: "l09",
    chapter: 1,
    type: "js",
    title: "Retry đăng nhập với async/await",
    difficulty: 2,
    xp: 70,
    prompt: "Viết `async function retryAsync(fn, times)`:\n\n- Gọi `await fn()`, nếu không lỗi thì trả về kết quả\n- Nếu `fn` ném lỗi thì thử lại, tối đa `times` lần\n- Hết lượt thì ném lại **lỗi cuối cùng**",
    starter: "async function retryAsync(fn, times) {\n  // try/catch trong vòng lặp\n}\n\nlet n = 0;\nconsole.log(await retryAsync(async () => { if (++n < 2) throw new Error('chưa sẵn sàng'); return 'OK'; }, 3));",
    tests: `test('thành công sau 1 lần lỗi', async () => {
  let n = 0;
  expect(await retryAsync(async () => { if (++n < 2) throw new Error('x'); return 'OK'; }, 3)).toBe('OK');
  expect(n).toBe(2);
});
test('ném lỗi cuối', async () => {
  let n = 0;
  await expect(retryAsync(async () => { n++; throw new Error('lần ' + n); }, 3)).rejects.toThrow('lần 3');
});
test('không gọi thừa', async () => { let n = 0; await retryAsync(async () => { n++; return 1; }, 5); expect(n).toBe(1); });`,
    hints: [
      "Vòng for, bên trong try { return await fn(); } catch (e) { nhớ lỗi }.",
      "Lưu lỗi vào biến lastError trong catch; sau vòng lặp throw lastError.",
      "let lastError;\nfor (let i = 0; i < times; i++) {\n  try { return await fn(); } catch (e) { lastError = e; }\n}\nthrow lastError;",
    ],
  },
  {
    id: "k-l09-all",
    lesson: "l09",
    chapter: 1,
    type: "js",
    title: "Lấy nhiều khách hàng song song",
    difficulty: 2,
    xp: 70,
    prompt: "Viết `async function fetchAll(ids, fetchOne)` trả về mảng kết quả **đúng thứ tự** `ids`.\n\nCác lần gọi phải chạy **song song**: test ẩn cho mỗi lần gọi mất 100ms, 5 id phải xong dưới 300ms.",
    starter: "async function fetchAll(ids, fetchOne) {\n  // viết code ở đây\n}",
    tests: `const slowFetch = (id) => new Promise((r) => setTimeout(() => r({ id }), 100));
test('đúng thứ tự', async () => { expect(await fetchAll([3, 1, 2], slowFetch)).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]); });
test('chạy song song', async () => {
  const t = Date.now();
  await fetchAll([1, 2, 3, 4, 5], slowFetch);
  expect(Date.now() - t).toBeLessThan(300);
});
test('mảng rỗng', async () => { expect(await fetchAll([], slowFetch)).toEqual([]); });`,
    hints: [
      "for...of với await sẽ mất 500ms. Cần chạy cùng lúc.",
      "ids.map(fetchOne) tạo mảng Promise; Promise.all chờ tất cả và giữ thứ tự.",
      "return Promise.all(ids.map((id) => fetchOne(id)));",
    ],
  },
  {
    id: "k-l10-rate",
    lesson: "l10",
    chapter: 1,
    type: "js",
    title: "Tỉ lệ pass có kiểu rõ ràng",
    difficulty: 2,
    xp: 60,
    prompt: "Bằng TypeScript, khai báo `interface TestResult { title: string; status: 'passed' | 'failed' | 'skipped' }` và viết `passRate(results: TestResult[]): number`.\n\nTỉ lệ tính trên các test **không bị skip**, làm tròn số nguyên. Không có test nào được tính thì trả về 0. **Không dùng `any`.**",
    starter: "interface TestResult {\n  // khai báo ở đây\n}\n\nfunction passRate(results: TestResult[]): number {\n  // viết code ở đây\n}",
    forbid: [{ pattern: "\\bany\\b", message: "Không dùng any. Hãy khai báo kiểu cụ thể." }],
    tests: `test('bỏ qua skipped', () => {
  expect(passRate([{ title: 'a', status: 'passed' }, { title: 'b', status: 'failed' }, { title: 'c', status: 'skipped' }])).toBe(50);
});
test('làm tròn', () => { expect(passRate([{ title: 'a', status: 'passed' }, { title: 'b', status: 'passed' }, { title: 'c', status: 'failed' }])).toBe(67); });
test('toàn skipped', () => { expect(passRate([{ title: 'a', status: 'skipped' }])).toBe(0); });`,
    hints: [
      "Lọc bỏ skipped trước, rồi đếm passed trên phần còn lại.",
      "const counted = results.filter((r) => r.status !== 'skipped'); nhớ trường hợp counted rỗng.",
      "interface TestResult { title: string; status: 'passed' | 'failed' | 'skipped'; }\n\nfunction passRate(results: TestResult[]): number {\n  const counted = results.filter((r) => r.status !== 'skipped');\n  if (!counted.length) return 0;\n  return Math.round((counted.filter((r) => r.status === 'passed').length / counted.length) * 100);\n}",
    ],
  },
  {
    id: "k-l10-readonly",
    lesson: "l10",
    chapter: 1,
    type: "js",
    title: "Config theo môi trường bằng TypeScript",
    difficulty: 3,
    xp: 80,
    prompt: "Khai báo `type Env = 'dev' | 'staging' | 'prod'` và class `EnvConfig` có `readonly baseUrl: string`, `readonly retries: number`, constructor nhận `env: Env`:\n\n- dev → `http://localhost:3000`, retries 0\n- staging → `https://staging.sokhach.vn`, retries 1\n- prod → `https://sokhach.vn`, retries 2\n- Giá trị khác (khi chạy thật đọc từ biến môi trường) → ném lỗi `Môi trường không hợp lệ: <env>`\n\n**Không dùng `any`.**",
    starter: "type Env = 'dev' | 'staging' | 'prod';\n\nclass EnvConfig {\n  // viết code ở đây\n}\n\nconsole.log(new EnvConfig('staging'));",
    forbid: [{ pattern: "\\bany\\b", message: "Không dùng any. Hãy khai báo kiểu cụ thể." }],
    tests: `test('dev', () => { const c = new EnvConfig('dev'); expect(c.baseUrl).toBe('http://localhost:3000'); expect(c.retries).toBe(0); });
test('staging', () => { expect(new EnvConfig('staging')).toMatchObject({ baseUrl: 'https://staging.sokhach.vn', retries: 1 }); });
test('prod', () => { expect(new EnvConfig('prod').retries).toBe(2); });
test('không hợp lệ', () => { expect(() => new EnvConfig('qa')).toThrow('Môi trường không hợp lệ: qa'); });`,
    hints: [
      "Dùng switch (env) trong constructor để gán this.baseUrl và this.retries.",
      "Thuộc tính readonly vẫn gán được trong constructor. Nhánh default ném lỗi.",
      "class EnvConfig {\n  readonly baseUrl: string;\n  readonly retries: number;\n  constructor(env: Env) {\n    switch (env) {\n      case 'dev': this.baseUrl = 'http://localhost:3000'; this.retries = 0; break;\n      case 'staging': this.baseUrl = 'https://staging.sokhach.vn'; this.retries = 1; break;\n      case 'prod': this.baseUrl = 'https://sokhach.vn'; this.retries = 2; break;\n      default: throw new Error(`Môi trường không hợp lệ: ${env}`);\n    }\n  }\n}",
    ],
  },
];
