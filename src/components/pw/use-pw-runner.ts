"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PwHost, type TraceStep } from "@/lib/pw/host";
import { runPlaywright, stopPlaywright, type LogLine, type PwOutcome } from "@/lib/runner/run";
import { BUG_KEY } from "@/lib/practice/store";

export interface LiveTest {
  name: string;
  status: "running" | "passed" | "failed" | "skipped";
}

export interface PwRunInput {
  code: string;
  files?: Record<string, string>;
  extraTests?: string;
  forbid?: { pattern: string; message: string }[];
  grep?: RegExp;
  /** Bật bug trong app Sổ Khách cho lượt chạy này (máy chấm dùng). */
  bug?: string;
}

function setBug(b?: string) {
  try {
    if (b) localStorage.setItem(BUG_KEY, b);
    else localStorage.removeItem(BUG_KEY);
  } catch {
    /* bỏ qua */
  }
}

/** Quản lý iframe Sổ Khách + một lượt chạy pw-lite. */
export function usePwRunner() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const hostRef = useRef<PwHost | null>(null);
  const [running, setRunning] = useState(false);
  const [tests, setTests] = useState<LiveTest[]>([]);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [out, setOut] = useState<PwOutcome | null>(null);
  const [url, setUrl] = useState("about:blank");
  const [slowMo, setSlowMoState] = useState(0);

  const ensureHost = useCallback(() => {
    if (!frameRef.current) throw new Error("Chưa có khung trình duyệt");
    if (!hostRef.current) {
      hostRef.current = new PwHost(frameRef.current, {
        slowMo,
        onStep: (s) => {
          setSteps((cur) => [...cur, s]);
          if (s.url) setUrl(s.url);
        },
      });
    }
    return hostRef.current;
  }, [slowMo]);

  useEffect(() => {
    hostRef.current?.setSlowMo(slowMo);
  }, [slowMo]);

  // Cập nhật thanh địa chỉ khi app trong iframe tự chuyển trang
  useEffect(() => {
    const t = setInterval(() => {
      if (hostRef.current) setUrl(hostRef.current.virtualUrl());
      else if (frameRef.current) {
        try {
          const loc = frameRef.current.contentWindow?.location;
          if (loc && loc.href !== "about:blank") setUrl("https://sokhach.playforge.dev" + (loc.pathname.replace(/^\/practice/, "") || "/"));
        } catch {
          /* bỏ qua */
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  const run = useCallback(
    async (input: PwRunInput) => {
      const host = ensureHost();
      setBug(input.bug);
      setRunning(true);
      setTests([]);
      setSteps([]);
      setLogs([]);
      setOut(null);
      const { bug: _bug, ...rest } = input;
      void _bug;
      const res = await runPlaywright({
        ...rest,
        host,
        onLog: (l) => setLogs((cur) => [...cur, l]),
        onTest: (name, status) =>
          setTests((cur) => {
            const i = cur.findIndex((t) => t.name === name);
            if (i < 0) return [...cur, { name, status }];
            const next = [...cur];
            next[i] = { name, status };
            return next;
          }),
        onStep: (s) => {
          if (s.phase === "end") setSteps((cur) => [...cur, { id: Date.now() + Math.random(), test: s.test, name: s.name, kind: s.kind === "hook" ? "hook" : s.kind === "api" ? "nav" : "step", ok: !!s.ok, ms: s.ms ?? 0 }]);
        },
      });
      setBug(undefined);
      setOut(res);
      setRunning(false);
      return res;
    },
    [ensureHost],
  );

  const stop = useCallback(() => {
    stopPlaywright();
    setBug(undefined);
    setRunning(false);
  }, []);

  // Rời trang khi đang chấm: tắt bug, dừng worker
  useEffect(() => () => { setBug(undefined); stopPlaywright(); }, []);

  const navigate = useCallback((path: string) => {
    if (frameRef.current) frameRef.current.src = "/practice" + path;
  }, []);

  return { frameRef, run, stop, running, tests, steps, logs, out, url, slowMo, setSlowMo: setSlowMoState, navigate, ensureHost };
}
