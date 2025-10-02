import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database status endpoint
router.get("/status", async (_req, res) => {
  try {
    const dbStatus = await storage.getDatabaseStatus();
    res.json({
      status: "healthy",
      database: process.env.DATABASE_URL ? "postgresql" : "in-memory",
      data: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Initialize sample data endpoint
router.post("/init-sample-data", async (_req, res) => {
  try {
    const result = await storage.initializeSampleData();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Clear all data endpoint (for development)
router.delete("/clear-data", async (_req, res) => {
  try {
    const result = await storage.clearAllData();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
