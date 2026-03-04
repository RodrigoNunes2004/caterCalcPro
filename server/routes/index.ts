import { type Express } from "express";
import { createServer } from "http";
import healthRoutes from "./health.js";
import authRoutes from "./auth.js";
import recipeRoutes from "./recipes.js";
import ingredientsRoutes from "./ingredients.js";
import eventsRoutes from "./events.js";
import menuRoutes from "./menus.js";
import prepListRoutes from "./prepLists.js";
import inventoryRoutes from "./inventory.js";
import billingRoutes from "./billing.js";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", billingRoutes);
  app.use("/api", recipeRoutes);
  app.use("/api", ingredientsRoutes);
  app.use("/api", eventsRoutes);
  app.use("/api", menuRoutes);
  app.use("/api", prepListRoutes);
  app.use("/api", inventoryRoutes);

  return httpServer;
}
