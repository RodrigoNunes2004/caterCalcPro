import { type Express } from "express";
import { createServer } from "http";
import healthRoutes from "./health";
import recipeRoutes from "./recipes";
import ingredientsRoutes from "./ingredients";
import eventsRoutes from "./events";
import menuRoutes from "./menus";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Register all route modules
  app.use("/api", healthRoutes);
  app.use("/api", recipeRoutes);
  app.use("/api", ingredientsRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", menuRoutes);

  return httpServer;
}
