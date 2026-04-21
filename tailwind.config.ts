import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: {
          50: "#fff7f6",
          100: "#ffe4df",
          200: "#f7c1b8",
          300: "#e89b8f",
          400: "#d57665",
          500: "#b85948",
          600: "#93463a"
        },
        sand: {
          50: "#faf7f2",
          100: "#f1ebe0",
          200: "#e2d6bf",
          300: "#cfbc97",
          400: "#b69d73",
          500: "#927c56"
        }
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Assistant", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
