/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: "#090D16",
          panel: "#121826",
          border: "#1E293B",
          accent: "#00F0FF",
          red: "#E63946",
          pink: "#FF2A54",
          yellow: "#FFE600",
          paper: "#F5F2EB",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        headline: ["'Plus Jakarta Sans'", "Montserrat", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        impact: ["Impact", "'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
