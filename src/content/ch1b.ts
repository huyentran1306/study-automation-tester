import type { LessonContent } from "./types";

// Chương 1 · Bài 6–10.

export const L06: LessonContent = {
  id: "l06",
  summary: "Hàm giúp chia nhỏ việc chuẩn bị dữ liệu test thành từng bước dễ đọc, dùng lại được. Hiểu arrow function, callback và phạm vi biến.",
  starter: `function makeCustomer(overrides = {}) {
  return { name: 'Khách thử', email: \`kh\${Date.now()}@mail.vn\`, tier: 'Thường', ...overrides };
}
console.log(makeCustomer());
console.log(makeCustomer({ tier: 'VIP' }));`,
  kata: ["k-l06-user", "k-l06-retry"],
  sections: [
    {
      id: "fn",
      title: "Khai báo hàm và giá trị trả về",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "function passRate(passed, total) {\n  if (total === 0) return 0;\n  return Math.round((passed / total) * 100);\n}\nconsole.log(passRate(7, 8) + '%');\nconsole.log(passRate(0, 0));" },
        { t: "p", md: "Hàm không có `return` sẽ trả về `undefined`. Đặt tên hàm bằng động từ: `login`, `createCustomer`, `expectToast`." },
      ],
    },
    {
      id: "arrow",
      title: "Arrow function và tham số mặc định",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const double = (x) => x * 2;\nconst greet = (name = 'bạn') => `Chào ${name}`;\nconsole.log(double(21), greet(), greet('Linh'));\n\n// Trả về object thì bọc trong ngoặc tròn\nconst toUser = (email) => ({ email, role: 'viewer' });\nconsole.log(toUser('ha@mail.vn'));" },
        { t: "callout", tone: "real", title: "Trong Playwright", md: "Mọi test viết dạng arrow function bất đồng bộ: `async ({ page }) => { ... }`." },
      ],
    },
    {
      id: "callback",
      title: "Callback: truyền hàm vào hàm",
      minutes: 5,
      blocks: [
        { t: "p", md: "Callback là hàm bạn đưa cho hàm khác gọi giúp. `map`, `filter` ở bài 4 đều nhận callback." },
        { t: "code", lang: "js", run: true, code: "function repeat(times, action) {\n  for (let i = 1; i <= times; i++) action(i);\n}\nrepeat(3, (n) => console.log('Tạo khách thứ', n));" },
      ],
    },
    {
      id: "scope",
      title: "Phạm vi biến",
      minutes: 4,
      blocks: [
        { t: "p", md: "Biến khai báo bằng `const`/`let` chỉ sống trong cặp `{ }` chứa nó. Biến bên ngoài nhìn thấy được từ bên trong, ngược lại thì không." },
        { t: "code", lang: "js", run: true, code: "const baseUrl = '/lab-api/v1';\nfunction customerUrl(id) {\n  const path = `/customers/${id}`;\n  return baseUrl + path;\n}\nconsole.log(customerUrl(5));\n// console.log(path); // ReferenceError: path is not defined" },
        { t: "quiz", id: "q1", q: "Gọi makeCustomer() không truyền gì, với function makeCustomer(overrides = {}). overrides bằng gì?", options: ["undefined", "{}", "null"], answer: 1, explain: "Tham số mặc định được dùng khi giá trị truyền vào là undefined." },
      ],
    },
    {
      id: "data",
      title: "Chia nhỏ việc chuẩn bị dữ liệu test",
      minutes: 5,
      blocks: [
        { t: "p", md: "Một test đăng nhập cần: tạo email duy nhất, tạo mật khẩu hợp lệ, ghép thành tài khoản. Tách thành hàm nhỏ để test nào cũng dùng lại được:" },
        { t: "code", lang: "js", run: true, code: "const uniqueEmail = (prefix = 'qa') => `${prefix}+${Date.now()}@sokhach.vn`;\nconst strongPassword = () => 'Matkhau@' + Math.floor(Math.random() * 900 + 100);\nconst newAccount = (role = 'viewer') => ({ email: uniqueEmail(role), password: strongPassword(), role });\nconsole.log(newAccount('admin'));" },
      ],
    },
  ],
  cards: [
    { id: "c-l06-1", tag: "Hàm", q: "Arrow function trả về object cần viết thế nào?", a: "Bọc object trong ngoặc tròn.", code: "const f = () => ({ ok: true });" },
    { id: "c-l06-2", tag: "Hàm", q: "Callback là gì?", a: "Hàm được truyền vào hàm khác để hàm đó gọi lại, ví dụ callback của map/filter." },
    { id: "c-l06-3", tag: "Phạm vi", q: "Biến khai báo bằng let trong một khối { } có dùng được bên ngoài không?", a: "Không, let/const có phạm vi khối." },
  ],
};

export const L07: LessonContent = {
  id: "l07",
  summary: "Git giúp cả team cùng sửa bộ test mà không giẫm chân nhau. Học vòng commit → branch → push → Pull Request và cách gỡ merge conflict.",
  git: "cloned",
  kata: ["k-l07-pr", "k-l07-conflict"],
  sections: [
    {
      id: "repo",
      title: "Repository, commit, branch, remote",
      minutes: 5,
      blocks: [
        { t: "list", items: ["**Repository (repo)**: thư mục dự án có Git theo dõi lịch sử", "**Commit**: một bức ảnh chụp toàn bộ file tại một thời điểm, kèm lời mô tả", "**Branch**: một dòng commit riêng để làm việc mà không ảnh hưởng `main`", "**Remote** (`origin`): bản repo trên GitHub mà cả team dùng chung"] },
        { t: "callout", tone: "tip", title: "Thử ngay bên phải", md: "Git Sandbox bên phải là repo đã clone sẵn. Gõ `git log --oneline` và `git status` để xem." },
      ],
    },
    {
      id: "ignore",
      title: ".gitignore",
      minutes: 3,
      blocks: [
        { t: "p", md: "Không commit thư viện tải về, báo cáo sinh ra mỗi lần chạy, hay file chứa mật khẩu. Liệt kê chúng trong `.gitignore`:" },
        { t: "code", lang: "text", title: ".gitignore", code: "node_modules/\nplaywright-report/\ntest-results/\n.env\n.auth/" },
        { t: "callout", tone: "warn", title: "Lỡ commit .env", md: "Đổi mật khẩu ngay, vì lịch sử Git vẫn giữ file cũ dù bạn xóa ở commit sau." },
      ],
    },
    {
      id: "basic",
      title: "status, add, commit, log, diff, restore",
      minutes: 7,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "git status                    # đang thay đổi gì\ngit diff                      # xem chi tiết dòng đã sửa\ngit add tests/login.spec.ts   # chọn file đưa vào commit\ngit commit -m \"test(login): thêm case sai mật khẩu\"\ngit log --oneline             # lịch sử ngắn gọn\ngit restore tests/login.spec.ts  # bỏ thay đổi chưa add" },
        { t: "p", md: "Viết commit message theo dạng `loại(phạm vi): mô tả`, ví dụ `test(cart): kiểm tra mã giảm giá hết hạn`, `fix(locator): bỏ XPath theo vị trí`." },
        { t: "quiz", id: "q1", q: "Bạn sửa file rồi chạy git commit -m \"...\" ngay. Git báo gì?", options: ["Commit thành công", "no changes added to commit (cần git add trước)", "Tự add mọi file"], answer: 1, explain: "Commit chỉ lấy những gì đã git add vào vùng chuẩn bị (staging)." },
      ],
    },
    {
      id: "remote",
      title: "push, pull, clone an toàn",
      minutes: 5,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "git clone https://github.com/team/so-khach-tests.git\ngit pull                      # lấy commit mới của team\ngit push -u origin test/login # đẩy nhánh lên lần đầu" },
        { t: "callout", tone: "tip", title: "Đăng nhập GitHub an toàn", md: "Dùng GitHub CLI (`gh auth login`) hoặc SSH key. Không dán mật khẩu GitHub vào URL hay vào file trong repo." },
        { t: "quiz", id: "q2", q: "Bạn đã commit ở nhánh của mình nhưng chưa push. Đồng nghiệp có thấy commit đó trên GitHub chưa?", options: ["Có, commit tự lên GitHub", "Chưa, phải git push thì mới lên", "Chỉ thấy nếu mở Pull Request"], answer: 1, explain: "Commit mới nằm ở máy bạn; git push mới đưa nó lên GitHub." },
      ],
    },
    {
      id: "pr",
      title: "Branch và Pull Request",
      minutes: 8,
      blocks: [
        { t: "p", md: "Cả team dùng chung nhánh `main`. Khi viết thêm test, tách ra nhánh riêng, commit ở đó, rồi mở **Pull Request** để người khác review trước khi gộp vào." },
        { t: "code", lang: "bash", title: "terminal", code: "git switch -c test/login-negative\n# ... sửa file ...\ngit add tests/login.spec.ts\ngit commit -m \"test(login): thêm 3 case sai mật khẩu\"\ngit push -u origin test/login-negative\ngh pr create --title \"Thêm case đăng nhập sai\"" },
        { t: "callout", tone: "real", title: "Tester ngoài đời làm vậy", md: "Đặt tên nhánh theo việc: `test/login-negative`, `fix/flaky-checkout`. Reviewer nhìn tên là biết bạn đang làm gì." },
      ],
    },
    {
      id: "conflict",
      title: "Merge conflict",
      minutes: 7,
      blocks: [
        { t: "p", md: "Conflict xảy ra khi hai nhánh cùng sửa **một dòng** theo hai cách khác nhau. Git đánh dấu chỗ đó trong file:" },
        { t: "code", lang: "text", title: "playwright.config.ts", code: "<<<<<<< HEAD\nexport default { timeout: 60000 };\n=======\nexport default { timeout: 45000 };\n>>>>>>> main" },
        { t: "list", ordered: true, items: ["Mở file, quyết định giữ dòng nào (hoặc viết lại cho đúng)", "Xóa hết 3 dòng đánh dấu `<<<<<<<`, `=======`, `>>>>>>>`", "`git add` file đó rồi `git commit` để kết thúc merge"] },
        { t: "callout", tone: "tip", title: "Không chắc thì hủy", md: "`git merge --abort` đưa mọi thứ về như trước khi merge." },
      ],
    },
    {
      id: "ai",
      title: "Nhờ AI viết lệnh và commit message",
      minutes: 3,
      blocks: [
        { t: "p", md: "Dán `git diff` cho AI và hỏi: *Viết commit message theo dạng loại(phạm vi): mô tả, tiếng Việt, dưới 72 ký tự.* Đọc lại trước khi dùng: AI không biết lý do nghiệp vụ bạn sửa." },
      ],
    },
  ],
  cards: [
    { id: "c-l07-1", tag: "Git", q: "Lệnh nào vừa tạo vừa chuyển sang nhánh mới?", a: "git switch -c <tên> (bản cũ: git checkout -b).", code: "git switch -c test/login-negative" },
    { id: "c-l07-2", tag: "Git", q: "Commit chưa push thì nằm ở đâu?", a: "Chỉ ở repo trên máy bạn; GitHub chưa có." },
    { id: "c-l07-3", tag: "Git", q: "Gỡ merge conflict gồm mấy bước?", a: "Sửa file và xóa dấu <<<<<<< ======= >>>>>>>, git add, git commit." },
    { id: "c-l07-4", tag: "Git", q: "Những gì nên có trong .gitignore của dự án Playwright?", a: "node_modules/, playwright-report/, test-results/, .env, .auth/" },
  ],
};

export const L08: LessonContent = {
  id: "l08",
  summary: "Class gom dữ liệu và hành động vào một chỗ. Đây là nền móng của Page Object Model: mỗi trang web là một class có locator và hành động riêng.",
  starter: `class LoginPage {
  constructor(page) {
    this.page = page;
    this.url = '/login';
  }
  async login(email, password) {
    await this.page.fill('Email', email);
    await this.page.fill('Mật khẩu', password);
    await this.page.click('Đăng nhập');
  }
}

// page giả lập: chỉ ghi lại thao tác
const page = { log: [], async fill(f, v) { this.log.push(\`fill \${f}=\${v}\`); }, async click(b) { this.log.push(\`click \${b}\`); } };
const lp = new LoginPage(page);
await lp.login('linh@sokhach.vn', 'Matkhau@123');
console.log(page.log);`,
  kata: ["k-l08-loginpage", "k-l08-extends"],
  sections: [
    {
      id: "class",
      title: "Class, constructor, phương thức",
      minutes: 6,
      blocks: [
        { t: "code", lang: "js", run: true, code: "class Customer {\n  constructor(name, tier = 'Thường') {\n    this.name = name;\n    this.tier = tier;\n  }\n  isVip() {\n    return this.tier === 'VIP';\n  }\n}\nconst c = new Customer('Lê Bảo Ngọc', 'VIP');\nconsole.log(c.name, c.isVip());" },
        { t: "p", md: "`constructor` chạy khi bạn `new`. `this` là chính object đang tạo." },
      ],
    },
    {
      id: "extends",
      title: "extends và super",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "class BasePage {\n  constructor(page) { this.page = page; }\n  async open(path) { console.log('goto', path); }\n}\nclass CustomersPage extends BasePage {\n  constructor(page) {\n    super(page); // gọi constructor của BasePage\n    this.path = '/customers';\n  }\n  async open() { await super.open(this.path); }\n}\nawait new CustomersPage({}).open();" },
        { t: "callout", tone: "real", title: "Chương 4 sẽ dùng lại", md: "`BasePage` chứa việc chung của mọi trang (mở URL, chờ toast). Trang cụ thể `extends BasePage`." },
      ],
    },
    {
      id: "encap",
      title: "Đóng gói và đa hình",
      minutes: 5,
      blocks: [
        { t: "p", md: "Trường bắt đầu bằng `#` là **private**: bên ngoài class không đọc được. Dùng để giấu chi tiết, chỉ lộ ra hành động cần thiết." },
        { t: "code", lang: "js", run: true, code: "class Session {\n  #token;\n  constructor(token) { this.#token = token; }\n  authHeader() { return { Authorization: `Bearer ${this.#token}` }; }\n}\nconst s = new Session('abc123');\nconsole.log(s.authHeader());\nconsole.log(s.token); // undefined" },
        { t: "p", md: "**Đa hình**: lớp con viết lại phương thức của lớp cha. Code gọi `page.open()` không cần biết đó là trang nào." },
        { t: "quiz", id: "q1", q: "Trong constructor của lớp con, phải gọi gì trước khi dùng this?", options: ["this.parent()", "super(...)", "new BasePage()"], answer: 1, explain: "Lớp con bắt buộc gọi super() trước khi truy cập this." },
      ],
    },
    {
      id: "pom",
      title: "LoginPage: bước đầu tới POM",
      minutes: 6,
      blocks: [
        { t: "p", md: "Thay vì lặp lại 3 dòng fill/click trong mọi test, gói chúng vào `LoginPage.login()`. Khi giao diện đổi, chỉ sửa một chỗ. Khu chạy thử bên phải có sẵn ví dụ, bấm **Chạy** để xem." },
        { t: "callout", tone: "tip", title: "Quy tắc POM", md: "Page Object chứa **locator** và **hành động**. Phần **kiểm tra** (expect) nên nằm trong test, hoặc trong phương thức tên rõ là kiểm tra như `expectLoggedIn()`." },
      ],
    },
  ],
  cards: [
    { id: "c-l08-1", tag: "Class", q: "Từ khóa nào để lớp con kế thừa lớp cha?", a: "extends; trong constructor gọi super().", code: "class LoginPage extends BasePage {}" },
    { id: "c-l08-2", tag: "Class", q: "Trường private trong class JS viết thế nào?", a: "Đặt # trước tên trường.", code: "class S { #token; }" },
    { id: "c-l08-3", tag: "POM", q: "Page Object nên chứa những gì?", a: "Locator và hành động của trang; phần kiểm tra để ở test hoặc hàm expectXxx rõ tên." },
  ],
};

export const L09: LessonContent = {
  id: "l09",
  summary: "Mọi thao tác Playwright đều bất đồng bộ. Hiểu Promise, async/await, chạy song song với Promise.all, chia module và bắt lỗi bằng try/catch.",
  starter: `const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCustomer(id) {
  await wait(200);
  if (id < 0) throw new Error('id không hợp lệ');
  return { id, name: 'Khách ' + id };
}

try {
  console.log(await fetchCustomer(1));
  console.log(await Promise.all([fetchCustomer(2), fetchCustomer(3)]));
  await fetchCustomer(-1);
} catch (e) {
  console.log('Bắt được lỗi:', e.message);
}`,
  kata: ["k-l09-retry", "k-l09-all"],
  sections: [
    {
      id: "promise",
      title: "Promise và await",
      minutes: 6,
      blocks: [
        { t: "p", md: "Mở trang, click, gọi API đều mất thời gian. Hàm trả về **Promise**, một lời hứa sẽ có kết quả sau. `await` đợi lời hứa đó xong rồi mới chạy dòng tiếp." },
        { t: "code", lang: "js", run: true, code: "const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nconsole.log('Bắt đầu');\nawait wait(300);\nconsole.log('Sau 300ms');" },
        { t: "callout", tone: "warn", title: "Quên await là bug số 1", md: "`page.click(...)` không có `await` thì test chạy tiếp ngay khi click chưa xong. Test có thể pass sai hoặc fail ngẫu nhiên." },
      ],
    },
    {
      id: "async",
      title: "async function và giá trị trả về",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "async function getTitle() {\n  return 'Sổ Khách';\n}\nconst p = getTitle();\nconsole.log(p instanceof Promise);\nconsole.log(await p);" },
        { t: "p", md: "Hàm `async` luôn trả về Promise, kể cả khi bạn `return` một chuỗi thường." },
      ],
    },
    {
      id: "loop",
      title: "await trong vòng lặp: for...of và Promise.all",
      minutes: 7,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconst ids = [1, 2, 3];\n\n// Lần lượt từng cái\nfor (const id of ids) { await wait(100); console.log('xong', id); }\n\n// forEach KHÔNG chờ\nids.forEach(async (id) => { await wait(100); console.log('forEach', id); });\nconsole.log('Dòng này chạy trước cả forEach!');\n\n// Song song, chờ tất cả\nconst t = Date.now();\nawait Promise.all(ids.map(() => wait(200)));\nconsole.log('Promise.all mất khoảng', Date.now() - t, 'ms');" },
        { t: "quiz", id: "q1", q: "Cần tạo 5 khách qua API trước test, các lần gọi không phụ thuộc nhau. Cách nào nhanh nhất?", options: ["for...of với await từng lần", "await Promise.all(list.map(createCustomer))", "list.forEach(async c => await createCustomer(c))"], answer: 1, explain: "Promise.all chạy song song và chờ hết; forEach không chờ nên test chạy tiếp khi dữ liệu chưa sẵn sàng." },
      ],
    },
    {
      id: "modules",
      title: "import / export",
      minutes: 4,
      blocks: [
        { t: "p", md: "Chia code thành nhiều file. File này `export`, file khác `import`:" },
        { t: "code", lang: "ts", title: "utils/data.ts", code: "export const uniqueEmail = () => `qa+${Date.now()}@sokhach.vn`;\nexport default function strongPassword() { return 'Matkhau@123'; }" },
        { t: "code", lang: "ts", title: "tests/signup.spec.ts", code: "import strongPassword, { uniqueEmail } from '../utils/data';" },
      ],
    },
    {
      id: "errors",
      title: "try / catch / finally và throw",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "function parseAmount(text) {\n  const n = Number(text.replace(/[^0-9]/g, ''));\n  if (!text.trim() || Number.isNaN(n)) throw new Error(`Không đọc được số tiền: \"${text}\"`);\n  return n;\n}\ntry {\n  console.log(parseAmount('1.250.000 ₫'));\n  console.log(parseAmount('   '));\n} catch (e) {\n  console.log('Lỗi:', e.message);\n} finally {\n  console.log('Luôn chạy, dùng để dọn dẹp');\n}" },
        { t: "callout", tone: "tip", title: "Đừng nuốt lỗi trong test", md: "`catch {}` rỗng làm test xanh dù có lỗi. Nếu bắt lỗi, hãy ghi lại hoặc `throw` tiếp." },
      ],
    },
  ],
  cards: [
    { id: "c-l09-1", tag: "Async", q: "Vì sao không dùng forEach với await?", a: "forEach không chờ callback async; code sau chạy ngay khi việc chưa xong. Dùng for...of hoặc Promise.all." },
    { id: "c-l09-2", tag: "Async", q: "Hàm async trả về gì?", a: "Luôn trả về Promise." },
    { id: "c-l09-3", tag: "Async", q: "Chạy song song nhiều việc và chờ tất cả?", a: "Promise.all.", code: "await Promise.all(ids.map(fetchOne))" },
    { id: "c-l09-4", tag: "Lỗi", q: "Khối finally dùng làm gì?", a: "Luôn chạy dù có lỗi hay không, để dọn dẹp (đóng kết nối, xóa dữ liệu test)." },
  ],
};

export const L10: LessonContent = {
  id: "l10",
  summary: "TypeScript thêm kiểu cho JavaScript để bắt lỗi ngay khi gõ. Playwright khuyến nghị TS, và chương 2 trở đi mình viết toàn bộ bằng TS.",
  starter: `interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
}

const results: TestResult[] = [
  { title: 'đăng nhập đúng', status: 'passed', durationMs: 1200 },
  { title: 'sai mật khẩu', status: 'failed', durationMs: 5000 },
];

function summary(list: TestResult[]): string {
  const passed = list.filter((r) => r.status === 'passed').length;
  return \`\${passed}/\${list.length} pass\`;
}
console.log(summary(results));`,
  kata: ["k-l10-rate", "k-l10-readonly"],
  sections: [
    {
      id: "why",
      title: "Vì sao automation dùng TypeScript",
      minutes: 4,
      blocks: [
        { t: "list", items: ["Gõ `page.` là VS Code gợi ý đủ hàm, không phải nhớ", "Gõ sai tên thuộc tính, truyền sai kiểu là báo đỏ ngay, không đợi chạy test mới biết", "Đọc code của người khác dễ hơn vì thấy rõ dữ liệu có dạng gì"] },
        { t: "code", lang: "bash", title: "terminal", code: "npx tsc --noEmit   # kiểm tra kiểu cho cả dự án, không sinh file\nnode app.ts         # Node 24 tự bỏ phần kiểu rồi chạy (không kiểm tra kiểu)" },
      ],
    },
    {
      id: "annot",
      title: "Chú thích kiểu",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", run: true, code: "const baseUrl: string = 'https://sokhach.playforge.dev';\nconst retries: number = 2;\nconst browsers: string[] = ['chromium', 'webkit'];\nfunction url(path: string, id?: number): string {\n  return id === undefined ? baseUrl + path : `${baseUrl}${path}/${id}`;\n}\nconsole.log(url('/customers', 5));" },
        { t: "p", md: "`id?: number` là tham số tùy chọn. Kiểu hợp `'passed' | 'failed'` chỉ cho phép đúng các giá trị đó." },
      ],
    },
    {
      id: "any",
      title: "Tránh any",
      minutes: 4,
      blocks: [
        { t: "p", md: "`any` tắt hết kiểm tra kiểu, mất luôn lợi ích của TS. Khi chưa biết kiểu, dùng `unknown` rồi kiểm tra trước khi dùng." },
        { t: "code", lang: "ts", run: true, code: "function readCount(body: unknown): number {\n  if (typeof body === 'object' && body !== null && 'total' in body) {\n    return Number((body as { total: unknown }).total);\n  }\n  throw new Error('Response thiếu total');\n}\nconsole.log(readCount({ total: 25 }));" },
      ],
    },
    {
      id: "iface",
      title: "type và interface",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", run: true, code: "interface Customer {\n  id: number;\n  name: string;\n  tier: 'VIP' | 'Mới' | 'Thường';\n  email?: string;\n}\ntype Env = 'dev' | 'staging' | 'prod';\n\nconst c: Customer = { id: 1, name: 'Trần Thu Hà', tier: 'Mới' };\nconst env: Env = 'staging';\nconsole.log(c, env);" },
        { t: "callout", tone: "tip", title: "Chọn cái nào", md: "Mô tả hình dạng object thì dùng `interface`. Kiểu hợp, kiểu ghép thì dùng `type`. Cả team thống nhất một kiểu là được." },
        { t: "quiz", id: "q1", q: "status: 'passed' | 'failed'. Gán status = 'pass' thì sao?", options: ["Chạy bình thường", "TypeScript báo lỗi ngay khi gõ", "Tự đổi thành 'passed'"], answer: 1, explain: "Kiểu hợp chỉ cho đúng các giá trị liệt kê; lỗi gõ sai bị bắt trước khi chạy." },
      ],
    },
    {
      id: "class",
      title: "Class trong TS: private, readonly",
      minutes: 5,
      blocks: [
        { t: "code", lang: "ts", run: true, code: "class LoginPage {\n  readonly url = '/login';\n  constructor(private readonly page: { fill(f: string, v: string): Promise<void> }) {}\n  async fillEmail(email: string): Promise<void> {\n    await this.page.fill('Email', email);\n  }\n}\nconst lp = new LoginPage({ async fill(f, v) { console.log('fill', f, v); } });\nawait lp.fillEmail('linh@sokhach.vn');\nconsole.log(lp.url);" },
        { t: "p", md: "`private readonly page` trong constructor vừa khai báo vừa gán thuộc tính, đúng kiểu bạn sẽ thấy trong mọi Page Object của Playwright." },
      ],
    },
  ],
  cards: [
    { id: "c-l10-1", tag: "TypeScript", q: "Kiểm tra kiểu cả dự án mà không sinh file JS?", a: "Chạy tsc với --noEmit.", code: "npx tsc --noEmit" },
    { id: "c-l10-2", tag: "TypeScript", q: "Vì sao tránh any?", a: "any tắt kiểm tra kiểu; dùng unknown rồi kiểm tra trước khi dùng." },
    { id: "c-l10-3", tag: "TypeScript", q: "constructor(private readonly page: Page) làm gì?", a: "Khai báo và gán thuộc tính page, private và không gán lại được." },
  ],
};
