import { Router } from "express";
import { storage } from "../storage";
import {
  insertIngredientSchema,
  updateIngredientSchema,
} from "../../shared/schema";

const router = Router();

// Get all ingredients with pagination and search
router.get("/ingredients", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const category = req.query.category as string;

    console.log(
      `Fetching ingredients - page: ${page}, limit: ${limit}, search: ${search}, category: ${category}`
    );

    const ingredients = await storage.getIngredients({
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
router.get("/ingredients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching ingredient with ID: ${id}`);

    const ingredient = await storage.getIngredient(id);

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
router.post("/ingredients", async (req, res) => {
  try {
    console.log("Creating new ingredient:", req.body);

    const ingredientData = insertIngredientSchema.parse(req.body);
    const newIngredient = await storage.createIngredient(ingredientData);

    console.log("Created ingredient:", newIngredient);
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

// Update ingredient
router.put("/ingredients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating ingredient ${id}:`, req.body);

    const updateData = updateIngredientSchema.parse(req.body);
    const updatedIngredient = await storage.updateIngredient(id, updateData);

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
router.delete("/ingredients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting ingredient with ID: ${id}`);

    const success = await storage.deleteIngredient(id);

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
router.get("/ingredients/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`Searching ingredients with query: ${query}, limit: ${limit}`);

    const ingredients = await storage.searchIngredients(query, limit);

    res.json(ingredients);
  } catch (error) {
    console.error("Error searching ingredients:", error);
    res.status(500).json({ error: "Failed to search ingredients" });
  }
});

// Get ingredient categories
router.get("/ingredients/categories/list", async (req, res) => {
  try {
    console.log("Fetching ingredient categories");

    const categories = await storage.getIngredientCategories();

    res.json(categories);
  } catch (error) {
    console.error("Error fetching ingredient categories:", error);
    res.status(500).json({ error: "Failed to fetch ingredient categories" });
  }
});

// Bulk create ingredients
router.post("/ingredients/bulk", async (req, res) => {
  try {
    const { ingredients } = req.body;

    console.log(`Bulk creating ${ingredients.length} ingredients`);

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res
        .status(400)
        .json({ error: "Ingredients array is required and must not be empty" });
    }

    // Validate all ingredients
    const validatedIngredients = ingredients.map((ingredient) =>
      insertIngredientSchema.parse(ingredient)
    );

    const createdIngredients = await storage.bulkCreateIngredients(
      validatedIngredients
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
