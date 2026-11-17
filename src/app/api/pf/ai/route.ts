import { NextRequest, NextResponse } from "next/server";
import { UID_RE } from "@/lib/account";
import { getEnv } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const LIMIT_USER = 40;
const LIMIT_GUEST = 10;

const SYSTEM = `Bạn là Mentor của PlayForge, kèm một tester người Việt học JavaScript/TypeScript và Playwright từ đầu.
- Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa khoảng 150 từ).
- Khi cần ví dụ, dùng code TypeScript ngắn trong khối \`\`\`ts.
- Giải thích lỗi: nói nguyên nhân bằng lời dễ hiểu trước, rồi mới nói cách sửa.
- Ưu tiên cách làm chuẩn của Playwright: locator getByRole/getByLabel/getByTestId, assertion web-first, không dùng waitForTimeout.
- Nếu câu hỏi không liên quan lập trình, kiểm thử hay công cụ (Git, VS Code, CI), lịch sự đưa về chủ đề khóa học.`;

const HINT_RULE = `Chế độ GỢI Ý: người học đang làm bài tập. KHÔNG đưa lời giải hoàn chỉnh hay code đáp án đầy đủ. Chỉ ra dòng hoặc ý có vấn đề và gợi hướng để họ tự sửa.`;

interface Body {
  uid?: string;
  mode?: "hint" | "full";
  topic?: string;
  question?: string;
  code?: string;
  error?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  const env = await getEnv();
  if (!env.AI) return NextResponse.json({ error: "Mentor AI chưa được bật trên máy chủ này." }, { status: 503 });
  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
  }
  const question = String(b.question ?? "").slice(0, 2000).trim();
  if (!question && !b.error) return NextResponse.json({ error: "Bạn chưa nhập câu hỏi" }, { status: 400 });

  // Hạn mức theo ngày
  const uid = b.uid && UID_RE.test(b.uid) ? b.uid : null;
  const who = uid ?? `ip:${req.headers.get("cf-connecting-ip") ?? "unknown"}`;
  const limit = uid ? LIMIT_USER : LIMIT_GUEST;
  const day = new Date().toISOString().slice(0, 10);
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT n FROM pf_ai_usage WHERE day = ? AND who = ?").bind(day, who).first<{ n: number }>();
      if ((row?.n ?? 0) >= limit) return NextResponse.json({ error: `Hôm nay bạn đã hỏi đủ ${limit} lượt. Mai hỏi tiếp nhé${uid ? "" : ", hoặc đăng nhập để có thêm lượt"}.` }, { status: 429 });
      await env.DB.prepare("INSERT INTO pf_ai_usage (day, who, n) VALUES (?, ?, 1) ON CONFLICT(day, who) DO UPDATE SET n = n + 1").bind(day, who).run();
    } catch (e) {
      console.error("pf ai usage:", e);
    }
  }

  const parts = [b.topic ? `Bài đang học: ${String(b.topic).slice(0, 200)}` : "", question ? `Câu hỏi: ${question}` : "Hãy giải thích lỗi dưới đây."];
  if (b.code) parts.push("Code của người học:\n```ts\n" + String(b.code).slice(0, 6000) + "\n```");
  if (b.error) parts.push("Lỗi khi chạy:\n```\n" + String(b.error).slice(0, 2000) + "\n```");
  const history = (b.history ?? []).slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) }));
  const messages = [
    { role: "system", content: SYSTEM + (b.mode === "full" ? "" : "\n" + HINT_RULE) },
    ...history,
    { role: "user", content: parts.filter(Boolean).join("\n\n") },
  ];
  try {
    const out = (await env.AI.run(MODEL, { messages, max_tokens: 700, temperature: 0.3 })) as { response?: string };
    return NextResponse.json({ answer: (out.response ?? "").trim() || "Mentor chưa nghĩ ra câu trả lời, thử hỏi lại theo cách khác nhé." });
  } catch (e) {
    console.error("pf ai:", e);
    return NextResponse.json({ error: "Mentor AI đang bận, thử lại sau ít phút." }, { status: 502 });
  }
}
