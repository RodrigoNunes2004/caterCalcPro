import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, like, ilike, desc, asc, and, or, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../shared/schema.js";
import { ensureAuthTables, ensureOrganizationIdColumns } from "./lib/ensureAuthTables.js";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSubRecipes,
  events,
  eventRecipes,
  menus,
  menuRecipes,
  organizations,
  type Recipe,
  type Ingredient,
  type Event,
  type Menu,
  type InsertRecipe,
  type UpdateRecipe,
  type InsertIngredient,
  type UpdateIngredient,
  type InsertEvent,
  type UpdateEvent,
  type InsertMenu,
  type UpdateMenu,
  type RecipeWithIngredients,
  type EventWithRecipes,
  type MenuWithRecipes,
} from "../shared/schema.js";

// PGLite is only loaded in development - avoids serverless crash (WASM/filesystem)
let pgliteClient: import("@electric-sql/pglite").PGlite | null = null;
let db: ReturnType<typeof drizzle>;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePGLite } = await import("drizzle-orm/pglite");
  pgliteClient = new PGlite("./dev.db");
  db = drizzlePGLite(pgliteClient, { schema }) as unknown as ReturnType<typeof drizzle>;
}

export { db };

/** Get PGLite client for raw SQL (development only). */
export function getPgliteClient() {
  return pgliteClient;
}

// Utility functions for data validation and generation
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function generateUUID(): string {
  return randomUUID();
}

function validateEventData(eventData: any): any {
  // Ensure all required fields are present and properly formatted
  const validatedData = {
    name: eventData.name || "Untitled Event",
    description: eventData.description || "",
    eventDate:
      eventData.eventDate instanceof Date
        ? eventData.eventDate
        : new Date(eventData.eventDate),
    venue: eventData.venue || "",
    guestCount: Number(eventData.guestCount) || 0,
    status: eventData.status || "planning",
    budgetPercentage: eventData.budgetPercentage || "0",
    notes: eventData.notes || "",
    createdAt:
      eventData.createdAt instanceof Date ? eventData.createdAt : new Date(),
    updatedAt:
      eventData.updatedAt instanceof Date ? eventData.updatedAt : new Date(),
  };

  // Validate guest count
  if (validatedData.guestCount < 0) {
    validatedData.guestCount = 0;
  }

  // Validate status
  const validStatuses = ["planning", "confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(validatedData.status)) {
    validatedData.status = "planning";
  }

  return validatedData;
}

// Initialize with sample data if database is empty
async function initializeSampleData(retryCount = 0, maxRetries = 3) {
  try {
    console.log(
      `Initializing sample data... (attempt ${retryCount + 1}/${
        maxRetries + 1
      })`
    );

    let devOrg: { id: string } | undefined;
    try {
      [devOrg] = await db.select().from(organizations).where(eq(organizations.name, "Development")).limit(1);
    } catch (err: any) {
      if (err?.message?.includes("organizations") || err?.message?.includes("does not exist")) {
        console.log("Auth tables not migrated yet. Run 'pnpm drizzle-kit push' for Neon/PostgreSQL.");
        return;
      }
      throw err;
    }
    if (!devOrg) {
      console.log("No Development org found, skipping sample data");
      return;
    }
    const orgId = devOrg.id;

    const existingEvents = await db.select().from(events).limit(1);
    const existingMenus = await db.select().from(menus).limit(1);
    const existingRecipes = await db.select().from(recipes).limit(2);

    if (existingEvents.length === 0) {
      console.log("No existing events found, creating sample events...");

      const sampleEventsData = [
        {
          organizationId: orgId,
          name: "Corporate Lunch Meeting",
          description: "Business lunch for 50 executives",
          eventDate: "2024-02-15",
          venue: "Conference Center",
          guestCount: 50,
          status: "confirmed",
          budgetPercentage: "15",
          notes: "Dietary restrictions: 3 vegetarians, 1 gluten-free",
        },
        {
          organizationId: orgId,
          name: "Wedding Reception",
          description: "Elegant wedding dinner for 120 guests",
          eventDate: "2024-03-20",
          venue: "Grand Ballroom",
          guestCount: 120,
          status: "planning",
          budgetPercentage: "25",
          notes: "Formal dinner service, cocktail hour included",
        },
      ];

      for (const eventData of sampleEventsData) {
        try {
          const validatedEvent = { ...validateEventData(eventData), organizationId: orgId };
          console.log(`Creating event: ${validatedEvent.name}`);
          await db.insert(events).values(validatedEvent);
          console.log(`✓ Event '${validatedEvent.name}' created successfully`);
        } catch (eventError) {
          console.error(
            `✗ Failed to create event '${eventData.name}':`,
            eventError
          );
          // Continue with other events even if one fails
        }
      }

      console.log("Sample events created");
    } else {
      console.log("Sample events already exist");
    }

    if (existingMenus.length === 0 && existingRecipes.length >= 2) {
      console.log("Creating sample menus...");
      try {
        const [r1, r2] = existingRecipes;
        const menuResult = await db
          .insert(menus)
          .values({
            organizationId: orgId,
            name: "Corporate Buffet",
            description: "Classic buffet for business events",
            category: "buffet",
            isActive: true,
            totalCost: "0",
            totalRecipes: 2,
            avgPrepTime: 20,
          } as any)
          .returning();
        const menuId = menuResult[0]?.id;
        if (menuId) {
          await db.insert(menuRecipes).values([
            { menuId, recipeId: r1.id, order: 0 },
            { menuId, recipeId: r2.id, order: 1 },
          ] as any);
          console.log("Sample menu 'Corporate Buffet' created");
        }
      } catch (menuError) {
        console.error("Failed to create sample menu:", menuError);
      }
    }
  } catch (error) {
    console.error(
      `Error initializing sample data (attempt ${retryCount + 1}):`,
      error
    );

    // Retry logic for transient errors
    if (retryCount < maxRetries) {
      console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return initializeSampleData(retryCount + 1, maxRetries);
    } else {
      console.error(
        "Max retries reached. Sample data initialization failed permanently."
      );
      // Don't throw the error - let the app continue without sample data
    }
  }
}

// Safe initialization function that won't crash the app
async function safeInitializeSampleData() {
  try {
    await initializeSampleData();
  } catch (error) {
    console.error(
      "Sample data initialization failed, but app will continue:",
      error
    );
  }
}

// Ensure menus table exists (run migration for PGLite when 0001 not applied)
async function ensureMenusTable() {
  if (process.env.DATABASE_URL) return; // Neon: use drizzle-kit migrate
  const client = getPgliteClient();
  if (!client) return;

  try {
    await db.select().from(menus).limit(1);
  } catch (err: any) {
    if (err?.message?.includes('relation "menus" does not exist')) {
      console.log("Running menus migration...");
      const migrationSql = `
        CREATE TABLE IF NOT EXISTS "menus" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "category" varchar(50) NOT NULL,
          "is_active" boolean DEFAULT true,
          "total_cost" numeric(10, 2) DEFAULT '0',
          "total_recipes" integer DEFAULT 0,
          "avg_prep_time" integer DEFAULT 0,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS "menu_recipes" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "menu_id" uuid NOT NULL,
          "recipe_id" uuid NOT NULL,
          "order" integer DEFAULT 0,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
        DO $$ BEGIN
          ALTER TABLE "menu_recipes" ADD CONSTRAINT "menu_recipes_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        DO $$ BEGIN
          ALTER TABLE "menu_recipes" ADD CONSTRAINT "menu_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `;
      await client.exec(migrationSql);
      console.log("Menus migration completed");
    }
  }

  // Add menu_id column to events if missing (for event-menu association)
  try {
    await client.exec(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'menu_id'
        ) THEN
          ALTER TABLE "events" ADD COLUMN "menu_id" uuid REFERENCES "menus"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  } catch (_err) {
    // Ignore - column may already exist
  }
}

// Run schema sync then sample data
export async function initStorage(): Promise<void> {
  await ensureAuthTables();
  await ensureMenusTable();
  await ensureOrganizationIdColumns();
  await safeInitializeSampleData();
}

(async () => {
  await initStorage();
})();


// Storage service layer
export const storage = {
  // Recipe operations (organizationId required for multi-tenant isolation)
  async getRecipes(
    options: {
      organizationId: string;
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    }
  ) {
    const { organizationId, page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(recipes.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          ilike(recipes.name, `%${search}%`),
          ilike(recipes.description, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(recipes.category, category));
    }

    const whereClause = and(...conditions);

    const recipesResult = await db
      .select()
      .from(recipes)
      .where(whereClause)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(recipes)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      recipes: recipesResult,
      total: Number(total),
      page,
      limit,
    };
  },

  async getRecipe(id: string, organizationId: string): Promise<any> {
    const recipe = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.organizationId, organizationId)))
      .limit(1);
    if (recipe.length === 0) return null;

    const recipeIngreds = await db
      .select()
      .from(recipeIngredients)
      .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
      .where(eq(recipeIngredients.recipeId, id));

    const subRecipes = await db
      .select()
      .from(recipeSubRecipes)
      .leftJoin(recipes, eq(recipeSubRecipes.subRecipeId, recipes.id))
      .where(eq(recipeSubRecipes.parentRecipeId, id));

    return {
      ...recipe[0],
      ingredients: recipeIngreds.map((ri: any) => ({
        id: ri.recipe_ingredients.id,
        recipeId: ri.recipe_ingredients.recipeId,
        ingredientId: ri.recipe_ingredients.ingredientId,
        quantity: ri.recipe_ingredients.quantity,
        unit: ri.recipe_ingredients.unit,
        notes: ri.recipe_ingredients.notes,
        createdAt: ri.recipe_ingredients.createdAt,
        ingredient: ri.ingredients!,
      })),
      subRecipes: subRecipes.map((sr: any) => ({
        id: sr.recipe_sub_recipes.id,
        parentRecipeId: sr.recipe_sub_recipes.parentRecipeId,
        subRecipeId: sr.recipe_sub_recipes.subRecipeId,
        quantity: sr.recipe_sub_recipes.quantity,
        createdAt: sr.recipe_sub_recipes.createdAt,
        subRecipe: sr.recipes!,
      })),
    };
  },

  async createRecipe(data: InsertRecipe & { organizationId: string }): Promise<any> {
    const result = await db
      .insert(recipes)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateRecipe(id: string, organizationId: string, data: UpdateRecipe): Promise<any> {
    const result = await db
      .update(recipes)
      .set(data)
      .where(and(eq(recipes.id, id), eq(recipes.organizationId, organizationId)))
      .returning();
    return result[0] || null;
  },

  async deleteRecipe(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.organizationId, organizationId)));
    return (result as any).rowCount > 0;
  },

  // Ingredient operations
  async getIngredients(
    options: {
      organizationId: string;
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    }
  ) {
    const { organizationId, page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(ingredients.organizationId, organizationId)];

    if (search) {
      conditions.push(ilike(ingredients.name, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(ingredients.category, category));
    }

    const whereClause = and(...conditions);

    const ingredientsResult = await db
      .select()
      .from(ingredients)
      .where(whereClause)
      .orderBy(asc(ingredients.name))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(ingredients)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      ingredients: ingredientsResult,
      total: Number(total),
      page,
      limit,
    };
  },

  async getIngredient(id: string, organizationId: string): Promise<any> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.organizationId, organizationId)))
      .limit(1);
    return ingredient || null;
  },

  async createIngredient(data: InsertIngredient & { organizationId: string }): Promise<any> {
    const result = await db
      .insert(ingredients)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateIngredient(id: string, organizationId: string, data: UpdateIngredient): Promise<any> {
    const result = await db
      .update(ingredients)
      .set(data)
      .where(and(eq(ingredients.id, id), eq(ingredients.organizationId, organizationId)))
      .returning();
    return result[0] || null;
  },

  async deleteIngredient(id: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(and(eq(ingredients.id, id), eq(ingredients.organizationId, organizationId)));
    return (result as any).rowCount > 0;
  },

  async searchIngredients(query: string, organizationId: string, limit: number = 10): Promise<any[]> {
    return await db
      .select()
      .from(ingredients)
      .where(and(eq(ingredients.organizationId, organizationId), ilike(ingredients.name, `%${query}%`)))
      .orderBy(asc(ingredients.name))
      .limit(limit);
  },

  async getIngredientCategories(organizationId: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: ingredients.category })
      .from(ingredients)
      .where(eq(ingredients.organizationId, organizationId))
      .orderBy(asc(ingredients.category));

    return result.map((r) => r.category).filter(Boolean) as string[];
  },

  async bulkCreateIngredients(data: (InsertIngredient & { organizationId: string })[]): Promise<any[]> {
    const result = await db
      .insert(ingredients)
      .values(data as any)
      .returning();
    return result;
  },

  // Event operations
  async getEvents(
    options: {
      organizationId: string;
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }
  ) {
    const { organizationId, page = 1, limit = 50, search, status } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(events.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          ilike(events.name, `%${search}%`),
          ilike(events.description, `%${search}%`),
          ilike(events.venue, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(events.status, status));
    }

    const whereClause = and(...conditions);

    const eventsResult = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(desc(events.eventDate))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(events)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      events: eventsResult,
      total: Number(total),
      page,
      limit,
    };
  },

  async getEvent(id: string, organizationId: string): Promise<any> {
    const event = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
      .limit(1);
    if (event.length === 0) return null;

    const eventRecipesResult = await db
      .select()
      .from(eventRecipes)
      .leftJoin(recipes, eq(eventRecipes.recipeId, recipes.id))
      .where(eq(eventRecipes.eventId, id));

    return {
      ...event[0],
      recipes: eventRecipesResult.map((er: any) => ({
        id: er.event_recipes.id,
        eventId: er.event_recipes.eventId,
        recipeId: er.event_recipes.recipeId,
        plannedServings: er.event_recipes.plannedServings,
        notes: er.event_recipes.notes,
        createdAt: er.event_recipes.createdAt,
        recipe: er.recipes!,
      })),
    };
  },

  async createEvent(data: InsertEvent & { organizationId: string }): Promise<any> {
    const result = await db
      .insert(events)
      .values(data as any)
      .returning();
    const newEvent = result[0];
    if (!newEvent) return null;

    const menuId = (data as any).menuId;
    if (menuId && newEvent.id && newEvent.guestCount && data.organizationId) {
      const menu = await this.getMenu(menuId, data.organizationId);
      if (menu?.recipes?.length) {
        for (const mr of menu.recipes) {
          const recipeId = mr.recipeId ?? mr.recipe?.id;
          if (recipeId) {
            await this.addRecipeToEvent({
              eventId: newEvent.id,
              recipeId,
              plannedServings: Number(newEvent.guestCount) || 1,
              notes: mr.notes ?? null,
            });
          }
        }
      }
    }
    return newEvent;
  },

  async updateEvent(id: string, organizationId: string, data: UpdateEvent): Promise<any> {
    const result = await db
      .update(events)
      .set(data)
      .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
      .returning();
    return result[0] || null;
  },

  async deleteEvent(id: string, organizationId: string): Promise<boolean> {
    try {
      const existingEvent = await db
        .select()
        .from(events)
        .where(and(eq(events.id, id), eq(events.organizationId, organizationId)))
        .limit(1);
      if (existingEvent.length === 0) {
        return false;
      }

      await db.delete(events).where(and(eq(events.id, id), eq(events.organizationId, organizationId)));
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  },

  // Additional methods expected by route files
  async getRecipeWithIngredients(id: string, organizationId: string): Promise<any> {
    return this.getRecipe(id, organizationId);
  },

  async getEventWithRecipes(id: string, organizationId: string): Promise<any> {
    return this.getEvent(id, organizationId);
  },

  // Recipe ingredient management
  async addIngredientToRecipe(data: any): Promise<void> {
    await db.insert(recipeIngredients).values(data);
  },

  async removeIngredientFromRecipe(
    recipeId: string,
    ingredientId: string
  ): Promise<boolean> {
    const result = await db
      .delete(recipeIngredients)
      .where(
        and(
          eq(recipeIngredients.recipeId, recipeId),
          eq(recipeIngredients.ingredientId, ingredientId)
        )
      );
    return (result as any).rowCount > 0;
  },

  // Sub-recipe management
  async addSubRecipeToRecipe(data: any): Promise<void> {
    await db.insert(recipeSubRecipes).values(data);
  },

  // Event recipe management
  async addRecipeToEvent(data: any): Promise<any> {
    const result = await db.insert(eventRecipes).values(data).returning();
    return result[0] as any;
  },

  async removeRecipeFromEvent(
    eventId: string,
    recipeId: string
  ): Promise<boolean> {
    const result = await db
      .delete(eventRecipes)
      .where(
        and(
          eq(eventRecipes.eventId, eventId),
          eq(eventRecipes.recipeId, recipeId)
        )
      );
    return (result as any).rowCount > 0;
  },

  async updateEventRecipe(
    eventId: string,
    recipeId: string,
    data: any
  ): Promise<any> {
    const result = await db
      .update(eventRecipes)
      .set(data)
      .where(
        and(
          eq(eventRecipes.eventId, eventId),
          eq(eventRecipes.recipeId, recipeId)
        )
      )
      .returning();
    return result[0] as any;
  },

  // Calculation methods
  async calculateRecipeCosts(recipeId: string, params: { organizationId: string } & Record<string, any>): Promise<any> {
    const recipe = await this.getRecipe(recipeId, params.organizationId);
    if (!recipe) return null;

    const originalServings = Number(recipe.servings) || 1;
    let targetServings = originalServings;

    if (params?.targetServings && params.targetServings > 0) {
      targetServings = params.targetServings;
    } else if (params?.guestCount && params.guestCount > 0) {
      const servingsPerGuest = params?.servingsPerGuest ?? 1;
      targetServings = params.guestCount * servingsPerGuest;
    }

    const scaleFactor = targetServings / originalServings;

    const ingredients: Array<{
      id: string;
      name: string;
      originalQuantity: number;
      scaledQuantity: number;
      unit: string;
      costPerUnit: number;
      totalCost: number;
      notes?: string;
    }> = [];

    let originalCost = 0;
    let scaledCost = 0;

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      for (const ri of recipe.ingredients) {
        const quantity = parseFloat(String(ri.quantity)) || 0;
        const costPerUnit = parseFloat(
          String(ri.ingredient?.costPerUnit ?? 0)
        ) || 0;
        const scaledQuantity = Math.round(quantity * scaleFactor * 10000) / 10000;
        const totalCost = scaledQuantity * costPerUnit;

        originalCost += quantity * costPerUnit;
        scaledCost += totalCost;

        ingredients.push({
          id: ri.ingredientId ?? ri.ingredient?.id,
          name: ri.ingredient?.name ?? "Unknown",
          originalQuantity: quantity,
          scaledQuantity,
          unit: ri.unit ?? ri.ingredient?.defaultUnit ?? "",
          costPerUnit,
          totalCost,
          notes: ri.notes ?? undefined,
        });
      }
    }

    // Add sub-recipe costs (sub-recipes used as ingredients)
    if (recipe.subRecipes && recipe.subRecipes.length > 0) {
      for (const sr of recipe.subRecipes) {
          const subRecipe = sr.subRecipe ?? (await this.getRecipe(sr.subRecipeId, params.organizationId));
        if (subRecipe) {
          const subQuantity = parseFloat(String(sr.quantity)) || 0;
          const subServings = Number(subRecipe.servings) || 1;
          const subTargetServings = subQuantity * subServings * scaleFactor;
          const subCostResult = await this.calculateRecipeCosts(subRecipe.id, {
            organizationId: params.organizationId,
            targetServings: subTargetServings,
          });
          if (subCostResult) {
            originalCost += subCostResult.originalCost * subQuantity;
            scaledCost += subCostResult.scaledCost;
          }
        }
      }
    }

    const costPerServing = targetServings > 0 ? scaledCost / targetServings : 0;

    return {
      id: recipeId,
      name: recipe.name,
      originalCost,
      scaledCost,
      totalCost: scaledCost, // alias for frontend compatibility
      costPerServing,
      scaleFactor,
      originalServings,
      targetServings,
      ingredients,
    };
  },

  async calculateEventCosts(eventId: string): Promise<any> {
    // Placeholder implementation
    return {
      totalCost: 0,
      costPerGuest: 0,
      breakdown: [],
    };
  },

  async generateShoppingList(
    recipes: any[],
    guestCount?: number
  ): Promise<any> {
    // Placeholder implementation
    return {
      items: [],
      totalCost: 0,
    };
  },

  async generateEventShoppingList(eventId: string): Promise<any> {
    // Placeholder implementation
    return {
      items: [],
      totalCost: 0,
    };
  },

  async adjustRecipeProportions(
    recipeId: string,
    modifiedIngredientId: string,
    newQuantity: number
  ): Promise<any> {
    // Placeholder implementation
    return null;
  },

  async getRecipeNutrition(recipeId: string): Promise<any> {
    // Placeholder implementation
    return {
      totalWeight: 0,
      ingredients: [],
    };
  },

  async compareEvents(eventIds: string[]): Promise<any> {
    // Placeholder implementation
    return {
      comparison: [],
    };
  },

  // Utility methods for data management
  async initializeSampleData(): Promise<{ success: boolean; message: string }> {
    try {
      await initializeSampleData();
      return { success: true, message: "Sample data initialized successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize sample data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    try {
      // Clear all tables in the correct order (respecting foreign key constraints)
      await db.delete(menuRecipes);
      await db.delete(eventRecipes);
      await db.delete(recipeSubRecipes);
      await db.delete(recipeIngredients);
      await db.delete(menus);
      await db.delete(events);
      await db.delete(recipes);
      await db.delete(ingredients);

      return { success: true, message: "All data cleared successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  async getDatabaseStatus(): Promise<{
    events: number;
    recipes: number;
    ingredients: number;
    menus: number;
    isHealthy: boolean;
  }> {
    try {
      const [eventsCount, recipesCount, ingredientsCount, menusCount] =
        await Promise.all([
          db.select({ count: count() }).from(events),
          db.select({ count: count() }).from(recipes),
          db.select({ count: count() }).from(ingredients),
          db.select({ count: count() }).from(menus),
        ]);

      return {
        events: Number(eventsCount[0]?.count || 0),
        recipes: Number(recipesCount[0]?.count || 0),
        ingredients: Number(ingredientsCount[0]?.count || 0),
        menus: Number(menusCount[0]?.count || 0),
        isHealthy: true,
      };
    } catch (error) {
      console.error("Database status check failed:", error);
      return {
        events: 0,
        recipes: 0,
        ingredients: 0,
        menus: 0,
        isHealthy: false,
      };
    }
  },

  // Menu operations
  async getMenus(
    options: {
      organizationId: string;
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    }
  ) {
    const { organizationId, page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(menus.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          ilike(menus.name, `%${search}%`),
          ilike(menus.description, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(menus.category, category));
    }

    const whereClause = and(...conditions);

    const menusResult = await db
      .select()
      .from(menus)
      .where(whereClause)
      .orderBy(desc(menus.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(menus)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Add recipe count per menu
    const menusWithCount = await Promise.all(
      menusResult.map(async (menu) => {
        const [countRow] = await db
          .select({ count: count() })
          .from(menuRecipes)
          .where(eq(menuRecipes.menuId, menu.id));
        return { ...menu, totalRecipes: Number(countRow?.count || 0) };
      })
    );

    return {
      menus: menusWithCount,
      total: Number(total),
      page,
      limit,
    };
  },

  async getMenu(id: string, organizationId: string): Promise<any> {
    const menu = await db.select().from(menus).where(and(eq(menus.id, id), eq(menus.organizationId, organizationId))).limit(1);
    if (menu.length === 0) return null;

    const menuRecipesResult = await db
      .select()
      .from(menuRecipes)
      .leftJoin(recipes, eq(menuRecipes.recipeId, recipes.id))
      .where(eq(menuRecipes.menuId, id))
      .orderBy(asc(menuRecipes.order));

    const recipesWithDetails = await Promise.all(
      menuRecipesResult.map(async (mr: any) => {
        const fullRecipe = await this.getRecipe(mr.recipes!.id, organizationId);
        return {
          id: mr.menu_recipes.id,
          menuId: mr.menu_recipes.menuId,
          recipeId: mr.menu_recipes.recipeId,
          order: mr.menu_recipes.order,
          notes: mr.menu_recipes.notes,
          createdAt: mr.menu_recipes.createdAt,
          recipe: fullRecipe || mr.recipes!,
        };
      })
    );

    return {
      ...menu[0],
      recipes: recipesWithDetails,
    };
  },

  async createMenu(data: InsertMenu & { organizationId: string }): Promise<any> {
    const result = await db
      .insert(menus)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateMenu(id: string, organizationId: string, data: UpdateMenu): Promise<any> {
    const result = await db
      .update(menus)
      .set(data)
      .where(and(eq(menus.id, id), eq(menus.organizationId, organizationId)))
      .returning();
    return result[0] || null;
  },

  async deleteMenu(id: string, organizationId: string): Promise<boolean> {
    try {
      const existingMenu = await db
        .select()
        .from(menus)
        .where(and(eq(menus.id, id), eq(menus.organizationId, organizationId)))
        .limit(1);
      if (existingMenu.length === 0) {
        return false;
      }

      await db.delete(menus).where(and(eq(menus.id, id), eq(menus.organizationId, organizationId)));
      return true;
    } catch (error) {
      console.error("Error deleting menu:", error);
      return false;
    }
  },

  // Menu recipe management
  async addRecipeToMenu(data: any): Promise<any> {
    const result = await db.insert(menuRecipes).values(data).returning();
    return result[0] as any;
  },

  async removeRecipeFromMenu(
    menuId: string,
    recipeId: string
  ): Promise<boolean> {
    const result = await db
      .delete(menuRecipes)
      .where(
        and(eq(menuRecipes.menuId, menuId), eq(menuRecipes.recipeId, recipeId))
      );
    return (result as any).rowCount > 0;
  },

  async updateMenuRecipe(
    menuId: string,
    recipeId: string,
    data: any
  ): Promise<any> {
    const result = await db
      .update(menuRecipes)
      .set(data)
      .where(
        and(eq(menuRecipes.menuId, menuId), eq(menuRecipes.recipeId, recipeId))
      )
      .returning();
    return result[0] as any;
  },
};
