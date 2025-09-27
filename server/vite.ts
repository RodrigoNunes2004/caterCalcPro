import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { fileURLToPath } from "url";

// Get current directory for Node.js v18 compatibility
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
    },
    allowedHosts: true as const,
  };

  // Properly resolve the config function with development mode
  const resolvedConfig =
    typeof viteConfig === "function"
      ? viteConfig({ mode: "development", command: "serve" })
      : viteConfig;

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        // Log the error but don't exit the process
        log(`Vite error: ${msg}`, "vite-error");
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Only serve HTML for non-API routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by the API middleware
    if (url.startsWith("/api/")) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(__dirname, "..", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Transform the HTML with Vite (this handles CSS injection and module resolution)
      const html = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, __dirname points to the built server (dist directory)
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve static assets including index.html for CSR
  app.use(express.static(distPath));

  // Fallback to index.html for client-side routing (SPA) - but skip API routes
  app.use("*", (req, res, next) => {
    // Skip API routes - let them be handled by the API middleware
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");
    res.sendFile(indexPath);
  });
}
