import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),       // ✅ tells Vite how to handle JSX
    tailwindcss(),
     // ✅ enables Tailwind 4 integration
  ],server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000", // your backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
