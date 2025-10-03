import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  DollarSign,
  ChefHat,
  Scale,
  Eye,
} from "lucide-react";
import RecipeForm from "@/components/RecipeForm";
import RecipeDetailView from "@/components/RecipeDetailView";
import type { Recipe, RecipeWithIngredients } from "../../shared/schema";

interface RecipeManagerProps {
  searchTerm: string;
}

interface RecipeFormData {
  name: string;
  description: string;
  servings: number;
  category: string;
  prepTime: number;
  cookTime: number;
  instructions: string;
  ingredients: Array<{
    id?: string;
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    notes?: string;
  }>;
  subRecipes: Array<{
    id?: string;
    subRecipeId: string;
    name: string;
    quantity: number;
    servings: number;
    cost: number;
  }>;
}

export default function RecipeManager({ searchTerm }: RecipeManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);

  const queryClient = useQueryClient();

  // Fetch recipes
  const { data: recipesData, isLoading } = useQuery({
    queryKey: ["recipes", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/recipes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
  });

  // Extract recipes array from API response
  const recipes = recipesData?.recipes || [];

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setShowCreateForm(false);
      toast({
        title: "Recipe Created",
        description: "Your recipe has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recipe. Please try again.",
      });
    },
  });

  // Update recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormData & { id: string }) => {
      const response = await fetch(`/api/recipes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setShowEditForm(false);
      setSelectedRecipe(null);
      toast({
        title: "Recipe Updated",
        description: "Your recipe has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
      });
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setShowDetailView(false);
      setSelectedRecipe(null);
      toast({
        title: "Recipe Deleted",
        description: "Recipe has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
      });
    },
  });

  const handleFormSubmit = (data: RecipeFormData) => {
    if (selectedRecipe) {
      updateRecipeMutation.mutate({ ...data, id: String(selectedRecipe.id) });
    } else {
      createRecipeMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedRecipe(null);
  };

  const handleViewRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error("Failed to fetch recipe");
      const recipe = await response.json();
      setSelectedRecipe(recipe);
      setShowDetailView(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recipe details.",
      });
    }
  };

  const handleEditRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error("Failed to fetch recipe");
      const recipe = await response.json();
      setSelectedRecipe(recipe);
      setShowDetailView(false);
      setShowEditForm(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recipe for editing.",
      });
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this recipe? This action cannot be undone."
      )
    ) {
      deleteRecipeMutation.mutate(recipeId);
    }
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedRecipe(null);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      appetizer: "bg-green-100 text-green-800",
      main: "bg-blue-100 text-blue-800",
      dessert: "bg-pink-100 text-pink-800",
      beverage: "bg-purple-100 text-purple-800",
      baking: "bg-amber-100 text-amber-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show create form if requested
  if (showCreateForm) {
    return (
      <RecipeForm
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isLoading={createRecipeMutation.isPending}
        mode="create"
      />
    );
  }

  // Show edit form if requested
  if (showEditForm && selectedRecipe) {
    return (
      <RecipeForm
        initialData={{
          name: String(selectedRecipe.name),
          description: String(selectedRecipe.description),
          category: String(selectedRecipe.category),
          instructions: String(selectedRecipe.instructions),
          servings: Number(selectedRecipe.servings) || 1,
          prepTime: Number(selectedRecipe.prepTime) || 0,
          cookTime: Number(selectedRecipe.cookTime) || 0,
          ingredients:
            selectedRecipe.ingredients?.map((ri) => {
              console.log("Loading ingredient for edit:", {
                name: ri.ingredient.name,
                quantity: ri.quantity,
                costPerUnit: ri.ingredient.costPerUnit,
                costPerUnitNumber: Number(ri.ingredient.costPerUnit),
              });
              return {
                ingredientId: String(ri.ingredient.id),
                name: String(ri.ingredient.name),
                quantity: Number(ri.quantity) || 0,
                unit: String(ri.unit),
                costPerUnit: Number(ri.ingredient.costPerUnit) || 0,
                notes: String(ri.notes || ""),
              };
            }) || [],
          subRecipes:
            selectedRecipe.subRecipes?.map((sr) => ({
              subRecipeId: String(sr.subRecipe.id),
              name: String(sr.subRecipe.name),
              quantity: Number(sr.quantity) || 0,
              servings: Number(sr.subRecipe.servings) || 1,
              cost: 0, // Calculate if needed
            })) || [],
        }}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isLoading={updateRecipeMutation.isPending}
        mode="edit"
      />
    );
  }

  // Show detail view if requested
  if (showDetailView && selectedRecipe) {
    return (
      <RecipeDetailView
        recipe={selectedRecipe}
        onBack={handleBackToList}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteRecipe}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Recipe Management
          </h2>
          <p className="text-muted-foreground">
            Create and manage your catering recipes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Recipe
        </Button>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes?.map((recipe: any) => (
          <Card
            key={recipe.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => handleViewRecipe(recipe.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                    {recipe.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {recipe.description || "No description provided"}
                  </CardDescription>
                </div>
                <Badge className={getCategoryColor(recipe.category || "main")}>
                  {recipe.category || "main"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>Click to view details</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRecipe(recipe.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecipe(recipe.id);
                      }}
                      disabled={deleteRecipeMutation.isPending}
                      className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipes?.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recipes found
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by creating your first recipe"}
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Recipe
          </Button>
        </div>
      )}
    </div>
  );
}
