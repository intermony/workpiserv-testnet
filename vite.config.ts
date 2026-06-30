import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  // ⚠️ TESTNET : doit correspondre EXACTEMENT au nom du repo GitHub.
  // L'app sera servie sur https://intermony.github.io/workpiserv-testnet/
  base: '/workpiserv-testnet/',
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
