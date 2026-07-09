/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        mva: {
          cyan: "#22d3ee",
          green: "#10b981",
          lime: "#84cc16",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
      boxShadow: {
        cyber: "0 24px 90px rgba(0, 0, 0, 0.46)",
        glow: "0 0 34px rgba(16, 185, 129, 0.28)",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(34,211,238,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.075) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
