import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        bg: {
          primary: "var(--color-background-primary)",
          secondary: "var(--color-background-secondary)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        border: {
          secondary: "var(--color-border-secondary)",
          tertiary: "var(--color-border-tertiary)",
        },
        accent: {
          DEFAULT: "#1D9E75",
          hover: "#0F6E56",
        },
        success: {
          bg: "var(--color-background-success)",
          text: "var(--color-text-success)",
        },
        info: {
          bg: "var(--color-background-info)",
          text: "var(--color-text-info)",
        },
        warning: {
          bg: "var(--color-background-warning)",
          text: "var(--color-text-warning)",
        },
        danger: {
          bg: "var(--color-background-danger)",
          text: "var(--color-text-danger)",
        },
      },
      borderRadius: {
        md: "var(--border-radius-md)",
        lg: "var(--border-radius-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
