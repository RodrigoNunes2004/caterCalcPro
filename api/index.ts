import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug - no storage dependency, runs before any heavy imports
app.get("/api/debug", (req, res) => {
  res.json({
    ok: true,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwt: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
});

// Lazy-load routes (storage/PGLite can crash on Vercel cold start if imported at top level)
let routesLoaded = false;
let routesLoadError: Error | null = null;

app.use("/api", async (req, res, next) => {
  if (req.path === "/debug") return next();
  if (!routesLoaded && !routesLoadError) {
    try {
      await import("../server/storage.js");
      const { default: healthRoutes } = await import("../server/routes/health.js");
      const { default: authRoutes } = await import("../server/routes/auth.js");
      const { default: recipeRoutes } = await import("../server/routes/recipes.js");
      const { default: ingredientsRoutes } = await import("../server/routes/ingredients.js");
      const { default: eventsRoutes } = await import("../server/routes/events.js");
      const { default: menuRoutes } = await import("../server/routes/menus.js");
      const { default: prepListRoutes } = await import("../server/routes/prepLists.js");
      app.use("/api", healthRoutes);
      app.use("/api", authRoutes);
      app.use("/api", recipeRoutes);
      app.use("/api", ingredientsRoutes);
      app.use("/api", eventsRoutes);
      app.use("/api", menuRoutes);
      app.use("/api", prepListRoutes);
      routesLoaded = true;
    } catch (err) {
      routesLoadError = err instanceof Error ? err : new Error(String(err));
      console.error("Routes load failed:", routesLoadError);
    }
  }
  if (routesLoadError) {
    return res.status(503).json({
      error: "Service temporarily unavailable",
      message: routesLoadError.message,
    });
  }
  next();
});

// Static + catch-all
app.use(express.static(path.join(__dirname, "../dist/public")));
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found", path: req.path });
  } else {
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  const origin = req.headers?.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
