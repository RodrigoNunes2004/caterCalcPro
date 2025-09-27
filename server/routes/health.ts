import { Router } from "express";

const router = Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database status endpoint
router.get("/status", async (_req, res) => {
  try {
    res.json({
      status: "healthy",
      database: process.env.DATABASE_URL ? "postgresql" : "in-memory",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
