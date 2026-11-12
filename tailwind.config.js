/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Brand Accent (Oh My Cashier vibrant orange/coral)
        brand: {
          DEFAULT: "#f97316",
          hover: "#ea580c",
          active: "#c2410c",
          subtle: "rgba(249, 115, 22, 0.12)",
          border: "rgba(249, 115, 22, 0.3)",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        // Cyberpunk 2077 Neon Theme Colors
        cyber: {
          pink: "#ff007f",
          magenta: "#f72585",
          cyan: "#00f0ff",
          yellow: "#ffe600",
          purple: "#9d4edd",
          green: "#00ff9f",
          bg: "#080811",
          surface: "#12132b",
          card: "#181938",
          elevated: "#242654",
          border: "#ff007f",
        },
        // Unified Dark Slate / Zinc Neutral Palette
        surface: {
          sidebar: "#020617", // Slate 950 (Sidebar navigation & top app bar)
          primary: "#0f172a", // Slate 900 (Main view background canvas)
          card: "#1e293b", // Slate 800 (Cards, panels, table containers)
          elevated: "#334155", // Slate 700 (Modals, hover states, badges)
          input: "#0b1120", // Slate 950/Deep Slate (Input fields)
        },
        border: {
          subtle: "#334155", // Slate 700 (Default divider & border)
          muted: "#1e293b", // Slate 800 (Subtle inner lines)
          focus: "#f97316", // Brand orange for active focus rings
        },
        // Semantic Status Colors
        status: {
          success: "#10b981", // Emerald: Selesai, Transaksi Berhasil, Kas Masuk
          warning: "#f59e0b", // Amber: Antre / Dimasak, Warning stok
          danger: "#f43f5e", // Rose: Dibatalkan, Void, Kas Keluar
          info: "#3b82f6", // Blue: Dine-in / Take-away, Info tags
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
