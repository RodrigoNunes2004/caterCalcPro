import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Download,
  Printer,
  Calculator,
  Package,
  DollarSign,
  Check,
  AlertCircle,
} from "lucide-react";

interface ShoppingListItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string;
  totalCost: number;
  costPerUnit: number;
  category: string;
  recipes: string[];
  isChecked: boolean;
  notes?: string;
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  eventName?: string;
  guestCount?: number;
  totalCost: number;
  onItemCheck?: (ingredientId: string, checked: boolean) => void;
  onExport?: (format: "pdf" | "csv") => void;
  onPrint?: () => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  dairy: "bg-blue-100 text-blue-800",
  meat: "bg-red-100 text-red-800",
  vegetable: "bg-green-100 text-green-800",
  fruit: "bg-yellow-100 text-yellow-800",
  grain: "bg-orange-100 text-orange-800",
  spice: "bg-purple-100 text-purple-800",
  pantry: "bg-gray-100 text-gray-800",
  frozen: "bg-cyan-100 text-cyan-800",
  bakery: "bg-pink-100 text-pink-800",
  baking: "bg-amber-100 text-amber-800",
  other: "bg-indigo-100 text-indigo-800",
};

export default function ShoppingList({
  items,
  eventName,
  guestCount,
  totalCost,
  onItemCheck,
  onExport,
  onPrint,
  isLoading = false,
}: ShoppingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!groupByCategory) {
      return { "All Items": items };
    }

    return items.reduce((groups, item) => {
      const category = item.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, ShoppingListItem[]>);
  }, [items, groupByCategory]);

  const checkedItemsCost = React.useMemo(() => {
    return items
      .filter((item) => checkedItems.has(item.ingredientId))
      .reduce((sum, item) => sum + item.totalCost, 0);
  }, [items, checkedItems]);

  const handleItemCheck = (ingredientId: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems);
    if (checked) {
      newCheckedItems.add(ingredientId);
    } else {
      newCheckedItems.delete(ingredientId);
    }
    setCheckedItems(newCheckedItems);
    onItemCheck?.(ingredientId, checked);
  };

  const completionPercentage =
    items.length > 0 ? (checkedItems.size / items.length) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-8 w-8 animate-pulse mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Generating shopping list...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping List</span>
                {eventName && <Badge variant="outline">{eventName}</Badge>}
              </CardTitle>
              <CardDescription>
                {guestCount && `For ${guestCount} guests • `}
                {items.length} unique ingredients
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("csv")}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("pdf")}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress and Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {items.length}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {completionPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Cost Breakdown */}
          {checkedItems.size > 0 && (
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {checkedItems.size} items checked
                </span>
              </div>
              <div className="text-sm font-medium">
                Cost: ${checkedItemsCost.toFixed(2)} / ${totalCost.toFixed(2)}
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupByCategory(!groupByCategory)}
            >
              {groupByCategory ? "Show All" : "Group by Category"}
            </Button>
            <div className="text-sm text-gray-500">
              Click items to mark as purchased
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List Items */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category}>
            {groupByCategory && (
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Badge
                    className={
                      CATEGORY_COLORS[category] || CATEGORY_COLORS.other
                    }
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({categoryItems.length} items)
                  </span>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div
                    key={item.ingredientId}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      checkedItems.has(item.ingredientId)
                        ? "bg-green-50 border-green-200"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={checkedItems.has(item.ingredientId)}
                      onCheckedChange={(checked) =>
                        handleItemCheck(item.ingredientId, checked as boolean)
                      }
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4
                            className={`font-medium ${
                              checkedItems.has(item.ingredientId)
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {item.name}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="font-medium">
                              {item.totalQuantity.toFixed(2)} {item.unit}
                            </span>
                            <span>
                              ${item.costPerUnit.toFixed(2)}/{item.unit}
                            </span>
                            {item.recipes.length > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.recipes.length} recipes
                              </Badge>
                            )}
                          </div>
                          {item.notes && (
                            <div className="flex items-center space-x-1 mt-1">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-amber-600">
                                {item.notes}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              checkedItems.has(item.ingredientId)
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            ${item.totalCost.toFixed(2)}
                          </div>
                          {item.recipes.length === 1 && (
                            <div className="text-xs text-gray-500">
                              {item.recipes[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {item.recipes.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.recipes.map((recipe, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {recipe}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items in shopping list
            </h3>
            <p className="text-gray-600">
              Add recipes to your event to generate a shopping list.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
