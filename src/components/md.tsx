import { Fragment, type ReactNode } from "react";

// Markdown rút gọn cho nội dung bài: `code`, **đậm**, *nghiêng*. Không render HTML thô.
export function Md({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{inline(text)}</span>;
}

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (m[1]) out.push(<code key={i++} className="code-inline">{tok.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={i++} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else out.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return out;
}

/** Nhiều đoạn cách nhau bằng dòng trống; dòng bắt đầu bằng "- " thành danh sách. */
export function MdBlock({ text }: { text: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <div className="flex flex-col gap-3">
      {paras.map((p, i) => {
        const lines = p.split("\n");
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
              {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
            </ul>
          );
        return <p key={i}>{inline(p)}</p>;
      })}
    </div>
  );
}
