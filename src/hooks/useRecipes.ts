import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Recipe,
  RecipeWithIngredients,
  InsertRecipe,
  UpdateRecipe,
  InsertRecipeIngredient,
  InsertRecipeSubRecipe,
} from "../../shared/schema";

// API functions
const api = {
  // Get all recipes with pagination and search
  getRecipes: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {}
  ): Promise<{
    recipes: Recipe[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.category) searchParams.set("category", params.category);

    const response = await fetch(`/api/recipes?${searchParams}`);
    if (!response.ok) throw new Error("Failed to fetch recipes");
    return response.json();
  },

  // Get single recipe with ingredients
  getRecipe: async (id: string): Promise<RecipeWithIngredients> => {
    const response = await fetch(`/api/recipes/${id}`);
    if (!response.ok) throw new Error("Failed to fetch recipe");
    return response.json();
  },

  // Create new recipe
  createRecipe: async (recipe: InsertRecipe): Promise<Recipe> => {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!response.ok) throw new Error("Failed to create recipe");
    return response.json();
  },

  // Update recipe
  updateRecipe: async (id: string, recipe: UpdateRecipe): Promise<Recipe> => {
    const response = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!response.ok) throw new Error("Failed to update recipe");
    return response.json();
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<void> => {
    const response = await fetch(`/api/recipes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete recipe");
  },

  // Add ingredient to recipe
  addIngredientToRecipe: async (
    ingredient: InsertRecipeIngredient
  ): Promise<void> => {
    const response = await fetch(
      `/api/recipes/${ingredient.recipeId}/ingredients`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ingredient),
      }
    );
    if (!response.ok) throw new Error("Failed to add ingredient to recipe");
  },

  // Remove ingredient from recipe
  removeIngredientFromRecipe: async (
    recipeId: string,
    ingredientId: string
  ): Promise<void> => {
    const response = await fetch(
      `/api/recipes/${recipeId}/ingredients/${ingredientId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok)
      throw new Error("Failed to remove ingredient from recipe");
  },

  // Add sub-recipe to recipe
  addSubRecipeToRecipe: async (
    subRecipe: InsertRecipeSubRecipe
  ): Promise<void> => {
    const response = await fetch(
      `/api/recipes/${subRecipe.parentRecipeId}/sub-recipes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subRecipe),
      }
    );
    if (!response.ok) throw new Error("Failed to add sub-recipe to recipe");
  },

  // Calculate recipe costs and scaling
  calculateRecipeCosts: async (
    id: string,
    params: {
      guestCount?: number;
      targetServings?: number;
    }
  ): Promise<{
    originalCost: number;
    scaledCost: number;
    costPerServing: number;
    scaleFactor: number;
    ingredients: Array<{
      name: string;
      originalQuantity: number;
      scaledQuantity: number;
      unit: string;
      cost: number;
    }>;
  }> => {
    const response = await fetch(`/api/recipes/${id}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error("Failed to calculate recipe costs");
    return response.json();
  },

  // Generate shopping list for multiple recipes
  generateShoppingList: async (
    recipes: Array<{
      recipeId: string;
      servings: number;
    }>,
    guestCount?: number
  ): Promise<{
    items: Array<{
      ingredientId: string;
      name: string;
      totalQuantity: number;
      unit: string;
      totalCost: number;
      costPerUnit: number;
      category: string;
      recipes: string[];
    }>;
    totalCost: number;
  }> => {
    const response = await fetch("/api/recipes/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipes, guestCount }),
    });
    if (!response.ok) throw new Error("Failed to generate shopping list");
    return response.json();
  },

  // Adjust recipe proportions when one ingredient is modified
  adjustRecipeProportions: async (
    id: string,
    modifiedIngredientId: string,
    newQuantity: number
  ): Promise<RecipeWithIngredients> => {
    const response = await fetch(`/api/recipes/${id}/adjust-proportions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modifiedIngredientId, newQuantity }),
    });
    if (!response.ok) throw new Error("Failed to adjust recipe proportions");
    return response.json();
  },

  // Get recipe nutrition info and percentages
  getRecipeNutrition: async (
    id: string
  ): Promise<{
    totalWeight: number;
    ingredients: Array<{
      name: string;
      weight: number;
      percentage: number;
    }>;
  }> => {
    const response = await fetch(`/api/recipes/${id}/nutrition`);
    if (!response.ok) throw new Error("Failed to fetch recipe nutrition");
    return response.json();
  },
};

// Query hooks
export const useRecipes = (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ["recipes", params],
    queryFn: () => api.getRecipes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: () => api.getRecipe(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecipeCosts = (
  id: string,
  params: {
    guestCount?: number;
    targetServings?: number;
  }
) => {
  return useQuery({
    queryKey: ["recipe-costs", id, params],
    queryFn: () => api.calculateRecipeCosts(id, params),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRecipeNutrition = (id: string) => {
  return useQuery({
    queryKey: ["recipe-nutrition", id],
    queryFn: () => api.getRecipeNutrition(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useShoppingList = (
  recipes: Array<{
    recipeId: string;
    servings: number;
  }>,
  guestCount?: number
) => {
  return useQuery({
    queryKey: ["shopping-list", recipes, guestCount],
    queryFn: () => api.generateShoppingList(recipes, guestCount),
    enabled: recipes.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation hooks
export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, recipe }: { id: string; recipe: UpdateRecipe }) =>
      api.updateRecipe(id, recipe),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};

export const useAddIngredientToRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.addIngredientToRecipe,
    onSuccess: (_, ingredient: InsertRecipeIngredient) => {
      queryClient.invalidateQueries({
        queryKey: ["recipe", ingredient.recipeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recipe-costs", ingredient.recipeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recipe-nutrition", ingredient.recipeId],
      });
    },
  });
};

export const useRemoveIngredientFromRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      ingredientId,
    }: {
      recipeId: string;
      ingredientId: string;
    }) => api.removeIngredientFromRecipe(recipeId, ingredientId),
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipe-costs", recipeId] });
      queryClient.invalidateQueries({
        queryKey: ["recipe-nutrition", recipeId],
      });
    },
  });
};

export const useAddSubRecipeToRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.addSubRecipeToRecipe,
    onSuccess: (_, subRecipe: InsertRecipeSubRecipe) => {
      queryClient.invalidateQueries({
        queryKey: ["recipe", subRecipe.parentRecipeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["recipe-costs", subRecipe.parentRecipeId],
      });
    },
  });
};

export const useAdjustRecipeProportions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      modifiedIngredientId,
      newQuantity,
    }: {
      id: string;
      modifiedIngredientId: string;
      newQuantity: number;
    }) => api.adjustRecipeProportions(id, modifiedIngredientId, newQuantity),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      queryClient.invalidateQueries({ queryKey: ["recipe-costs", id] });
      queryClient.invalidateQueries({ queryKey: ["recipe-nutrition", id] });
    },
  });
};
