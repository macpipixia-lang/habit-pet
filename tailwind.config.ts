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
        ink: "#f5f2ea",
        night: "#141312",
        mist: "#ada79d",
        panel: "#1d1b19",
        panelAlt: "#262320",
        line: "rgba(245, 242, 234, 0.12)",
        accent: "#c9a46a",
        accentWarm: "#a8844f",
        success: "#c9a46a",
        danger: "#c56f61",
      },
      boxShadow: {
        glow: "0 20px 48px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(245,242,234,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,234,0.04) 1px, transparent 1px)",
        spotlight: "radial-gradient(circle at top, rgba(201,164,106,0.08), transparent 34%)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
