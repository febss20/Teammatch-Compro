import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", 
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        primary: {
          DEFAULT: "#06b6d4", // Cyan 500
          dark: "#0891b2",
        },
        secondary: {
          DEFAULT: "#14b8a6", // Teal 500
          dark: "#0d9488",
        },
      },
    },
  },
  plugins: [],
};
export default config;