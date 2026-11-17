-- Thêm cột cho dữ liệu khách hàng của API luyện tập (đồng bộ với giao diện Sổ Khách).
ALTER TABLE lab_customers ADD COLUMN city TEXT NOT NULL DEFAULT '';
ALTER TABLE lab_customers ADD COLUMN newsletter INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_lab_customers_email ON lab_customers (user_id, email);
