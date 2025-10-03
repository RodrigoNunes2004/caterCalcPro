import React, { useState } from "react";
import { ChefHat } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { unitConverter, ConversionResult } from "../lib/unitConverter";
import Navigator from "./Navigator";

const COMMON_UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "oz", label: "Ounces (oz)" },
  { value: "L", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "cup", label: "Cups" },
  { value: "cups", label: "Cups (plural)" },
  { value: "tbsp", label: "Tablespoons (tbsp)" },
  { value: "tsp", label: "Teaspoons (tsp)" },
  { value: "fl oz", label: "Fluid Ounces (fl oz)" },
  { value: "each", label: "Each/Piece" },
];

const COMMON_INGREDIENTS = [
  "flour",
  "sugar",
  "brown sugar",
  "butter",
  "milk",
  "cream",
  "oil",
  "olive oil",
  "honey",
  "maple syrup",
  "salt",
  "pepper",
  "onions",
  "carrots",
  "potatoes",
  "rice",
  "oats",
  "almonds",
  "cheese",
  "eggs",
  "tomatoes",
  "garlic",
];

export default function UnitConverter() {
  const [ingredientName, setIngredientName] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchaseUnit, setPurchaseUnit] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [result, setResult] = useState<
    ConversionResult | { error: string; suggestion?: string } | null
  >(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (
      !ingredientName ||
      !purchaseQuantity ||
      !purchaseUnit ||
      !purchasePrice ||
      !targetQuantity ||
      !targetUnit
    ) {
      setResult({ error: "Please fill in all fields" });
      return;
    }

    setIsCalculating(true);

    try {
      const conversion = unitConverter.convert(
        ingredientName,
        parseFloat(purchaseQuantity),
        purchaseUnit,
        parseFloat(purchasePrice),
        parseFloat(targetQuantity),
        targetUnit
      );

      setResult(conversion);
    } catch (error) {
      setResult({
        error: "Calculation failed",
        suggestion: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExample = () => {
    // Set the form fields for a flour example
    setIngredientName("flour");
    setPurchaseQuantity("10");
    setPurchaseUnit("kg");
    setPurchasePrice("54.00");
    setTargetQuantity("1");
    setTargetUnit("cup");

    // Calculate the example result
    const exampleResult = unitConverter.convert(
      "flour",
      10,
      "kg",
      54.0,
      1,
      "cup"
    );

    setResult(exampleResult);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 4) => {
    return Number(num.toFixed(decimals));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-foreground">
                CaterCalc Pro
              </h1>
            </div>
            <Navigator />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Unit Converter & Price Calculator
          </h1>
          <p className="text-muted-foreground mt-2">
            Convert between units and calculate ingredient costs for your
            recipes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Input</CardTitle>
              <CardDescription>
                Enter your purchase details and target conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient">Ingredient Name</Label>
                <Input
                  id="ingredient"
                  placeholder="e.g., flour, sugar, milk"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  list="ingredients"
                />
                <datalist id="ingredients">
                  {COMMON_INGREDIENTS.map((ingredient) => (
                    <option key={ingredient} value={ingredient} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-qty">Purchase Quantity</Label>
                  <Input
                    id="purchase-qty"
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-unit">Purchase Unit</Label>
                  <Select value={purchaseUnit} onValueChange={setPurchaseUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price (NZD)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  placeholder="54.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-qty">Target Quantity</Label>
                  <Input
                    id="target-qty"
                    type="number"
                    step="0.01"
                    placeholder="1"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-unit">Target Unit</Label>
                  <Select value={targetUnit} onValueChange={setTargetUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isCalculating ? "Calculating..." : "Calculate"}
                </Button>
                <Button variant="outline" onClick={handleExample}>
                  Example
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Results</CardTitle>
              <CardDescription>
                Unit conversion and cost calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                "error" in result ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {result.error}
                      {result.suggestion && (
                        <div className="mt-2 text-sm">
                          <strong>Suggestion:</strong> {result.suggestion}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(result.targetPrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Cost for {formatNumber(result.targetQuantity)}{" "}
                          {result.targetUnit}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(result.pricePerBaseUnit)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Price per {result.baseUnit}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Conversion Factor:
                        </span>
                        <Badge variant="secondary">
                          {formatNumber(result.conversionFactor, 6)}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Base Quantity:
                        </span>
                        <Badge variant="outline">
                          {formatNumber(result.baseQuantity, 2)}{" "}
                          {result.baseUnit}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Target Quantity:
                        </span>
                        <Badge variant="outline">
                          {formatNumber(result.targetQuantity, 2)}{" "}
                          {result.targetUnit}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Calculation Summary:</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          • {formatNumber(result.targetQuantity, 2)}{" "}
                          {result.targetUnit} ={" "}
                          {formatNumber(result.baseQuantity, 2)}{" "}
                          {result.baseUnit}
                        </div>
                        <div>
                          • Price per {result.baseUnit}:{" "}
                          {formatCurrency(result.pricePerBaseUnit)}
                        </div>
                        <div>
                          • Total cost: {formatCurrency(result.targetPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Enter your conversion details to see results
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
