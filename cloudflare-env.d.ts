// Kiểu cho binding Cloudflare (chạy `npm run cf-typegen` để sinh bản đầy đủ).
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: Ai;
}
