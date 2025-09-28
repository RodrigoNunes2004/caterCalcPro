import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Calculator,
  Package,
  Download,
  Edit3,
  Save,
  X,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  scaleQuantity,
  convertSameType,
  normalizeUnit,
} from "@/lib/unitConversion";

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: "protein" | "vegetable" | "carb" | "sauce" | "seasoning" | "other";
  preparationMethod?: string;
  notes?: string;
}

interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: Ingredient[];
  preparationSteps: string[];
  category: string;
}

interface Menu {
  id: string;
  name: string;
  description: string;
  recipes: Recipe[];
  eventType: string;
}

interface PrepItem {
  id: string;
  task: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  notes?: string;
}

interface InventoryItem {
  id: string;
  productName: string;
  currentStock: number;
  unit: string;
  location: string;
}

interface PurchaseItem {
  ingredient: string;
  needed: number;
  available: number;
  toBuy: number;
  unit: string;
  estimatedCost?: number;
}

interface CustomOverride {
  ingredientName: string;
  quantity: number;
  unit: string;
  category: "protein" | "vegetable" | "carb";
}

interface PrepListGeneratorProps {
  onSave?: (prepList: PrepItem[], purchaseList: PurchaseItem[]) => void;
}

// Mock data for demonstration
const MOCK_MENUS: Menu[] = [
  {
    id: "bistro-menu",
    name: "General Bistro Menu",
    description: "Classic bistro dishes with modern presentation",
    eventType: "buffet",
    recipes: [
      {
        id: "herb-salmon",
        name: "Herb-Crusted Salmon",
        servings: 10,
        category: "main",
        ingredients: [
          {
            id: "1",
            name: "salmon fillets",
            quantity: 2,
            unit: "kg",
            category: "protein",
            preparationMethod: "portion into 150g pieces",
          },
          {
            id: "2",
            name: "fresh herbs",
            quantity: 100,
            unit: "g",
            category: "seasoning",
            preparationMethod: "finely chop (parsley, dill, chives)",
          },
          {
            id: "3",
            name: "breadcrumbs",
            quantity: 200,
            unit: "g",
            category: "other",
            preparationMethod: "mix with herbs",
          },
          {
            id: "4",
            name: "lemon",
            quantity: 3,
            unit: "pieces",
            category: "other",
            preparationMethod: "zest and juice",
          },
          {
            id: "5",
            name: "butter",
            quantity: 150,
            unit: "g",
            category: "other",
            preparationMethod: "soften at room temperature",
          },
        ],
        preparationSteps: [
          "Portion salmon fillets into 150g pieces",
          "Finely chop fresh herbs (parsley, dill, chives)",
          "Mix breadcrumbs with chopped herbs",
          "Zest and juice lemons",
          "Soften butter at room temperature",
        ],
      },
      {
        id: "roasted-vegetables",
        name: "Roasted Vegetable Medley",
        servings: 12,
        category: "side",
        ingredients: [
          {
            id: "6",
            name: "carrots",
            quantity: 800,
            unit: "g",
            category: "vegetable",
            preparationMethod: "julienne cut",
          },
          {
            id: "7",
            name: "beetroot",
            quantity: 600,
            unit: "g",
            category: "vegetable",
            preparationMethod: "roast whole, then slice",
          },
          {
            id: "8",
            name: "green beans",
            quantity: 500,
            unit: "g",
            category: "vegetable",
            preparationMethod: "blanch until tender-crisp",
          },
          {
            id: "9",
            name: "red onions",
            quantity: 400,
            unit: "g",
            category: "vegetable",
            preparationMethod: "dice medium",
          },
          {
            id: "10",
            name: "olive oil",
            quantity: 100,
            unit: "ml",
            category: "other",
            preparationMethod: "for roasting",
          },
        ],
        preparationSteps: [
          "Julienne cut carrots",
          "Roast beetroot whole, then slice",
          "Blanch green beans until tender-crisp",
          "Dice red onions medium",
        ],
      },
    ],
  },
  {
    id: "summer-salad",
    name: "Summer Salad Menu",
    description: "Fresh, seasonal salads perfect for warm weather events",
    eventType: "buffet",
    recipes: [
      {
        id: "quinoa-salad",
        name: "Mediterranean Quinoa Salad",
        servings: 8,
        category: "side",
        ingredients: [
          {
            id: "11",
            name: "quinoa",
            quantity: 400,
            unit: "g",
            category: "carb",
            preparationMethod: "cook until fluffy",
          },
          {
            id: "12",
            name: "cherry tomatoes",
            quantity: 300,
            unit: "g",
            category: "vegetable",
            preparationMethod: "halve",
          },
          {
            id: "13",
            name: "cucumber",
            quantity: 250,
            unit: "g",
            category: "vegetable",
            preparationMethod: "dice small",
          },
          {
            id: "14",
            name: "red onions",
            quantity: 100,
            unit: "g",
            category: "vegetable",
            preparationMethod: "dice fine",
          },
          {
            id: "15",
            name: "feta cheese",
            quantity: 200,
            unit: "g",
            category: "other",
            preparationMethod: "crumble",
          },
        ],
        preparationSteps: [
          "Cook quinoa until fluffy",
          "Halve cherry tomatoes",
          "Dice cucumber small",
          "Dice red onions fine",
          "Crumble feta cheese",
        ],
      },
    ],
  },
];

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    productName: "salmon fillets",
    currentStock: 1.5,
    unit: "kg",
    location: "Main Fridge",
  },
  {
    id: "2",
    productName: "carrots",
    currentStock: 2,
    unit: "kg",
    location: "Cold Storage",
  },
  {
    id: "3",
    productName: "quinoa",
    currentStock: 1,
    unit: "kg",
    location: "Dry Storage",
  },
  {
    id: "4",
    productName: "red onions",
    currentStock: 3,
    unit: "kg",
    location: "Pantry",
  },
  {
    id: "5",
    productName: "green beans",
    currentStock: 0.3,
    unit: "kg",
    location: "Main Fridge",
  },
];

export default function PrepListGenerator({ onSave }: PrepListGeneratorProps) {
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState<number>(50);
  const [customOverrides, setCustomOverrides] = useState<CustomOverride[]>([]);
  const [prepList, setPrepList] = useState<PrepItem[]>([]);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomOverrides, setShowCustomOverrides] = useState(false);
  const [editingPrepItem, setEditingPrepItem] = useState<string | null>(null);

  const handleMenuSelection = (menuId: string, checked: boolean) => {
    if (checked) {
      setSelectedMenus([...selectedMenus, menuId]);
    } else {
      setSelectedMenus(selectedMenus.filter((id) => id !== menuId));
    }
  };

  const addCustomOverride = () => {
    setCustomOverrides([
      ...customOverrides,
      { ingredientName: "", quantity: 0, unit: "g", category: "protein" },
    ]);
  };

  const updateCustomOverride = (
    index: number,
    field: keyof CustomOverride,
    value: any
  ) => {
    const updated = [...customOverrides];
    updated[index] = { ...updated[index], [field]: value };
    setCustomOverrides(updated);
  };

  const removeCustomOverride = (index: number) => {
    setCustomOverrides(customOverrides.filter((_, i) => i !== index));
  };

  const normalizeIngredientName = (name: string): string => {
    return name.toLowerCase().trim().replace(/s$/, ""); // Remove plural 's'
  };

  const aggregateIngredients = (
    recipes: Recipe[],
    guestCount: number
  ): Map<string, PrepItem> => {
    const aggregated = new Map<string, PrepItem>();

    recipes.forEach((recipe) => {
      const scaleFactor = guestCount / recipe.servings;

      recipe.ingredients.forEach((ingredient) => {
        const scaledQuantity = scaleQuantity(
          ingredient.quantity,
          recipe.servings,
          guestCount
        );
        const normalizedName = normalizeIngredientName(ingredient.name);
        const taskKey = `${
          ingredient.preparationMethod || "prep"
        }_${normalizedName}`;

        // Check for custom overrides
        const override = customOverrides.find(
          (o) => normalizeIngredientName(o.ingredientName) === normalizedName
        );

        const finalQuantity = override ? override.quantity : scaledQuantity;
        const finalUnit = override ? override.unit : ingredient.unit;

        if (aggregated.has(taskKey)) {
          const existing = aggregated.get(taskKey)!;
          // Try to combine quantities if units are compatible
          try {
            if (existing.unit === finalUnit) {
              existing.quantity += finalQuantity;
            } else {
              // Attempt unit conversion
              const converted = convertSameType(
                finalQuantity,
                finalUnit,
                existing.unit
              );
              existing.quantity += converted.quantity;
            }
          } catch {
            // If conversion fails, create separate entry
            const newTaskKey = `${taskKey}_${finalUnit}`;
            aggregated.set(newTaskKey, {
              id: `prep_${Date.now()}_${Math.random()}`,
              task: ingredient.preparationMethod || `Prep ${ingredient.name}`,
              ingredient: ingredient.name,
              quantity: finalQuantity,
              unit: finalUnit,
              category: ingredient.category,
              priority: ingredient.category === "protein" ? "high" : "medium",
              estimatedTime: estimateTaskTime(
                ingredient.category,
                finalQuantity
              ),
              notes: ingredient.notes,
            });
          }
        } else {
          aggregated.set(taskKey, {
            id: `prep_${Date.now()}_${Math.random()}`,
            task: ingredient.preparationMethod || `Prep ${ingredient.name}`,
            ingredient: ingredient.name,
            quantity: finalQuantity,
            unit: finalUnit,
            category: ingredient.category,
            priority: ingredient.category === "protein" ? "high" : "medium",
            estimatedTime: estimateTaskTime(ingredient.category, finalQuantity),
            notes: ingredient.notes,
          });
        }
      });
    });

    return aggregated;
  };

  const estimateTaskTime = (category: string, quantity: number): string => {
    const baseTime = {
      protein: 15, // minutes per kg
      vegetable: 10,
      carb: 5,
      sauce: 8,
      seasoning: 3,
      other: 5,
    };

    const timePerUnit = baseTime[category as keyof typeof baseTime] || 5;
    const totalMinutes = Math.max(
      5,
      Math.round((quantity / 1000) * timePerUnit)
    );

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const checkInventoryAndGeneratePurchaseList = (
    prepItems: PrepItem[]
  ): PurchaseItem[] => {
    const purchaseItems: PurchaseItem[] = [];

    prepItems.forEach((prepItem) => {
      const normalizedIngredient = normalizeIngredientName(prepItem.ingredient);
      const inventoryItem = MOCK_INVENTORY.find(
        (item) =>
          normalizeIngredientName(item.productName) === normalizedIngredient
      );

      if (inventoryItem) {
        // Convert units if necessary for comparison
        let neededQuantity = prepItem.quantity;
        let availableQuantity = inventoryItem.currentStock;

        try {
          if (prepItem.unit !== inventoryItem.unit) {
            const converted = convertSameType(
              prepItem.quantity,
              prepItem.unit,
              inventoryItem.unit
            );
            neededQuantity = converted.quantity;
          }
        } catch {
          // If conversion fails, treat as different items
        }

        if (neededQuantity > availableQuantity) {
          const toBuy = neededQuantity - availableQuantity;
          purchaseItems.push({
            ingredient: prepItem.ingredient,
            needed: neededQuantity,
            available: availableQuantity,
            toBuy: Math.max(0, toBuy),
            unit: inventoryItem.unit,
            estimatedCost: estimateIngredientCost(
              prepItem.ingredient,
              toBuy,
              inventoryItem.unit
            ),
          });
        }
      } else {
        // Not in inventory, need to buy all
        purchaseItems.push({
          ingredient: prepItem.ingredient,
          needed: prepItem.quantity,
          available: 0,
          toBuy: prepItem.quantity,
          unit: prepItem.unit,
          estimatedCost: estimateIngredientCost(
            prepItem.ingredient,
            prepItem.quantity,
            prepItem.unit
          ),
        });
      }
    });

    return purchaseItems;
  };

  const estimateIngredientCost = (
    ingredient: string,
    quantity: number,
    unit: string
  ): number => {
    // Mock cost estimation - in real app, this would use actual pricing data
    const baseCosts: Record<string, number> = {
      "salmon fillets": 28.5, // per kg
      carrots: 2.5,
      quinoa: 8.0,
      "red onions": 3.0,
      "green beans": 6.5,
      default: 5.0,
    };

    const normalizedName = normalizeIngredientName(ingredient);
    const costPerKg = baseCosts[normalizedName] || baseCosts.default;

    // Convert to kg for cost calculation
    let quantityInKg = quantity;
    if (unit === "g") {
      quantityInKg = quantity / 1000;
    } else if (unit === "pieces") {
      quantityInKg = quantity * 0.15; // Assume 150g per piece for estimation
    }

    return Math.round(costPerKg * quantityInKg * 100) / 100;
  };

  const generatePrepList = async () => {
    setIsGenerating(true);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const selectedMenuData = MOCK_MENUS.filter((menu) =>
        selectedMenus.includes(menu.id)
      );
      const allRecipes = selectedMenuData.flatMap((menu) => menu.recipes);

      const aggregatedIngredients = aggregateIngredients(
        allRecipes,
        guestCount
      );
      const prepItems = Array.from(aggregatedIngredients.values());

      // Sort by priority and category
      const sortedPrepItems = prepItems.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const categoryOrder = {
          protein: 0,
          vegetable: 1,
          carb: 2,
          sauce: 3,
          seasoning: 4,
          other: 5,
        };
        return (
          categoryOrder[a.category as keyof typeof categoryOrder] -
          categoryOrder[b.category as keyof typeof categoryOrder]
        );
      });

      const purchaseItems =
        checkInventoryAndGeneratePurchaseList(sortedPrepItems);

      setPrepList(sortedPrepItems);
      setPurchaseList(purchaseItems);
    } catch (error) {
      console.error("Error generating prep list:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatQuantity = (quantity: number, unit: string): string => {
    if (quantity < 1 && unit === "kg") {
      return `${Math.round(quantity * 1000)} g`;
    }
    if (quantity >= 1000 && unit === "g") {
      return `${Math.round((quantity / 1000) * 100) / 100} kg`;
    }
    return `${Math.round(quantity * 100) / 100} ${unit}`;
  };

  const updatePrepItem = (id: string, field: keyof PrepItem, value: any) => {
    setPrepList(
      prepList.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const exportPrepList = () => {
    const formattedList = generateFormattedPrepList();
    const blob = new Blob([formattedList], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-list-${guestCount}-guests-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateFormattedPrepList = (): string => {
    const menuNames = MOCK_MENUS.filter((menu) =>
      selectedMenus.includes(menu.id)
    )
      .map((menu) => menu.name)
      .join(" + ");

    let output = `🥘 ${menuNames} - Prep List\n`;
    output += `👥 Guest Count: ${guestCount}\n`;
    output += `📅 Generated: ${new Date().toLocaleDateString()}\n\n`;

    const categories = [
      "protein",
      "vegetable",
      "carb",
      "sauce",
      "seasoning",
      "other",
    ];

    categories.forEach((category) => {
      const categoryItems = prepList.filter(
        (item) => item.category === category
      );
      if (categoryItems.length > 0) {
        output += `\n${getCategoryEmoji(category)} ${category.toUpperCase()}\n`;
        categoryItems.forEach((item) => {
          output += `• ${item.task} (${formatQuantity(
            item.quantity,
            item.unit
          )})\n`;
          if (item.notes) {
            output += `  📝 ${item.notes}\n`;
          }
        });
      }
    });

    if (purchaseList.length > 0) {
      output += `\n\n🛒 Items to Purchase\n`;
      purchaseList.forEach((item) => {
        output += `• ${item.ingredient} (${formatQuantity(
          item.toBuy,
          item.unit
        )})`;
        if (item.estimatedCost) {
          output += ` - ~$${item.estimatedCost}`;
        }
        output += `\n`;
      });

      const totalCost = purchaseList.reduce(
        (sum, item) => sum + (item.estimatedCost || 0),
        0
      );
      if (totalCost > 0) {
        output += `\n💰 Estimated Total Cost: $${totalCost.toFixed(2)}\n`;
      }
    }

    return output;
  };

  const getCategoryEmoji = (category: string): string => {
    const emojis = {
      protein: "🥩",
      vegetable: "🥕",
      carb: "🌾",
      sauce: "🍯",
      seasoning: "🧂",
      other: "📦",
    };
    return emojis[category as keyof typeof emojis] || "📦";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span>Prep List Generator</span>
          </CardTitle>
          <CardDescription>
            Generate comprehensive prep lists for your catering events with
            automatic scaling and inventory checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="overrides">Custom Overrides</TabsTrigger>
              <TabsTrigger value="prep-list">Prep List</TabsTrigger>
              <TabsTrigger value="purchase-list">Purchase List</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              {/* Menu Selection */}
              <div>
                <Label className="text-base font-medium">Select Menus</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {MOCK_MENUS.map((menu) => (
                    <Card
                      key={menu.id}
                      className="border-2 border-gray-200 hover:border-orange-300 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedMenus.includes(menu.id)}
                            onCheckedChange={(checked) =>
                              handleMenuSelection(menu.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {menu.name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {menu.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Recipes:</span>
                            <span className="font-medium">
                              {menu.recipes.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Event Type:</span>
                            <Badge variant="secondary" className="text-xs">
                              {menu.eventType}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-1">
                              Recipes:
                            </div>
                            {menu.recipes.map((recipe) => (
                              <div
                                key={recipe.id}
                                className="text-xs text-gray-500"
                              >
                                • {recipe.name} ({recipe.servings} servings)
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <Label htmlFor="guestCount" className="text-base font-medium">
                  Guest Count
                </Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 10))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="guestCount"
                    type="number"
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGuestCount(guestCount + 10)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>guests</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={generatePrepList}
                  disabled={selectedMenus.length === 0 || isGenerating}
                  className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Generate Prep List
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="overrides" className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Label className="text-base font-medium">
                      Custom Ingredient Overrides
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Override default quantities for proteins, vegetables, and
                      carbs
                    </p>
                  </div>
                  <Button
                    onClick={addCustomOverride}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Override
                  </Button>
                </div>

                {customOverrides.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Edit3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No custom overrides set</p>
                      <p className="text-sm text-gray-500">
                        Add overrides to customize ingredient quantities
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {customOverrides.map((override, index) => (
                      <Card key={index} className="border border-orange-200">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                              <Label className="text-sm">Ingredient</Label>
                              <Input
                                value={override.ingredientName}
                                onChange={(e) =>
                                  updateCustomOverride(
                                    index,
                                    "ingredientName",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., salmon fillets"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Quantity</Label>
                              <Input
                                type="number"
                                value={override.quantity}
                                onChange={(e) =>
                                  updateCustomOverride(
                                    index,
                                    "quantity",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                step="0.1"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Unit</Label>
                              <Select
                                value={override.unit}
                                onValueChange={(value) =>
                                  updateCustomOverride(index, "unit", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="g">Grams (g)</SelectItem>
                                  <SelectItem value="kg">
                                    Kilograms (kg)
                                  </SelectItem>
                                  <SelectItem value="pieces">Pieces</SelectItem>
                                  <SelectItem value="ml">
                                    Milliliters (ml)
                                  </SelectItem>
                                  <SelectItem value="l">Liters (l)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Category</Label>
                              <Select
                                value={override.category}
                                onValueChange={(value) =>
                                  updateCustomOverride(index, "category", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="protein">
                                    Protein
                                  </SelectItem>
                                  <SelectItem value="vegetable">
                                    Vegetable
                                  </SelectItem>
                                  <SelectItem value="carb">Carb</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCustomOverride(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="prep-list" className="space-y-6">
              {prepList.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No prep list generated
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Select menus and generate a prep list to see detailed
                      preparation tasks
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Chef Prep List
                      </h3>
                      <p className="text-sm text-gray-600">
                        {prepList.length} tasks for {guestCount} guests
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportPrepList}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      {onSave && (
                        <Button
                          onClick={() => onSave(prepList, purchaseList)}
                          className="bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      "protein",
                      "vegetable",
                      "carb",
                      "sauce",
                      "seasoning",
                      "other",
                    ].map((category) => {
                      const categoryItems = prepList.filter(
                        (item) => item.category === category
                      );
                      if (categoryItems.length === 0) return null;

                      return (
                        <Card key={category}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center space-x-2 text-lg">
                              <span>{getCategoryEmoji(category)}</span>
                              <span className="capitalize">{category}</span>
                              <Badge variant="secondary" className="ml-2">
                                {categoryItems.length} tasks
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <CheckCircle className="h-4 w-4 text-gray-400" />
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {item.task} (
                                          {formatQuantity(
                                            item.quantity,
                                            item.unit
                                          )}
                                          )
                                        </div>
                                        {item.notes && (
                                          <div className="text-sm text-gray-600 mt-1">
                                            📝 {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Badge
                                      variant={
                                        item.priority === "high"
                                          ? "destructive"
                                          : item.priority === "medium"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {item.priority}
                                    </Badge>
                                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                                      <Clock className="h-3 w-3" />
                                      <span>{item.estimatedTime}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchase-list" className="space-y-6">
              {purchaseList.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No purchase list generated
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Generate a prep list first to see what ingredients need to
                      be purchased
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Shopping List
                      </h3>
                      <p className="text-sm text-gray-600">
                        {purchaseList.length} items to purchase
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        Total: $
                        {purchaseList
                          .reduce(
                            (sum, item) => sum + (item.estimatedCost || 0),
                            0
                          )
                          .toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Estimated cost
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {purchaseList.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 capitalize">
                                {item.ingredient}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Need: {formatQuantity(item.needed, item.unit)} •
                                Available:{" "}
                                {formatQuantity(item.available, item.unit)} • To
                                buy: {formatQuantity(item.toBuy, item.unit)}
                              </div>
                            </div>
                            <div className="text-right">
                              {item.estimatedCost && (
                                <div className="font-medium text-gray-900">
                                  ${item.estimatedCost.toFixed(2)}
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                {item.available > 0 ? (
                                  <Badge variant="outline" className="text-xs">
                                    Partial stock
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Not in stock
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
