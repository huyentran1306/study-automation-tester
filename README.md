# PlayForge · Xưởng luyện Automation

Web học Playwright với JavaScript/TypeScript theo lộ trình 16 tuần / 48 buổi (lịch lớp T2–T4–T6, khai giảng 23/11/2026).
Đủ 41 bài trong 7 chương, 44 thử thách chấm tự động, IDE chạy test Playwright ngay trên trình duyệt, Locator Lab, API Lab, ôn tập lặp lại ngắt quãng, dự án cuối khóa và nhóm học.

Bản thiết kế UI (canvas): https://claude.ai/artifact/6wyhwSM1pfkfGDrt7qpVq7

## Stack

- Next.js 15 chạy trên Cloudflare Workers qua OpenNext (giống web học tiếng Anh `study-en`)
- **D1 riêng `playforge-db`**, không dùng chung database với app nào khác
- Tài khoản dùng chung với study-en qua API tài khoản (`ACCOUNT_API`): chỉ đọc id người dùng, không đụng database của study-en
- Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) cho Mentor AI, giới hạn 40 lượt/ngày (khách: 10)
- Monaco Editor + sucrase: TypeScript dịch ngay trên trình duyệt, chạy trong Web Worker riêng có giới hạn thời gian

## Chạy ở máy

```bash
npm install
npm run db:migrate:local   # tạo bảng trong D1 local (.wrangler/)
npm run dev                # http://localhost:3100
```

- `next dev` dùng môi trường `local` trong `wrangler.jsonc`: chỉ có D1 local, **không cần đăng nhập Cloudflare**. Vì vậy Mentor AI ở máy local sẽ báo "chưa bật"; bản deploy có AI.
- API tiến độ chấp nhận uid bắt đầu bằng `local-test-` ở chế độ dev để thử mà không cần tài khoản thật.
- Không chạy `next build` khi `next dev` đang chạy (dùng chung thư mục `.next`). Nếu lỡ, dừng dev, xóa `.next` rồi chạy lại.

## Deploy

```bash
npx wrangler login
npm run db:migrate:remote  # áp migration 0001–0003 lên playforge-db (0001 đã áp ngày 17/11/2026)
npm run deploy
```

Sau khi có domain, kiểm tra đăng nhập Google: worker tài khoản nhận `state=<origin>/auth-callback`.

## Kiến trúc chạy test Playwright trên trình duyệt (pw-lite)

```
Web Worker (code học viên)          Luồng chính                       iframe /practice/* (app Sổ Khách)
  test(), expect(), page, Locator  ── RPC ──>  PwHost (src/lib/pw)  ──>  thao tác DOM thật, fetch → /lab-api
  fixture, hook, step, extend                  auto-wait, strict mode,
  request fixture → /lab-api                   web-first assertion, route/mock, trace
```

- **App luyện tập Sổ Khách** (`/practice/*`): đăng nhập, bảng khách hàng (CRUD qua API thật), trang Thành phần (iframe, Shadow DOM, hộp thoại, upload/download, kéo thả, giỏ hàng bất đồng bộ).
- **API luyện tập** `/lab-api/v1/*`: Bearer/Basic/API key, 401/403/404/409, phân trang, upload, giả lập sự cố (`x-chaos: slow|error|flaky`). Dữ liệu riêng theo từng người (`x-lab-user`) trong bảng `lab_customers`.
- **Công tắc bug** (`localStorage pf-bug`): máy chấm bật từng bug trong Sổ Khách. Test của học viên phải đỏ, tức là bắt được bug (mutation testing).
- Mỗi test có trình duyệt sạch; dữ liệu máy chủ chỉ reset ở đầu mỗi lượt chạy (giống thực tế, để dạy được lỗi test phụ thuộc nhau).

## Cấu trúc

| Thư mục | Nội dung |
| --- | --- |
| `src/lib/curriculum.ts` | 7 chương, 41 bài, cột mốc, lịch buổi học |
| `src/content/` | Nội dung 41 bài (`ch1a`…`ch7`) và 44 thử thách (`kata-ch*`) có test ẩn, bug, luật |
| `src/lib/runner/` | Worker chạy JS/TS (`worker-src`) và Playwright (`worker-pw`), cầu nối `run.ts` |
| `src/lib/pw/` | `dom.ts` (role, tên truy cập, text, label…), `host.ts` (thao tác, chờ, expect, route), `locator-lab.ts` |
| `src/lib/git/` | Git mô phỏng + kịch bản + gợi ý |
| `src/lib/practice/` | Dữ liệu mẫu, client API, công tắc bug của Sổ Khách |
| `src/lib/progress/` | Tiến độ: gộp nhiều thiết bị, XP/cấp/chuỗi ngày, 6 hộp ghi nhớ |
| `src/app/api/pf/` | `progress`, `ai` (Mentor AI), `groups` (nhóm học) |
| `src/app/lab-api/v1/` | API luyện tập |
| `migrations/` | 0001 bảng chính, 0002 cột cho lab_customers, 0003 tên thành viên nhóm |
| `scripts/verify/` | Kiểm chứng nội dung (xem dưới) |

## Thêm bài học, thử thách

1. Viết `LessonContent` (xem `src/content/ch2.ts`), đăng ký trong `src/content/index.ts`. Bài Playwright đặt `pw: true`, code "Chạy thử" là file spec đầy đủ.
2. Thử thách Playwright: `runner: "pw"`, `mutants` (bug phải bắt được), `require`/`forbid`, `repeat` (chống flaky), `isolate` (test độc lập). Gợi ý bậc 3 là lời giải tham chiếu.
3. Kiểm chứng (dev server đang chạy ở cổng 3100):

```bash
node scripts/verify/js-kata.cjs "$PWD"                      # thử thách JS/Git: lời giải qua, code mẫu trượt
node scripts/verify/js-blocks.cjs "$PWD"                    # mọi đoạn code chạy thử chương 1 không lỗi
npm i -D playwright                                         # 3 script dưới cần Playwright để điều khiển trình duyệt
node scripts/verify/pw-lessons.cjs 11-41                    # code mẫu mọi bài Playwright chạy xanh
node scripts/verify/pw-kata.cjs "$PWD" all kata-ch2.ts,…    # lời giải tham chiếu được chấm đạt
node scripts/verify/pw-kata-negative.cjs "$PWD" all kata-ch2.ts,…   # code mẫu bị chấm trượt
```

Trạng thái lần kiểm gần nhất: 21/21 thử thách JS/Git, 23/23 thử thách Playwright (cả 2 chiều), 37/38 bài Playwright xanh (bài 38 cố ý hỏng để học viên sửa), build production qua.

## Lộ trình làm

| Đợt | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Trang chủ, lộ trình, bài học, chạy JS/TS, Git Sandbox, thử thách, ôn tập, hồ sơ, đồng bộ D1, Mentor AI | Xong |
| 2 | Xưởng Code chế độ Playwright (pw-lite), app Sổ Khách, Locator Lab, Trace, chương 2 | Xong |
| 3 | Săn flaky, API Lab + `/lab-api/v1`, request fixture, page.route, chương 3 + 6 | Xong |
| 4 | Chương 4, 5, 7, dự án cuối khóa, tạo YAML CI, nhóm học + bảng xếp hạng | Xong |
| Sau | Chạy Chromium thật trên Cloudflare (tầng 2), CLI tải bài về VS Code (tầng 3) | Chưa làm |
