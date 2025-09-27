import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  decimal,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Recipes table
export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").notNull().default(1),
  instructions: text("instructions"),
  category: varchar("category", { length: 50 }).default("main"), // appetizer, main, dessert, beverage
  prepTime: integer("prep_time"), // in minutes
  cookTime: integer("cook_time"), // in minutes
  isSubRecipe: boolean("is_sub_recipe").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  defaultUnit: varchar("default_unit", { length: 20 }).notNull(), // cups, grams, oz, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }), // dairy, meat, vegetable, etc.
  density: decimal("density", { precision: 8, scale: 4 }), // for volume to weight conversions (g/ml)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipe-Ingredient relationships
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  ingredientId: uuid("ingredient_id")
    .references(() => ingredients.id, { onDelete: "cascade" })
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  notes: text("notes"), // optional notes for this ingredient in this recipe
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sub-recipe relationships (for complex recipes that use other recipes as ingredients)
export const recipeSubRecipes = pgTable("recipe_sub_recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentRecipeId: uuid("parent_recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  subRecipeId: uuid("sub_recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(), // how many servings of sub-recipe needed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table for managing catering events
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }), // buffet, morning-tea, canapes, etc.
  eventDate: timestamp("event_date").notNull(),
  guestCount: integer("guest_count").notNull(),
  venue: text("venue"),
  budgetPercentage: decimal("budget_percentage", {
    precision: 5,
    scale: 2,
  }).default("0"), // optional profit margin percentage
  status: varchar("status", { length: 20 }).default("planning"), // planning, confirmed, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event-Recipe relationships (which recipes are planned for which events)
export const eventRecipes = pgTable("event_recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  plannedServings: integer("planned_servings").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertRecipeSchema = createInsertSchema(recipes);
export const selectRecipeSchema = createSelectSchema(recipes);
export const updateRecipeSchema = insertRecipeSchema.partial();

export const insertIngredientSchema = createInsertSchema(ingredients);
export const selectIngredientSchema = createSelectSchema(ingredients);
export const updateIngredientSchema = insertIngredientSchema.partial();

export const insertRecipeIngredientSchema =
  createInsertSchema(recipeIngredients);
export const selectRecipeIngredientSchema =
  createSelectSchema(recipeIngredients);

export const insertRecipeSubRecipeSchema = createInsertSchema(recipeSubRecipes);
export const selectRecipeSubRecipeSchema = createSelectSchema(recipeSubRecipes);

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export const updateEventSchema = insertEventSchema.partial();

export const insertEventRecipeSchema = createInsertSchema(eventRecipes);
export const selectEventRecipeSchema = createSelectSchema(eventRecipes);

// TypeScript types
export type Recipe = z.infer<typeof selectRecipeSchema>;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;

export type Ingredient = z.infer<typeof selectIngredientSchema>;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type UpdateIngredient = z.infer<typeof updateIngredientSchema>;

export type RecipeIngredient = z.infer<typeof selectRecipeIngredientSchema>;
export type InsertRecipeIngredient = z.infer<
  typeof insertRecipeIngredientSchema
>;

export type RecipeSubRecipe = z.infer<typeof selectRecipeSubRecipeSchema>;
export type InsertRecipeSubRecipe = z.infer<typeof insertRecipeSubRecipeSchema>;

export type Event = z.infer<typeof selectEventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;

export type EventRecipe = z.infer<typeof selectEventRecipeSchema>;
export type InsertEventRecipe = z.infer<typeof insertEventRecipeSchema>;

// Extended types for API responses with relationships
export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
  subRecipes: (RecipeSubRecipe & { subRecipe: Recipe })[];
};

export type EventWithRecipes = Event & {
  recipes: (EventRecipe & { recipe: Recipe })[];
};
