import type { LessonContent } from "./types";

// Chương 1 · Bài 1–5. Nội dung tự viết theo chủ đề của từng bài trong lộ trình.

export const L01: LessonContent = {
  id: "l01",
  summary: "Cài đúng Node.js, làm quen VS Code và tạo dự án Node đầu tiên. Học cách dùng AI gợi ý lệnh mà không chạy bừa.",
  starter: `// Chương trình đầu tiên của bạn. Bấm Chạy (Ctrl + Enter).
const tester = 'Linh';
console.log('Xin chào, ' + tester + '!');
console.log('Node đang chạy phiên bản giả lập:', 'v24 LTS');`,
  kata: ["k-l01-greet", "k-l01-scripts"],
  sections: [
    {
      id: "node",
      title: "Node.js và npm là gì",
      minutes: 4,
      blocks: [
        { t: "p", md: "Playwright viết bằng JavaScript/TypeScript nên cần một chương trình chạy được JS ngoài trình duyệt. Đó là **Node.js**. Đi kèm Node là **npm**, công cụ tải thư viện như `@playwright/test`." },
        { t: "list", items: ["`node` chạy file `.js`: `node index.js`", "`npm` cài thư viện vào thư mục `node_modules`", "`npx` chạy công cụ của thư viện mà không cần cài toàn máy, ví dụ `npx playwright test`"] },
        { t: "callout", tone: "tip", title: "Chọn bản LTS", md: "LTS (Long Term Support) là bản được hỗ trợ lâu dài. Chọn bản LTS mới nhất, hiện là **Node 24 LTS**. Bản số lẻ (25, 27) là bản thử nghiệm, không dùng cho dự án test." },
        { t: "quiz", id: "q1", q: "Lệnh nào chạy bộ test Playwright mà không cần cài Playwright toàn máy?", options: ["node playwright test", "npx playwright test", "npm playwright"], answer: 1, explain: "npx tìm công cụ trong node_modules của dự án rồi chạy nó." },
      ],
    },
    {
      id: "install",
      title: "Cài trên Windows và macOS",
      minutes: 5,
      blocks: [
        { t: "p", md: "Tải bộ cài từ trang chính thức nodejs.org, chọn bản LTS. Cài xong, mở terminal mới và kiểm tra:" },
        { t: "code", lang: "bash", title: "terminal", code: "node -v   # ví dụ: v24.11.0\nnpm -v    # ví dụ: 11.6.2" },
        { t: "callout", tone: "warn", title: "Lỗi hay gặp", md: "Gõ `node -v` báo *command not found* thường do terminal mở **trước** khi cài. Đóng hẳn terminal / VS Code rồi mở lại." },
        { t: "p", md: "Trên macOS có thể cài bằng Homebrew: `brew install node@24`. Trên Windows dùng bộ cài `.msi`, nhớ tick ô *Add to PATH*." },
      ],
    },
    {
      id: "vscode",
      title: "VS Code: terminal và extension",
      minutes: 4,
      blocks: [
        { t: "p", md: "VS Code là nơi bạn viết test hằng ngày. Mở terminal tích hợp bằng **Ctrl + `** (dấu huyền). Nên cài các extension:" },
        { t: "list", items: ["**Playwright Test for VS Code**: chạy, debug test ngay trong editor", "**ESLint**: báo lỗi code sớm", "**Prettier**: tự căn chỉnh code khi lưu", "**GitLens**: xem ai sửa dòng nào"] },
        { t: "callout", tone: "real", title: "Tester ngoài đời làm vậy", md: "Bật *Format on Save* để code của cả team cùng một kiểu. Reviewer sẽ không phải nhắc chuyện dấu cách." },
      ],
    },
    {
      id: "project",
      title: "Dự án Node đầu tiên",
      minutes: 6,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "mkdir so-khach-tests && cd so-khach-tests\nnpm init -y        # tạo package.json\nnode index.js      # chạy file" },
        { t: "p", md: "`package.json` là *hồ sơ* của dự án: tên, phiên bản, thư viện đang dùng và các lệnh tắt trong mục `scripts`." },
        { t: "code", lang: "json", title: "package.json", code: '{\n  "name": "so-khach-tests",\n  "version": "1.0.0",\n  "scripts": {\n    "test": "playwright test",\n    "test:smoke": "playwright test --grep @smoke"\n  }\n}' },
        { t: "p", md: "Khi đó `npm test` sẽ chạy `playwright test`, còn `npm run test:smoke` chạy nhóm smoke. Thử chạy đoạn code bên dưới:" },
        { t: "code", lang: "js", run: true, code: "const pkg = {\n  name: 'so-khach-tests',\n  scripts: { test: 'playwright test', 'test:smoke': 'playwright test --grep @smoke' },\n};\nconsole.log('Dự án:', pkg.name);\nconsole.log('Các lệnh:', Object.keys(pkg.scripts));" },
        { t: "quiz", id: "q2", q: "File nào ghi lại các thư viện và lệnh tắt của dự án?", options: ["node_modules", "package.json", "index.js"], answer: 1, explain: "node_modules chỉ chứa code thư viện đã tải; danh sách và scripts nằm trong package.json." },
      ],
    },
    {
      id: "ai",
      title: "Dùng AI gợi ý lệnh mà không chạy bừa",
      minutes: 5,
      blocks: [
        { t: "p", md: "Claude, ChatGPT, Gemini giúp rất nhiều khi cài đặt và viết test. Nhưng AI có thể đưa lệnh cũ, sai hệ điều hành, hoặc nguy hiểm. Trước khi dán lệnh vào terminal, kiểm tra 3 điều:" },
        { t: "list", ordered: true, items: ["Mình hiểu từng phần của lệnh làm gì chưa?", "Lệnh có xóa, ghi đè hay cần `sudo` / quyền admin không?", "Đối chiếu với tài liệu chính thức (nodejs.org, playwright.dev) có khớp không?"] },
        { t: "callout", tone: "warn", title: "Dừng lại ngay nếu thấy", md: "`rm -rf`, `sudo chmod -R 777`, `curl ... | bash` từ trang lạ. Hỏi lại AI: *lệnh này làm gì, có an toàn không?*" },
        { t: "callout", tone: "tip", title: "Cách hỏi AI hiệu quả", md: "Nói rõ hệ điều hành, phiên bản, lỗi đầy đủ: *Mình dùng macOS 15, Node 24, chạy `npx playwright test` báo lỗi: ... Giải thích nguyên nhân trước rồi mới đưa lệnh sửa.*" },
      ],
    },
  ],
  cards: [
    { id: "c-l01-1", tag: "Node.js", q: "Vì sao chọn Node bản LTS cho dự án test?", a: "Bản LTS được hỗ trợ và vá lỗi lâu dài, ổn định hơn bản số lẻ thử nghiệm." },
    { id: "c-l01-2", tag: "npm", q: "npm, npx khác nhau thế nào?", a: "npm cài và quản lý thư viện; npx chạy công cụ của thư viện (vd: npx playwright test).", code: "npx playwright test" },
    { id: "c-l01-3", tag: "Dự án", q: "Mục scripts trong package.json dùng để làm gì?", a: "Đặt lệnh tắt, ví dụ npm test chạy playwright test." },
  ],
};

export const L02: LessonContent = {
  id: "l02",
  summary: "Biến, kiểu dữ liệu và toán tử: những viên gạch đầu tiên. Thực hành làm sạch chuỗi cào từ web và so sánh đúng cách.",
  starter: `const raw = '  1.250.000 ₫ ';
const clean = raw.trim().replace(/[^0-9]/g, '');
const price = Number(clean);
console.log(price, typeof price);
console.log(\`Giá sau giảm 10%: \${price * 0.9}\`);`,
  kata: ["k-l02-price", "k-l02-report"],
  sections: [
    {
      id: "vars",
      title: "const và let",
      minutes: 4,
      blocks: [
        { t: "p", md: "Dùng `const` cho giá trị không gán lại, `let` khi cần gán lại. Gần như không dùng `var` nữa." },
        { t: "code", lang: "js", run: true, code: "const baseUrl = 'https://sokhach.playforge.dev';\nlet retries = 0;\nretries = retries + 1;\nconsole.log(baseUrl, retries);\n// baseUrl = 'khác'; // lỗi: Assignment to constant variable." },
        { t: "callout", tone: "tip", title: "Quy tắc nhanh", md: "Mặc định viết `const`. Chỉ đổi sang `let` khi trình soạn báo bạn cần gán lại." },
      ],
    },
    {
      id: "types",
      title: "Kiểu dữ liệu và typeof",
      minutes: 5,
      blocks: [
        { t: "list", items: ["`string`: chuỗi, `'Đăng nhập'`", "`number`: số, `42`, `3.14`", "`boolean`: `true` / `false`", "`undefined`, `null`: chưa có / cố ý để trống", "`object`, `array`: nói ở bài 4–5"] },
        { t: "code", lang: "js", run: true, code: "console.log(typeof 'Xóa');      // string\nconsole.log(typeof 200);        // number\nconsole.log(typeof true);       // boolean\nconsole.log(typeof undefined);  // undefined\nconsole.log(typeof null);       // object  (lỗi lịch sử của JS!)" },
        { t: "p", md: "Template literal dùng dấu huyền, chèn biến bằng `${...}`. Rất hay dùng để ghép URL và thông báo lỗi:" },
        { t: "code", lang: "js", run: true, code: "const id = 126;\nconst url = `/lab-api/v1/customers/${id}`;\nconsole.log(url);\nconsole.log(`Test ${'đăng nhập'} chạy mất ${1.2 * 1000}ms`);" },
      ],
    },
    {
      id: "strings",
      title: "Làm sạch chuỗi cào từ web",
      minutes: 6,
      blocks: [
        { t: "p", md: "Chữ đọc từ trang web hay dính khoảng trắng, xuống dòng, ký hiệu tiền tệ. Trước khi so sánh, làm sạch nó:" },
        { t: "code", lang: "js", run: true, code: "const text = '\\n   Tổng: 1.250.000 ₫  ';\nconsole.log(JSON.stringify(text.trim()));\nconst digits = text.replace(/[^0-9]/g, '');\nconsole.log(Number(digits));\nconsole.log('Email@Mail.VN'.toLowerCase());\nconsole.log('Nguyễn Minh Anh'.includes('Minh'));" },
        { t: "callout", tone: "warn", title: "Number('') là 0", md: "`Number('')` trả về `0`, còn `Number('abc')` trả về `NaN`. Kiểm tra chuỗi rỗng trước khi đổi sang số." },
      ],
    },
    {
      id: "compare",
      title: "So sánh: == và ===",
      minutes: 5,
      blocks: [
        { t: "p", md: "`==` tự đổi kiểu trước khi so sánh nên dễ ra kết quả lạ. Trong test luôn dùng `===` và `!==`." },
        { t: "code", lang: "js", run: true, code: "console.log('1' == 1);    // true  (đổi kiểu)\nconsole.log('1' === 1);   // false (khác kiểu)\nconsole.log(0 == '');     // true  (!)\nconsole.log(null == undefined, null === undefined);" },
        { t: "p", md: "Toán tử logic: `&&` (và), `||` (hoặc), `!` (phủ định)." },
        { t: "quiz", id: "q1", q: "Ô số lượng giỏ hàng hiển thị chữ \"1\". Biểu thức nào đúng nghĩa \"giỏ có đúng 1 món\"?", options: ["text == 1", "Number(text) === 1", "text === 1"], answer: 1, explain: "text là chuỗi nên text === 1 luôn false; đổi sang số rồi so sánh chặt là rõ ràng nhất." },
      ],
    },
  ],
  cards: [
    { id: "c-l02-1", tag: "Biến", q: "Khi nào dùng let thay vì const?", a: "Chỉ khi cần gán lại giá trị cho biến đó." },
    { id: "c-l02-2", tag: "So sánh", q: "Vì sao trong test nên dùng === thay vì ==?", a: "=== không tự đổi kiểu nên không có kết quả bất ngờ như 0 == '' là true." },
    { id: "c-l02-3", tag: "Chuỗi", q: "Đổi \"  1.250.000 ₫ \" thành số 1250000 thế nào?", a: "Bỏ ký tự không phải số rồi Number().", code: "Number(raw.replace(/[^0-9]/g, ''))" },
  ],
};

export const L03: LessonContent = {
  id: "l03",
  summary: "Cho code ra quyết định: if/else, toán tử ba ngôi, switch. Tránh các bẫy truthy/falsy khiến test pass sai.",
  starter: `const status = 404;
if (status >= 200 && status < 300) {
  console.log('Thành công');
} else if (status >= 400 && status < 500) {
  console.log('Lỗi phía client');
} else {
  console.log('Lỗi khác');
}`,
  kata: ["k-l03-status", "k-l03-timeout"],
  sections: [
    {
      id: "if",
      title: "if / else if / else",
      minutes: 4,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const browser = 'webkit';\nif (browser === 'chromium') {\n  console.log('Chrome / Edge');\n} else if (browser === 'webkit') {\n  console.log('Safari');\n} else {\n  console.log('Firefox');\n}" },
        { t: "p", md: "Toán tử ba ngôi viết gọn khi chỉ cần chọn 1 trong 2 giá trị: `điều_kiện ? A : B`." },
        { t: "code", lang: "js", run: true, code: "const passed = 7, total = 8;\nconst label = passed === total ? 'Tất cả xanh' : `${total - passed} test đỏ`;\nconsole.log(label);" },
      ],
    },
    {
      id: "truthy",
      title: "Bẫy truthy / falsy",
      minutes: 6,
      blocks: [
        { t: "p", md: "Trong `if`, JS tự coi một số giá trị là sai (**falsy**): `false`, `0`, `''`, `null`, `undefined`, `NaN`. Mọi thứ khác là đúng, kể cả `'0'`, `[]`, `{}`." },
        { t: "code", lang: "js", run: true, code: "const count = 0;\nif (count) console.log('Có món'); else console.log('Giỏ trống?');\n\nconst items = [];\nif (items) console.log('[] vẫn là truthy!');\nif (items.length === 0) console.log('Kiểm tra độ dài mới đúng');" },
        { t: "callout", tone: "warn", title: "Bug thật trong test", md: "`if (await row.textContent())` sẽ bỏ qua dòng có nội dung `'0'`? Không, `'0'` là truthy. Nhưng nếu bạn đã đổi sang số `0` thì lại bị bỏ qua. Luôn so sánh rõ ràng." },
      ],
    },
    {
      id: "default",
      title: "|| và ?? khi đặt giá trị mặc định",
      minutes: 5,
      blocks: [
        { t: "p", md: "`a || b` lấy `b` khi `a` là **falsy**. `a ?? b` chỉ lấy `b` khi `a` là `null` hoặc `undefined`. Với số `0` hay chuỗi rỗng hợp lệ, dùng `??`." },
        { t: "code", lang: "js", run: true, code: "const fromEnv = 0; // người dùng cố ý đặt retries = 0\nconsole.log(fromEnv || 2);  // 2   (sai ý!)\nconsole.log(fromEnv ?? 2);  // 0   (đúng ý)" },
        { t: "quiz", id: "q1", q: "process.env.RETRIES có thể là '0'. Sau khi Number(), muốn mặc định 2 nếu chưa đặt. Dùng gì?", options: ["Number(x) || 2", "x === undefined ? 2 : Number(x)", "Cả hai như nhau"], answer: 1, explain: "Number('0') || 2 cho ra 2, làm mất giá trị 0 hợp lệ." },
      ],
    },
    {
      id: "switch",
      title: "switch / case",
      minutes: 4,
      blocks: [
        { t: "p", md: "Khi so một biến với nhiều giá trị cố định, `switch` dễ đọc hơn chuỗi `else if`. Nhớ `break`." },
        { t: "code", lang: "js", run: true, code: "function envUrl(env) {\n  switch (env) {\n    case 'dev': return 'http://localhost:3000';\n    case 'staging': return 'https://staging.sokhach.vn';\n    case 'prod': return 'https://sokhach.vn';\n    default: throw new Error(`Môi trường không hợp lệ: ${env}`);\n  }\n}\nconsole.log(envUrl('staging'));" },
      ],
    },
  ],
  cards: [
    { id: "c-l03-1", tag: "Falsy", q: "Kể 6 giá trị falsy trong JS.", a: "false, 0, '' (chuỗi rỗng), null, undefined, NaN." },
    { id: "c-l03-2", tag: "Mặc định", q: "|| và ?? khác nhau khi giá trị là 0?", a: "0 || 5 cho 5; 0 ?? 5 cho 0. ?? chỉ thay khi null/undefined." },
    { id: "c-l03-3", tag: "Rẽ nhánh", q: "Viết gọn: nếu passed === total thì 'Xanh' ngược lại 'Đỏ'.", a: "Dùng toán tử ba ngôi.", code: "const s = passed === total ? 'Xanh' : 'Đỏ';" },
  ],
};

export const L04: LessonContent = {
  id: "l04",
  summary: "Lặp và xử lý danh sách: for, while, retry có giới hạn, cùng các hàm mảng map, filter, find dùng hằng ngày khi kiểm tra dữ liệu.",
  starter: `const attempts = [
  { user: 'linh', ok: true },
  { user: 'ha', ok: false },
  { user: 'ngoc', ok: false },
];
const failed = attempts.filter(a => !a.ok).map(a => a.user);
console.log('Đăng nhập lỗi:', failed);`,
  kata: ["k-l04-locked", "k-l04-summary"],
  sections: [
    {
      id: "loops",
      title: "for, while và retry có giới hạn",
      minutes: 6,
      blocks: [
        { t: "code", lang: "js", run: true, code: "for (let i = 1; i <= 3; i++) {\n  console.log('Lần chạy', i);\n}" },
        { t: "p", md: "Khi thử lại một việc (ví dụ gọi API chưa sẵn sàng), luôn đặt **giới hạn** để không lặp vô tận:" },
        { t: "code", lang: "js", run: true, code: "let attempt = 0;\nlet ok = false;\nwhile (!ok && attempt < 3) {\n  attempt++;\n  ok = Math.random() > 0.5; // giả lập: lúc được lúc không\n  console.log(`Thử lần ${attempt}:`, ok ? 'OK' : 'lỗi');\n}\nconsole.log(ok ? 'Thành công' : 'Bỏ cuộc sau 3 lần');" },
      ],
    },
    {
      id: "arrays",
      title: "Mảng: thêm, bớt, duyệt",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const browsers = ['chromium', 'firefox'];\nbrowsers.push('webkit');\nconsole.log(browsers.length, browsers);\nconst last = browsers.pop();\nconsole.log('Vừa bỏ:', last);\nfor (const b of browsers) console.log('Chạy trên', b);\nconsole.log(browsers.includes('firefox'));" },
        { t: "callout", tone: "tip", title: "for...of hay forEach?", md: "Hai cách đều duyệt mảng. Nhưng **forEach không chờ được await** (bài 9 sẽ thấy). Trong test, quen dùng `for...of` cho an toàn." },
      ],
    },
    {
      id: "hof",
      title: "map, filter, find",
      minutes: 7,
      blocks: [
        { t: "list", items: ["`map`: biến mỗi phần tử thành giá trị mới, ra mảng cùng độ dài", "`filter`: giữ lại phần tử thỏa điều kiện", "`find`: lấy **phần tử đầu tiên** thỏa điều kiện, không có thì `undefined`"] },
        { t: "code", lang: "js", run: true, code: "const customers = [\n  { name: 'Nguyễn Minh Anh', tier: 'VIP' },\n  { name: 'Trần Thu Hà', tier: 'Mới' },\n  { name: 'Lê Bảo Ngọc', tier: 'VIP' },\n];\nconsole.log(customers.map(c => c.name));\nconsole.log(customers.filter(c => c.tier === 'VIP').length);\nconsole.log(customers.find(c => c.name.includes('Hà')));" },
        { t: "quiz", id: "q1", q: "Muốn kiểm tra bảng có đúng 2 khách VIP, dùng gì?", options: ["customers.find(c => c.tier === 'VIP')", "customers.filter(c => c.tier === 'VIP').length === 2", "customers.map(c => c.tier === 'VIP')"], answer: 1, explain: "find chỉ lấy 1 phần tử; map ra mảng true/false; filter rồi đếm length mới đúng." },
      ],
    },
    {
      id: "crm",
      title: "Tổng kết lượt đăng nhập CRM",
      minutes: 5,
      blocks: [
        { t: "p", md: "Ghép lại: từ danh sách lượt đăng nhập, tính số lần thành công, thất bại và tỉ lệ pass." },
        { t: "code", lang: "js", run: true, code: "const log = [true, true, false, true, false, true];\nconst pass = log.filter(x => x).length;\nconst fail = log.length - pass;\nconst rate = Math.round(pass / log.length * 100);\nconsole.log({ pass, fail, rate: rate + '%' });" },
      ],
    },
  ],
  cards: [
    { id: "c-l04-1", tag: "Mảng", q: "find và filter khác nhau thế nào?", a: "find trả 1 phần tử đầu tiên (hoặc undefined); filter trả mảng mọi phần tử thỏa điều kiện." },
    { id: "c-l04-2", tag: "Vòng lặp", q: "Vì sao vòng retry cần giới hạn số lần?", a: "Để không lặp vô tận khi hệ thống lỗi thật; test phải dừng và báo lỗi." },
    { id: "c-l04-3", tag: "Mảng", q: "Lấy danh sách tên từ mảng khách hàng.", a: "Dùng map.", code: "customers.map(c => c.name)" },
  ],
};

export const L05: LessonContent = {
  id: "l05",
  summary: "Object và JSON là dạng dữ liệu bạn gặp mỗi ngày: dữ liệu test, response API, file cấu hình. Học cách đọc an toàn và gộp chúng.",
  starter: `const res = { data: { id: 126, name: 'Võ Ngọc Trâm', address: null } };
const { id, name } = res.data;
console.log(id, name);
console.log(res.data.address?.city ?? 'Chưa có địa chỉ');
console.log(JSON.stringify(res.data, null, 2));`,
  kata: ["k-l05-config", "k-l05-city"],
  sections: [
    {
      id: "obj",
      title: "Object: thuộc tính và cách đọc",
      minutes: 5,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const user = { email: 'linh@sokhach.vn', role: 'admin', 'display name': 'Linh' };\nconsole.log(user.email);\nconsole.log(user['display name']);\nuser.role = 'manager';\nuser.active = true;\nconsole.log(user);" },
        { t: "p", md: "Duyệt object bằng `Object.keys`, `Object.values`, `Object.entries`:" },
        { t: "code", lang: "js", run: true, code: "const headers = { 'content-type': 'application/json', 'x-request-id': 'abc' };\nfor (const [key, value] of Object.entries(headers)) {\n  console.log(key, '=>', value);\n}" },
      ],
    },
    {
      id: "safe",
      title: "Đọc an toàn với ?. và ??",
      minutes: 5,
      blocks: [
        { t: "p", md: "Response API có thể thiếu trường. `a?.b` trả về `undefined` thay vì báo lỗi khi `a` là `null/undefined`. Kết hợp `??` để có giá trị mặc định." },
        { t: "code", lang: "js", run: true, code: "const res = { user: null };\n// console.log(res.user.name); // TypeError: Cannot read properties of null\nconsole.log(res.user?.name);\nconsole.log(res.user?.name ?? 'Khách');" },
      ],
    },
    {
      id: "json",
      title: "JSON.stringify và JSON.parse",
      minutes: 5,
      blocks: [
        { t: "p", md: "JSON là chuỗi chữ mô tả dữ liệu, dùng để gửi qua API hoặc lưu file. `stringify` đổi object thành chuỗi, `parse` làm ngược lại." },
        { t: "code", lang: "js", run: true, code: "const body = { name: 'Trâm', tier: 'VIP' };\nconst text = JSON.stringify(body);\nconsole.log(text, typeof text);\nconst back = JSON.parse(text);\nconsole.log(back.tier);\nconsole.log(JSON.stringify(body, null, 2));" },
        { t: "callout", tone: "warn", title: "Object so sánh theo địa chỉ", md: "`{ a: 1 } === { a: 1 }` là `false`. Muốn so nội dung, dùng `expect(x).toEqual(y)` trong test." },
      ],
    },
    {
      id: "destructure",
      title: "Destructuring và spread",
      minutes: 6,
      blocks: [
        { t: "code", lang: "js", run: true, code: "const res = { status: 201, body: { id: 126, email: 'tram@mail.vn' } };\nconst { status, body: { id } } = res;\nconsole.log(status, id);\n\nconst base = { timeout: 30000, retries: 0, headless: true };\nconst ci = { ...base, retries: 2 };\nconsole.log(ci);\n\nconst list = [1, 2];\nconsole.log([...list, 3]);" },
        { t: "callout", tone: "real", title: "Trong Playwright", md: "Bạn sẽ thấy destructuring ở mọi test: `test('...', async ({ page, request }) => { ... })`. Đó là lấy `page` và `request` ra khỏi object fixture." },
        { t: "quiz", id: "q1", q: "{ ...base, retries: 2 } với base.retries = 0 cho ra retries bằng bao nhiêu?", options: ["0", "2", "Báo lỗi trùng khóa"], answer: 1, explain: "Thuộc tính viết sau ghi đè thuộc tính trải ra trước đó." },
      ],
    },
  ],
  cards: [
    { id: "c-l05-1", tag: "Object", q: "res.user?.name trả về gì khi res.user là null?", a: "undefined, không báo lỗi." },
    { id: "c-l05-2", tag: "JSON", q: "Đổi object thành chuỗi JSON đẹp, thụt 2 dấu cách?", a: "JSON.stringify với tham số thứ ba.", code: "JSON.stringify(obj, null, 2)" },
    { id: "c-l05-3", tag: "Spread", q: "Tạo config mới từ base nhưng đổi retries = 2?", a: "Spread rồi ghi đè.", code: "const ci = { ...base, retries: 2 };" },
  ],
};
