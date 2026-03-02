import { Router } from "express";
import { storage } from "../storage.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Types for prep list generation
interface PrepListRequest {
  eventId: string;
  menuIds: string[];
  guestCount: number;
  /** Portions per person (default 1). Total portions = guests × this. */
  portionsPerPerson?: number;
  /** Per-recipe override: portions per person for specific recipes */
  recipePortions?: { [recipeId: string]: number };
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
  id?: string;
  task: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  isManual?: boolean;
}

interface InventoryItem {
  ingredientId: string;
  name: string;
  currentStock: number;
  unit: string;
  minimumStock: number;
}

interface PurchaseItem {
  id?: string;
  ingredientId: string;
  name: string;
  neededQuantity: number;
  unit: string;
  currentStock: number;
  shortfall: number;
}

type ListStatus = "in_preparation" | "done" | "archived";

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

// Map ingredients to chef prep actions (chop, peel, dice, etc.)
function getPrepAction(ingredientName: string): string {
  const name = ingredientName.toLowerCase().trim();
  if (name.includes("onion")) return "Chop";
  if (name.includes("potato") || name.includes("potatoes")) return "Peel";
  if (name.includes("garlic")) return "Mince";
  if (name.includes("carrot")) return "Peel and dice";
  if (name.includes("tomato") || name.includes("tomatoes")) return "Dice";
  if (name.includes("celery")) return "Chop";
  if (name.includes("mushroom")) return "Slice";
  if (name.includes("pepper") && !name.includes("black") && !name.includes("white")) return "Dice";
  if (name.includes("zucchini") || name.includes("courgette")) return "Slice";
  if (name.includes("lemon") || name.includes("lime")) return "Juice";
  if (name.includes("cheese")) return "Grate";
  if (name.includes("egg")) return "Crack";
  if (name.includes("chicken") || name.includes("beef") || name.includes("pork") || name.includes("meat")) return "Portion";
  if (name.includes("lettuce") || name.includes("greens") || name.includes("salad")) return "Wash and chop";
  if (name.includes("herb") || name.includes("basil") || name.includes("parsley") || name.includes("cilantro")) return "Chop";
  if (name.includes("bread") && !name.includes("crumbs")) return "Slice";
  return "Prepare";
}

// Generate prep list
router.post("/prep-lists", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const {
      eventId,
      menuIds,
      guestCount,
      portionsPerPerson = 1,
      recipePortions = {},
      userOverrides = {},
    }: PrepListRequest = req.body;

    if (!eventId || !menuIds || !guestCount) {
      return res.status(400).json({
        error: "Event ID, menu IDs, and guest count are required",
      });
    }

    const event = await storage.getEvent(eventId, orgId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const menusList = [];
    for (const menuId of menuIds) {
      try {
        const menu = await storage.getMenu(menuId, orgId);
        if (menu) {
          menusList.push(menu);
        }
      } catch (error) {
        console.error(`Error fetching menu ${menuId}:`, error);
      }
    }

    if (menusList.length === 0) {
      return res.status(404).json({ error: "No valid menus found" });
    }

    // Collect all recipes from all menus, DEDUPLICATED by recipe ID (same recipe in 2 menus = count once)
    const recipeById = new Map<string, (typeof menusList)[0]["recipes"][0]>();
    for (const menu of menusList) {
      if (menu.recipes && menu.recipes.length > 0) {
        for (const mr of menu.recipes) {
          const recipe = mr?.recipe;
          if (recipe?.id && !recipeById.has(recipe.id)) {
            recipeById.set(recipe.id, mr);
          }
        }
      }
    }
    const allRecipes = Array.from(recipeById.values());

    if (allRecipes.length === 0) {
      return res
        .status(404)
        .json({ error: "No recipes found in selected menus" });
    }

    // Process ingredients and scale them (for purchase list and mise en place)
    const scaledIngredients: ScaledIngredient[] = [];
    const ingredientMap = new Map<string, ScaledIngredient>();

    for (const menuRecipe of allRecipes) {
      const recipe = menuRecipe.recipe;
      if (!recipe) continue;
      const servings = Number(recipe.servings) || 1;
      const portionsForRecipe = recipePortions[recipe.id] ?? portionsPerPerson;
      const totalPortions = guestCount * portionsForRecipe;
      const scaleFactor = totalPortions / servings;

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredient;
          const originalQuantity = parseFloat(recipeIngredient.quantity);
          const originalUnit = recipeIngredient.unit;

          let finalQuantity = originalQuantity * scaleFactor;
          let finalUnit = originalUnit;

          if (userOverrides[ingredient.id]) {
            finalQuantity = userOverrides[ingredient.id].quantity;
            finalUnit = userOverrides[ingredient.id].unit;
          }

          const key = ingredient.id;
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            const { quantity: existingBase, baseUnit: existingBaseUnit } =
              convertToBaseUnit(existing.scaledQuantity, existing.scaledUnit);
            const { quantity: newBase, baseUnit: newBaseUnit } =
              convertToBaseUnit(finalQuantity, finalUnit);

            let totalBaseQuantity = existingBase;
            if (existingBaseUnit === newBaseUnit) {
              totalBaseQuantity += newBase;
            } else {
              totalBaseQuantity += convertFromBaseUnit(
                newBase,
                newBaseUnit,
                existingBaseUnit
              );
            }

            const displayQuantity = convertFromBaseUnit(
              totalBaseQuantity,
              existingBaseUnit,
              existing.scaledUnit
            );

            existing.scaledQuantity = displayQuantity;
          } else {
            ingredientMap.set(key, {
              ingredientId: ingredient.id,
              name: ingredient.name,
              category: ingredient.category || "other",
              originalQuantity,
              originalUnit,
              scaledQuantity: finalQuantity,
              scaledUnit: finalUnit,
              prepTasks: [],
              notes: recipeIngredient.notes,
            });
          }
        }
      }
    }

    scaledIngredients.push(...Array.from(ingredientMap.values()));

    // Build CHEF PREP TASKS: actionable items (Chop X onions, Peel X potatoes, Prepare X portions of Cheese Bread)
    const countUnits = ["each", "pcs", "pieces", "whole", "egg", "eggs", "item", "items"];
    const formatQty = (q: number, u: string) => {
      const un = u.toLowerCase().trim();
      if (countUnits.some((c) => un.includes(c))) return Math.round(q) || 1;
      return Math.round(q * 100) / 100;
    };

    const prepTasks: PrepTask[] = [];

    // 1. Recipe-level: how many portions to produce (e.g. "Prepare 54 cheese bread portions")
    for (const menuRecipe of allRecipes) {
      const recipe = menuRecipe.recipe;
      if (!recipe) continue;
      const servings = Number(recipe.servings) || 1;
      const portionsForRecipe = recipePortions[recipe.id] ?? portionsPerPerson;
      const totalPortions = guestCount * portionsForRecipe;
      if (totalPortions > 0) {
        const recipeName = recipe.name || "Recipe";
        prepTasks.push({
          task: `Prepare ${Math.round(totalPortions)} portions of ${recipeName}`,
          ingredient: recipeName,
          quantity: totalPortions,
          unit: "portions",
          category: "Dishes",
        });
      }
    }

    // 2. Ingredient prep: Chop X onions, Peel X potatoes, etc.
    for (const ing of scaledIngredients) {
      const qty = formatQty(ing.scaledQuantity, ing.scaledUnit);
      const action = getPrepAction(ing.name);
      const taskText = action === "Prepare"
        ? `Prepare ${qty} ${ing.scaledUnit} ${ing.name}`
        : `${action} ${qty} ${ing.scaledUnit} ${ing.name}`;
      prepTasks.push({
        task: taskText,
        ingredient: ing.name,
        quantity: ing.scaledQuantity,
        unit: ing.scaledUnit,
        category: ing.category,
      });
    }

    // Fetch real inventory from database
    const dbInventory = await storage.getInventory(orgId);
    const inventoryItems: InventoryItem[] = dbInventory.map((row) => ({
      ingredientId: "",
      name: row.name,
      currentStock: row.currentStock,
      unit: row.unit,
      minimumStock: row.minimumStock,
    }));

    const purchaseItems: PurchaseItem[] = [];
    for (const ingredient of scaledIngredients) {
      const inventoryItem = inventoryItems.find(
        (item) => item.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
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

    const created = await storage.createPrepListRecord({
      organizationId: orgId,
      eventId,
      eventName: event.name,
      guestCount,
      portionsPerPerson,
      prepTasks: prepTasks.map((task) => ({
        task: task.task,
        ingredient: task.ingredient,
        quantity: Math.round(task.quantity * 100) / 100,
        unit: task.unit,
        category: task.category,
      })),
      purchaseItems: purchaseItems.map((item) => ({
        ingredient: item.name,
        ingredientId: item.ingredientId,
        needed: Math.round(item.neededQuantity * 100) / 100,
        unit: item.unit,
        currentStock: Math.round(item.currentStock * 100) / 100,
        shortfall: Math.round(item.shortfall * 100) / 100,
        category: "other",
      })),
    });

    if (!created) {
      return res.status(500).json({ error: "Failed to persist prep list" });
    }

    const response = {
      ...created,
      menus: menusList.map((menu) => ({
        id: menu.id,
        name: menu.name,
        category: menu.category,
      })),
    };

    console.log("Generated prep list:", response.id);
    res.json(response);
  } catch (error) {
    console.error("Error generating prep list:", error);
    res.status(500).json({ error: "Failed to generate prep list" });
  }
});

// Get prep list by ID (for future use)
router.get("/prep-lists/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orgId = req.auth!.organizationId;
    const prepList = await storage.getPrepListRecord(id, orgId);
    if (!prepList) return res.status(404).json({ error: "Prep list not found" });
    res.json(prepList);
  } catch (error) {
    console.error("Error fetching prep list:", error);
    res.status(500).json({ error: "Failed to fetch prep list" });
  }
});

function canConvertBetween(baseA: string, baseB: string): boolean {
  return baseA === baseB;
}

async function applyInventoryUsageForPrepList(prepList: any, orgId: string) {
  if (!prepList?.prepTasks?.length) return;
  const inventoryRows = await storage.getInventoryItems(orgId);
  const itemsByName = new Map(
    (inventoryRows || []).map((row: any) => [
      String(row.name || "").toLowerCase().trim(),
      row,
    ])
  );

  for (const task of prepList.prepTasks as PrepTask[]) {
    if (!task?.ingredient || !task?.unit || task.quantity <= 0) continue;
    // Dish-level tasks are informational and should not deduct stock.
    if (task.unit.toLowerCase().trim() === "portions") continue;

    const inv = itemsByName.get(task.ingredient.toLowerCase().trim());
    if (!inv) continue;
    const currentStock = parseFloat(String(inv.current_stock ?? inv.currentStock ?? 0)) || 0;
    const inventoryUnit = String(inv.unit || "");
    const { quantity: neededBase, baseUnit: neededBaseUnit } = convertToBaseUnit(task.quantity, task.unit);
    const { quantity: stockBase, baseUnit: stockBaseUnit } = convertToBaseUnit(currentStock, inventoryUnit);
    if (!canConvertBetween(neededBaseUnit, stockBaseUnit)) continue;

    const updatedBase = Math.max(0, stockBase - neededBase);
    const updatedStock = convertFromBaseUnit(updatedBase, stockBaseUnit, inventoryUnit);
    await storage.updateInventoryItem(String(inv.id), orgId, { currentStock: updatedStock } as any);
  }
}

router.patch("/prep-lists/:id/status", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { id } = req.params;
    const { kind, status } = req.body as { kind: "prep" | "purchase"; status: ListStatus };

    if (!["prep", "purchase"].includes(kind)) {
      return res.status(400).json({ error: "kind must be 'prep' or 'purchase'" });
    }
    if (!["in_preparation", "done", "archived"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing = await storage.getPrepListRecord(id, orgId);
    if (!existing) return res.status(404).json({ error: "Prep list not found" });

    if (kind === "prep" && status === "done" && !existing.prepInventoryApplied) {
      await applyInventoryUsageForPrepList(existing, orgId);
      await storage.markPrepInventoryApplied(id, orgId);
    }

    const updated = await storage.updatePrepListStatus({ id, organizationId: orgId, kind, status });
    res.json(updated);
  } catch (error) {
    console.error("Error updating prep list status:", error);
    res.status(500).json({ error: "Failed to update prep list status" });
  }
});

router.post("/prep-lists/:id/manual-tasks", async (req: AuthRequest, res) => {
  try {
    const orgId = req.auth!.organizationId;
    const { id } = req.params;
    const { task, ingredient, quantity, unit, category } = req.body as {
      task: string;
      ingredient: string;
      quantity: number;
      unit: string;
      category?: string;
    };
    if (!task?.trim() || !ingredient?.trim() || !unit?.trim()) {
      return res.status(400).json({ error: "task, ingredient and unit are required" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "quantity must be a positive number" });
    }
    const updated = await storage.addManualPrepTask({
      prepListId: id,
      organizationId: orgId,
      task: task.trim(),
      ingredient: ingredient.trim(),
      quantity: qty,
      unit: unit.trim(),
      category: category?.trim() || "other",
    });
    if (!updated) return res.status(404).json({ error: "Prep list not found" });
    res.status(201).json(updated);
  } catch (error) {
    console.error("Error adding manual prep task:", error);
    res.status(500).json({ error: "Failed to add manual prep task" });
  }
});

export default router;
