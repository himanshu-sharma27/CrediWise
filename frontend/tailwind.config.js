/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Traditional & Safe Fintech Color Palette (PRD v8.0)
        navy: {
          950: "#101C31",
          900: "#1A2B4C", // Oxford Navy (Primary brand color)
          850: "#1A2B4C", // Sidebar & Header primary
          800: "#1A2B4C", // Primary Dark Headings
          750: "#243A61", // Oxford Navy Hover
          700: "#243A61",
          600: "#2D4160", // Sidebar border
          500: "#395074",
          200: "#CBD2DA", // Strong border
          100: "#E2E5E9", // Light border
          50: "#F8F9FA",  // Soft Alabaster background
        },
        ochre: {
          900: "#8E5B2E",
          700: "#B98150", // Active accent
          600: "#C48F5E", // Hover accent
          500: "#D4A373", // Warm Ochre (Human-friendly action accent)
          400: "#DFB791",
          300: "#E7CBB0",
          200: "#F2DFCF",
          100: "#FBF4EC", // Soft ochre light surface
          50: "#FDFBF8",
        },
        slate: {
          900: "#1A202C",
          800: "#2D3748",
          700: "#4A5568", // Muted Slate (Body text & secondary text)
          600: "#4A5568",
          500: "#718096", // Text Muted / placeholders
          400: "#A0AEC0",
          300: "#CBD2DA", // Strong border
          200: "#E2E5E9", // Light border
          100: "#F3F4F6", // Very light surface
          50: "#F8F9FA",  // Soft Alabaster background
        },
        // Backward-compatible semantic aliases mapped to the new palette
        cyan: {
          900: "#1A2B4C",
          700: "#B98150",
          600: "#C48F5E",
          500: "#D4A373", // Warm Ochre
          400: "#DFB791",
          300: "#E7CBB0",
          200: "#F2DFCF",
          100: "#FBF4EC",
          50: "#F8F9FA",
        },
        coolgray: {
          500: "#718096",
          400: "#A0AEC0",
          300: "#CBD2DA",
          200: "#E2E5E9",
          100: "#F3F4F6",
          50: "#F8F9FA",
        },
        accent: {
          DEFAULT: "#D4A373",
          hover: "#C48F5E",
          active: "#B98150",
          light: "#FBF4EC",
          text: "#79552F",
          yellow: "#D4A373",
          yellowHover: "#C48F5E",
          yellowLight: "#FBF4EC",
          yellowText: "#79552F",
        },
        status: {
          approved: "#4F6F52",
          approvedBg: "#EEF4EE",
          approvedText: "#315236",
          approvedBorder: "#A7C1A9",
          rejected: "#A6534A",
          rejectedBg: "#F8EEEE",
          rejectedText: "#7A332D",
          rejectedBorder: "#E5B8B3",
          moderate: "#D4A373",
          moderateBg: "#FBF4EC",
          moderateText: "#79552F",
          moderateBorder: "#E7CBB0",
          neutral: "#4A5568",
          neutralBg: "#F3F4F6",
          neutralText: "#4A5568",
          neutralBorder: "#E2E5E9",
        },
        danger: {
          DEFAULT: "#A6534A",
          dark: "#7A332D",
          border: "#E5B8B3",
          light: "#F8EEEE",
        },
        teal: {
          950: "#101C31",
          900: "#1A2B4C",
          850: "#1A2B4C",
          800: "#1A2B4C",
          750: "#D4A373",
          700: "#C48F5E",
          600: "#D4A373",
          500: "#D4A373",
          200: "#CBD2DA",
          100: "#F3F4F6",
          50: "#F8F9FA",
        },
        coral: {
          700: "#B98150",
          600: "#C48F5E",
          500: "#D4A373",
          400: "#DFB791",
          200: "#F2DFCF",
          100: "#FBF4EC",
          50: "#F8F9FA",
        },
        cream: {
          50: "#FFFFFF",
          100: "#F8F9FA", // Soft Alabaster
          200: "#F3F4F6",
          300: "#E2E5E9",
        },
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(26, 43, 76, 0.05), 0 1px 2px -1px rgba(26, 43, 76, 0.05)",
        "card-hover": "0 4px 6px -1px rgba(26, 43, 76, 0.08), 0 2px 4px -2px rgba(26, 43, 76, 0.08)",
        "focus-ochre": "0 0 0 3px rgba(212, 163, 115, 0.20)",
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
        "sm": "4px",
        "md": "8px",
        "lg": "10px",
        "xl": "12px",
        "2xl": "14px",
        "3xl": "16px",
      },
    },
  },
  plugins: [],
};

