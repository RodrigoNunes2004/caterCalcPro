import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// In-memory storage for menus (in production, this would be in a database)
let menus: any[] = [
  {
    id: "1",
    name: "Corporate Buffet Menu",
    description: "Perfect for business meetings and conferences",
    category: "corporate",
    isActive: true,
    recipeIds: ["1", "2", "3"], // Sample recipe IDs
    totalCost: 125.5,
    totalRecipes: 3,
    avgPrepTime: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Wedding Reception Menu",
    description: "Elegant dining for special celebrations",
    category: "wedding",
    isActive: true,
    recipeIds: ["1", "4", "5", "6"], // Sample recipe IDs
    totalCost: 275.0,
    totalRecipes: 4,
    avgPrepTime: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all menus with search functionality
router.get("/menus", async (req, res) => {
  try {
    const search = req.query.search as string;
    console.log(`Fetching menus - search: ${search}`);

    // For now, return mock data since we don't have menu storage yet
    const mockMenus = [
      {
        id: "1",
        name: "Corporate Buffet Menu",
        description: "Perfect for business meetings and conferences",
        category: "corporate",
        isActive: true,
        totalCost: 125.5,
        totalRecipes: 5,
        avgPrepTime: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Wedding Reception Menu",
        description: "Elegant dining for special celebrations",
        category: "wedding",
        isActive: true,
        totalCost: 275.0,
        totalRecipes: 8,
        avgPrepTime: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter by search term if provided
    const filteredMenus = search
      ? menus.filter(
          (menu) =>
            menu.name.toLowerCase().includes(search.toLowerCase()) ||
            menu.description.toLowerCase().includes(search.toLowerCase()) ||
            menu.category.toLowerCase().includes(search.toLowerCase())
        )
      : menus;

    res.json(filteredMenus);
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

    // Create new menu and add to persistent storage
    const newMenu = {
      id: Date.now().toString(),
      name,
      description: description || "",
      category,
      isActive: isActive !== false,
      recipeIds: recipeIds || [], // Store the recipe IDs
      totalCost: totalCost,
      totalRecipes: recipeIds ? recipeIds.length : 0,
      avgPrepTime: avgPrepTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to persistent storage
    menus.push(newMenu);

    console.log("Created menu:", newMenu);
    console.log("Total menus now:", menus.length);
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

    // Find and update menu in persistent storage
    const menuIndex = menus.findIndex((menu) => menu.id === id);
    if (menuIndex === -1) {
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

    const updatedMenu = {
      ...menus[menuIndex],
      name,
      description: description || "",
      category,
      isActive: isActive !== false,
      recipeIds: recipeIds || [], // Store the recipe IDs
      totalCost: totalCost,
      totalRecipes: recipeIds ? recipeIds.length : 0,
      avgPrepTime: avgPrepTime,
      updatedAt: new Date().toISOString(),
    };

    menus[menuIndex] = updatedMenu;

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

    // Find and delete menu from persistent storage
    const menuIndex = menus.findIndex((menu) => menu.id === id);
    if (menuIndex === -1) {
      return res.status(404).json({ error: "Menu not found" });
    }

    menus.splice(menuIndex, 1);
    console.log(`Successfully deleted menu ${id}`);
    console.log("Total menus now:", menus.length);
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

    const menu = menus.find((menu) => menu.id === id);
    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    // Fetch recipe details for the menu's recipe IDs
    let menuRecipes = [];
    if (menu.recipeIds && menu.recipeIds.length > 0) {
      try {
        // Fetch recipes from the recipes API
        const recipePromises = menu.recipeIds.map(async (recipeId: string) => {
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

        const recipeResults = await Promise.all(recipePromises);
        menuRecipes = recipeResults.filter((recipe) => recipe !== null);
      } catch (error) {
        console.error("Error fetching menu recipes:", error);
      }
    }

    const menuWithRecipes = {
      ...menu,
      recipes: menuRecipes,
    };

    console.log("Menu with recipes:", menuWithRecipes);
    res.json(menuWithRecipes);
  } catch (error) {
    console.error("Error fetching menu details:", error);
    res.status(500).json({ error: "Failed to fetch menu details" });
  }
});

export default router;
