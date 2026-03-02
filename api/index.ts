import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Static imports so Vercel bundles everything; storage.ts uses Neon only when DATABASE_URL is set
import "../server/storage.js";
import healthRoutes from "../server/routes/health.js";
import authRoutes from "../server/routes/auth.js";
import recipeRoutes from "../server/routes/recipes.js";
import ingredientsRoutes from "../server/routes/ingredients.js";
import eventsRoutes from "../server/routes/events.js";
import menuRoutes from "../server/routes/menus.js";
import prepListRoutes from "../server/routes/prepLists.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

app.get("/api/debug", (req, res) => {
  res.json({
    ok: true,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwt: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", recipeRoutes);
app.use("/api", ingredientsRoutes);
app.use("/api", eventsRoutes);
app.use("/api", menuRoutes);
app.use("/api", prepListRoutes);

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
