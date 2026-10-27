/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ghost: {
          50:  "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        specter: {
          50:  "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
      },
      animation: {
        "aurora": "aurora 8s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "typewriter": "typewriter 0.05s steps(1) forwards",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        aurora: {
          "0%":   { backgroundPosition: "0% 50%", opacity: "0.6" },
          "50%":  { backgroundPosition: "100% 50%", opacity: "1" },
          "100%": { backgroundPosition: "0% 50%", opacity: "0.6" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 5px rgba(20,184,166,0.3), 0 0 20px rgba(20,184,166,0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(20,184,166,0.6), 0 0 40px rgba(20,184,166,0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
