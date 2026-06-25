/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify paths to search for Tailwind classes in the Expo Router structure
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#DC2626", // Crimson Red
          secondary: "#EF4444",
          hover: "#B91C1C",
          background: "#030712", // Rich dark slate
          panel: "#090D1A",    // Deep blue slate
          subpanel: "#060914", // Deeper chamber
          border: "#101726",   // Structured borders
          lightBorder: "#1E293B",
          textMuted: "#6B7280"
        }
      },
      fontFamily: {
        sans: ["System", "sans-serif"],
        mono: ["Courier New", "monospace"]
      }
    }
  },
  plugins: []
}
