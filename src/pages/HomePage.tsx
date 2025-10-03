import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calculator,
  ShoppingCart,
  Users,
  ChefHat,
  Package,
  Menu as MenuIcon,
  Calendar,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigator";
import { useRecipes, useDeleteRecipe } from "@/hooks/useRecipes";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const navigate = useNavigate();
  const [guestCount, setGuestCount] = useState<number>(50);
  const [hiddenRecipes, setHiddenRecipes] = useState<Set<string>>(new Set());

  // Fetch recent recipes (limit to 3 most recent)
  const { data: recipesData, isLoading: recipesLoading } = useRecipes({
    limit: 3,
    page: 1,
  });

  // Calculate total cost for all recipes at current guest count
  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ["homepage-cost", guestCount],
    queryFn: async () => {
      if (!recipesData?.recipes?.length)
        return { totalCost: 0, costPerGuest: 0 };

      // Calculate total cost for all recipes scaled to guest count
      let totalCost = 0;
      for (const recipe of recipesData.recipes) {
        const servings = Array.isArray(recipe.servings)
          ? recipe.servings[0]
          : recipe.servings;
        const totalCostValue = Array.isArray(recipe.totalCost)
          ? recipe.totalCost[0]
          : recipe.totalCost;
        const scaleFactor = guestCount / (servings || 1);
        const recipeCost =
          typeof totalCostValue === "number"
            ? totalCostValue
            : parseFloat(totalCostValue || "0");
        const scaledCost = recipeCost * scaleFactor;
        totalCost += scaledCost;
      }

      return {
        totalCost: totalCost,
        costPerGuest: guestCount > 0 ? totalCost / guestCount : 0,
      };
    },
    enabled: !!recipesData?.recipes?.length,
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useDeleteRecipe();

  const handleDeleteRecipe = async (recipeId: string) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipeMutation.mutateAsync(recipeId);
        // Remove from hidden recipes if it was hidden
        setHiddenRecipes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });
      } catch (error) {
        console.error("Failed to delete recipe:", error);
      }
    }
  };

  const handleHideRecipe = (recipeId: string) => {
    setHiddenRecipes((prev) => new Set([...Array.from(prev), recipeId]));
  };

  const handleShowRecipe = (recipeId: string) => {
    setHiddenRecipes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(recipeId);
      return newSet;
    });
  };

  // Filter out hidden recipes
  const visibleRecipes =
    recipesData?.recipes?.filter((recipe) => {
      const recipeId = Array.isArray(recipe.id) ? recipe.id[0] : recipe.id;
      return !hiddenRecipes.has(recipeId as string);
    }) || [];

  // Mock data for upcoming events (keeping this for now)
  const upcomingEvents = [
    {
      id: 1,
      name: "Corporate Lunch",
      date: "2024-01-15",
      guests: 75,
      status: "confirmed",
    },
    {
      id: 2,
      name: "Wedding Reception",
      date: "2024-01-20",
      guests: 150,
      status: "planning",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-foreground">
                Gastro Grid
              </h1>
            </div>

            <Navigation
              showCreateButton={true}
              createButtonText="New Recipe"
              createButtonAction={() => navigate("/recipes")}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Scale Your Catering Operations
          </h2>
          <p className="text-muted-foreground text-lg">
            Intelligent recipe scaling, cost breakdown, and ingredient
            management for professional caterers.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card
            className="border-orange-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/guest-scaler")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Smart Recipe Scaling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Automatically scale your recipes based on guest count with
                intelligent unit conversion.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-20"
                  min="1"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm text-muted-foreground">guests</span>
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/guest-scaler");
                  }}
                >
                  Scale Recipes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">
                  Real-Time Cost Breakdown
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant cost calculations per recipe with live ingredient
                price tracking.
              </p>
              {costLoading ? (
                <div className="text-2xl font-bold text-blue-600 mt-3">
                  Calculating...
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600 mt-3">
                    ${costData?.totalCost?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    for {guestCount} guests
                  </div>
                  {costData?.costPerGuest && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ${costData.costPerGuest.toFixed(2)} per guest
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/prep-list")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Smart Prep Lists</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Generate comprehensive prep lists and shopping lists with
                automatic ingredient aggregation.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 mt-3">
                Generate List
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-purple-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/events")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Event Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Plan buffets, morning tea, canapés, and more. Track
                profitability across all your events.
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="secondary">Buffets</Badge>
                <Badge variant="secondary">Canapés</Badge>
                <Badge variant="secondary">Morning Tea</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-indigo-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/inventory")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Inventory Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Track stock levels, manage storage locations, and monitor
                ingredient costs in real-time.
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="secondary">Stock Take</Badge>
                <Badge variant="secondary">Low Stock</Badge>
                <Badge variant="secondary">Pricing</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Recent Recipes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Recipes</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/recipes")}
                  >
                    View All
                  </Button>
                </div>
                <CardDescription>
                  Your most recently created and modified recipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recipesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading recipes...
                  </div>
                ) : visibleRecipes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>
                      No recipes found. Create your first recipe to get started!
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate("/recipes")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Recipe
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleRecipes.map((recipe) => {
                      const recipeId = Array.isArray(recipe.id)
                        ? recipe.id[0]
                        : recipe.id;
                      const recipeName = Array.isArray(recipe.name)
                        ? recipe.name[0]
                        : recipe.name;
                      const recipeServings = Array.isArray(recipe.servings)
                        ? recipe.servings[0]
                        : recipe.servings;
                      const recipeCategory = Array.isArray(recipe.category)
                        ? recipe.category[0]
                        : recipe.category;
                      const recipeTotalCost = Array.isArray(recipe.totalCost)
                        ? recipe.totalCost[0]
                        : recipe.totalCost;

                      return (
                        <div
                          key={recipeId}
                          className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {recipeName as string}
                            </h4>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                {recipeServings as number} servings
                              </span>
                              <Badge variant="secondary">
                                {recipeCategory as string}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-semibold text-foreground">
                                $
                                {typeof recipeTotalCost === "number"
                                  ? recipeTotalCost.toFixed(2)
                                  : parseFloat(
                                      (recipeTotalCost as string) || "0"
                                    ).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                base cost
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleHideRecipe(recipeId as string)
                                }
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteRecipe(recipeId as string)
                                }
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                disabled={deleteRecipeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Show hidden recipes count if any */}
                    {hiddenRecipes.size > 0 && (
                      <div className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Show all hidden recipes
                            setHiddenRecipes(new Set());
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show {hiddenRecipes.size} hidden recipe
                          {hiddenRecipes.size !== 1 ? "s" : ""}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Your scheduled catering events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border rounded-lg bg-card"
                    >
                      <h4 className="font-medium text-foreground mb-2">
                        {event.name}
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground mb-2">
                        <div>Date: {event.date}</div>
                        <div>Guests: {event.guests}</div>
                      </div>
                      <Badge
                        variant={
                          event.status === "confirmed" ? "default" : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/events")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Everything You Need to Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Intelligent Recipe Scaling
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatically scale recipes for any guest count with smart
                  unit conversion from cups to grams and vice versa.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Sub-Recipe Support
                </h4>
                <p className="text-sm text-muted-foreground">
                  Build complex recipes using other recipes as ingredients with
                  automatic cost and scaling calculations.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2 text-foreground">
                  Smart Shopping Lists
                </h4>
                <p className="text-sm text-muted-foreground">
                  Generate consolidated shopping lists that automatically
                  combine similar ingredients across multiple recipes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
