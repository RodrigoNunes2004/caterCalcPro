import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { viteBridge } from "vite-bridge";
import path from "path";
// Get current directory for Node.js v18 compatibility
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "~": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    build: {
      outDir: "dist/public",
    },
  };
});
