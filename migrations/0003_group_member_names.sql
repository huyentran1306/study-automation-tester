-- Tên hiển thị của thành viên nhóm (lấy lúc tham gia), để bảng xếp hạng không phải gọi máy chủ tài khoản.
ALTER TABLE pf_group_members ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
