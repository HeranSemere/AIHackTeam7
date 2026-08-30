import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF3E7",
        paper: "#FFFDF9",
        ink: "#241708",
        coffee: "#4A2E1A",
        gold: {
          DEFAULT: "#D6A02C",
          dark: "#A97A1C",
          light: "#F1D68C",
        },
        forest: {
          DEFAULT: "#1F6E4A",
          light: "#E4F2EA",
        },
        clay: {
          DEFAULT: "#A5432B",
          light: "#F6E4DE",
        },
        amber: {
          DEFAULT: "#C1791A",
          light: "#FBEBD3",
        },
        navy: {
          DEFAULT: "#16283D",
          light: "#1F3A57",
          soft: "#EAF0F5",
        },
        slate: {
          DEFAULT: "#5B6B7A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        ethiopic: ["var(--font-ethiopic)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,23,8,0.04), 0 8px 24px -12px rgba(36,23,8,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
