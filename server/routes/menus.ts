import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get all menus with search functionality
router.get("/menus", async (req, res) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    console.log(
      `Fetching menus - search: ${search}, category: ${category}, page: ${page}, limit: ${limit}`
    );

    const result = await storage.getMenus({
      search,
      category,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Failed to fetch menus" });
  }
});

// Create new menu
router.post("/menus", async (req, res) => {
  try {
    console.log("Creating new menu:", req.body);

    const { name, description, category, isActive, recipeIds } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }

    // Calculate totalCost and avgPrepTime from recipes
    let totalCost = 0;
    let avgPrepTime = 0;

    if (recipeIds && recipeIds.length > 0) {
      try {
        // Fetch recipe details to calculate totals
        const recipePromises = recipeIds.map(async (recipeId: string) => {
          try {
            const response = await fetch(
              `http://localhost:3000/api/recipes/${recipeId}`
            );
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.error(`Error fetching recipe ${recipeId}:`, error);
            return null;
          }
        });

        const recipes = await Promise.all(recipePromises);
        const validRecipes = recipes.filter((recipe) => recipe !== null);

        // Calculate totals from actual recipe data
        if (validRecipes.length > 0) {
          totalCost = validRecipes.reduce((sum, recipe) => {
            const recipeCost =
              recipe.ingredients?.reduce(
                (ingredientSum: number, recipeIngredient: any) => {
                  const quantity = parseFloat(recipeIngredient.quantity);
                  const costPerUnit = parseFloat(
                    recipeIngredient.ingredient.costPerUnit
                  );
                  return ingredientSum + quantity * costPerUnit;
                },
                0
              ) || 0;
            return sum + recipeCost;
          }, 0);

          avgPrepTime = Math.round(
            validRecipes.reduce((sum, recipe) => {
              return sum + (recipe.prepTime || 0) + (recipe.cookTime || 0);
            }, 0) / validRecipes.length
          );
        }
      } catch (error) {
        console.error("Error calculating menu totals:", error);
      }
    }

    // Create new menu in database
    const newMenu = await storage.createMenu({
      name,
      description: description || "",
      category,
      isActive: isActive !== false,
      totalCost: totalCost.toString(),
      totalRecipes: recipeIds ? recipeIds.length : 0,
      avgPrepTime: avgPrepTime,
    });

    // Add recipes to menu if provided
    if (recipeIds && recipeIds.length > 0) {
      for (let i = 0; i < recipeIds.length; i++) {
        await storage.addRecipeToMenu({
          menuId: newMenu.id,
          recipeId: recipeIds[i],
          order: i,
        });
      }
    }

    console.log("Created menu:", newMenu);
    res.status(201).json(newMenu);
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ error: "Failed to create menu" });
  }
});

// Update menu
router.put("/menus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating menu ${id}:`, req.body);

    const { name, description, category, isActive, recipeIds } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }

    // Check if menu exists
    const existingMenu = await storage.getMenu(id);
    if (!existingMenu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    // Calculate totalCost and avgPrepTime from recipes
    let totalCost = 0;
    let avgPrepTime = 0;

    if (recipeIds && recipeIds.length > 0) {
      try {
        // Fetch recipe details to calculate totals
        const recipePromises = recipeIds.map(async (recipeId: string) => {
          try {
            const response = await fetch(
              `http://localhost:3000/api/recipes/${recipeId}`
            );
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.error(`Error fetching recipe ${recipeId}:`, error);
            return null;
          }
        });

        const recipes = await Promise.all(recipePromises);
        const validRecipes = recipes.filter((recipe) => recipe !== null);

        // Calculate totals from actual recipe data
        if (validRecipes.length > 0) {
          totalCost = validRecipes.reduce((sum, recipe) => {
            const recipeCost =
              recipe.ingredients?.reduce(
                (ingredientSum: number, recipeIngredient: any) => {
                  const quantity = parseFloat(recipeIngredient.quantity);
                  const costPerUnit = parseFloat(
                    recipeIngredient.ingredient.costPerUnit
                  );
                  return ingredientSum + quantity * costPerUnit;
                },
                0
              ) || 0;
            return sum + recipeCost;
          }, 0);

          avgPrepTime = Math.round(
            validRecipes.reduce((sum, recipe) => {
              return sum + (recipe.prepTime || 0) + (recipe.cookTime || 0);
            }, 0) / validRecipes.length
          );
        }
      } catch (error) {
        console.error("Error calculating menu totals:", error);
      }
    }

    // Update menu in database
    const updatedMenu = await storage.updateMenu(id, {
      name,
      description: description || "",
      category,
      isActive: isActive !== false,
      totalCost: totalCost.toString(),
      totalRecipes: recipeIds ? recipeIds.length : 0,
      avgPrepTime: avgPrepTime,
    });

    if (!updatedMenu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    // Update recipes in menu if provided
    if (recipeIds) {
      // Remove existing recipes
      for (const existingRecipe of existingMenu.recipes || []) {
        await storage.removeRecipeFromMenu(id, existingRecipe.recipeId);
      }

      // Add new recipes
      for (let i = 0; i < recipeIds.length; i++) {
        await storage.addRecipeToMenu({
          menuId: id,
          recipeId: recipeIds[i],
          order: i,
        });
      }
    }

    console.log("Updated menu:", updatedMenu);
    res.json(updatedMenu);
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ error: "Failed to update menu" });
  }
});

// Delete menu
router.delete("/menus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting menu with ID: ${id}`);

    const success = await storage.deleteMenu(id);
    if (!success) {
      return res.status(404).json({ error: "Menu not found" });
    }

    console.log(`Successfully deleted menu ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({ error: "Failed to delete menu" });
  }
});

// Get menu details with recipes
router.get("/menus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching menu details for ID: ${id}`);

    const menu = await storage.getMenu(id);
    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    console.log("Menu with recipes:", menu);
    res.json(menu);
  } catch (error) {
    console.error("Error fetching menu details:", error);
    res.status(500).json({ error: "Failed to fetch menu details" });
  }
});

export default router;
