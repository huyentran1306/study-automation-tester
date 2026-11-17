-- PlayForge (xưởng luyện Playwright) — database D1 riêng "playforge-db".
-- user_id là id tài khoản chung với study-en (chỉ dùng id, không đọc/ghi database của app khác).

-- Tiến độ: 1 dòng / người dùng. data = JSON toàn bộ trạng thái (bài, thử thách, thẻ ôn, ghi chú...).
-- Máy chủ gộp (merge) khi nhiều thiết bị cùng ghi. Các cột tóm tắt để xếp hạng mà không cần đọc JSON.
CREATE TABLE IF NOT EXISTS pf_progress (
  user_id      TEXT PRIMARY KEY,
  data         TEXT    NOT NULL,
  xp           INTEGER NOT NULL DEFAULT 0,
  lessons_done INTEGER NOT NULL DEFAULT 0,
  kata_passed  INTEGER NOT NULL DEFAULT 0,
  streak       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pf_progress_xp ON pf_progress (xp DESC);

-- Dự án trong Xưởng Code (nhiều file). files = JSON { "đường/dẫn.ts": "nội dung" }.
CREATE TABLE IF NOT EXISTS pf_projects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'sandbox', -- sandbox | kata | final
  files      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pf_projects_user ON pf_projects (user_id, updated_at DESC);

-- Mỗi lần bấm Chạy / Nộp bài (để vẽ thống kê và chấm cột mốc).
CREATE TABLE IF NOT EXISTS pf_runs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  kata_id     TEXT,
  tier        TEXT NOT NULL DEFAULT 'fast', -- fast | real | local
  passed      INTEGER NOT NULL DEFAULT 0,
  failed      INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pf_runs_user ON pf_runs (user_id, created_at DESC);

-- Nhóm học + thành viên (bảng xếp hạng theo tuần).
CREATE TABLE IF NOT EXISTS pf_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS pf_group_members (
  group_id  TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_pf_group_members_user ON pf_group_members (user_id);

-- Dữ liệu riêng từng người cho API luyện tập /lab-api/v1.
CREATE TABLE IF NOT EXISTS lab_customers (
  user_id    TEXT NOT NULL,
  id         INTEGER NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  tier       TEXT NOT NULL DEFAULT 'Thường',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, id)
);

-- Đếm lượt hỏi Mentor AI theo ngày (who = uid hoặc "ip:<địa chỉ>" với khách).
CREATE TABLE IF NOT EXISTS pf_ai_usage (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, who)
);
