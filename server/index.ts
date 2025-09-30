import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes/index.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { storage } from "./storage.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database will be initialized on first access
log("Database will be initialized on first access");

// Register API routes
log("Registering API routes...");
await registerRoutes(app);

// Setup Vite for development or serve static files for production
if (process.env.NODE_ENV === "development") {
  log("Setting up Vite development server...");
  await setupVite(app, server);
} else {
  log("Setting up static file serving...");
  serveStatic(app);
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  log(`Error: ${err.message}`, "error");
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  log(`Server running on http://${HOST}:${PORT}`);
  log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

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
