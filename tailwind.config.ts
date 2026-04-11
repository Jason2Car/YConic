import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────────────
        "bg-primary":   "#0B1120", // Deep Navy — primary background
        "bg-surface":   "#111827", // slightly lighter surface (panels, sidebar)
        "bg-elevated":  "#1A2236", // elevated cards / tabs
        "border":       "#1E2D45", // subtle borders

        "signal-blue":  "#3B8BFF", // Action / CTA
        "signal-blue-hover": "#5FA0FF",

        "velocity-teal": "#1D9E75", // Success / complete
        "amber-surge":   "#F0994A", // Warning / highlight
        "chalk":         "#F1EFE8", // Light surface / primary text on dark

        "text-primary":  "#F1EFE8", // Chalk — main readable text
        "text-secondary":"#8A9BB5", // muted text
        "text-disabled": "#4A5568",

        "error":         "#F05252", // destructive actions
        "error-muted":   "#7B1D1D",

        // ── Semantic aliases kept for component compatibility ───────
        "vsc-bg":          "#0B1120",
        "vsc-sidebar":     "#111827",
        "vsc-panel":       "#0B1120",
        "vsc-border":      "#1E2D45",
        "vsc-tab":         "#1A2236",
        "vsc-tab-active":  "#0B1120",
        "vsc-text":        "#F1EFE8",
        "vsc-text-muted":  "#8A9BB5",
        "vsc-accent":      "#3B8BFF",
        "vsc-accent-hover":"#5FA0FF",
        "vsc-green":       "#1D9E75",
        "vsc-yellow":      "#F0994A",
        "vsc-orange":      "#F0994A",
        "vsc-purple":      "#A78BFA",
        "vsc-blue":        "#3B8BFF",
        "vsc-red":         "#F05252",
        "vsc-status":      "#3B8BFF",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        mono: ["Consolas", "Menlo", "Monaco", "'Courier New'", "monospace"],
      },
      fontSize: {
        // Display — 32px / 600 / −0.03em
        "display": ["32px", { fontWeight: "600", letterSpacing: "-0.03em", lineHeight: "1.2" }],
        // Heading — 18px / 500
        "heading": ["18px", { fontWeight: "500", lineHeight: "1.4" }],
        // Body — 14px / 400 / 1.7
        "body":    ["14px", { fontWeight: "400", lineHeight: "1.7" }],
      },
    },
  },
  plugins: [],
};

export default config;
