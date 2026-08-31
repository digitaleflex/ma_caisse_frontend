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
  build: {
    // Réduction de la taille des chunks via code-splitting manuel manuel
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor React + React DOM
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react'
          }
          // Radix UI
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix'
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'query'
          }
          // Forms (react-hook-form + zod)
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'forms'
          }
          // Recharts
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts'
          }
          // jsPDF + html2canvas (gros, pour les exports)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable') || id.includes('node_modules/html2canvas')) {
            return 'pdf'
          }
          // date-fns
          if (id.includes('node_modules/date-fns')) {
            return 'date'
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
