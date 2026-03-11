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
        ink: "#f5f7fb",
        night: "#09090b",
        mist: "#a1a1aa",
        panel: "#111827",
        panelAlt: "#161b26",
        line: "rgba(255,255,255,0.08)",
        accent: "#7dd3fc",
        accentWarm: "#f59e0b",
        success: "#34d399",
        danger: "#fb7185",
      },
      boxShadow: {
        glow: "0 20px 80px rgba(14, 165, 233, 0.12)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
