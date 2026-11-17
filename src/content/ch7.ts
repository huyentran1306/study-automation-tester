import type { LessonContent } from "./types";

// Chương 7 · Debug, Report, CI/CD & Framework (bài 38–41).

const BROKEN = `import { test, expect } from '@playwright/test';

// Test này có 2 lỗi. Bấm Chạy test, mở tab Trace, đọc bước đỏ và thông báo lỗi để sửa.
test('lọc khách VIP', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
  await page.getByLabel('Mật khẩu').fill('Matkhau@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await page.getByLabel('Hạng khách').selectOption('VIP');
  await expect(page.getByTestId('customer-count')).toHaveText('6 khách hàng');
});
`;

export const L38: LessonContent = {
  id: "l38",
  pw: true,
  summary: "Test đỏ là chuyện thường; quan trọng là tìm ra vì sao trong vài phút. Dùng UI Mode, Trace Viewer, ảnh chụp, video, chế độ --debug với Inspector, page.pause(), và nhờ AI đọc lỗi cùng bạn.",
  starter: BROKEN,
  kata: ["k-l38-debug"],
  sections: [
    {
      id: "tools",
      title: "Bộ đồ nghề debug",
      minutes: 6,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npx playwright test --ui                      # UI Mode: chạy, xem từng bước, chọn locator\nnpx playwright test --debug                   # mở Inspector, chạy từng dòng\nnpx playwright test --trace on                # ghi trace cho mọi test\nnpx playwright show-trace test-results/…/trace.zip" },
        { t: "list", items: ["**UI Mode**: danh sách test, chạy lại khi lưu file, xem DOM tại từng bước", "**Trace Viewer**: dòng thời gian thao tác, ảnh trước/sau, network, console", "**Inspector** (`--debug` hoặc `await page.pause()`): dừng giữa test, thử locator trực tiếp", "**Ảnh, video**: bật trong config (bài 29)"] },
      ],
    },
    {
      id: "read",
      title: "Đọc lỗi như thám tử",
      minutes: 7,
      blocks: [
        { t: "code", lang: "ts", run: true, code: BROKEN },
        { t: "list", ordered: true, items: ["Đọc dòng đầu thông báo lỗi: Timeout? strict mode? assertion sai giá trị?", "Xem **Call log** hoặc Trace: bước cuối cùng xanh là gì, bước đỏ đang chờ gì", "So *Mong đợi* với *Nhận được*: lệch một chữ, một dấu cách là đủ đỏ", "Sửa một chỗ, chạy lại, không sửa nhiều chỗ cùng lúc"] },
        { t: "callout", tone: "tip", title: "Nhờ AI đúng cách", md: "Dán cho AI: đoạn test, toàn bộ thông báo lỗi, và HTML/ảnh của trang lúc lỗi. Hỏi *\"giải thích nguyên nhân\"* trước khi hỏi *\"sửa giúp\"*." },
        { t: "quiz", id: "q1", q: "Lỗi: \"locator.selectOption: Timeout 5000ms exceeded. waiting for getByLabel('Hạng khách')\". Nguyên nhân dễ nhất là gì?", options: ["Mạng chậm, tăng timeout", "Không có phần tử nào có nhãn 'Hạng khách'", "Playwright bị lỗi"], answer: 1, explain: "Call log cho thấy đang chờ tìm phần tử; nhãn thật trên trang là 'Hạng'." },
      ],
    },
  ],
  cards: [
    { id: "c-l38-1", tag: "Debug", q: "Mở UI Mode của Playwright?", a: "npx playwright test --ui" },
    { id: "c-l38-2", tag: "Debug", q: "Dừng test giữa chừng để thử locator?", a: "await page.pause() (hoặc chạy với --debug)." },
    { id: "c-l38-3", tag: "Debug", q: "Thứ tự đọc một lỗi test?", a: "Dòng đầu lỗi → Call log/Trace bước đỏ → so Mong đợi với Nhận được → sửa một chỗ, chạy lại." },
  ],
};

const ATTACH = `import { test, expect } from '@playwright/test';

test('đính kèm thông tin vào report', async ({ page }, testInfo) => {
  test.info().annotations.push({ type: 'issue', description: 'SK-142' });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await testInfo.attach('ghi-chu.txt', { body: 'Kiểm tra trang đăng nhập trên staging', contentType: 'text/plain' });
});
`;

export const L39: LessonContent = {
  id: "l39",
  pw: true,
  summary: "Report là thứ quản lý và dev đọc. HTML report có sẵn của Playwright, Allure Report đẹp và có lịch sử, cùng cách đính kèm ảnh, video, trace, ghi chú và mã ticket vào từng test.",
  starter: ATTACH,
  kata: [],
  sections: [
    {
      id: "html",
      title: "Reporter có sẵn",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", title: "playwright.config.ts", code: "reporter: [\n  ['list'],                                   // in ra terminal\n  ['html', { open: 'never' }],                // playwright-report/\n  ['junit', { outputFile: 'results.xml' }],   // cho Jenkins, Azure DevOps\n]," },
      ],
    },
    {
      id: "allure",
      title: "Allure Report",
      minutes: 6,
      blocks: [
        { t: "code", lang: "bash", title: "terminal", code: "npm i -D allure-playwright allure-commandline\nnpx playwright test --reporter=allure-playwright\nnpx allure generate allure-results --clean -o allure-report\nnpx allure open allure-report" },
        { t: "list", items: ["Nhóm test theo tính năng, mức độ nghiêm trọng, người phụ trách", "Lịch sử: test nào hay flaky, chạy chậm dần", "Mỗi bước `test.step` hiện thành một bước trong report"] },
      ],
    },
    {
      id: "attach",
      title: "Đính kèm vào report",
      minutes: 4,
      blocks: [
        { t: "code", lang: "ts", run: true, code: ATTACH },
        { t: "quiz", id: "q1", q: "Muốn report có ảnh chụp mỗi khi test đỏ mà không viết thêm code?", options: ["Chụp ảnh thủ công trong mọi test", "screenshot: 'only-on-failure' trong use của config", "Không làm được"], answer: 1, explain: "Playwright tự chụp và đính kèm vào report khi bật trong config." },
      ],
    },
  ],
  cards: [
    { id: "c-l39-1", tag: "Report", q: "Đính kèm tệp/ghi chú vào report của một test?", a: "testInfo.attach(name, { body, contentType })." },
    { id: "c-l39-2", tag: "Report", q: "Lệnh tạo và mở Allure report?", a: "npx allure generate allure-results --clean -o allure-report rồi npx allure open allure-report." },
  ],
};

const WORKFLOW = `name: e2e
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 19 * * *'   # 2:00 sáng giờ Việt Nam
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps \${{ matrix.project }}
      - run: npx playwright test --project=\${{ matrix.project }}
        env:
          BASE_URL: \${{ vars.STAGING_URL }}
          ADMIN_PASSWORD: \${{ secrets.ADMIN_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: \${{ !cancelled() }}
        with:
          name: report-\${{ matrix.project }}
          path: playwright-report/
          retention-days: 14`;

export const L40: LessonContent = {
  id: "l40",
  summary: "Test chỉ có giá trị khi chạy thường xuyên. GitHub Actions chạy bộ test mỗi khi push, mở Pull Request, và theo lịch hằng đêm; lưu report, trace; giữ mật khẩu trong Secrets.",
  starter: "// Thử thách của bài: viết workflow GitHub Actions. Mở bên trái đọc mẫu rồi bấm Làm thử thách.\nconsole.log('Xem .github/workflows/e2e.yml ở phần bài học');",
  kata: ["k-l40-ci"],
  sections: [
    {
      id: "why",
      title: "Vì sao cần CI",
      minutes: 3,
      blocks: [
        { t: "list", items: ["Mỗi Pull Request được kiểm tra tự động trước khi merge", "Chạy đêm trên staging để phát hiện lỗi sớm", "Ai cũng xem được report, không còn \"máy em chạy được mà\""] },
      ],
    },
    {
      id: "workflow",
      title: "Workflow Playwright",
      minutes: 9,
      blocks: [
        { t: "code", lang: "text", title: ".github/workflows/e2e.yml", code: WORKFLOW },
        { t: "list", items: ["`on`: khi nào chạy (push, pull_request, schedule)", "`matrix`: chạy song song 3 trình duyệt", "`npx playwright install --with-deps`: cài trình duyệt + thư viện hệ thống trên máy CI", "`if: !cancelled()`: vẫn lưu report khi test đỏ (lúc cần nhất!)", "`secrets.ADMIN_PASSWORD`: khai báo ở Settings → Secrets and variables → Actions"] },
        { t: "callout", tone: "warn", title: "cron dùng giờ UTC", md: "`0 19 * * *` là 19:00 UTC = 2:00 sáng giờ Việt Nam (UTC+7)." },
        { t: "quiz", id: "q1", q: "Test đỏ trên CI nhưng không có report để xem. Thiếu gì?", options: ["Thiếu matrix", "Bước upload-artifact thiếu if: !cancelled() (hoặc always()) nên bị bỏ qua khi bước test đỏ", "Thiếu npm ci"], answer: 1, explain: "Mặc định các bước sau bị bỏ qua khi một bước trước thất bại." },
      ],
    },
  ],
  cards: [
    { id: "c-l40-1", tag: "CI", q: "Vì sao bước upload report cần if: !cancelled()?", a: "Để vẫn chạy khi bước test thất bại; mặc định bước sau bị bỏ qua." },
    { id: "c-l40-2", tag: "CI", q: "Lệnh cài trình duyệt Playwright trên máy CI?", a: "npx playwright install --with-deps" },
    { id: "c-l40-3", tag: "CI", q: "cron '0 19 * * *' chạy lúc mấy giờ ở Việt Nam?", a: "2:00 sáng (cron GitHub dùng UTC, Việt Nam là UTC+7)." },
  ],
};

export const L41: LessonContent = {
  id: "l41",
  summary: "Ghép mọi thứ của khóa học thành một framework kiểm thử hoàn chỉnh: kiến trúc thư mục, POM + fixture, cấu hình nhiều môi trường, dữ liệu ngoài, test API + UI, report và CI. Dùng AI như một đồng đội để dựng nhanh, rồi tự review.",
  starter: "// Bài tổng kết. Làm theo checklist ở trang Dự án cuối khóa.\nconsole.log('Mở Dự án cuối khóa để xem 7 mốc và tiêu chí chấm');",
  kata: [],
  sections: [
    {
      id: "arch",
      title: "Kiến trúc framework",
      minutes: 7,
      blocks: [
        { t: "code", lang: "text", title: "so-khach-tests/", code: "playwright.config.ts      ← projects: setup, chromium, firefox, webkit, api\n.env.example              ← BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD…\nfixtures/\n  index.ts                ← mergeTests(authTest, pagesTest, apiTest)\npages/                    ← Page Object + components/\napi/                      ← client.ts, customers.service.ts\ntest-data/                ← customers.csv, users.json, factory.ts (Faker)\ntests/\n  auth.setup.ts           ← lưu storageState từng vai trò\n  ui/                     ← test giao diện\n  api/                    ← test API\nutils/\n.github/workflows/e2e.yml\nREADME.md                 ← cách chạy trong 5 phút" },
      ],
    },
    {
      id: "ai",
      title: "Dựng nhanh cùng AI",
      minutes: 6,
      blocks: [
        { t: "list", ordered: true, items: ["Mô tả kiến trúc trên cho AI, yêu cầu sinh khung thư mục và config", "Từng module: đưa HTML/ảnh trang, yêu cầu Page Object theo quy ước của bạn", "Tự viết test nghiệp vụ quan trọng; nhờ AI gợi ý thêm case biên", "Review theo checklist bài 22, chạy 3 lần liên tiếp để chắc không flaky", "Đẩy lên GitHub, bật workflow, đính kèm link report vào README"] },
        { t: "callout", tone: "real", title: "Dùng làm portfolio", md: "Nhà tuyển dụng automation thường hỏi \"có repo nào cho xem không?\". Một repo gọn, README rõ, CI xanh là điểm cộng lớn." },
        { t: "quiz", id: "q1", q: "AI sinh xong 40 test và tất cả xanh. Việc tiếp theo?", options: ["Merge ngay", "Review: mỗi test có kiểm tra đúng điều quan trọng không, có test nào luôn xanh dù app hỏng không", "Xóa bớt cho nhanh"], answer: 1, explain: "Test luôn xanh là test vô dụng. Thử làm hỏng app (như máy chấm của PlayForge) để xem test có đỏ không." },
      ],
    },
  ],
  cards: [
    { id: "c-l41-1", tag: "Framework", q: "Kể các thư mục chính của một framework Playwright hoàn chỉnh.", a: "fixtures, pages, api, test-data, tests (ui/api + setup), utils, .github/workflows, cùng playwright.config.ts và .env.example." },
  ],
};
