import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "var(--ivory)",
        "ivory-2": "var(--ivory-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        hair: "var(--hair)",
        "hair-strong": "var(--hair-strong)",
        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",
        paper: "var(--paper)",
        // ── legacy aliases (used by admin pages); mapped to new palette ──
        rose: {
          50: "var(--paper)",
          100: "var(--paper)",
          200: "var(--hair)",
          300: "var(--hair-strong)",
          400: "var(--accent)",
          500: "var(--accent)",
          600: "var(--accent-deep)"
        },
        sand: {
          50: "var(--ivory)",
          100: "var(--paper)",
          200: "var(--hair)",
          300: "var(--hair-strong)",
          400: "var(--ink-3)",
          500: "var(--ink-2)"
        },
        stone: {
          100: "var(--hair)",
          200: "var(--hair)",
          300: "var(--hair-strong)",
          400: "var(--ink-3)",
          500: "var(--ink-3)",
          600: "var(--ink-2)",
          700: "var(--ink-2)",
          800: "var(--ink)"
        }
      },
      fontFamily: {
        display: ["Heebo", "Calibri", "system-ui", "sans-serif"],
        body: ["Heebo", "Calibri", "system-ui", "sans-serif"],
        serif: ["'Cormorant Garamond'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        paper:
          "0 1px 2px rgba(60,40,20,0.06), 0 8px 28px rgba(60,40,20,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
