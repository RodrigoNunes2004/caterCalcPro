import { type Express } from "express";
import { createServer } from "http";
import healthRoutes from "./health.js";
import recipeRoutes from "./recipes.js";
import ingredientsRoutes from "./ingredients.js";
import eventsRoutes from "./events.js";
import menuRoutes from "./menus.js";
import prepListRoutes from "./prepLists.js";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Register all route modules
  app.use("/api", healthRoutes);
  app.use("/api", recipeRoutes);
  app.use("/api", ingredientsRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", menuRoutes);
  app.use("/api", prepListRoutes);

  return httpServer;
}
