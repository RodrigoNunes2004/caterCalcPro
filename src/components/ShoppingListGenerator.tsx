import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Download,
  DollarSign,
  Package,
  CheckCircle,
  Calculator,
} from "lucide-react";

interface SelectedRecipe {
  id: string;
  name: string;
  servings: number;
  guestCount: number;
}

interface ShoppingListItem {
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  category: string;
  recipes: string[];
  isPurchased: boolean;
}

interface ShoppingListData {
  items: ShoppingListItem[];
  totalCost: number;
  totalItems: number;
  recipesIncluded: string[];
}

export default function ShoppingListGenerator() {
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipe[]>([]);
  const [eventGuestCount, setEventGuestCount] = useState<number>(50);
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(
    null
  );
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  // Fetch recipes for selection
  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
  });

  // Generate shopping list mutation
  const generateListMutation = useMutation({
    mutationFn: async () => {
      if (selectedRecipes.length === 0) {
        throw new Error("Please select at least one recipe");
      }

      const recipeList = selectedRecipes.map((recipe) => ({
        recipeId: recipe.id,
        servings: recipe.servings,
      }));

      const response = await fetch("/api/recipes/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipes: recipeList,
          guestCount: eventGuestCount,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate shopping list");
      return response.json();
    },
    onSuccess: (data) => {
      setShoppingList(data);
      setPurchasedItems(new Set());
      toast({
        title: "Shopping List Generated",
        description: `Created list with ${data.totalItems} items from ${data.recipesIncluded.length} recipes.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate shopping list.",
      });
    },
  });

  const addRecipe = (recipeId: string) => {
    const recipe = recipes?.find((r: any) => r.id === recipeId);
    if (!recipe) return;

    const isAlreadySelected = selectedRecipes.some((r) => r.id === recipeId);
    if (isAlreadySelected) {
      toast({
        title: "Recipe Already Added",
        description: "This recipe is already in your shopping list.",
      });
      return;
    }

    const newRecipe: SelectedRecipe = {
      id: recipe.id,
      name: recipe.name,
      servings: Math.ceil(eventGuestCount / recipe.servings) * recipe.servings,
      guestCount: eventGuestCount,
    };

    setSelectedRecipes((prev) => [...prev, newRecipe]);
  };

  const removeRecipe = (recipeId: string) => {
    setSelectedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const updateRecipeServings = (recipeId: string, servings: number) => {
    setSelectedRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, servings } : r))
    );
  };

  const toggleItemPurchased = (ingredientName: string) => {
    setPurchasedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      dairy: "bg-blue-100 text-blue-800",
      meat: "bg-red-100 text-red-800",
      vegetable: "bg-green-100 text-green-800",
      grain: "bg-yellow-100 text-yellow-800",
      spice: "bg-purple-100 text-purple-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const exportShoppingList = () => {
    if (!shoppingList) return;

    const content = [
      "CATERING SHOPPING LIST",
      `Generated for ${eventGuestCount} guests`,
      `Total Cost: ${formatCurrency(shoppingList.totalCost)}`,
      "",
      "INGREDIENTS:",
      ...shoppingList.items.map(
        (item) =>
          `- ${item.ingredientName}: ${item.totalQuantity.toFixed(2)} ${
            item.unit
          } (${formatCurrency(item.totalCost)})`
      ),
      "",
      "RECIPES INCLUDED:",
      ...shoppingList.recipesIncluded.map((recipe) => `- ${recipe}`),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Shopping List Exported",
      description: "Your shopping list has been downloaded as a text file.",
    });
  };

  const purchasedItemsCount = shoppingList
    ? shoppingList.items.filter((item) =>
        purchasedItems.has(item.ingredientName)
      ).length
    : 0;

  const purchasedItemsCost = shoppingList
    ? shoppingList.items
        .filter((item) => purchasedItems.has(item.ingredientName))
        .reduce((sum, item) => sum + item.totalCost, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Shopping List Generator
        </h2>
        <p className="text-gray-600">
          Create comprehensive shopping lists for catering events
        </p>
      </div>

      {/* Event Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Event Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guestCount">Number of Guests</Label>
              <Input
                id="guestCount"
                type="number"
                value={eventGuestCount}
                onChange={(e) =>
                  setEventGuestCount(parseInt(e.target.value) || 0)
                }
                min="1"
                placeholder="Total guests"
              />
            </div>
            <div>
              <Label htmlFor="addRecipe">Add Recipe</Label>
              <div className="flex space-x-2">
                <Select onValueChange={addRecipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipe..." />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Recipes */}
      {selectedRecipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Recipes ({selectedRecipes.length})</span>
              <Button
                onClick={() => generateListMutation.mutate()}
                disabled={
                  generateListMutation.isPending || selectedRecipes.length === 0
                }
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Generate List
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Planned Servings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRecipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={recipe.servings}
                        onChange={(e) =>
                          updateRecipeServings(
                            recipe.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="1"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipe(recipe.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Shopping List Summary */}
      {shoppingList && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {shoppingList.totalItems}
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
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(shoppingList.totalCost)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Purchased
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {purchasedItemsCount}/{shoppingList.totalItems}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Remaining Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(shoppingList.totalCost - purchasedItemsCost)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shopping List Items */}
      {shoppingList && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Shopping List</span>
                </CardTitle>
                <CardDescription>
                  Aggregated ingredients for {eventGuestCount} guests
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exportShoppingList}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">✓</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Used In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shoppingList.items.map((item, index) => (
                  <TableRow
                    key={index}
                    className={
                      purchasedItems.has(item.ingredientName)
                        ? "opacity-60 bg-green-50"
                        : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={purchasedItems.has(item.ingredientName)}
                        onCheckedChange={() =>
                          toggleItemPurchased(item.ingredientName)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.ingredientName}
                    </TableCell>
                    <TableCell>
                      {item.totalQuantity.toFixed(2)} {item.unit}
                    </TableCell>
                    <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category || "Other"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {item.recipes.slice(0, 2).join(", ")}
                      {item.recipes.length > 2 &&
                        ` +${item.recipes.length - 2} more`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {generateListMutation.isPending && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating shopping list...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedRecipes.length === 0 && !generateListMutation.isPending && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Create Shopping List
              </h3>
              <p className="text-gray-600">
                Add recipes to generate a comprehensive shopping list for your
                catering event
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
