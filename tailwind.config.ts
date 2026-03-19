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
        ink: "#fff7ed",
        night: "#1f1712",
        mist: "#cfbda9",
        panel: "#2a1f18",
        panelAlt: "#38281f",
        line: "rgba(255,237,213,0.12)",
        accent: "#f6ad55",
        accentWarm: "#d97706",
        success: "#68b984",
        danger: "#e58a72",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(217, 119, 6, 0.18)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,237,213,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,237,213,0.05) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
