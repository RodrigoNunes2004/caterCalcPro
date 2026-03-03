import { Router } from "express";
import { storage } from "../storage.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { requireBillingAccess } from "../middleware/billing.js";
import {
  insertIngredientSchema,
  updateIngredientSchema,
} from "../../shared/schema.js";

const router = Router();
router.use(authMiddleware, requireBillingAccess);

// Get all ingredients with pagination and search
router.get("/ingredients", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const ingredients = await storage.getIngredients({
      organizationId: orgId,
      page,
      limit,
      search,
      category,
    });

    res.json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// Get single ingredient
router.get("/ingredients/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;
    const ingredient = await storage.getIngredient(id, orgId);

    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json(ingredient);
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

// Create new ingredient
router.post("/ingredients", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const processedData = {
      ...req.body,
      costPerUnit: req.body.costPerUnit
        ? String(req.body.costPerUnit)
        : undefined,
    };

    const ingredientData = insertIngredientSchema.parse(processedData);
    const newIngredient = await storage.createIngredient({
      ...ingredientData,
      organizationId: orgId,
    });

    console.log("Created ingredient:", newIngredient);
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

// Update ingredient
router.put("/ingredients/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;
    const updateData = updateIngredientSchema.parse(req.body);
    const updatedIngredient = await storage.updateIngredient(id, orgId, updateData);

    if (!updatedIngredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    console.log("Updated ingredient:", updatedIngredient);
    res.json(updatedIngredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ error: "Failed to update ingredient" });
  }
});

// Delete ingredient
router.delete("/ingredients/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;
    const success = await storage.deleteIngredient(id, orgId);

    if (!success) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    console.log(`Successfully deleted ingredient ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

// Search ingredients by name (for autocomplete)
router.get("/ingredients/search/:query", async (req: AuthRequest, res) => {
  try {
    const { query } = req.params;
    const orgId = req.auth!.organizationId;
    const limit = parseInt(req.query.limit as string) || 10;

    const ingredients = await storage.searchIngredients(query, orgId, limit);

    res.json(ingredients);
  } catch (error) {
    console.error("Error searching ingredients:", error);
    res.status(500).json({ error: "Failed to search ingredients" });
  }
});

// Get ingredient categories
router.get("/ingredients/categories/list", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const categories = await storage.getIngredientCategories(orgId);

    res.json(categories);
  } catch (error) {
    console.error("Error fetching ingredient categories:", error);
    res.status(500).json({ error: "Failed to fetch ingredient categories" });
  }
});

// Bulk create ingredients
router.post("/ingredients/bulk", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res
        .status(400)
        .json({ error: "Ingredients array is required and must not be empty" });
    }

    const validatedIngredients = (ingredients as any[]).map((ingredient: any) =>
      insertIngredientSchema.parse({ ...ingredient, organizationId: orgId })
    );

    const createdIngredients = await storage.bulkCreateIngredients(
      validatedIngredients as any
    );

    console.log(
      `Successfully created ${createdIngredients.length} ingredients`
    );
    res.status(201).json(createdIngredients);
  } catch (error) {
    console.error("Error bulk creating ingredients:", error);
    res.status(500).json({ error: "Failed to bulk create ingredients" });
  }
});

export default router;
