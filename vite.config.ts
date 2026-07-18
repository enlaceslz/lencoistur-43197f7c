import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    ViteImageOptimizer({
      jpg: { quality: 80, progressive: true },
      png: { quality: 80, progressive: true },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    chunkSizeWarningLimit: 900,
    // Split heavy vendor libs into their own chunks. The public (marketing)
    // site must NOT download jspdf/recharts unless the user actually opens a
    // page that needs them. Function form is required: the array form let
    // Rollup co-locate date-fns (needed eagerly by Navbar/utils) together
    // with recharts, forcing ~400kB of charts onto the homepage.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion") || id.includes("/motion-dom") || id.includes("/motion-utils")) return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@dnd-kit")) return "vendor-dnd";
          if (
            id.includes("/react") ||
            id.includes("/react-dom") ||
            id.includes("/react-router") ||
            id.includes("/scheduler") ||
            id.includes("use-sync-external-store")
          ) return "vendor-react";
          // recharts and date-fns are left to Rollup's default chunking:
          // recharts is only imported by lazy admin pages, date-fns only by
          // eager components (via lib/utils). Forcing them into manual chunks
          // made Rollup co-locate date-fns with recharts, pulling 384kB of
          // charts onto the marketing homepage.
        },
      },
    },
  },
}));
