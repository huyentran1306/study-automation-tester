import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/progress/store";
import { AppShell } from "@/components/shell/app-shell";

const display = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PlayForge · Xưởng luyện Automation",
  description: "Lộ trình 16 tuần học Playwright với JavaScript/TypeScript: bài học, IDE chạy code ngay, thử thách chấm tự động, ôn tập lặp lại ngắt quãng.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
