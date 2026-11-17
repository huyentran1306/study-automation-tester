"use client";

import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { PW_TYPES } from "./pw-types";

const EXTRA_LIB = `
declare function test(name: string, fn: () => unknown | Promise<unknown>): void;
declare function describe(name: string, fn: () => void): void;
interface PFMatchers { toBe(v: unknown): void; toEqual(v: unknown): void; toMatchObject(v: unknown): void; toBeTruthy(): void; toBeFalsy(): void; toBeNull(): void; toBeUndefined(): void; toBeDefined(): void; toContain(v: unknown): void; toHaveLength(n: number): void; toThrow(e?: string | RegExp): void; toBeGreaterThan(n: number): void; toBeLessThan(n: number): void; toBeCloseTo(n: number, digits?: number): void; toMatch(re: string | RegExp): void; toBeInstanceOf(c: unknown): void; }
declare function expect(actual: unknown): PFMatchers & { not: PFMatchers; rejects: { [K in keyof PFMatchers]: (...a: Parameters<PFMatchers[K]>) => Promise<void> }; resolves: { [K in keyof PFMatchers]: (...a: Parameters<PFMatchers[K]>) => Promise<void> } };
`;

let configured = false;
const beforeMount: BeforeMount = (monaco) => {
  if (configured) return;
  configured = true;
  monaco.editor.defineTheme("playforge", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8A93A3", fontStyle: "italic" },
      { token: "keyword", foreground: "2563C9", fontStyle: "bold" },
      { token: "string", foreground: "2F7D6D" },
      { token: "number", foreground: "A35B00" },
      { token: "type", foreground: "5B44B8" },
      { token: "identifier", foreground: "1C2433" },
    ],
    colors: {
      "editor.background": "#FCFDFF",
      "editor.foreground": "#1C2433",
      "editorLineNumber.foreground": "#A9B1BF",
      "editorLineNumber.activeForeground": "#2563C9",
      "editor.lineHighlightBackground": "#F2F7FF",
      "editor.selectionBackground": "#D4E4FA",
      "editorCursor.foreground": "#2563C9",
      "editorIndentGuide.background1": "#EBEFF5",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E3E8EF",
    },
  });
  const ts = monaco.languages.typescript;
  const opts = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    strict: true,
    noEmit: true,
    lib: ["esnext", "dom"],
  };
  ts.typescriptDefaults.setCompilerOptions(opts);
  ts.javascriptDefaults.setCompilerOptions(opts);
  // 1375/1378: top-level await; 2451/2393/2300: trùng tên giữa các file độc lập; 7006/7031: tham số chưa khai kiểu (JS)
  const ignore = [1375, 1378, 2451, 2393, 2300, 1208, 2307, 2792, 80001, 80005, 7044];
  ts.typescriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: ignore });
  ts.javascriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [...ignore, 7006, 7031] });
  ts.typescriptDefaults.addExtraLib(EXTRA_LIB, "file:///pf-globals.d.ts");
  ts.javascriptDefaults.addExtraLib(EXTRA_LIB, "file:///pf-globals.d.ts");
  ts.typescriptDefaults.addExtraLib(PW_TYPES, "file:///node_modules/@playwright/test/index.d.ts");
};

export interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  language?: "typescript" | "javascript" | "json" | "shell" | "plaintext";
  path?: string;
  height?: string | number;
  fontSize?: number;
  onRun?: () => void;
  errorLine?: number | null;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language = "typescript", path, height = "100%", fontSize = 14, onRun, errorLine, readOnly }: CodeEditorProps) {
  const runRef = useRef(onRun);
  runRef.current = onRun;
  const decoRef = useRef<{ clear(): void; set(d: unknown[]): void } | null>(null);
  const edRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const [mounted, setMounted] = useState(false);
  const onMount: OnMount = (editor, monaco) => {
    edRef.current = editor;
    monacoRef.current = monaco;
    setMounted(true);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    decoRef.current = editor.createDecorationsCollection([]) as unknown as { clear(): void; set(d: unknown[]): void };
  };

  // Tô dòng lỗi
  useEffect(() => {
    const m = monacoRef.current;
    if (!mounted || !m || !decoRef.current) return;
    if (errorLine && errorLine > 0)
      decoRef.current.set([{ range: new m.Range(errorLine, 1, errorLine, 1), options: { isWholeLine: true, className: "pf-error-line", linesDecorationsClassName: "pf-error-glyph" } }]);
    else decoRef.current.clear();
  }, [errorLine, mounted]);

  return (
    <Editor
      height={height}
      language={language}
      path={path}
      value={value}
      theme="playforge"
      beforeMount={beforeMount}
      onMount={onMount}
      onChange={(v) => onChange(v ?? "")}
      loading={<div className="p-4 text-sm text-muted">Đang mở editor…</div>}
      options={{
        fontSize,
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontLigatures: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
        lineNumbersMinChars: 3,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        automaticLayout: true,
        readOnly,
        fixedOverflowWidgets: true,
      }}
    />
  );
}
