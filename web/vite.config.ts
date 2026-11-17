import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// don't empty docs/, jobs.json lives there
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "../docs", emptyOutDir: false },
});
