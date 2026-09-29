/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages liefert die App unter /Understand-3D/ aus. Lokal und im Test läuft sie unter /.
const base = process.env.PAGES_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: true, host: "127.0.0.1" },
  preview: { port: 4173, strictPort: true, host: "127.0.0.1" },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
