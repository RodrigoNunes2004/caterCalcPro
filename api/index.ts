import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Initialize storage (runs migrations/schema for PGLite; no-op when DATABASE_URL is set)
import "../server/storage.js";
import authRoutes from "../server/routes/auth.js";
import healthRoutes from "../server/routes/health.js";
import recipeRoutes from "../server/routes/recipes.js";
import ingredientsRoutes from "../server/routes/ingredients.js";
import eventsRoutes from "../server/routes/events.js";
import menuRoutes from "../server/routes/menus.js";
import prepListRoutes from "../server/routes/prepLists.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS - allow credentials and reflect request origin (required for cookies)
app.use(cors({ origin: true, credentials: true }));
// Ensure CORS headers on all responses (including errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes (same as server)
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", recipeRoutes);
app.use("/api", ingredientsRoutes);
app.use("/api", eventsRoutes);
app.use("/api", menuRoutes);
app.use("/api", prepListRoutes);

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, "../dist/public")));

// Prevent favicon 404 (browser requests /favicon.ico before parsing HTML)
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Catch-all: serve React app for non-API routes (Vercel also serves static directly)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({
      error: "Not found",
      path: req.path,
      method: req.method,
      message: "This API route is not handled",
    });
  } else {
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
  }
});

// Error handling middleware - ensure CORS headers on errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  const origin = req.headers?.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export for Vercel
export default app;
