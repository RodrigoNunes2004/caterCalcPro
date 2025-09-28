import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Users,
  DollarSign,
  ChefHat,
  Calculator,
  Edit,
  Trash2,
  Scale,
  ShoppingCart,
} from "lucide-react";
import type { RecipeWithIngredients } from "../../shared/schema";

interface RecipeDetailViewProps {
  recipe: RecipeWithIngredients;
  onBack: () => void;
  onEdit: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
}

export default function RecipeDetailView({
  recipe,
  onBack,
  onEdit,
  onDelete,
}: RecipeDetailViewProps) {
  const [guestCount, setGuestCount] = useState<number>(
    Number(recipe.servings) || 1
  );
  const [isScaling, setIsScaling] = useState(false);

  const scaleFactor = guestCount / (Number(recipe.servings) || 1);

  // Calculate total cost from ingredients
  const totalCost = recipe.ingredients.reduce((sum, recipeIngredient) => {
    const quantity = parseFloat(String(recipeIngredient.quantity));
    const costPerUnit = parseFloat(
      String(recipeIngredient.ingredient.costPerUnit)
    );
    return sum + quantity * costPerUnit;
  }, 0);

  const scaledCost = totalCost * scaleFactor;
  const costPerServing = guestCount > 0 ? scaledCost / guestCount : 0;

  const getCategoryColor = (category: string) => {
    const colors = {
      appetizer:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      main: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      beverage:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      baking:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      side: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      sauce: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      dressing:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return (
      colors[category as keyof typeof colors] ||
      "bg-muted text-muted-foreground"
    );
  };

  const handleScale = () => {
    setIsScaling(true);
    setTimeout(() => setIsScaling(false), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Recipes</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center space-x-3">
              <span>{String(recipe.name)}</span>
              <Badge
                className={getCategoryColor(String(recipe.category) || "main")}
              >
                {String(recipe.category) || "main"}
              </Badge>
            </h1>
            {recipe.description && (
              <p className="text-muted-foreground mt-1">
                {String(recipe.description)}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onEdit(String(recipe.id))}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(String(recipe.id))}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recipe Info & Scaling */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recipe Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5" />
                <span>Recipe Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{Number(recipe.servings) || 1} servings</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
                {recipe.prepTime && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{String(recipe.prepTime)} min prep</span>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{String(recipe.cookTime)} min cook</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Time</span>
                  <span className="font-semibold">
                    {(Number(recipe.prepTime) || 0) +
                      (Number(recipe.cookTime) || 0)}{" "}
                    minutes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="font-semibold text-green-600">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cost per Serving</span>
                  <span className="font-semibold text-green-600">
                    ${(totalCost / (Number(recipe.servings) || 1)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scaling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Scale Recipe</span>
              </CardTitle>
              <CardDescription>
                Adjust quantities for different guest counts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Number of Guests
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="flex-1"
                    min="1"
                    max="1000"
                  />
                  <Button
                    onClick={handleScale}
                    disabled={
                      guestCount === (Number(recipe.servings) || 1) || isScaling
                    }
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isScaling ? (
                      <Scale className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {guestCount !== (Number(recipe.servings) || 1) && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Scaled for {guestCount} guests
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {scaleFactor.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-700 dark:text-orange-300">
                      New Total Cost
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ${scaledCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-700 dark:text-orange-300">
                      Cost per Guest
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ${costPerServing.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Ingredients & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ingredients</span>
                  <Badge variant="secondary">{recipe.ingredients.length}</Badge>
                </div>
                {guestCount !== (Number(recipe.servings) || 1) && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                  >
                    Scaled {scaleFactor.toFixed(2)}x
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipe.ingredients.map((recipeIngredient, index) => {
                  const originalQuantity = parseFloat(
                    String(recipeIngredient.quantity)
                  );
                  const scaledQuantity = originalQuantity * scaleFactor;
                  const cost =
                    parseFloat(
                      String(recipeIngredient.ingredient.costPerUnit)
                    ) * scaledQuantity;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {String(recipeIngredient.ingredient.name)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {scaledQuantity.toFixed(2)}{" "}
                          {String(recipeIngredient.unit)}
                          {recipeIngredient.notes && (
                            <span className="text-muted-foreground ml-2">
                              • {String(recipeIngredient.notes)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          ${cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          $
                          {parseFloat(
                            String(recipeIngredient.ingredient.costPerUnit)
                          ).toFixed(2)}
                          /{String(recipeIngredient.unit)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {recipe.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {String(recipe.instructions)
                    .split("\n")
                    .map((line, index) => (
                      <p key={index} className="mb-2 text-gray-700">
                        {line.trim() && (
                          <>
                            <span className="font-medium text-orange-600 mr-2">
                              {index + 1}.
                            </span>
                            {line.trim()}
                          </>
                        )}
                      </p>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
