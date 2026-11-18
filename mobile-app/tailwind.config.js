/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./context/**/*.{js,jsx,ts,tsx}", "./data/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F1EB",
        ink: "#17211B",
        muted: "#858A82",
        lime: "#C8EF73",
        line: "#E3E0D8",
      },
    },
  },
  plugins: [],
};
