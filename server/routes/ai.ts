import { Router } from "express";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { requireBillingAccess } from "../middleware/billing.js";
import { requirePlan } from "../middleware/plan.js";
import { calculateRecipeCost } from "../services/pricingEngine.js";
import { storage } from "../storage.js";

const router = Router();
router.use(authMiddleware, requireBillingAccess, requirePlan("ai"));

const generateRecipeSchema = z.object({
  cuisineType: z.string().min(1),
  eventType: z.string().min(1),
  dietaryRequirements: z.array(z.string()).default([]),
  ingredientsOnHand: z.array(z.string()).min(1),
  guestCount: z.number().int().positive().default(10),
  recipeName: z.string().min(1).optional(),
});

router.post("/ai/generate-recipe", async (req: AuthRequest, res) => {
  try {
    const payload = generateRecipeSchema.parse(req.body || {});
    const organizationId = req.auth!.organizationId;
    const fallbackName = `${payload.cuisineType} ${payload.eventType} Special`;
    const recipeName = payload.recipeName || fallbackName;

    // This endpoint is intentionally isolated. It can be swapped with a real AI provider later.
    const createdRecipe = await storage.createRecipe({
      organizationId,
      name: recipeName,
      description: `AI draft for ${payload.eventType} (${payload.cuisineType})`,
      servings: payload.guestCount,
      instructions:
        "1) Prepare ingredients.\n2) Cook in stages.\n3) Adjust seasoning.\n4) Plate and serve.",
      category: payload.eventType,
      prepTime: 30,
      cookTime: 45,
      isAIGenerated: true,
      aiPrompt: JSON.stringify(payload),
    } as any);

    for (const ingredientName of payload.ingredientsOnHand) {
      const existing = await storage.searchIngredients(ingredientName, organizationId, 1);
      const ingredient =
        existing[0] ||
        (await storage.createIngredient({
          organizationId,
          name: ingredientName,
          defaultUnit: "grams",
          costPerUnit: "0",
          category: "ai-generated",
        } as any));

      await storage.addIngredientToRecipe({
        recipeId: createdRecipe.id,
        ingredientId: ingredient.id,
        quantity: "100",
        unit: ingredient.defaultUnit || "grams",
        notes: "AI generated placeholder quantity",
      });
    }

    const costing = await calculateRecipeCost(
      createdRecipe.id,
      payload.guestCount,
      organizationId
    );

    return res.status(201).json({
      recipe: createdRecipe,
      costing,
      note: "Generated recipe is a draft. Review before production use.",
    });
  } catch (error) {
    console.error("AI recipe generation failed:", error);
    return res.status(500).json({ error: "Failed to generate AI recipe" });
  }
});

export default router;

