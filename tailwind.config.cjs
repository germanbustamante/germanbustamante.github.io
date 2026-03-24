/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#14b8a6",
          light: "#2dd4bf",
          dark: "#0d9488",
        },
        surface: {
          primary: "#0a0a0a",
          secondary: "#111111",
          card: "#1a1a1a",
          border: "#262626",
        },
      },
      fontFamily: {
        sans: ["InterVariable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            ":not(pre) > code": {
              backgroundColor: theme("colors.neutral.200"),
              border: "1px solid",
              borderColor: theme("colors.zinc.300"),
              padding: "0.250rem 0.4rem",
              borderRadius: "0.250rem",
              fontWeight: "400",
            },
          },
        },
        invert: {
          css: {
            ":not(pre) > code": {
              backgroundColor: theme("colors.neutral.800"),
              borderColor: theme("colors.zinc.700"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
