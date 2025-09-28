import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Search,
  Calculator,
  Clock,
  Users,
  ChefHat,
  Trash2,
  Scale,
} from "lucide-react";
import { getAllUnits } from "@/lib/unitConversion";

interface Ingredient {
  id?: string;
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  notes?: string;
}

interface SubRecipe {
  id?: string;
  subRecipeId: string;
  name: string;
  quantity: number;
  servings: number;
  cost: number;
}

interface RecipeFormData {
  name: string;
  description: string;
  servings: number;
  category: string;
  prepTime: number;
  cookTime: number;
  instructions: string;
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

const RECIPE_CATEGORIES = [
  "appetizer",
  "main",
  "side",
  "dessert",
  "beverage",
  "sauce",
  "dressing",
  "baking",
];

export default function RecipeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    description: "",
    servings: 4,
    category: "main",
    prepTime: 30,
    cookTime: 0,
    instructions: "",
    ingredients: [],
    subRecipes: [],
    ...initialData,
  });

  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: "",
    quantity: 0,
    unit: "cups",
    costPerUnit: 0,
  });

  const [quantityInput, setQuantityInput] = useState("");
  const [ingredientQuantityInputs, setIngredientQuantityInputs] = useState<
    Record<number, string>
  >({});

  const [totalCost, setTotalCost] = useState(0);
  const [costPerServing, setCostPerServing] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const units = getAllUnits();
  const allUnits = [...units.volume, ...units.weight, ...units.count];

  // Initialize quantity inputs when form data changes
  useEffect(() => {
    if (initialData?.ingredients) {
      const inputs: Record<number, string> = {};
      initialData.ingredients.forEach((ingredient, index) => {
        inputs[index] = ingredient.quantity.toString();
      });
      setIngredientQuantityInputs(inputs);
    }
  }, [initialData]);

  // Calculate total cost whenever ingredients or sub-recipes change
  useEffect(() => {
    const ingredientsCost = formData.ingredients.reduce((sum, ingredient) => {
      return sum + ingredient.quantity * ingredient.costPerUnit;
    }, 0);

    const subRecipesCost = formData.subRecipes.reduce((sum, subRecipe) => {
      return sum + subRecipe.quantity * subRecipe.cost;
    }, 0);

    const total = ingredientsCost + subRecipesCost;
    setTotalCost(total);
    setCostPerServing(formData.servings > 0 ? total / formData.servings : 0);
  }, [formData.ingredients, formData.subRecipes, formData.servings]);

  const handleInputChange = (field: keyof RecipeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Function to parse fraction or decimal string to number
  const parseFractionOrDecimal = (value: string): number => {
    if (!value || value.trim() === "") return 0;

    // Handle fractions like "3/4", "1/2", "2 1/4"
    const fractionRegex = /^(\d+\s+)?(\d+)\/(\d+)$/;
    const match = value.trim().match(fractionRegex);

    if (match) {
      const wholeNumber = match[1] ? parseInt(match[1].trim()) : 0;
      const numerator = parseInt(match[2]);
      const denominator = parseInt(match[3]);

      if (denominator === 0) return 0;
      return wholeNumber + numerator / denominator;
    }

    // Handle regular decimals
    const decimal = parseFloat(value);
    return isNaN(decimal) ? 0 : decimal;
  };

  const addIngredient = () => {
    if (
      newIngredient.name &&
      newIngredient.quantity &&
      newIngredient.costPerUnit
    ) {
      const ingredient: Ingredient = {
        ingredientId: `temp-${Date.now()}`,
        name: newIngredient.name,
        quantity: newIngredient.quantity,
        unit: newIngredient.unit || "cups",
        costPerUnit: newIngredient.costPerUnit,
        notes: newIngredient.notes,
      };

      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredient],
      }));

      setNewIngredient({
        name: "",
        quantity: 0,
        unit: "cups",
        costPerUnit: 0,
      });
      setQuantityInput("");
    }
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "create" ? "Create New Recipe" : "Edit Recipe"}
          </h1>
          <p className="text-muted-foreground">
            Build your recipe with ingredients, costs, and scaling information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="recipe-form"
            disabled={
              isLoading || !formData.name || formData.ingredients.length === 0
            }
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading
              ? "Saving..."
              : mode === "create"
              ? "Create Recipe"
              : "Update Recipe"}
          </Button>
        </div>
      </div>

      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter recipe name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your recipe"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="servings"
                  className="flex items-center space-x-1"
                >
                  <Users className="h-4 w-4" />
                  <span>Servings</span>
                </Label>
                <Input
                  id="servings"
                  type="number"
                  value={formData.servings}
                  onChange={(e) =>
                    handleInputChange("servings", Number(e.target.value))
                  }
                  min="1"
                  max="1000"
                />
              </div>
              <div>
                <Label
                  htmlFor="prepTime"
                  className="flex items-center space-x-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>Prep Time (min)</span>
                </Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) =>
                    handleInputChange("prepTime", Number(e.target.value))
                  }
                  min="0"
                />
              </div>
              <div>
                <Label
                  htmlFor="cookTime"
                  className="flex items-center space-x-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>Cook Time (min)</span>
                </Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) =>
                    handleInputChange("cookTime", Number(e.target.value))
                  }
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5" />
                <span>Ingredients</span>
                <Badge variant="secondary">{formData.ingredients.length}</Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calculator className="h-4 w-4" />
                <span>
                  Total: ${totalCost.toFixed(2)} (${costPerServing.toFixed(2)}
                  /serving)
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Ingredient Form */}
            <Card className="border-dashed border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Ingredient</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="ingredient-name"
                      className="text-sm font-medium"
                    >
                      Ingredient Name *
                    </Label>
                    <Input
                      id="ingredient-name"
                      placeholder="e.g., Salmon fillets, Olive oil, Flour"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="ingredient-quantity"
                        className="text-sm font-medium"
                      >
                        Quantity *
                      </Label>
                      <Input
                        id="ingredient-quantity"
                        type="text"
                        placeholder="e.g., 3/4, 1.5, 2 1/4"
                        value={quantityInput}
                        onChange={(e) => {
                          setQuantityInput(e.target.value);
                          const parsedQuantity = parseFractionOrDecimal(
                            e.target.value
                          );
                          setNewIngredient((prev) => ({
                            ...prev,
                            quantity: parsedQuantity,
                          }));
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="ingredient-unit"
                        className="text-sm font-medium"
                      >
                        Unit
                      </Label>
                      <Select
                        value={newIngredient.unit}
                        onValueChange={(value) =>
                          setNewIngredient((prev) => ({ ...prev, unit: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                            Volume
                          </div>
                          {units.volume.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                          <Separator />
                          <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                            Weight
                          </div>
                          {units.weight.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                          <Separator />
                          <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                            Count
                          </div>
                          {units.count.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="ingredient-cost"
                      className="text-sm font-medium"
                    >
                      Cost per Unit (NZD) *
                    </Label>
                    <Input
                      id="ingredient-cost"
                      type="number"
                      placeholder="0.00"
                      value={newIngredient.costPerUnit || ""}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          costPerUnit: Number(e.target.value),
                        }))
                      }
                      step="0.01"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="ingredient-notes"
                      className="text-sm font-medium"
                    >
                      Notes (Optional)
                    </Label>
                    <Input
                      id="ingredient-notes"
                      placeholder="e.g., Fresh, organic, brand preference"
                      value={newIngredient.notes || ""}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addIngredient}
                    disabled={
                      !newIngredient.name ||
                      !newIngredient.quantity ||
                      !newIngredient.costPerUnit
                    }
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients List */}
            {formData.ingredients.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Added Ingredients
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {formData.ingredients.length} ingredient
                    {formData.ingredients.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <Card
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400">
                              Ingredient Name
                            </Label>
                            <Input
                              value={ingredient.name}
                              onChange={(e) =>
                                updateIngredient(index, "name", e.target.value)
                              }
                              placeholder="Ingredient name"
                              className="mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500 dark:text-gray-400">
                                Quantity
                              </Label>
                              <Input
                                type="text"
                                placeholder="e.g., 3/4, 1.5, 2 1/4"
                                value={
                                  ingredientQuantityInputs[index] ??
                                  ingredient.quantity.toString()
                                }
                                onChange={(e) => {
                                  const newInputs = {
                                    ...ingredientQuantityInputs,
                                  };
                                  newInputs[index] = e.target.value;
                                  setIngredientQuantityInputs(newInputs);

                                  const parsedQuantity = parseFractionOrDecimal(
                                    e.target.value
                                  );
                                  updateIngredient(
                                    index,
                                    "quantity",
                                    parsedQuantity
                                  );
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500 dark:text-gray-400">
                                Unit
                              </Label>
                              <Select
                                value={ingredient.unit}
                                onValueChange={(value) =>
                                  updateIngredient(index, "unit", value)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                                    Volume
                                  </div>
                                  {units.volume.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                  <Separator />
                                  <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                                    Weight
                                  </div>
                                  {units.weight.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                  <Separator />
                                  <div className="font-semibold text-xs text-muted-foreground px-2 py-1">
                                    Count
                                  </div>
                                  {units.count.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400">
                              Cost per Unit (NZD)
                            </Label>
                            <Input
                              type="number"
                              value={ingredient.costPerUnit}
                              onChange={(e) =>
                                updateIngredient(
                                  index,
                                  "costPerUnit",
                                  Number(e.target.value)
                                )
                              }
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="mt-1"
                            />
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <Label className="text-xs text-gray-500 dark:text-gray-400">
                                Total Cost
                              </Label>
                              <div className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                                $
                                {(
                                  ingredient.quantity * ingredient.costPerUnit
                                ).toFixed(2)}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeIngredient(index)}
                              className="text-red-600 hover:text-red-700 mt-2"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        {ingredient.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <Label className="text-xs text-gray-500 dark:text-gray-400">
                              Notes
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {ingredient.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {formData.ingredients.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No ingredients added yet. Add your first ingredient above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.instructions}
              onChange={(e) =>
                handleInputChange("instructions", e.target.value)
              }
              placeholder="Enter step-by-step cooking instructions"
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Recipe Summary</div>
                  <div>
                    {formData.ingredients.length} ingredients •{" "}
                    {formData.servings} servings
                    {totalCost > 0 && ` • ${totalCost.toFixed(2)} total cost`}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onCancel} type="button">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !formData.name ||
                    formData.ingredients.length === 0
                  }
                  className="bg-orange-600 hover:bg-orange-700 px-8"
                >
                  {isLoading
                    ? "Saving..."
                    : mode === "create"
                    ? "Create Recipe"
                    : "Update Recipe"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
