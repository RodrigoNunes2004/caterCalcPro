import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { registerRoutes } from "./routes/index.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { initStorage } from "./storage.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware - ensure CORS headers on errors
app.use((err: any, req: any, res: any, next: any) => {
  log(`Error: ${err.message}`, "error");
  console.error(err);
  const origin = req.headers?.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST ?? "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV ?? "development";

if (NODE_ENV === "production" && !process.env.PORT) {
  log("PORT environment variable is required in production", "error");
  process.exit(1);
}

async function main() {
  log("Database will be initialized on first access");
  log("Registering API routes...");
  await registerRoutes(app);

  if (NODE_ENV === "development") {
    log("Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving...");
    serveStatic(app);
  }

  try {
    await initStorage();
    log("Storage initialized");
  } catch (err) {
    log("Storage init failed (run 'pnpm drizzle-kit push' for Neon/PostgreSQL)", "error");
    console.error(err);
  }

  server.listen(PORT, HOST, () => {
    log(`Server running on http://${HOST}:${PORT}`);
    log(`Environment: ${NODE_ENV}`);
  });
}

main();

// Graceful shutdown
process.on("SIGTERM", () => {
  log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    log("Server closed");
    process.exit(0);
  });
});
