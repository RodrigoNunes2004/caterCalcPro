// Unit Conversion and Price Calculator for Catering
// Handles conversions between different units and calculates prices per unit

export interface ConversionResult {
  targetQuantity: number;
  targetUnit: string;
  baseQuantity: number;
  baseUnit: string;
  pricePerBaseUnit: number;
  targetPrice: number;
  conversionFactor: number;
}

export interface IngredientDensity {
  name: string;
  density: number; // grams per ml for liquids, grams per cup for solids
  unit: "g/ml" | "g/cup" | "g/tbsp" | "g/tsp";
}

// Common ingredient densities (grams per cup unless specified)
const INGREDIENT_DENSITIES: IngredientDensity[] = [
  // Flours and grains
  { name: "flour", density: 120, unit: "g/cup" },
  { name: "all-purpose flour", density: 120, unit: "g/cup" },
  { name: "bread flour", density: 136, unit: "g/cup" },
  { name: "cake flour", density: 100, unit: "g/cup" },
  { name: "whole wheat flour", density: 120, unit: "g/cup" },
  { name: "rice", density: 185, unit: "g/cup" },
  { name: "brown rice", density: 195, unit: "g/cup" },
  { name: "oats", density: 80, unit: "g/cup" },
  { name: "quinoa", density: 170, unit: "g/cup" },

  // Sugars
  { name: "sugar", density: 200, unit: "g/cup" },
  { name: "brown sugar", density: 220, unit: "g/cup" },
  { name: "powdered sugar", density: 120, unit: "g/cup" },
  { name: "coconut sugar", density: 200, unit: "g/cup" },

  // Liquids (g/ml)
  { name: "water", density: 1, unit: "g/ml" },
  { name: "milk", density: 1.03, unit: "g/ml" },
  { name: "cream", density: 1.01, unit: "g/ml" },
  { name: "oil", density: 0.92, unit: "g/ml" },
  { name: "olive oil", density: 0.92, unit: "g/ml" },
  { name: "vegetable oil", density: 0.92, unit: "g/ml" },
  { name: "honey", density: 1.4, unit: "g/ml" },
  { name: "maple syrup", density: 1.33, unit: "g/ml" },
  { name: "vinegar", density: 1.01, unit: "g/ml" },
  { name: "wine", density: 0.99, unit: "g/ml" },
  { name: "beer", density: 1.01, unit: "g/ml" },

  // Dairy
  { name: "butter", density: 227, unit: "g/cup" },
  { name: "cheese", density: 113, unit: "g/cup" },
  { name: "yogurt", density: 245, unit: "g/cup" },
  { name: "sour cream", density: 240, unit: "g/cup" },

  // Nuts and seeds
  { name: "almonds", density: 95, unit: "g/cup" },
  { name: "walnuts", density: 100, unit: "g/cup" },
  { name: "pecans", density: 100, unit: "g/cup" },
  { name: "cashews", density: 130, unit: "g/cup" },
  { name: "peanuts", density: 150, unit: "g/cup" },
  { name: "sunflower seeds", density: 140, unit: "g/cup" },
  { name: "chia seeds", density: 170, unit: "g/cup" },

  // Spices and seasonings
  { name: "salt", density: 292, unit: "g/cup" },
  { name: "pepper", density: 120, unit: "g/cup" },
  { name: "cinnamon", density: 120, unit: "g/cup" },
  { name: "paprika", density: 120, unit: "g/cup" },
  { name: "garlic powder", density: 120, unit: "g/cup" },
  { name: "onion powder", density: 120, unit: "g/cup" },
  { name: "oregano", density: 30, unit: "g/cup" },
  { name: "basil", density: 30, unit: "g/cup" },
  { name: "thyme", density: 30, unit: "g/cup" },

  // Vegetables (approximate)
  { name: "onions", density: 160, unit: "g/cup" },
  { name: "carrots", density: 128, unit: "g/cup" },
  { name: "celery", density: 100, unit: "g/cup" },
  { name: "potatoes", density: 150, unit: "g/cup" },
  { name: "tomatoes", density: 180, unit: "g/cup" },
  { name: "bell peppers", density: 150, unit: "g/cup" },
  { name: "mushrooms", density: 70, unit: "g/cup" },
  { name: "spinach", density: 30, unit: "g/cup" },
  { name: "lettuce", density: 30, unit: "g/cup" },

  // Fruits
  { name: "apples", density: 125, unit: "g/cup" },
  { name: "bananas", density: 150, unit: "g/cup" },
  { name: "strawberries", density: 150, unit: "g/cup" },
  { name: "blueberries", density: 150, unit: "g/cup" },
  { name: "lemons", density: 200, unit: "g/cup" },
  { name: "limes", density: 200, unit: "g/cup" },
];

// Unit conversion factors to base units (grams for solids, ml for liquids)
const UNIT_CONVERSIONS: Record<string, number> = {
  // Weight units (to grams)
  kg: 1000,
  g: 1,
  lb: 453.592,
  oz: 28.3495,

  // Volume units (to ml)
  L: 1000,
  l: 1000,
  ml: 1,
  cup: 240, // US cup = 240ml
  cups: 240,
  tbsp: 15,
  tsp: 5,
  "fl oz": 29.5735,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,

  // Count units
  each: 1,
  piece: 1,
  item: 1,
};

export class UnitConverter {
  private densities: Map<string, IngredientDensity> = new Map();

  constructor() {
    // Initialize density lookup map
    INGREDIENT_DENSITIES.forEach((density) => {
      this.densities.set(density.name.toLowerCase(), density);
    });
  }

  /**
   * Find ingredient density by name (case-insensitive, partial matching)
   */
  private findIngredientDensity(
    ingredientName: string
  ): IngredientDensity | null {
    const searchName = ingredientName.toLowerCase();

    // Exact match
    if (this.densities.has(searchName)) {
      return this.densities.get(searchName)!;
    }

    // Partial match
    for (const [key, density] of this.densities.entries()) {
      if (searchName.includes(key) || key.includes(searchName)) {
        return density;
      }
    }

    return null;
  }

  /**
   * Convert between different units using density
   */
  private convertWithDensity(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName: string
  ): { quantity: number; baseUnit: string } | null {
    const density = this.findIngredientDensity(ingredientName);
    if (!density) return null;

    // Convert from unit to base unit
    let baseQuantity: number;
    let baseUnit: string;

    if (density.unit === "g/ml") {
      // Liquid ingredient
      baseQuantity = quantity * UNIT_CONVERSIONS[fromUnit] || quantity;
      baseUnit = "ml";
    } else {
      // Solid ingredient
      baseQuantity = quantity * UNIT_CONVERSIONS[fromUnit] || quantity;
      baseUnit = "g";
    }

    // Convert to target unit using density
    let targetQuantity: number;
    let targetBaseUnit: string;

    if (density.unit === "g/ml") {
      // Liquid: convert ml to target unit
      targetQuantity = baseQuantity / (UNIT_CONVERSIONS[toUnit] || 1);
      targetBaseUnit = "ml";
    } else {
      // Solid: convert grams to target unit using density
      const densityFactor = density.density / UNIT_CONVERSIONS[toUnit];
      targetQuantity = baseQuantity / densityFactor;
      targetBaseUnit = "g";
    }

    return {
      quantity: targetQuantity,
      baseUnit: targetBaseUnit,
    };
  }

  /**
   * Convert between units without density (direct conversion)
   */
  private convertDirect(
    quantity: number,
    fromUnit: string,
    toUnit: string
  ): { quantity: number; baseUnit: string } | null {
    const fromFactor = UNIT_CONVERSIONS[fromUnit];
    const toFactor = UNIT_CONVERSIONS[toUnit];

    if (!fromFactor || !toFactor) return null;

    const baseQuantity = quantity * fromFactor;
    const targetQuantity = baseQuantity / toFactor;

    // Determine base unit based on the units involved
    const weightUnits = ["kg", "g", "lb", "oz"];
    const volumeUnits = [
      "L",
      "l",
      "ml",
      "cup",
      "cups",
      "tbsp",
      "tsp",
      "fl oz",
      "pint",
      "quart",
      "gallon",
    ];

    let baseUnit: string;
    if (weightUnits.includes(fromUnit) || weightUnits.includes(toUnit)) {
      baseUnit = "g";
    } else if (volumeUnits.includes(fromUnit) || volumeUnits.includes(toUnit)) {
      baseUnit = "ml";
    } else {
      baseUnit = "each";
    }

    return {
      quantity: targetQuantity,
      baseUnit,
    };
  }

  /**
   * Main conversion function
   */
  convert(
    ingredientName: string,
    purchaseQuantity: number,
    purchaseUnit: string,
    purchasePrice: number,
    targetQuantity: number,
    targetUnit: string
  ): ConversionResult | { error: string; suggestion?: string } {
    try {
      // First try conversion with density
      let conversion = this.convertWithDensity(
        purchaseQuantity,
        purchaseUnit,
        targetUnit,
        ingredientName
      );

      let baseUnit: string;
      let baseQuantity: number;
      let conversionFactor: number;

      if (conversion) {
        baseUnit = conversion.baseUnit;
        baseQuantity = conversion.quantity;
        conversionFactor = baseQuantity / purchaseQuantity;
      } else {
        // Fallback to direct conversion
        conversion = this.convertDirect(
          purchaseQuantity,
          purchaseUnit,
          targetUnit
        );
        if (!conversion) {
          return {
            error: `Cannot convert from ${purchaseUnit} to ${targetUnit}`,
            suggestion:
              "Please check if the units are compatible or provide a custom density.",
          };
        }
        baseUnit = conversion.baseUnit;
        baseQuantity = conversion.quantity;
        conversionFactor = baseQuantity / purchaseQuantity;
      }

      // Calculate price per base unit
      const pricePerBaseUnit =
        purchasePrice / (purchaseQuantity * conversionFactor);

      // Calculate target price
      const targetPrice = targetQuantity * pricePerBaseUnit;

      return {
        targetQuantity,
        targetUnit,
        baseQuantity: targetQuantity * conversionFactor,
        baseUnit,
        pricePerBaseUnit,
        targetPrice,
        conversionFactor,
      };
    } catch (error) {
      return {
        error: `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        suggestion: "Please check your input values and try again.",
      };
    }
  }

  /**
   * Add custom ingredient density
   */
  addIngredientDensity(density: IngredientDensity): void {
    this.densities.set(density.name.toLowerCase(), density);
  }

  /**
   * Get all available ingredient densities
   */
  getAvailableDensities(): IngredientDensity[] {
    return Array.from(this.densities.values());
  }

  /**
   * Search for ingredients by name
   */
  searchIngredients(query: string): IngredientDensity[] {
    const searchQuery = query.toLowerCase();
    return Array.from(this.densities.values()).filter((density) =>
      density.name.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Calculate cost for a recipe ingredient
   */
  calculateIngredientCost(
    ingredientName: string,
    purchaseQuantity: number,
    purchaseUnit: string,
    purchasePrice: number,
    recipeQuantity: number,
    recipeUnit: string
  ): {
    cost: number;
    unitCost: number;
    conversion: ConversionResult | { error: string };
  } {
    const conversion = this.convert(
      ingredientName,
      purchaseQuantity,
      purchaseUnit,
      purchasePrice,
      recipeQuantity,
      recipeUnit
    );

    if ("error" in conversion) {
      return {
        cost: 0,
        unitCost: 0,
        conversion,
      };
    }

    return {
      cost: conversion.targetPrice,
      unitCost: conversion.pricePerBaseUnit,
      conversion,
    };
  }
}

// Export a singleton instance
export const unitConverter = new UnitConverter();

// Helper function for easy use
export function convertUnit(
  ingredientName: string,
  purchaseQuantity: number,
  purchaseUnit: string,
  purchasePrice: number,
  targetQuantity: number,
  targetUnit: string
): ConversionResult | { error: string; suggestion?: string } {
  return unitConverter.convert(
    ingredientName,
    purchaseQuantity,
    purchaseUnit,
    purchasePrice,
    targetQuantity,
    targetUnit
  );
}

// Example usage and test cases
export const examples = {
  flour: () => convertUnit("flour", 10, "kg", 54.0, 1, "cup"),
  sugar: () => convertUnit("sugar", 5, "kg", 25.0, 2, "cups"),
  milk: () => convertUnit("milk", 1, "L", 3.5, 250, "ml"),
  butter: () => convertUnit("butter", 1, "kg", 8.0, 1, "cup"),
  oil: () => convertUnit("olive oil", 500, "ml", 12.0, 2, "tbsp"),
};
