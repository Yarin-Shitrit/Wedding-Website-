import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./messages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-assistant)", "var(--font-heebo)", "sans-serif"],
      },
      colors: {
        ivory: "#FAF7F2",
        sage: {
          50: "#F3F6F2",
          100: "#E3EADF",
          500: "#7A9279",
          600: "#5E7A5D",
          700: "#445B43",
        },
        blush: {
          100: "#F7E6E0",
          300: "#E8B6A6",
          500: "#C88671",
          700: "#9E5F4C",
        },
        ink: "#2C2A28",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(44,42,40,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
