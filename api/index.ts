import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, "../dist/public")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint called");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.DATABASE_URL ? "connected" : "not configured",
  });
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "API is working!" });
});

// Events endpoint (simplified)
app.get("/api/events", (req, res) => {
  console.log("Events endpoint called");
  res.json([
    {
      id: "1",
      name: "Sample Event",
      description: "This is a test event",
      eventDate: new Date().toISOString(),
      venue: "Test Venue",
      guestCount: 50,
      status: "confirmed"
    }
  ]);
});

// Menus endpoint (simplified)
app.get("/api/menus", (req, res) => {
  console.log("Menus endpoint called");
  res.json([
    {
      id: "1",
      name: "Sample Menu",
      description: "This is a test menu",
      category: "test",
      isActive: true,
      totalCost: 100.0
    }
  ]);
});

// Catch-all route: send back React's index.html file for any non-API routes
app.get("*", (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith("/api/")) {
    console.log(`Unhandled API route: ${req.method} ${req.path}`);
    res.status(404).json({ 
      error: "Not found", 
      path: req.path,
      method: req.method,
      message: "This API route is not handled"
    });
  } else {
    // For all other routes, serve the React app
    console.log(`Serving React app for: ${req.path}`);
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Export for Vercel
export default app;
