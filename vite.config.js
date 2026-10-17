import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5510 },
  build: {
    target: "es2019",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // separate, long-cached vendor chunks; pages are split automatically via React.lazy
      output: { manualChunks: { react: ["react", "react-dom", "react-router-dom"], charts: ["chart.js", "react-chartjs-2"], supabase: ["@supabase/supabase-js"] } },
    },
  },
});
