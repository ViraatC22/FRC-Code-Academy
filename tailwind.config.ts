import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // FRC-flavored palette
        ink: "#0a0e17",
        panel: "#121826",
        panel2: "#1a2235",
        edge: "#26304a",
        brand: "#3b82f6",
        brand2: "#60a5fa",
        accent: "#f59e0b",
        good: "#22c55e",
        bad: "#ef4444",
        muted: "#8b96ad",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
