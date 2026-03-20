import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        slateBg: "#0B1220",
        panel: "#111827",
        accent: "#22C55E"
      }
    }
  },
  plugins: []
};

export default config;
