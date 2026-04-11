import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sworn-bg": "#ffffff",
        "sworn-bg-secondary": "#f7f7f5",
        "sworn-primary": "#0d0d0d",
        "sworn-secondary": "#555550",
        "sworn-tertiary": "#999990",
      },
      borderColor: {
        DEFAULT: "rgba(0,0,0,0.08)",
        md: "rgba(0,0,0,0.14)",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
