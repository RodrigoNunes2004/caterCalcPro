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
import {
  Clock,
  Users,
  DollarSign,
  ChefHat,
  Calculator,
  Edit,
  Trash2,
  Scale,
} from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  category: string;
  prepTime?: number;
  cookTime?: number;
  totalCost: number;
  costPerServing: number;
  ingredientCount: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipeId: string) => void;
  onDelete?: (recipeId: string) => void;
  onScale?: (recipeId: string, guestCount: number) => void;
  onViewDetails?: (recipeId: string) => void;
  showActions?: boolean;
  showScaling?: boolean;
}

export default function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onScale,
  onViewDetails,
  showActions = true,
  showScaling = true,
}: RecipeCardProps) {
  const [guestCount, setGuestCount] = useState<number>(recipe.servings);
  const [isScaling, setIsScaling] = useState(false);

  const handleScale = () => {
    if (onScale && guestCount !== recipe.servings) {
      setIsScaling(true);
      onScale(recipe.id, guestCount);
      setTimeout(() => setIsScaling(false), 1000);
    }
  };

  const scaleFactor = guestCount / recipe.servings;
  const scaledCost = recipe.totalCost * scaleFactor;

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "appetizer":
        return "bg-green-100 text-green-800";
      case "main":
        return "bg-blue-100 text-blue-800";
      case "dessert":
        return "bg-purple-100 text-purple-800";
      case "beverage":
        return "bg-orange-100 text-orange-800";
      case "side":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {recipe.name}
            </CardTitle>
            {recipe.description && (
              <CardDescription className="text-sm text-gray-600 line-clamp-2">
                {recipe.description}
              </CardDescription>
            )}
          </div>
          <Badge className={getCategoryColor(recipe.category)}>
            {recipe.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recipe Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ChefHat className="h-4 w-4" />
            <span>{recipe.ingredientCount} ingredients</span>
          </div>
          {recipe.prepTime && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{recipe.prepTime + (recipe.cookTime || 0)} min</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>${recipe.costPerServing.toFixed(2)}/serving</span>
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Base Cost</span>
            <span className="font-semibold text-gray-900">
              ${recipe.totalCost.toFixed(2)}
            </span>
          </div>

          {showScaling && guestCount !== recipe.servings && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-orange-600 font-medium">
                Scaled for {guestCount} servings
              </span>
              <span className="font-semibold text-orange-600">
                ${scaledCost.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Scaling Controls */}
        {showScaling && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Scale for guests:
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
                disabled={guestCount === recipe.servings || isScaling}
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
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(recipe.id)}
              className="flex-1"
            >
              View Details
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(recipe.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(recipe.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
