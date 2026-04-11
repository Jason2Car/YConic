import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                vscode: {
                    bg: "#1e1e1e",
                    sidebar: "#252526",
                    panel: "#2d2d30",
                    border: "#3e3e42",
                    accent: "#007acc",
                    activityBar: "#333333",
                    statusBar: "#007acc",
                    tabActive: "#1e1e1e",
                    tabInactive: "#2d2d30",
                    text: "#cccccc",
                    textMuted: "#858585",
                    hover: "#2a2d2e",
                    selection: "#264f78",
                    inputBg: "#3c3c3c",
                },
            },
            fontFamily: {
                mono: ["Consolas", "Monaco", "Courier New", "monospace"],
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};

export default config;
