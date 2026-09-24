/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        chart: {
          "1": "oklch(var(--chart-1) / <alpha-value>)",
          "2": "oklch(var(--chart-2) / <alpha-value>)",
          "3": "oklch(var(--chart-3) / <alpha-value>)",
          "4": "oklch(var(--chart-4) / <alpha-value>)",
          "5": "oklch(var(--chart-5) / <alpha-value>)",
        },
        brand: {
          50: "#f7f8f1",
          100: "#ecefdd",
          200: "#d8dec0",
          300: "#bcc59a",
          400: "#a0ab77",
          500: "#8b9172",
          600: "#6f7455",
          700: "#575c43",
          800: "#3f4432",
          900: "#2d3023",
          950: "#1a1c14",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f5ecd0",
          200: "#ead79e",
          300: "#ddc06b",
          400: "#d3ad4a",
          500: "#c69a3d",
          600: "#a87f2c",
          700: "#856224",
          800: "#6b4e21",
          900: "#5a411f",
        },
      },
      boxShadow: {
        brand: "0 10px 40px -12px rgb(139 145 114 / 0.45)",
        "brand-lg": "0 24px 70px -20px rgb(139 145 114 / 0.5)",
        glow: "0 0 0 1px rgb(139 145 114 / 0.25), 0 18px 50px -12px rgb(139 145 114 / 0.5)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #2d3023 0%, #4b5240 40%, #8b9172 78%, #c69a3d 130%)",
        "brand-soft":
          "linear-gradient(135deg, #f7f8f1 0%, #ecefdd 55%, #e6e4d5 100%)",
        "hero-glow":
          "radial-gradient(60% 80% at 20% 10%, rgb(198 154 61 / 0.18) 0%, transparent 60%), radial-gradient(50% 70% at 90% 0%, rgb(139 145 114 / 0.25) 0%, transparent 60%)",
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "toast-progress": {
          from: { transform: "scaleX(1)" },
          to: { transform: "scaleX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "toast-progress": "toast-progress linear forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
