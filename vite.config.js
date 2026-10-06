import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5510 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ["three"], charts: ["chart.js", "react-chartjs-2"], supabase: ["@supabase/supabase-js"] } },
    },
  },
});
