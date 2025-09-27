import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Set environment
app.set("env", process.env.NODE_ENV || "development");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Register routes and start server
(async () => {
  await registerRoutes(app);

  const PORT = process.env.PORT || 3000;

  const server = createServer(app);

  // Serve frontend via Vite (optional)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  server.listen(PORT, () => {
    log(`🚀 CaterCalc Pro server running at http://localhost:${PORT}`);
  });
})();

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log(`❌ Error: ${err.message}`);
  res.status(500).json({ error: err.message });
});
