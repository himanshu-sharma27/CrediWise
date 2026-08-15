/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          950: "#0B1E23",
          900: "#0F2930",
          850: "#132E35", // Main Sidebar dark teal
          800: "#173740",
          750: "#1D434D", // Primary buttons
          700: "#1F4752",
          600: "#2A5A67",
          500: "#387383",
          200: "#C3E2E8",
          100: "#E2F1F4", // Soft pill buttons
          50: "#F2F9FA",
        },
        coral: {
          700: "#B54D26",
          600: "#C85A32",
          500: "#D96B43", // Coral highlight and active sidebar
          400: "#E07A5F",
          200: "#F6C5B6",
          100: "#FCECE7",
          50: "#FFF8F6",
        },
        cream: {
          50: "#FCFAF7",
          100: "#FAF8F5", // Main application warm background
          200: "#F3EFE8",
          300: "#EBE6DC", // Soft borders
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
