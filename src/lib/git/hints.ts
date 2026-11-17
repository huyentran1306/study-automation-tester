import { status, type Repo } from "./sim";

/** Gợi ý bước tiếp theo dựa trên trạng thái repo (dùng cho nút "Gợi ý lệnh tiếp theo"). */
export function nextStepHint(r: Repo): string {
  if (!r.inited) return "git init";
  const s = status(r);
  if (r.merging) {
    if (r.conflicts.length) return `mở ${r.conflicts[0]} ở khung "Tệp trong thư mục", giữ dòng đúng, xóa các dấu <<<<<<< ======= >>>>>>>, lưu rồi git add ${r.conflicts[0]}`;
    return 'git commit -m "merge: ..." để kết thúc merge';
  }
  if (s.untracked.length || s.unstaged.length) return `git add ${(s.untracked[0] ?? s.unstaged[0].file)}`;
  if (s.staged.length) return 'git commit -m "test(login): mô tả thay đổi"';
  if (r.head === "main") return "git switch -c test/login-negative (tạo nhánh riêng trước khi sửa)";
  const local = r.branches[r.head];
  const main = r.branches.main;
  if (local === main) return `sửa file, ví dụ: echo "test('sai mật khẩu', async () => {});" >> tests/login.spec.ts`;
  if (r.hasRemote && r.remote[r.head] !== local) return `git push -u origin ${r.head}`;
  if (r.hasRemote && !r.prs.some((p) => p.from === r.head)) return 'gh pr create --title "Mô tả ngắn gọn thay đổi"';
  return "Xong các bước chính. Thử git log --oneline để xem lịch sử.";
}
