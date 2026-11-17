import type { Config } from "tailwindcss";

// Bảng màu PlayForge: nền trắng ngả xanh, màu chính xanh dương, phụ tím (AI), xanh xô thơm (pass), cam đất (flaky).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ground: "#F6F8FB",
        line: "#E3E8EF",
        line2: "#EBEFF5",
        ink: { DEFAULT: "#1C2433", 2: "#323A48", 3: "#3D4757" },
        muted: { DEFAULT: "#5E6878", 2: "#8A93A3" },
        brand: { DEFAULT: "#2563C9", dark: "#1D4E9E", soft: "#E6F0FD", tint: "#EEF5FE", edge: "#D4E4FA", ring: "#C3D8F5" },
        ai: { DEFAULT: "#5B44B8", dark: "#4A37A0", soft: "#F4F1FC", tint: "#EFEBFB", edge: "#E0D8F6" },
        ok: { DEFAULT: "#2F7D6D", dark: "#22685A", soft: "#E4F2EE", tint: "#EEF7F4", edge: "#CFE6DF" },
        warn: { DEFAULT: "#A35B00", dark: "#8A4D00", soft: "#FDF1E2" },
        bad: { DEFAULT: "#B42318", dark: "#9A1C12", soft: "#FDECEA", edge: "#F5C2BC" },
        chip: "#EFF3F8",
        paper: "#FCFDFF",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(28,36,51,0.12)",
        lift: "0 10px 30px rgba(37,99,201,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
