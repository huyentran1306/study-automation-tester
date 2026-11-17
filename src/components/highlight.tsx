// Tô màu cú pháp nhẹ cho khối code tĩnh (bài học, gợi ý). Editor thật dùng Monaco.
const KW = /\b(import|from|export|default|const|let|var|function|return|if|else|for|while|of|in|new|class|extends|super|this|async|await|try|catch|finally|throw|switch|case|break|interface|type|readonly|private|public|typeof|instanceof|true|false|null|undefined)\b/;

export function highlight(line: string, lang: string) {
  if (lang === "bash" || lang === "text") {
    if (lang === "bash") {
      const hash = line.indexOf("#");
      const code = hash >= 0 ? line.slice(0, hash) : line;
      const comment = hash >= 0 ? line.slice(hash) : "";
      const [cmd, ...rest] = code.split(" ");
      return [
        { t: cmd, c: "text-brand font-semibold" },
        { t: rest.length ? " " + rest.join(" ") : "", c: "text-ink" },
        { t: comment, c: "text-muted-2 italic" },
      ];
    }
    return [{ t: line, c: /^(<<<<<<<|=======|>>>>>>>)/.test(line) ? "text-bad font-semibold" : "text-ink" }];
  }
  const re = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b[A-Za-z_$][\w$]*\b)(?=\s*\()|(\b[A-Za-z_$][\w$]*\b)|(\b\d[\d_.]*\b)/g;
  const out: { t: string; c: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), c: "text-ink" });
    let c = "text-ink";
    if (m[1]) c = "text-muted-2 italic";
    else if (m[2]) c = "text-ok";
    else if (m[3]) c = KW.test(m[3]) ? "text-brand font-semibold" : "text-ai";
    else if (m[4]) c = KW.test(m[4]) ? "text-brand font-semibold" : "text-ink";
    else if (m[5]) c = "text-warn";
    out.push({ t: m[0], c });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ t: line.slice(last), c: "text-ink" });
  return out;
}

export function CodeLines({ code, lang }: { code: string; lang: string }) {
  return (
    <pre className="overflow-x-auto bg-paper px-4 py-3 font-mono text-[13px] leading-[1.75]">
      {code.split("\n").map((l, i) => (
        <div key={i} className="whitespace-pre">
          {highlight(l, lang).map((s, j) => (
            <span key={j} className={s.c}>{s.t}</span>
          ))}
          {l === "" ? " " : null}
        </div>
      ))}
    </pre>
  );
}
