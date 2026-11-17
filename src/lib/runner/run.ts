"use client";

import { transform } from "sucrase";
import { WORKER_SRC } from "./worker-src";
import { WORKER_PW } from "./worker-pw";
import type { PwHost } from "@/lib/pw/host";
import { getLabUser } from "@/lib/practice/api";

export interface LogLine {
  level: "log" | "warn" | "error" | "info" | "system";
  text: string;
}

export interface TestResult {
  name: string;
  ok: boolean;
  ms: number;
  error?: string;
  skipped?: boolean;
  line?: number | null;
  tags?: string[];
}

export interface RunOutcome {
  logs: LogLine[];
  results: TestResult[];
  error: { name: string; message: string; line: number | null } | null;
  ms: number;
  timedOut: boolean;
  violations: string[];
}

let workerUrl: string | null = null;
function getWorkerUrl() {
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC, "\n", WORKER_PW], { type: "text/javascript" }));
  return workerUrl;
}

/** Dịch TS/ESM sang JS chạy được trong worker. Giữ nguyên số dòng. */
export function compile(src: string, ts = true): string {
  const hasModules = /^\s*(import|export)\s/m.test(src);
  const transforms: ("typescript" | "imports")[] = [];
  if (ts) transforms.push("typescript");
  if (hasModules) transforms.push("imports");
  if (!transforms.length) return src;
  return transform(src, { transforms, disableESTransforms: true, preserveDynamicImport: true, keepUnusedImports: false }).code;
}

function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export interface RunOptions {
  code: string;
  tests?: string;
  /** Các tệp khác trong dự án (đường dẫn → nội dung TS/JS) để import. */
  files?: Record<string, string>;
  forbid?: { pattern: string; message: string }[];
  timeoutMs?: number;
  onLog?: (l: LogLine) => void;
}

export function runCode(opts: RunOptions): Promise<RunOutcome> {
  const violations = (opts.forbid ?? [])
    .filter((f) => new RegExp(f.pattern).test(stripComments(opts.code)))
    .map((f) => f.message);

  let compiled: string;
  const compiledFiles: Record<string, string> = {};
  try {
    compiled = compile(opts.code);
    for (const [k, v] of Object.entries(opts.files ?? {})) compiledFiles[k] = compile(v, /\.ts$/.test(k));
  } catch (e) {
    const err = e as Error & { loc?: { line: number } };
    const m = err.message.match(/\((\d+):(\d+)\)/);
    return Promise.resolve({
      logs: [],
      results: [],
      error: { name: "SyntaxError", message: err.message.replace(/\s*\(\d+:\d+\)$/, ""), line: m ? Number(m[1]) : null },
      ms: 0,
      timedOut: false,
      violations,
    });
  }

  return new Promise((resolve) => {
    const logs: LogLine[] = [];
    const worker = new Worker(getWorkerUrl());
    const limit = (opts.timeoutMs ?? 4000) + (opts.tests ? 6000 : 1000);
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        logs,
        results: [],
        error: { name: "TimeoutError", message: `Hết thời gian chạy (${Math.round(limit / 1000)} giây). Có vòng lặp vô tận không?`, line: null },
        ms: limit,
        timedOut: true,
        violations,
      });
    }, limit);
    worker.onmessage = (ev: MessageEvent) => {
      const m = ev.data;
      if (m.type === "log") {
        const l = { level: m.level, text: m.text } as LogLine;
        logs.push(l);
        opts.onLog?.(l);
        if (logs.length > 500) {
          worker.terminate();
          clearTimeout(timer);
          resolve({ logs: [...logs, { level: "system", text: "… dừng vì in quá nhiều dòng (500)" }], results: [], error: null, ms: 0, timedOut: true, violations });
        }
      } else if (m.type === "done") {
        clearTimeout(timer);
        worker.terminate();
        resolve({ logs, results: m.results, error: m.error, ms: m.ms, timedOut: false, violations });
      }
    };
    worker.onerror = (ev) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ logs, results: [], error: { name: "Error", message: ev.message, line: null }, ms: 0, timedOut: false, violations });
    };
    worker.postMessage({
      code: compiled,
      tests: opts.tests ?? "",
      files: compiledFiles,
      userLines: opts.code.split("\n").length,
      timeoutMs: opts.timeoutMs ?? 4000,
    });
  });
}

// ---------------- Chế độ Playwright (pw-lite) ----------------

export interface PwRunOptions {
  /** File spec đang chạy (TS). */
  code: string;
  /** Các file khác trong dự án (page object, fixture, dữ liệu). */
  files?: Record<string, string>;
  /** Test ẩn chấm bài (nối sau code học viên). */
  extraTests?: string;
  forbid?: { pattern: string; message: string }[];
  grep?: RegExp;
  host: PwHost;
  onLog?: (l: LogLine) => void;
  onTest?: (name: string, status: "running" | "passed" | "failed" | "skipped") => void;
  onStep?: (s: { test: string; name: string; kind: string; phase: string; ok?: boolean; ms?: number }) => void;
  timeoutMs?: number;
}

export interface PwOutcome extends RunOutcome {
  total: number;
}

let activePw: Worker | null = null;

/** Dừng lượt chạy Playwright đang chạy (nút Dừng). */
export function stopPlaywright() {
  activePw?.terminate();
  activePw = null;
}

export function runPlaywright(opts: PwRunOptions): Promise<PwOutcome> {
  const violations = (opts.forbid ?? []).filter((f) => new RegExp(f.pattern).test(stripComments(opts.code))).map((f) => f.message);
  let compiled: string;
  const compiledFiles: Record<string, string> = {};
  try {
    compiled = compile(opts.code);
    for (const [k, v] of Object.entries(opts.files ?? {})) compiledFiles[k] = /\.(ts|js)$/.test(k) ? compile(v, /\.ts$/.test(k)) : v;
  } catch (e) {
    const err = e as Error;
    const m = err.message.match(/\((\d+):(\d+)\)/);
    return Promise.resolve({ logs: [], results: [], error: { name: "SyntaxError", message: err.message.replace(/\s*\(\d+:\d+\)$/, ""), line: m ? Number(m[1]) : null }, ms: 0, timedOut: false, violations, total: 0 });
  }
  stopPlaywright();
  return new Promise((resolve) => {
    const logs: LogLine[] = [];
    const worker = new Worker(getWorkerUrl());
    activePw = worker;
    const started = Date.now();
    const limit = opts.timeoutMs ?? 180_000;
    let finished = false;
    const finish = (o: PwOutcome) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      if (activePw === worker) activePw = null;
      resolve(o);
    };
    const timer = setTimeout(() => finish({ logs, results: [], error: { name: "TimeoutError", message: `Cả lượt chạy quá ${limit / 1000} giây`, line: null }, ms: limit, timedOut: true, violations, total: 0 }), limit);
    const prevEvent = (opts.host as unknown as { opts: { onEvent?: unknown } }).opts.onEvent;
    (opts.host as unknown as { opts: { onEvent?: (e: unknown) => void } }).opts.onEvent = (e) => worker.postMessage({ type: "event", ...(e as object) });
    worker.onmessage = async (ev: MessageEvent) => {
      const m = ev.data;
      if (m.type === "log") {
        const l = { level: m.level, text: m.text } as LogLine;
        logs.push(l);
        opts.onLog?.(l);
      } else if (m.type === "rpc") {
        try {
          const value = await opts.host.handle(m.op, m.args, m.test);
          if (!finished) worker.postMessage({ type: "rpc-result", id: m.id, ok: true, value });
        } catch (e) {
          if (!finished) worker.postMessage({ type: "rpc-result", id: m.id, ok: false, error: (e as Error).message, errorName: (e as Error).name });
        }
      } else if (m.type === "test") {
        opts.onTest?.(m.name, m.status);
      } else if (m.type === "step") {
        opts.onStep?.(m);
      } else if (m.type === "done") {
        (opts.host as unknown as { opts: { onEvent?: unknown } }).opts.onEvent = prevEvent;
        finish({ logs, results: m.results, error: m.error, ms: Date.now() - started, timedOut: false, violations, total: m.total });
      }
    };
    worker.onerror = (ev) => finish({ logs, results: [], error: { name: "Error", message: ev.message, line: null }, ms: 0, timedOut: false, violations, total: 0 });
    worker.postMessage({
      mode: "pw",
      labUser: getLabUser(),
      code: compiled,
      files: compiledFiles,
      extraTests: opts.extraTests ? compile(opts.extraTests) : "",
      userLines: opts.code.split("\n").length,
      grep: opts.grep ? { re: opts.grep.source, flags: opts.grep.flags } : null,
    });
  });
}
