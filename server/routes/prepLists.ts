import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Types for prep list generation
interface PrepListRequest {
  eventId: string;
  menuIds: string[];
  guestCount: number;
  userOverrides?: {
    [ingredientId: string]: {
      quantity: number;
      unit: string;
    };
  };
}

interface ScaledIngredient {
  ingredientId: string;
  name: string;
  category: string;
  originalQuantity: number;
  originalUnit: string;
  scaledQuantity: number;
  scaledUnit: string;
  prepTasks: string[];
  notes?: string;
}

interface PrepTask {
  task: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
}

interface InventoryItem {
  ingredientId: string;
  name: string;
  currentStock: number;
  unit: string;
  minimumStock: number;
}

interface PurchaseItem {
  ingredientId: string;
  name: string;
  neededQuantity: number;
  unit: string;
  currentStock: number;
  shortfall: number;
}

// Unit conversion utilities
const UNIT_CONVERSIONS = {
  // Weight conversions (to grams)
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.59,
  pound: 453.59,
  pounds: 453.59,

  // Volume conversions (to ml)
  ml: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 250,
  cups: 250,
  tbsp: 15,
  tsp: 5,
  tablespoon: 15,
  teaspoon: 5,
  tablespoons: 15,
  teaspoons: 5,
  "fl oz": 29.57,
  pint: 473.18,
  quart: 946.35,
  gallon: 3785.41,

  // Count conversions
  pcs: 1,
  pieces: 1,
  each: 1,
  whole: 1,
  item: 1,
  items: 1,
};

function convertToBaseUnit(
  quantity: number,
  unit: string
): { quantity: number; baseUnit: string } {
  const normalizedUnit = unit.toLowerCase().trim();
  const conversion = UNIT_CONVERSIONS[normalizedUnit];

  if (conversion) {
    // Determine if it's weight or volume
    if (["g", "kg", "oz", "lb", "pound", "pounds"].includes(normalizedUnit)) {
      return { quantity: quantity * conversion, baseUnit: "g" };
    } else if (
      [
        "ml",
        "l",
        "liter",
        "liters",
        "cup",
        "cups",
        "tbsp",
        "tsp",
        "tablespoon",
        "teaspoon",
        "tablespoons",
        "teaspoons",
        "fl oz",
        "pint",
        "quart",
        "gallon",
      ].includes(normalizedUnit)
    ) {
      return { quantity: quantity * conversion, baseUnit: "ml" };
    } else {
      return { quantity: quantity, baseUnit: "pcs" };
    }
  }

  return { quantity, baseUnit: unit };
}

function convertFromBaseUnit(
  quantity: number,
  baseUnit: string,
  targetUnit: string
): number {
  const normalizedTarget = targetUnit.toLowerCase().trim();
  const conversion = UNIT_CONVERSIONS[normalizedTarget];

  if (!conversion) return quantity;

  // Convert from base unit to target unit
  if (
    baseUnit === "g" &&
    ["g", "kg", "oz", "lb", "pound", "pounds"].includes(normalizedTarget)
  ) {
    return quantity / conversion;
  } else if (
    baseUnit === "ml" &&
    [
      "ml",
      "l",
      "liter",
      "liters",
      "cup",
      "cups",
      "tbsp",
      "tsp",
      "tablespoon",
      "teaspoon",
      "tablespoons",
      "teaspoons",
      "fl oz",
      "pint",
      "quart",
      "gallon",
    ].includes(normalizedTarget)
  ) {
    return quantity / conversion;
  } else if (
    baseUnit === "pcs" &&
    ["pcs", "pieces", "each", "whole", "item", "items"].includes(
      normalizedTarget
    )
  ) {
    return quantity;
  }

  return quantity;
}

// Extract prep tasks from recipe instructions
function extractPrepTasks(instructions: string): string[] {
  const tasks: string[] = [];
  const lines = instructions
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  for (const line of lines) {
    // Look for common prep verbs
    const prepVerbs = [
      "dice",
      "chop",
      "slice",
      "mince",
      "julienne",
      "brunoise",
      "chiffonade",
      "blanch",
      "boil",
      "steam",
      "roast",
      "bake",
      "grill",
      "fry",
      "sauté",
      "marinate",
      "season",
      "mix",
      "combine",
      "whisk",
      "beat",
      "fold",
      "portion",
      "divide",
      "separate",
      "trim",
      "clean",
      "wash",
      "peel",
      "grate",
      "shred",
      "crush",
      "mash",
      "puree",
      "strain",
      "drain",
    ];

    const lowerLine = line.toLowerCase();
    for (const verb of prepVerbs) {
      if (lowerLine.includes(verb)) {
        // Extract the task description
        const taskMatch = line.match(
          new RegExp(`\\d+[^\\d]*${verb}[^\\d]*`, "i")
        );
        if (taskMatch) {
          tasks.push(taskMatch[0].trim());
        } else {
          // Just add the verb with context
          const contextMatch = line.match(
            new RegExp(`[^\\d]*${verb}[^\\d]*`, "i")
          );
          if (contextMatch) {
            tasks.push(contextMatch[0].trim());
          }
        }
      }
    }
  }

  return [...new Set(tasks)]; // Remove duplicates
}

// Generate prep list
router.post("/prep-lists", async (req, res) => {
  try {
    console.log("Generating prep list:", req.body);

    const {
      eventId,
      menuIds,
      guestCount,
      userOverrides = {},
    }: PrepListRequest = req.body;

    if (!eventId || !menuIds || !guestCount) {
      return res.status(400).json({
        error: "Event ID, menu IDs, and guest count are required",
      });
    }

    // Fetch event details
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch menus and their recipes
    const menus = [];
    for (const menuId of menuIds) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/menus/${menuId}`
        );
        if (response.ok) {
          const menu = await response.json();
          menus.push(menu);
        }
      } catch (error) {
        console.error(`Error fetching menu ${menuId}:`, error);
      }
    }

    if (menus.length === 0) {
      return res.status(404).json({ error: "No valid menus found" });
    }

    // Collect all recipes from all menus
    const allRecipes = [];
    for (const menu of menus) {
      if (menu.recipes && menu.recipes.length > 0) {
        allRecipes.push(...menu.recipes);
      }
    }

    if (allRecipes.length === 0) {
      return res
        .status(404)
        .json({ error: "No recipes found in selected menus" });
    }

    // Process ingredients and scale them
    const scaledIngredients: ScaledIngredient[] = [];
    const ingredientMap = new Map<string, ScaledIngredient>();

    for (const recipe of allRecipes) {
      const scaleFactor = guestCount / recipe.servings;

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredient;
          const originalQuantity = parseFloat(recipeIngredient.quantity);
          const originalUnit = recipeIngredient.unit;

          // Check for user override
          let finalQuantity = originalQuantity * scaleFactor;
          let finalUnit = originalUnit;

          if (userOverrides[ingredient.id]) {
            finalQuantity = userOverrides[ingredient.id].quantity;
            finalUnit = userOverrides[ingredient.id].unit;
          }

          // Extract prep tasks from recipe instructions
          const prepTasks = extractPrepTasks(recipe.instructions || "");

          const key = ingredient.id;
          if (ingredientMap.has(key)) {
            // Consolidate with existing ingredient
            const existing = ingredientMap.get(key)!;
            const { quantity: existingBase, baseUnit: existingBaseUnit } =
              convertToBaseUnit(existing.scaledQuantity, existing.scaledUnit);
            const { quantity: newBase, baseUnit: newBaseUnit } =
              convertToBaseUnit(finalQuantity, finalUnit);

            // Convert to same base unit and add
            let totalBaseQuantity = existingBase;
            if (existingBaseUnit === newBaseUnit) {
              totalBaseQuantity += newBase;
            } else {
              // Convert new quantity to existing base unit
              totalBaseQuantity += convertFromBaseUnit(
                newBase,
                newBaseUnit,
                existingBaseUnit
              );
            }

            // Convert back to display unit
            const displayQuantity = convertFromBaseUnit(
              totalBaseQuantity,
              existingBaseUnit,
              existing.scaledUnit
            );

            existing.scaledQuantity = displayQuantity;
            existing.prepTasks = [
              ...new Set([...existing.prepTasks, ...prepTasks]),
            ];
          } else {
            // Create new ingredient entry
            const scaledIngredient: ScaledIngredient = {
              ingredientId: ingredient.id,
              name: ingredient.name,
              category: ingredient.category || "other",
              originalQuantity,
              originalUnit,
              scaledQuantity: finalQuantity,
              scaledUnit: finalUnit,
              prepTasks,
              notes: recipeIngredient.notes,
            };

            ingredientMap.set(key, scaledIngredient);
          }
        }
      }
    }

    // Convert map to array
    scaledIngredients.push(...ingredientMap.values());

    // Generate prep tasks
    const prepTasks: PrepTask[] = [];
    for (const ingredient of scaledIngredients) {
      for (const task of ingredient.prepTasks) {
        prepTasks.push({
          task,
          ingredient: ingredient.name,
          quantity: ingredient.scaledQuantity,
          unit: ingredient.scaledUnit,
          category: ingredient.category,
        });
      }
    }

    // Check inventory (mock for now - would integrate with actual inventory system)
    const inventoryItems: InventoryItem[] = [
      // Mock inventory data - in real implementation, this would come from database
      {
        ingredientId: "1",
        name: "Onions",
        currentStock: 5,
        unit: "kg",
        minimumStock: 2,
      },
      {
        ingredientId: "2",
        name: "Garlic",
        currentStock: 1,
        unit: "kg",
        minimumStock: 0.5,
      },
      {
        ingredientId: "3",
        name: "Carrots",
        currentStock: 3,
        unit: "kg",
        minimumStock: 1,
      },
    ];

    const purchaseItems: PurchaseItem[] = [];
    for (const ingredient of scaledIngredients) {
      const inventoryItem = inventoryItems.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (!inventoryItem) {
        // Item not in inventory - needs to be purchased
        purchaseItems.push({
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          neededQuantity: ingredient.scaledQuantity,
          unit: ingredient.scaledUnit,
          currentStock: 0,
          shortfall: ingredient.scaledQuantity,
        });
      } else {
        // Check if we have enough stock
        const { quantity: neededBase, baseUnit: neededBaseUnit } =
          convertToBaseUnit(ingredient.scaledQuantity, ingredient.scaledUnit);
        const { quantity: stockBase, baseUnit: stockBaseUnit } =
          convertToBaseUnit(inventoryItem.currentStock, inventoryItem.unit);

        let availableStock = stockBase;
        if (neededBaseUnit !== stockBaseUnit) {
          availableStock = convertFromBaseUnit(
            stockBase,
            stockBaseUnit,
            neededBaseUnit
          );
        }

        if (availableStock < neededBase) {
          const shortfall = neededBase - availableStock;
          const shortfallDisplay = convertFromBaseUnit(
            shortfall,
            neededBaseUnit,
            ingredient.scaledUnit
          );

          purchaseItems.push({
            ingredientId: ingredient.ingredientId,
            name: ingredient.name,
            neededQuantity: ingredient.scaledQuantity,
            unit: ingredient.scaledUnit,
            currentStock: inventoryItem.currentStock,
            shortfall: shortfallDisplay,
          });
        }
      }
    }

    // Generate the prep list response
    const prepList = {
      eventId,
      eventName: event.name,
      guestCount,
      menus: menus.map((menu) => ({
        id: menu.id,
        name: menu.name,
        category: menu.category,
      })),
      generatedAt: new Date().toISOString(),
      prepTasks: prepTasks.map((task) => ({
        task: task.task,
        ingredient: task.ingredient,
        quantity: Math.round(task.quantity * 100) / 100, // Round to 2 decimal places
        unit: task.unit,
        category: task.category,
      })),
      purchaseList: purchaseItems.map((item) => ({
        ingredient: item.name,
        needed: Math.round(item.neededQuantity * 100) / 100,
        unit: item.unit,
        currentStock: Math.round(item.currentStock * 100) / 100,
        shortfall: Math.round(item.shortfall * 100) / 100,
      })),
      summary: {
        totalIngredients: scaledIngredients.length,
        totalPrepTasks: prepTasks.length,
        itemsToPurchase: purchaseItems.length,
        estimatedPrepTime: Math.ceil(prepTasks.length * 5), // Rough estimate: 5 minutes per task
      },
    };

    console.log("Generated prep list:", prepList);
    res.json(prepList);
  } catch (error) {
    console.error("Error generating prep list:", error);
    res.status(500).json({ error: "Failed to generate prep list" });
  }
});

// Get prep list by ID (for future use)
router.get("/prep-lists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // In a real implementation, this would fetch from database
    res.status(404).json({ error: "Prep list not found" });
  } catch (error) {
    console.error("Error fetching prep list:", error);
    res.status(500).json({ error: "Failed to fetch prep list" });
  }
});

export default router;

