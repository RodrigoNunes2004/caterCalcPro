import express from "express";
import cors from "cors";
import { registerRoutes } from "../server/routes/index.js";
import { serveStatic, log } from "../server/vite.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.DATABASE_URL ? "connected" : "not configured"
  });
});

// Database will be initialized on first access
log("Database will be initialized on first access");

// Register API routes asynchronously
log("Registering API routes...");
registerRoutes(app).catch((error) => {
  log(`Error registering routes: ${error.message}`, "error");
  console.error(error);
});

// Serve static files for production
if (process.env.NODE_ENV === "production") {
  log("Setting up static file serving...");
  serveStatic(app);
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  log(`Error: ${err.message}`, "error");
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Export for Vercel
export default app;
