import { emptyRepo, makeCommit, type Repo } from "./sim";

const LOGIN_V1 = `import { test, expect } from '@playwright/test';

test('đăng nhập đúng', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('linh@sokhach.vn');
});`;

const README = `# so-khach-tests
Bộ test tự động cho app Sổ Khách.`;

const CONFIG_V1 = `export default { timeout: 30000 };`;

export interface Scenario {
  id: string;
  title: string;
  intro: string;
  build: () => Repo;
}

export const SCENARIOS: Record<string, Scenario> = {
  blank: {
    id: "blank",
    title: "Thư mục trống",
    intro: "Thư mục so-khach-tests chưa có Git. Bắt đầu bằng git init.",
    build: () => {
      const r = emptyRepo();
      r.work = { "README.md": README };
      return r;
    },
  },
  cloned: {
    id: "cloned",
    title: "Repo đã clone từ GitHub",
    intro: "Bạn vừa clone repo của team về máy. Nhánh main đã có 2 commit và nối với origin trên GitHub.",
    build: () => {
      const r = emptyRepo();
      r.inited = true;
      r.hasRemote = true;
      r.branches = { main: null };
      makeCommit(r, "chore: khởi tạo dự án", { "README.md": README, "playwright.config.ts": CONFIG_V1 });
      makeCommit(r, "test(login): test đăng nhập đầu tiên", { "README.md": README, "playwright.config.ts": CONFIG_V1, "tests/login.spec.ts": LOGIN_V1 });
      r.remote = { main: r.branches.main };
      r.upstream = { main: true };
      return r;
    },
  },
  conflict: {
    id: "conflict",
    title: "Hai người cùng sửa một dòng",
    intro: "Bạn đang ở nhánh test/slow-network và đã đổi timeout thành 60000. Trong lúc đó đồng đổi timeout trên main thành 45000. Gộp main vào nhánh của bạn và xử lý conflict.",
    build: () => {
      const r = emptyRepo();
      r.inited = true;
      r.hasRemote = true;
      r.branches = { main: null };
      makeCommit(r, "chore: khởi tạo dự án", { "README.md": README, "playwright.config.ts": CONFIG_V1 });
      const base = r.branches.main;
      makeCommit(r, "chore(config): tăng timeout cho CI", { "README.md": README, "playwright.config.ts": `export default { timeout: 45000 };` });
      r.remote = { main: r.branches.main };
      r.upstream = { main: true };
      r.branches["test/slow-network"] = base;
      r.head = "test/slow-network";
      makeCommit(r, "test: mạng chậm cần timeout dài", { "README.md": README, "playwright.config.ts": `export default { timeout: 60000 };` });
      return r;
    },
  },
};

export function buildScenario(id: string | undefined): Repo {
  return (SCENARIOS[id ?? "blank"] ?? SCENARIOS.blank).build();
}
