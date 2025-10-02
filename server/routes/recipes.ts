import { Router } from "express";
import { storage, db } from "../storage";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSubRecipes,
  insertRecipeSchema,
  updateRecipeSchema,
  insertRecipeIngredientSchema,
  insertRecipeSubRecipeSchema,
  type RecipeWithIngredients,
} from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Get all recipes with pagination and search
router.get("/recipes", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;

    console.log(
      `Fetching recipes - page: ${page}, limit: ${limit}, search: ${search}, category: ${category}`
    );

    const allRecipes = await storage.getRecipes({
      page,
      limit,
      search,
      category,
    });

    res.json(allRecipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Get single recipe with ingredients and sub-recipes
router.get("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching recipe with ID: ${id}`);

    const recipe = await storage.getRecipeWithIngredients(id);

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// Create new recipe
router.post("/recipes", async (req, res) => {
  try {
    console.log("Creating new recipe:", req.body);

    const {
      ingredients: formIngredients,
      subRecipes: formSubRecipes,
      ...recipeData
    } = req.body;

    // Validate recipe data (without ingredients/subRecipes)
    const validatedRecipeData = insertRecipeSchema.parse(recipeData);

    // Create the recipe first
    const newRecipe = await storage.createRecipe(validatedRecipeData);

    // Create ingredients and link them to the recipe
    if (formIngredients && formIngredients.length > 0) {
      for (const ingredient of formIngredients) {
        // Create or find the ingredient
        let ingredientRecord;
        try {
          // Try to find existing ingredient by name
          const existingIngredients = await storage.searchIngredients(
            ingredient.name,
            1
          );
          if (existingIngredients.length > 0) {
            ingredientRecord = existingIngredients[0];
          } else {
            // Create new ingredient
            ingredientRecord = await storage.createIngredient({
              name: ingredient.name,
              defaultUnit: ingredient.unit,
              costPerUnit: ingredient.costPerUnit.toString(),
              category: "other", // Default category
            });
          }
        } catch (error) {
          console.error("Error creating ingredient:", error);
          // Create new ingredient with fallback
          ingredientRecord = await storage.createIngredient({
            name: ingredient.name,
            defaultUnit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit.toString(),
            category: "other",
          });
        }

        // Link ingredient to recipe
        await storage.addIngredientToRecipe({
          recipeId: newRecipe.id,
          ingredientId: ingredientRecord.id,
          quantity: ingredient.quantity.toString(),
          unit: ingredient.unit,
          notes: ingredient.notes || null,
        });
      }
    }

    console.log("Created recipe:", newRecipe);
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

// Update recipe
router.put("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating recipe ${id}:`, req.body);

    const updateData = updateRecipeSchema.parse(req.body);
    const updatedRecipe = await storage.updateRecipe(id, updateData);

    if (!updatedRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    console.log("Updated recipe:", updatedRecipe);
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Delete recipe
router.delete("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting recipe with ID: ${id}`);

    const success = await storage.deleteRecipe(id);

    if (!success) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    console.log(`Successfully deleted recipe ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// Add ingredient to recipe
router.post("/recipes/:id/ingredients", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Adding ingredient to recipe ${id}:`, req.body);

    const ingredientData = insertRecipeIngredientSchema.parse({
      ...req.body,
      recipeId: id,
    });

    const newIngredient = await storage.addIngredientToRecipe(ingredientData);

    console.log("Added ingredient to recipe:", newIngredient);
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error adding ingredient to recipe:", error);
    res.status(500).json({ error: "Failed to add ingredient to recipe" });
  }
});

// Remove ingredient from recipe
router.delete(
  "/recipes/:recipeId/ingredients/:ingredientId",
  async (req, res) => {
    try {
      const { recipeId, ingredientId } = req.params;
      console.log(
        `Removing ingredient ${ingredientId} from recipe ${recipeId}`
      );

      const success = await storage.removeIngredientFromRecipe(
        recipeId,
        ingredientId
      );

      if (!success) {
        return res.status(404).json({ error: "Recipe ingredient not found" });
      }

      console.log(
        `Successfully removed ingredient ${ingredientId} from recipe ${recipeId}`
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing ingredient from recipe:", error);
      res
        .status(500)
        .json({ error: "Failed to remove ingredient from recipe" });
    }
  }
);

// Add sub-recipe to recipe
router.post("/recipes/:id/sub-recipes", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Adding sub-recipe to recipe ${id}:`, req.body);

    const subRecipeData = insertRecipeSubRecipeSchema.parse({
      ...req.body,
      parentRecipeId: id,
    });

    const newSubRecipe = await storage.addSubRecipeToRecipe(subRecipeData);

    console.log("Added sub-recipe to recipe:", newSubRecipe);
    res.status(201).json(newSubRecipe);
  } catch (error) {
    console.error("Error adding sub-recipe to recipe:", error);
    res.status(500).json({ error: "Failed to add sub-recipe to recipe" });
  }
});

// Calculate recipe cost and scaling
router.post("/recipes/:id/calculate", async (req, res) => {
  try {
    const { id } = req.params;
    const { guestCount, targetServings } = req.body;

    console.log(
      `Calculating costs for recipe ${id}, guests: ${guestCount}, servings: ${targetServings}`
    );

    const calculation = await storage.calculateRecipeCosts(id, {
      guestCount: guestCount || null,
      targetServings: targetServings || null,
    });

    console.log("Recipe calculation result:", calculation);
    res.json(calculation);
  } catch (error) {
    console.error("Error calculating recipe costs:", error);
    res.status(500).json({ error: "Failed to calculate recipe costs" });
  }
});

// Generate shopping list for multiple recipes
router.post("/recipes/shopping-list", async (req, res) => {
  try {
    const { recipes: recipeList, guestCount } = req.body;

    if (!Array.isArray(recipeList) || recipeList.length === 0) {
      return res
        .status(400)
        .json({ error: "Recipe list is required and must not be empty" });
    }

    console.log(
      `Generating shopping list for ${recipeList.length} recipes, guests: ${guestCount}`
    );

    const shoppingList = await storage.generateShoppingList(
      recipeList,
      guestCount
    );

    console.log("Generated shopping list:", shoppingList);
    res.json(shoppingList);
  } catch (error) {
    console.error("Error generating shopping list:", error);
    res.status(500).json({ error: "Failed to generate shopping list" });
  }
});

// Scale recipe proportionally (when one ingredient is modified)
router.post("/recipes/:id/adjust-proportions", async (req, res) => {
  try {
    const { id } = req.params;
    const { modifiedIngredientId, newQuantity } = req.body;

    console.log(
      `Adjusting proportions for recipe ${id}, ingredient ${modifiedIngredientId}, new quantity: ${newQuantity}`
    );

    const adjustedRecipe = await storage.adjustRecipeProportions(
      id,
      modifiedIngredientId,
      newQuantity
    );

    console.log("Adjusted recipe proportions:", adjustedRecipe);
    res.json(adjustedRecipe);
  } catch (error) {
    console.error("Error adjusting recipe proportions:", error);
    res.status(500).json({ error: "Failed to adjust recipe proportions" });
  }
});

// Get recipe nutrition info and percentages
router.get("/recipes/:id/nutrition", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching nutrition info for recipe ${id}`);

    const nutritionInfo = await storage.getRecipeNutrition(id);

    console.log("Recipe nutrition info:", nutritionInfo);
    res.json(nutritionInfo);
  } catch (error) {
    console.error("Error fetching recipe nutrition:", error);
    res.status(500).json({ error: "Failed to fetch recipe nutrition" });
  }
});

export default router;
