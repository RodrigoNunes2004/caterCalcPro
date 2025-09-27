import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePGLite } from "drizzle-orm/pglite";
import { neon } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";
import { eq, like, ilike, desc, asc, and, or, count } from "drizzle-orm";
import * as schema from "../shared/schema";
import {
  recipes,
  ingredients,
  recipeIngredients,
  recipeSubRecipes,
  events,
  eventRecipes,
  type Recipe,
  type Ingredient,
  type Event,
  type InsertRecipe,
  type UpdateRecipe,
  type InsertIngredient,
  type UpdateIngredient,
  type InsertEvent,
  type UpdateEvent,
  type RecipeWithIngredients,
  type EventWithRecipes,
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

  async getRecipe(id: string): Promise<RecipeWithIngredients | null> {
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
      ingredients: recipeIngreds.map((ri) => ({
        ...ri.recipe_ingredients,
        ingredient: ri.ingredients!,
      })) as any,
      subRecipes: subRecipes.map((sr) => ({
        ...sr.recipe_sub_recipes,
        subRecipe: sr.recipes!,
      })) as any,
    } as RecipeWithIngredients;
  },

  async createRecipe(data: InsertRecipe): Promise<Recipe> {
    const result = await db.insert(recipes).values(data).returning();
    return result[0] as Recipe;
  },

  async updateRecipe(id: string, data: UpdateRecipe): Promise<Recipe | null> {
    const result = await db
      .update(recipes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id))
      .returning();
    return (result[0] as Recipe) || null;
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

  async getIngredient(id: string): Promise<Ingredient | null> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return ingredient || null;
  },

  async createIngredient(data: InsertIngredient): Promise<Ingredient> {
    const result = await db.insert(ingredients).values(data).returning();
    return result[0] as Ingredient;
  },

  async updateIngredient(
    id: string,
    data: UpdateIngredient
  ): Promise<Ingredient | null> {
    const result = await db
      .update(ingredients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ingredients.id, id))
      .returning();
    return (result[0] as Ingredient) || null;
  },

  async deleteIngredient(id: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(eq(ingredients.id, id));
    return (result as any).rowCount > 0;
  },

  async searchIngredients(
    query: string,
    limit: number = 10
  ): Promise<Ingredient[]> {
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

  async bulkCreateIngredients(data: InsertIngredient[]): Promise<Ingredient[]> {
    const result = await db.insert(ingredients).values(data).returning();
    return result as Ingredient[];
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

  async getEvent(id: string): Promise<EventWithRecipes | null> {
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
      recipes: eventRecipesResult.map((er) => ({
        ...er.event_recipes,
        recipe: er.recipes!,
      })) as any,
    } as EventWithRecipes;
  },

  async createEvent(data: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(data).returning();
    return result[0] as Event;
  },

  async updateEvent(id: string, data: UpdateEvent): Promise<Event | null> {
    const result = await db
      .update(events)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    return (result[0] as Event) || null;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result as any).rowCount > 0;
  },

  // Additional methods expected by route files
  async getRecipeWithIngredients(
    id: string
  ): Promise<RecipeWithIngredients | null> {
    return this.getRecipe(id);
  },

  async getEventWithRecipes(id: string): Promise<EventWithRecipes | null> {
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
};
