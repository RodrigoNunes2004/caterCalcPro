import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePGLite } from "drizzle-orm/pglite";
import { neon } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";
import { eq, like, ilike, desc, asc, and, or, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../shared/schema";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSubRecipes,
  events,
  eventRecipes,
  menus,
  menuRecipes,
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
} from "../shared/schema";

// For development, we'll use PGLite (WASM Postgres)
// For production, this will connect to PostgreSQL via DATABASE_URL
export function createDrizzleDb() {
  if (process.env.DATABASE_URL) {
    // Production: Use PostgreSQL via Neon
    console.log("Using Neon PostgreSQL connection");
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle(sql, { schema });
  } else {
    // Development: Use PGLite (WASM Postgres)
    console.log(
      "No DATABASE_URL found, using PGLite (WASM Postgres) for development"
    );

    // Use in-memory PGLite for development
    const client = new PGlite("./dev.db");
    return drizzlePGLite(client, { schema });
  }
}

export const db = createDrizzleDb();

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

    // Check if we have any events
    const existingEvents = await db.select().from(events).limit(1);

    if (existingEvents.length === 0) {
      console.log("No existing events found, creating sample data...");

      // Define sample events with proper validation
      const sampleEventsData = [
        {
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

      // Validate and insert each event
      for (const eventData of sampleEventsData) {
        try {
          const validatedEvent = validateEventData(eventData);
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

      console.log("Sample data initialization completed");
    } else {
      console.log("Sample data already exists, skipping initialization");
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

// Initialize sample data asynchronously (non-blocking)
safeInitializeSampleData();

// Storage service layer
export const storage = {
  // Recipe operations
  async getRecipes(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(recipes.name, `%${search}%`),
          ilike(recipes.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(recipes.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getRecipe(id: string): Promise<any> {
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
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

  async createRecipe(data: InsertRecipe): Promise<any> {
    const result = await db
      .insert(recipes)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateRecipe(id: string, data: UpdateRecipe): Promise<any> {
    const result = await db
      .update(recipes)
      .set(data)
      .where(eq(recipes.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return (result as any).rowCount > 0;
  },

  // Ingredient operations
  async getIngredients(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(ilike(ingredients.name, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(ingredients.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getIngredient(id: string): Promise<any> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return ingredient || null;
  },

  async createIngredient(data: InsertIngredient): Promise<any> {
    const result = await db
      .insert(ingredients)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateIngredient(id: string, data: UpdateIngredient): Promise<any> {
    const result = await db
      .update(ingredients)
      .set(data)
      .where(eq(ingredients.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteIngredient(id: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(eq(ingredients.id, id));
    return (result as any).rowCount > 0;
  },

  async searchIngredients(query: string, limit: number = 10): Promise<any[]> {
    return await db
      .select()
      .from(ingredients)
      .where(ilike(ingredients.name, `%${query}%`))
      .orderBy(asc(ingredients.name))
      .limit(limit);
  },

  async getIngredientCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: ingredients.category })
      .from(ingredients)
      .where(eq(ingredients.category, ingredients.category))
      .orderBy(asc(ingredients.category));

    return result.map((r) => r.category).filter(Boolean) as string[];
  },

  async bulkCreateIngredients(data: InsertIngredient[]): Promise<any[]> {
    const result = await db
      .insert(ingredients)
      .values(data as any)
      .returning();
    return result;
  },

  // Event operations
  async getEvents(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, search, status } = options;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(events.name, `%${search}%`),
          ilike(events.description, `%${search}%`),
          ilike(events.venue, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(events.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getEvent(id: string): Promise<any> {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
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

  async createEvent(data: InsertEvent): Promise<any> {
    const result = await db
      .insert(events)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateEvent(id: string, data: UpdateEvent): Promise<any> {
    const result = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteEvent(id: string): Promise<boolean> {
    try {
      // First check if the event exists
      const existingEvent = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      if (existingEvent.length === 0) {
        return false;
      }

      // Delete the event
      await db.delete(events).where(eq(events.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  },

  // Additional methods expected by route files
  async getRecipeWithIngredients(id: string): Promise<any> {
    return this.getRecipe(id);
  },

  async getEventWithRecipes(id: string): Promise<any> {
    return this.getEvent(id);
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

  // Calculation methods (placeholder implementations)
  async calculateRecipeCosts(recipeId: string, params: any): Promise<any> {
    // Placeholder implementation
    return {
      originalCost: 0,
      scaledCost: 0,
      costPerServing: 0,
      scaleFactor: 1,
      ingredients: [],
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
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, search, category } = options;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(menus.name, `%${search}%`),
          ilike(menus.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(menus.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

    return {
      menus: menusResult,
      total: Number(total),
      page,
      limit,
    };
  },

  async getMenu(id: string): Promise<any> {
    const menu = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
    if (menu.length === 0) return null;

    const menuRecipesResult = await db
      .select()
      .from(menuRecipes)
      .leftJoin(recipes, eq(menuRecipes.recipeId, recipes.id))
      .where(eq(menuRecipes.menuId, id))
      .orderBy(asc(menuRecipes.order));

    // Fetch full recipe details with ingredients for each recipe
    const recipesWithDetails = await Promise.all(
      menuRecipesResult.map(async (mr: any) => {
        const fullRecipe = await this.getRecipe(mr.recipes!.id);
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

  async createMenu(data: InsertMenu): Promise<any> {
    const result = await db
      .insert(menus)
      .values(data as any)
      .returning();
    return result[0];
  },

  async updateMenu(id: string, data: UpdateMenu): Promise<any> {
    const result = await db
      .update(menus)
      .set(data)
      .where(eq(menus.id, id))
      .returning();
    return result[0] || null;
  },

  async deleteMenu(id: string): Promise<boolean> {
    try {
      // First check if the menu exists
      const existingMenu = await db
        .select()
        .from(menus)
        .where(eq(menus.id, id))
        .limit(1);
      if (existingMenu.length === 0) {
        return false;
      }

      // Delete the menu (cascade will handle menu_recipes)
      await db.delete(menus).where(eq(menus.id, id));
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
