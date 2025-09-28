import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Scale,
  Percent,
  PieChart,
} from "lucide-react";
import {
  convertSameType,
  volumeToWeight,
  isVolumeUnit,
  isWeightUnit,
} from "@/lib/unitConversion";

interface CostBreakdown {
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  percentage: number;
}

interface RecipeCostData {
  recipeName: string;
  totalCost: number;
  costPerServing: number;
  servings: number;
  ingredients: CostBreakdown[];
}

export default function CostCalculator() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [targetServings, setTargetServings] = useState<number>(4);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [costData, setCostData] = useState<RecipeCostData | null>(null);

  // Fetch recipes for selection
  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      return response.json();
    },
  });

  // Fetch recipe cost calculation
  const { data: calculation, isLoading: isCalculating } = useQuery({
    queryKey: ["recipe-calculation", selectedRecipeId, targetServings],
    queryFn: async () => {
      if (!selectedRecipeId) return null;

      const response = await fetch(
        `/api/recipes/${selectedRecipeId}/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetServings }),
        }
      );

      if (!response.ok) throw new Error("Failed to calculate recipe costs");
      return response.json();
    },
    enabled: !!selectedRecipeId,
  });

  useEffect(() => {
    if (calculation) {
      setCostData(calculation);
    }
  }, [calculation]);

  const calculateSellingPrice = (cost: number, margin: number) => {
    return cost / (1 - margin / 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getUnitConversionInfo = (
    quantity: number,
    unit: string,
    ingredientName: string
  ) => {
    try {
      if (isVolumeUnit(unit)) {
        const weightConversion = volumeToWeight(
          quantity,
          unit,
          ingredientName,
          "g"
        );
        return `≈ ${weightConversion.quantity.toFixed(2)} g`;
      } else if (isWeightUnit(unit) && unit !== "g") {
        const gramConversion = convertSameType(quantity, unit, "g");
        return `≈ ${gramConversion.quantity.toFixed(2)} g`;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cost Calculator</h2>
        <p className="text-gray-600">
          Calculate recipe costs and profit margins
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Recipe Selection & Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="servings">Target Servings</Label>
              <Input
                id="servings"
                type="number"
                value={targetServings}
                onChange={(e) =>
                  setTargetServings(parseInt(e.target.value) || 0)
                }
                min="1"
                placeholder="Number of servings"
              />
            </div>

            <div>
              <Label htmlFor="margin">Profit Margin (%)</Label>
              <Input
                id="margin"
                type="number"
                value={profitMargin}
                onChange={(e) =>
                  setProfitMargin(parseFloat(e.target.value) || 0)
                }
                min="0"
                max="100"
                placeholder="Profit margin"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      {costData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {formatCurrency(costData.totalCost)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cost Per Serving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(costData.costPerServing)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Selling Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    calculateSellingPrice(costData.totalCost, profitMargin)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Percent className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    calculateSellingPrice(costData.totalCost, profitMargin) -
                      costData.totalCost
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ingredient Breakdown */}
      {costData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Ingredient Cost Breakdown</span>
            </CardTitle>
            <CardDescription>
              Detailed cost analysis for {costData.recipeName} ({targetServings}{" "}
              servings)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Cost Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costData.ingredients.map((ingredient, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{ingredient.ingredientName}</div>
                          {getUnitConversionInfo(
                            ingredient.quantity,
                            ingredient.unit,
                            ingredient.ingredientName
                          ) && (
                            <div className="text-xs text-gray-500">
                              {getUnitConversionInfo(
                                ingredient.quantity,
                                ingredient.unit,
                                ingredient.ingredientName
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ingredient.quantity.toFixed(2)} {ingredient.unit}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(ingredient.costPerUnit)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(ingredient.totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ingredient.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[100px]">
                          <Progress
                            value={ingredient.percentage}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isCalculating && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating recipe costs...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedRecipeId && !isCalculating && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Recipe
              </h3>
              <p className="text-gray-600">
                Choose a recipe from the dropdown to see detailed cost
                calculations
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
