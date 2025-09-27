import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
const __dirname = path.dirname(__filename);

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
