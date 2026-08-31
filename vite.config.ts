import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"



export default defineConfig({
  server: {
    port: 8080,
    host: true,
    strictPort: false,
    // Preload key client files to reduce first navigation latency in dev
    warmup: { clientFiles: ["src/main.tsx", "src/App.tsx"] },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  // Configuration pour vite preview (production)
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    // VitePWA({...}) disabled - causing dev server crashes
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Speed up cold-start by pre-bundling heavy deps used across the app
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "clsx",
      "class-variance-authority",
      "tailwind-merge",
      "react-hook-form",
      "zod",
      "lucide-react",
      // Radix packages commonly used in this project
      "@radix-ui/react-dialog",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-aspect-ratio",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
    ],
  },
})
