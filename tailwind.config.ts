import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--app-ink)",
        night: "var(--app-bg)",
        mist: "var(--app-mist)",
        panel: "var(--app-bg-soft)",
        panelAlt: "#f4eadc",
        line: "var(--app-line)",
        accent: "var(--app-accent)",
        accentWarm: "var(--app-accent-warm)",
        success: "var(--app-success)",
        danger: "var(--app-danger)",
      },
      boxShadow: {
        glow: "0 18px 42px rgba(208, 175, 124, 0.18)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(114,88,58,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(114,88,58,0.05) 1px, transparent 1px)",
        spotlight: "radial-gradient(circle at top, rgba(242,140,82,0.12), transparent 34%)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
