import { storage } from "../storage.js";

export async function calculateRecipeCost(
  recipeId: string,
  servings: number | null,
  organizationId: string
) {
  return storage.calculateRecipeCosts(recipeId, {
    organizationId,
    targetServings: servings && servings > 0 ? servings : null,
  });
}

export async function calculateEventCost(eventId: string, organizationId: string) {
  return storage.calculateEventCosts(eventId, organizationId);
}

export async function calculateMenuCost(
  menuId: string,
  guestCount: number | null,
  organizationId: string
) {
  const menu = await storage.getMenu(menuId, organizationId);
  if (!menu) return null;

  const breakdown: Array<{
    recipeId: string;
    recipeName: string;
    targetServings: number;
    totalCost: number;
  }> = [];

  let totalCost = 0;
  const defaultServings = guestCount && guestCount > 0 ? guestCount : 1;

  for (const recipeLink of menu.recipes || []) {
    const recipeId = String(recipeLink.recipeId || recipeLink.recipe?.id || "");
    if (!recipeId) continue;

    const recipeName = String(recipeLink.recipe?.name || "Recipe");
    const recipeCalc = await storage.calculateRecipeCosts(recipeId, {
      organizationId,
      targetServings: defaultServings,
    });
    if (!recipeCalc) continue;

    const recipeTotalCost = Number(recipeCalc.totalCost || 0);
    totalCost += recipeTotalCost;
    breakdown.push({
      recipeId,
      recipeName,
      targetServings: defaultServings,
      totalCost: Math.round(recipeTotalCost * 100) / 100,
    });
  }

  return {
    menuId: String(menu.id),
    menuName: String(menu.name),
    guestCount: guestCount && guestCount > 0 ? guestCount : null,
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown,
  };
}

