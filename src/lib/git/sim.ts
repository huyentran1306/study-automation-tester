// Git mô phỏng chạy hoàn toàn trong trình duyệt, đủ cho bài 7: init, status, add, commit, log, branch,
// switch/checkout, merge (fast-forward, 3-way, conflict), push/pull với "origin", diff, restore, cộng lệnh shell cơ bản.

export type Tree = Record<string, string>;

export interface Commit {
  id: string;
  msg: string;
  parent: string | null;
  parent2?: string | null;
  tree: Tree;
  at: number;
}

export interface Repo {
  inited: boolean;
  commits: Record<string, Commit>;
  branches: Record<string, string | null>;
  head: string; // tên nhánh hiện tại
  work: Tree;
  index: Tree;
  hasRemote: boolean;
  remote: Record<string, string | null>;
  upstream: Record<string, boolean>;
  merging: { theirs: string; branch: string } | null;
  conflicts: string[];
  seq: number;
  /** Lịch sử lệnh đã chạy, để chấm bài. */
  history: string[];
  /** Pull Request đã mở (mô phỏng GitHub). */
  prs: { from: string; to: string; title: string }[];
}

export function emptyRepo(): Repo {
  return {
    inited: false,
    commits: {},
    branches: {},
    head: "main",
    work: {},
    index: {},
    hasRemote: false,
    remote: {},
    upstream: {},
    merging: null,
    conflicts: [],
    seq: 0,
    history: [],
    prs: [],
  };
}

export function cloneRepo(r: Repo): Repo {
  return JSON.parse(JSON.stringify(r));
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export function headCommit(r: Repo): Commit | null {
  const id = r.branches[r.head];
  return id ? r.commits[id] : null;
}

export function headTree(r: Repo): Tree {
  return headCommit(r)?.tree ?? {};
}

function sameTree(a: Tree, b: Tree) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => b[k] === a[k]);
}

/** Tạo commit trực tiếp (dùng khi dựng kịch bản). */
export function makeCommit(r: Repo, msg: string, tree: Tree, parent2: string | null = null): string {
  r.seq += 1;
  const parent = r.branches[r.head] ?? null;
  const id = hash(`${r.seq}|${msg}|${parent}|${JSON.stringify(tree)}`);
  r.commits[id] = { id, msg, parent, parent2, tree: { ...tree }, at: r.seq };
  r.branches[r.head] = id;
  r.work = { ...tree };
  r.index = { ...tree };
  return id;
}

function ancestors(r: Repo, id: string | null): Set<string> {
  const out = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const c = stack.pop()!;
    if (out.has(c)) continue;
    out.add(c);
    const cm = r.commits[c];
    if (cm?.parent) stack.push(cm.parent);
    if (cm?.parent2) stack.push(cm.parent2);
  }
  return out;
}

function mergeBase(r: Repo, a: string, b: string): string | null {
  const anc = ancestors(r, a);
  // BFS từ b, commit đầu tiên nằm trong tổ tiên của a
  const queue = [b];
  const seen = new Set<string>();
  while (queue.length) {
    const c = queue.shift()!;
    if (seen.has(c)) continue;
    seen.add(c);
    if (anc.has(c)) return c;
    const cm = r.commits[c];
    if (cm?.parent) queue.push(cm.parent);
    if (cm?.parent2) queue.push(cm.parent2);
  }
  return null;
}

export interface StatusInfo {
  staged: { file: string; kind: "new" | "modified" | "deleted" }[];
  unstaged: { file: string; kind: "modified" | "deleted" }[];
  untracked: string[];
}

export function status(r: Repo): StatusInfo {
  const head = headTree(r);
  const staged: StatusInfo["staged"] = [];
  const unstaged: StatusInfo["unstaged"] = [];
  const untracked: string[] = [];
  const files = new Set([...Object.keys(head), ...Object.keys(r.index), ...Object.keys(r.work)]);
  for (const f of [...files].sort()) {
    const h = head[f];
    const i = r.index[f];
    const w = r.work[f];
    if (i !== undefined && h === undefined) staged.push({ file: f, kind: "new" });
    else if (i !== undefined && h !== undefined && i !== h) staged.push({ file: f, kind: "modified" });
    else if (i === undefined && h !== undefined) staged.push({ file: f, kind: "deleted" });
    if (i === undefined && w !== undefined && h === undefined) untracked.push(f);
    else if (i !== undefined && w === undefined) unstaged.push({ file: f, kind: "deleted" });
    else if (i !== undefined && w !== undefined && w !== i) unstaged.push({ file: f, kind: "modified" });
  }
  return { staged, unstaged, untracked };
}

export function isClean(r: Repo) {
  const s = status(r);
  return !s.staged.length && !s.unstaged.length && !s.untracked.length;
}

/** Tách chuỗi lệnh thành các đối số, giữ nguyên phần trong dấu nháy. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q: string | null = null;
  let has = false;
  for (const ch of line) {
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      q = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (cur || has) out.push(cur);
      cur = "";
      has = false;
    } else cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

export interface RunResult {
  repo: Repo;
  out: string;
  ok: boolean;
  clear?: boolean;
}

const HELP = `Lệnh hỗ trợ trong Git Sandbox:
  git init | status | add <tệp|.> | commit -m "..." | log [--oneline]
  git branch [tên] [-d tên] | switch [-c] <nhánh> | checkout [-b] <nhánh>
  git merge <nhánh> | push [-u origin <nhánh>] | pull | diff | restore <tệp>
  git remote -v
  gh pr create --title "..." [--base main]   (mở Pull Request)
  ls | cat <tệp> | echo "nội dung" > <tệp> | echo "dòng" >> <tệp> | touch <tệp> | rm <tệp> | clear`;

export function run(prev: Repo, line: string): RunResult {
  const r = cloneRepo(prev);
  const trimmed = line.trim();
  if (!trimmed) return { repo: prev, out: "", ok: true };
  r.history.push(trimmed);
  const ok = (out: string): RunResult => ({ repo: r, out, ok: true });
  const fail = (out: string): RunResult => ({ repo: r, out, ok: false });

  // echo "..." > file  /  >> file
  const redir = trimmed.match(/^echo\s+(.*?)\s*(>>?)\s*(\S+)$/);
  if (redir) {
    const text = tokenize(redir[1]).join(" ");
    const file = redir[3];
    r.work[file] = redir[2] === ">>" && r.work[file] !== undefined ? r.work[file] + "\n" + text : text;
    return ok("");
  }

  const args = tokenize(trimmed);
  const cmd = args[0];
  switch (cmd) {
    case "help":
      return ok(HELP);
    case "clear":
      return { repo: r, out: "", ok: true, clear: true };
    case "ls":
      return ok(Object.keys(r.work).sort().join("  ") || "(thư mục trống)");
    case "cat": {
      const f = args[1];
      if (!f) return fail("cat: thiếu tên tệp");
      if (r.work[f] === undefined) return fail(`cat: ${f}: No such file or directory`);
      return ok(r.work[f]);
    }
    case "touch": {
      const f = args[1];
      if (!f) return fail("touch: thiếu tên tệp");
      if (r.work[f] === undefined) r.work[f] = "";
      return ok("");
    }
    case "rm": {
      const f = args[1];
      if (!f || r.work[f] === undefined) return fail(`rm: ${f ?? ""}: No such file`);
      delete r.work[f];
      return ok("");
    }
    case "echo":
      return ok(args.slice(1).join(" "));
    case "gh":
      return gh(r, args.slice(1));
    case "git":
      return git(r, args.slice(1));
    default:
      return fail(`${cmd}: lệnh không có trong sandbox. Gõ help để xem danh sách.`);
  }
}

function needRepo(r: Repo): RunResult | null {
  if (!r.inited) return { repo: r, out: "fatal: not a git repository (or any of the parent directories): .git", ok: false };
  return null;
}

function gh(r: Repo, a: string[]): RunResult {
  if (a[0] !== "pr" || a[1] !== "create") return { repo: r, out: "gh: sandbox chỉ hỗ trợ `gh pr create`", ok: false };
  if (!r.hasRemote) return { repo: r, out: "no git remotes found", ok: false };
  const ti = a.indexOf("--title");
  const bi = a.indexOf("--base");
  const title = ti >= 0 ? a[ti + 1] ?? "" : `Cập nhật từ ${r.head}`;
  const base = bi >= 0 ? a[bi + 1] ?? "main" : "main";
  if (r.head === base) return { repo: r, out: `pull request create failed: head branch "${r.head}" is the same as base branch`, ok: false };
  if (!r.remote[r.head]) return { repo: r, out: `aborted: you must first push the current branch to a remote, or use the --head flag`, ok: false };
  r.prs.push({ from: r.head, to: base, title });
  return { repo: r, out: `https://github.com/linh/so-khach-tests/pull/${r.prs.length}\n✓ Đã mở Pull Request #${r.prs.length}: ${r.head} → ${base}`, ok: true };
}

function git(r: Repo, a: string[]): RunResult {
  const sub = a[0];
  const ok = (out: string): RunResult => ({ repo: r, out, ok: true });
  const fail = (out: string): RunResult => ({ repo: r, out, ok: false });
  if (!sub) return ok("usage: git <command> [<args>]  (gõ help để xem các lệnh)");

  if (sub === "init") {
    if (r.inited) return ok("Reinitialized existing Git repository in ~/so-khach-tests/.git/");
    r.inited = true;
    r.branches = { main: null };
    r.head = "main";
    return ok("Initialized empty Git repository in ~/so-khach-tests/.git/");
  }
  const nr = needRepo(r);
  if (nr) return nr;

  switch (sub) {
    case "status": {
      const s = status(r);
      const lines = [`On branch ${r.head}`];
      if (r.merging) {
        lines.push(r.conflicts.length ? "You have unmerged paths.\n  (fix conflicts and run \"git commit\")" : "All conflicts fixed but you are still merging.\n  (use \"git commit\" to conclude merge)");
        if (r.conflicts.length) lines.push("\nUnmerged paths:\n" + r.conflicts.map((f) => `\tboth modified:   ${f}`).join("\n"));
      }
      if (s.staged.length) lines.push("\nChanges to be committed:\n" + s.staged.map((x) => `\t${x.kind === "new" ? "new file" : x.kind}:   ${x.file}`).join("\n"));
      if (s.unstaged.length) lines.push("\nChanges not staged for commit:\n" + s.unstaged.map((x) => `\t${x.kind}:   ${x.file}`).join("\n"));
      if (s.untracked.length) lines.push("\nUntracked files:\n  (use \"git add <file>...\" to include in what will be committed)\n" + s.untracked.map((f) => `\t${f}`).join("\n"));
      if (!s.staged.length && !s.unstaged.length && !s.untracked.length && !r.merging) lines.push("nothing to commit, working tree clean");
      return ok(lines.join("\n"));
    }
    case "add": {
      const target = a[1];
      if (!target) return fail("Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?");
      const files = target === "." || target === "-A" ? [...new Set([...Object.keys(r.work), ...Object.keys(r.index)])] : [target];
      for (const f of files) {
        if (r.work[f] === undefined && r.index[f] === undefined) return fail(`fatal: pathspec '${f}' did not match any files`);
        if (r.work[f] === undefined) delete r.index[f];
        else r.index[f] = r.work[f];
        if (r.conflicts.includes(f) && !/^(<<<<<<<|=======|>>>>>>>)/m.test(r.work[f] ?? "")) r.conflicts = r.conflicts.filter((x) => x !== f);
      }
      return ok("");
    }
    case "commit": {
      const mi = a.indexOf("-m");
      const am = a.includes("-am") || a.includes("-a");
      const msgIdx = mi >= 0 ? mi : a.indexOf("-am");
      const msg = msgIdx >= 0 ? a[msgIdx + 1] : undefined;
      if (!msg) return fail("Aborting commit due to empty commit message.\n(sandbox: dùng git commit -m \"nội dung\")");
      if (am) for (const f of Object.keys(r.index)) if (r.work[f] !== undefined) r.index[f] = r.work[f];
      if (r.conflicts.length) return fail(`error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add <file>'\n${r.conflicts.map((f) => "U\t" + f).join("\n")}`);
      if (sameTree(r.index, headTree(r)) && !r.merging) {
        const s = status(r);
        return fail(`On branch ${r.head}\n` + (s.untracked.length || s.unstaged.length ? "no changes added to commit (use \"git add\")" : "nothing to commit, working tree clean"));
      }
      const parent2 = r.merging ? r.merging.theirs : null;
      const work = { ...r.work };
      const id = makeCommit(r, msg, r.index, parent2);
      r.work = work;
      r.merging = null;
      const s = Object.keys(r.index).length;
      return ok(`[${r.head} ${id}] ${msg}\n ${s} file(s) in snapshot`);
    }
    case "log": {
      const one = a.includes("--oneline");
      const out: string[] = [];
      let c = headCommit(r);
      if (!c) return fail(`fatal: your current branch '${r.head}' does not have any commits yet`);
      while (c) {
        const labels = Object.entries(r.branches).filter(([, id]) => id === c!.id).map(([b]) => (b === r.head ? `HEAD -> ${b}` : b));
        const remoteLabels = Object.entries(r.remote).filter(([, id]) => id === c!.id).map(([b]) => `origin/${b}`);
        const all = [...labels, ...remoteLabels];
        const deco = all.length ? ` (${all.join(", ")})` : "";
        out.push(one ? `${c.id}${deco} ${c.msg}` : `commit ${c.id}${deco}\n\n    ${c.msg}\n`);
        c = c.parent ? r.commits[c.parent] : null;
      }
      return ok(out.join("\n"));
    }
    case "branch": {
      if (!a[1]) return ok(Object.keys(r.branches).sort().map((b) => (b === r.head ? `* ${b}` : `  ${b}`)).join("\n"));
      if (a[1] === "-d" || a[1] === "-D") {
        const b = a[2];
        if (!b || !(b in r.branches)) return fail(`error: branch '${b ?? ""}' not found.`);
        if (b === r.head) return fail(`error: Cannot delete branch '${b}' checked out`);
        delete r.branches[b];
        return ok(`Deleted branch ${b}.`);
      }
      const b = a[1];
      if (b in r.branches) return fail(`fatal: a branch named '${b}' already exists`);
      if (!r.branches[r.head]) return fail(`fatal: not a valid object name: '${r.head}'`);
      r.branches[b] = r.branches[r.head];
      return ok("");
    }
    case "switch":
    case "checkout": {
      const create = (sub === "switch" && a[1] === "-c") || (sub === "checkout" && a[1] === "-b");
      const b = create ? a[2] : a[1];
      if (!b) return fail(`fatal: missing branch name`);
      if (create) {
        if (b in r.branches) return fail(`fatal: a branch named '${b}' already exists`);
        r.branches[b] = r.branches[r.head];
        r.head = b;
        return ok(`Switched to a new branch '${b}'`);
      }
      if (!(b in r.branches)) {
        if (r.remote[b] !== undefined) {
          r.branches[b] = r.remote[b];
          r.upstream[b] = true;
          r.head = b;
          r.work = { ...headTree(r) };
          r.index = { ...headTree(r) };
          return ok(`branch '${b}' set up to track 'origin/${b}'.\nSwitched to a new branch '${b}'`);
        }
        return fail(`fatal: invalid reference: ${b}`);
      }
      if (b === r.head) return ok(`Already on '${b}'`);
      const s = status(r);
      if (s.staged.length || s.unstaged.length) return fail(`error: Your local changes to the following files would be overwritten by checkout:\n${[...s.staged, ...s.unstaged].map((x) => "\t" + x.file).join("\n")}\nPlease commit your changes or stash them before you switch branches.`);
      const untracked = Object.fromEntries(s.untracked.map((f) => [f, r.work[f]]));
      r.head = b;
      r.work = { ...headTree(r), ...untracked };
      r.index = { ...headTree(r) };
      return ok(`Switched to branch '${b}'`);
    }
    case "merge": {
      const b = a[1];
      if (b === "--abort") {
        if (!r.merging) return fail("fatal: There is no merge to abort (MERGE_HEAD missing).");
        r.merging = null;
        r.conflicts = [];
        r.work = { ...headTree(r) };
        r.index = { ...headTree(r) };
        return ok("");
      }
      if (!b) return fail("fatal: No remote for the current branch.");
      const theirsId = b.startsWith("origin/") ? r.remote[b.slice(7)] : r.branches[b];
      if (theirsId === undefined) return fail(`merge: ${b} - not something we can merge`);
      if (!theirsId) return fail(`merge: ${b} - not something we can merge`);
      const oursId = r.branches[r.head];
      if (!isClean(r) && status(r).staged.length + status(r).unstaged.length > 0) return fail("error: Your local changes would be overwritten by merge.\nPlease commit your changes before you merge.");
      if (!oursId) {
        r.branches[r.head] = theirsId;
        r.work = { ...r.commits[theirsId].tree };
        r.index = { ...r.work };
        return ok(`Fast-forward`);
      }
      if (ancestors(r, oursId).has(theirsId)) return ok("Already up to date.");
      if (ancestors(r, theirsId).has(oursId)) {
        r.branches[r.head] = theirsId;
        r.work = { ...r.commits[theirsId].tree };
        r.index = { ...r.work };
        return ok(`Updating ${oursId}..${theirsId}\nFast-forward`);
      }
      const baseId = mergeBase(r, oursId, theirsId);
      const base = baseId ? r.commits[baseId].tree : {};
      const ours = r.commits[oursId].tree;
      const theirs = r.commits[theirsId].tree;
      const result: Tree = {};
      const conflicts: string[] = [];
      for (const f of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
        const o = ours[f], t = theirs[f], s = base[f];
        if (o === t) { if (o !== undefined) result[f] = o; }
        else if (o === s) { if (t !== undefined) result[f] = t; }
        else if (t === s) { if (o !== undefined) result[f] = o; }
        else {
          conflicts.push(f);
          result[f] = `<<<<<<< HEAD\n${o ?? ""}\n=======\n${t ?? ""}\n>>>>>>> ${b}`;
        }
      }
      if (!conflicts.length) {
        const id = makeCommit(r, `Merge branch '${b}' into ${r.head}`, result, theirsId);
        return ok(`Merge made by the 'ort' strategy.\n[${r.head} ${id}]`);
      }
      r.work = { ...result };
      r.index = Object.fromEntries(Object.entries(result).filter(([f]) => !conflicts.includes(f)));
      for (const f of conflicts) if (ours[f] !== undefined) r.index[f] = ours[f];
      r.merging = { theirs: theirsId, branch: b };
      r.conflicts = conflicts;
      return fail(conflicts.map((f) => `Auto-merging ${f}\nCONFLICT (content): Merge conflict in ${f}`).join("\n") + "\nAutomatic merge failed; fix conflicts and then commit the result.");
    }
    case "remote": {
      if (!r.hasRemote) return ok("");
      return ok("origin\thttps://github.com/linh/so-khach-tests.git (fetch)\norigin\thttps://github.com/linh/so-khach-tests.git (push)");
    }
    case "push": {
      if (!r.hasRemote) return fail("fatal: No configured push destination.");
      const u = a.includes("-u") || a.includes("--set-upstream");
      const rest = a.slice(1).filter((x) => !x.startsWith("-"));
      const b = rest[1] ?? r.head;
      if (rest[0] && rest[0] !== "origin") return fail(`fatal: '${rest[0]}' does not appear to be a git repository`);
      if (!(b in r.branches)) return fail(`error: src refspec ${b} does not match any`);
      if (!r.upstream[b] && !u && !rest.length) return fail(`fatal: The current branch ${b} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream origin ${b}\n`);
      const localId = r.branches[b];
      const remoteId = r.remote[b];
      if (remoteId && localId && !ancestors(r, localId).has(remoteId)) return fail(` ! [rejected]        ${b} -> ${b} (fetch first)\nerror: failed to push some refs\nhint: Updates were rejected because the remote contains work that you do not have locally. Use 'git pull' first.`);
      if (remoteId === localId) return ok("Everything up-to-date");
      r.remote[b] = localId;
      if (u) r.upstream[b] = true;
      const isNew = remoteId === undefined;
      return ok(`To https://github.com/linh/so-khach-tests.git\n ${isNew ? "* [new branch]      " : `   ${(remoteId ?? "").slice(0, 7)}..${(localId ?? "").slice(0, 7)}  `}${b} -> ${b}` + (u ? `\nbranch '${b}' set up to track 'origin/${b}'.` : "") + (isNew && b !== "main" ? `\nremote:\nremote: Create a pull request for '${b}' on GitHub by visiting:\nremote:      https://github.com/linh/so-khach-tests/pull/new/${b}` : ""));
    }
    case "pull": {
      if (!r.hasRemote) return fail("fatal: No remote repository specified.");
      const remoteId = r.remote[r.head];
      if (!remoteId) return fail(`There is no tracking information for the current branch.`);
      const res = git(r, ["merge", `origin/${r.head}`]);
      return { ...res, out: `From https://github.com/linh/so-khach-tests\n${res.out}` };
    }
    case "diff": {
      const lines: string[] = [];
      const staged = a.includes("--staged") || a.includes("--cached");
      const from = staged ? headTree(r) : r.index;
      const to = staged ? r.index : r.work;
      for (const f of new Set([...Object.keys(from), ...Object.keys(to)])) {
        if (!staged && from[f] === undefined) continue; // untracked: git diff không hiện
        if (from[f] === to[f]) continue;
        lines.push(`diff --git a/${f} b/${f}`);
        for (const l of (from[f] ?? "").split("\n")) if (l !== "" || from[f]) lines.push(`- ${l}`);
        for (const l of (to[f] ?? "").split("\n")) if (l !== "" || to[f]) lines.push(`+ ${l}`);
      }
      return ok(lines.join("\n"));
    }
    case "restore": {
      const st = a.includes("--staged");
      const f = a.filter((x) => !x.startsWith("-"))[1];
      if (!f) return fail("fatal: you must specify path(s) to restore");
      if (st) {
        const h = headTree(r)[f];
        if (h === undefined) delete r.index[f];
        else r.index[f] = h;
        return ok("");
      }
      if (r.index[f] === undefined) return fail(`error: pathspec '${f}' did not match any file(s) known to git`);
      r.work[f] = r.index[f];
      return ok("");
    }
    default:
      return fail(`git: '${sub}' chưa có trong sandbox. Gõ help để xem danh sách.`);
  }
}

/** Danh sách commit để vẽ đồ thị: theo thứ tự tạo, kèm nhãn nhánh. */
export function graph(r: Repo) {
  const list = Object.values(r.commits).sort((x, y) => x.at - y.at);
  return list.map((c) => ({
    ...c,
    branches: Object.entries(r.branches).filter(([, id]) => id === c.id).map(([b]) => b),
    remotes: Object.entries(r.remote).filter(([, id]) => id === c.id).map(([b]) => b),
    isHead: r.branches[r.head] === c.id,
  }));
}
