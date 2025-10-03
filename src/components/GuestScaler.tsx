import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Scale,
  TrendingUp,
  RefreshCw,
  Calculator,
  ChefHat,
  Target,
} from "lucide-react";
import { scaleQuantity, adjustRecipeProportions } from "@/lib/unitConversion";

interface ScaledIngredient {
  id: string;
  name: string;
  originalQuantity: number;
  scaledQuantity: number;
  unit: string;
  notes?: string;
  isModified?: boolean;
}

interface ScaledRecipe {
  id: string;
  name: string;
  originalServings: number;
  targetServings: number;
  scaleFactor: number;
  ingredients: ScaledIngredient[];
  totalCost: number;
  costPerServing: number;
}

export default function GuestScaler() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(50);
  const [servingsPerGuest, setServingsPerGuest] = useState<number>(1);
  const [scaledRecipe, setScaledRecipe] = useState<ScaledRecipe | null>(null);
  const [adjustedIngredients, setAdjustedIngredients] = useState<
    ScaledIngredient[]
  >([]);

  const queryClient = useQueryClient();

  // Fetch recipes for selection
  const { data: recipesData } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
  });

  const recipes = recipesData?.recipes || [];

  // Fetch and scale recipe
  const { data: recipeData, isLoading: isScaling } = useQuery({
    queryKey: [
      "recipe-scaling",
      selectedRecipeId,
      guestCount,
      servingsPerGuest,
    ],
    queryFn: async () => {
      if (!selectedRecipeId) return null;

      const targetServings = guestCount * servingsPerGuest;

      const response = await fetch(
        `/api/recipes/${selectedRecipeId}/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetServings }),
        }
      );

      if (!response.ok) throw new Error("Failed to scale recipe");
      return response.json();
    },
    enabled: !!selectedRecipeId && guestCount > 0,
  });

  // Adjust proportions mutation
  const adjustProportionsMutation = useMutation({
    mutationFn: async ({
      ingredientId,
      newQuantity,
    }: {
      ingredientId: string;
      newQuantity: number;
    }) => {
      const response = await fetch(
        `/api/recipes/${selectedRecipeId}/adjust-proportions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modifiedIngredientId: ingredientId,
            newQuantity,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to adjust proportions");
      return response.json();
    },
    onSuccess: (data) => {
      setAdjustedIngredients(data.ingredients);
      toast({
        title: "Proportions Adjusted",
        description: "Recipe proportions have been recalculated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to adjust proportions. Please try again.",
      });
    },
  });

  useEffect(() => {
    if (recipeData) {
      setScaledRecipe(recipeData);
      setAdjustedIngredients(recipeData.ingredients || []);
    }
  }, [recipeData]);

  const handleIngredientQuantityChange = (
    ingredientId: string,
    newQuantity: number
  ) => {
    // Update local state immediately for responsive UI
    setAdjustedIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingredientId
          ? { ...ing, scaledQuantity: newQuantity, isModified: true }
          : ing
      )
    );

    // Debounce the API call
    setTimeout(() => {
      adjustProportionsMutation.mutate({ ingredientId, newQuantity });
    }, 500);
  };

  const resetToOriginalProportions = () => {
    if (scaledRecipe) {
      setAdjustedIngredients(scaledRecipe.ingredients);
      toast({
        title: "Reset Complete",
        description: "Ingredients reset to original proportions.",
      });
    }
  };

  const formatQuantity = (quantity: number) => {
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  };

  const calculateTotalGuests = () => guestCount;
  const calculateTotalServings = () => guestCount * servingsPerGuest;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Guest Scaling</h2>
        <p className="text-gray-600">
          Scale recipes for catering events based on guest count
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Event Planning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="recipe">Select Recipe</Label>
              <Select
                value={selectedRecipeId}
                onValueChange={setSelectedRecipeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a recipe..." />
                </SelectTrigger>
                <SelectContent>
                  {recipes?.map((recipe: any) => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="guests">Number of Guests</Label>
              <div className="space-y-2">
                <Input
                  id="guests"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="Number of guests"
                />
                <Slider
                  value={[guestCount]}
                  onValueChange={(value) => setGuestCount(value[0])}
                  max={500}
                  min={1}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="servingsPerGuest">Servings per Guest</Label>
              <Select
                value={servingsPerGuest.toString()}
                onValueChange={(value) =>
                  setServingsPerGuest(parseFloat(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5 (Appetizer)</SelectItem>
                  <SelectItem value="1">1.0 (Standard)</SelectItem>
                  <SelectItem value="1.5">1.5 (Generous)</SelectItem>
                  <SelectItem value="2">2.0 (Large Portions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scaling Summary */}
      {scaledRecipe && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotalGuests()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Servings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {calculateTotalServings()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Scale Factor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {(
                    calculateTotalServings() / scaledRecipe.originalServings
                  ).toFixed(1)}
                  x
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  ${scaledRecipe.totalCost?.toFixed(2) || "0.00"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scaled Ingredients */}
      {scaledRecipe && adjustedIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <ChefHat className="h-5 w-5" />
                  <span>Scaled Ingredients</span>
                </CardTitle>
                <CardDescription>
                  {scaledRecipe.name} scaled for {calculateTotalServings()}{" "}
                  servings
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToOriginalProportions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Scaled Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustedIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatQuantity(ingredient.originalQuantity)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={ingredient.scaledQuantity}
                        onChange={(e) =>
                          handleIngredientQuantityChange(
                            ingredient.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.01"
                        min="0"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell>
                      {ingredient.isModified ? (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-600"
                        >
                          Modified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          Scaled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ingredient.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isScaling && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Scaling recipe for {calculateTotalGuests()} guests...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedRecipeId && !isScaling && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Scale a Recipe
              </h3>
              <p className="text-gray-600">
                Select a recipe and set your guest count to see scaled
                ingredients
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
