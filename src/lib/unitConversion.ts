// Unit conversion utilities for catering calculations

export type Unit =
  // Volume units
  | "cup"
  | "cups"
  | "tbsp"
  | "tsp"
  | "ml"
  | "l"
  | "fl oz"
  | "pint"
  | "quart"
  | "gallon"
  // Weight units
  | "g"
  | "kg"
  | "oz"
  | "lb"
  | "lbs"
  // Count units
  | "piece"
  | "pieces"
  | "each"
  | "whole"
  | "slice"
  | "slices";

export interface ConversionResult {
  quantity: number;
  unit: string;
  originalQuantity: number;
  originalUnit: string;
}

// Base conversion factors to grams and milliliters
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
  lbs: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  cup: 236.588,
  cups: 236.588,
  tbsp: 14.7868,
  tsp: 4.92892,
  "fl oz": 29.5735,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

// Common ingredient densities (g/ml) for volume to weight conversion
export const INGREDIENT_DENSITIES: Record<string, number> = {
  // Liquids
  water: 1.0,
  milk: 1.03,
  cream: 0.99,
  oil: 0.92,
  honey: 1.4,
  syrup: 1.3,

  // Dry ingredients
  flour: 0.53,
  sugar: 0.85,
  "brown sugar": 0.9,
  salt: 1.2,
  "baking powder": 0.9,
  "cocoa powder": 0.41,
  butter: 0.91,
  rice: 0.75,
  oats: 0.41,

  // Default fallback
  default: 0.7,
};

export function isVolumeUnit(unit: string): boolean {
  return Object.keys(VOLUME_TO_ML).includes(unit.toLowerCase());
}

export function isWeightUnit(unit: string): boolean {
  return Object.keys(WEIGHT_TO_GRAMS).includes(unit.toLowerCase());
}

export function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  // Handle plural/singular variations
  const unitMappings: Record<string, string> = {
    cup: "cups",
    piece: "pieces",
    slice: "slices",
    lb: "lbs",
  };

  return unitMappings[normalized] || normalized;
}

/**
 * Convert between units of the same type (volume to volume, weight to weight)
 */
export function convertSameType(
  quantity: number,
  fromUnit: string,
  toUnit: string
): ConversionResult {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (normalizedFrom === normalizedTo) {
    return {
      quantity,
      unit: toUnit,
      originalQuantity: quantity,
      originalUnit: fromUnit,
    };
  }

  let convertedQuantity: number;

  if (isVolumeUnit(normalizedFrom) && isVolumeUnit(normalizedTo)) {
    // Volume to volume conversion
    const mlAmount = quantity * VOLUME_TO_ML[normalizedFrom];
    convertedQuantity = mlAmount / VOLUME_TO_ML[normalizedTo];
  } else if (isWeightUnit(normalizedFrom) && isWeightUnit(normalizedTo)) {
    // Weight to weight conversion
    const gramAmount = quantity * WEIGHT_TO_GRAMS[normalizedFrom];
    convertedQuantity = gramAmount / WEIGHT_TO_GRAMS[normalizedTo];
  } else {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit}`);
  }

  return {
    quantity: Math.round(convertedQuantity * 10000) / 10000, // Round to 4 decimal places
    unit: toUnit,
    originalQuantity: quantity,
    originalUnit: fromUnit,
  };
}

/**
 * Convert volume to weight using ingredient density
 */
export function volumeToWeight(
  quantity: number,
  volumeUnit: string,
  ingredientName: string,
  targetWeightUnit: string = "g"
): ConversionResult {
  if (!isVolumeUnit(volumeUnit)) {
    throw new Error(`${volumeUnit} is not a volume unit`);
  }

  if (!isWeightUnit(targetWeightUnit)) {
    throw new Error(`${targetWeightUnit} is not a weight unit`);
  }

  // Get ingredient density
  const ingredientKey = ingredientName.toLowerCase();
  const density =
    INGREDIENT_DENSITIES[ingredientKey] || INGREDIENT_DENSITIES.default;

  // Convert to ml first
  const normalizedVolumeUnit = normalizeUnit(volumeUnit);
  const mlAmount = quantity * VOLUME_TO_ML[normalizedVolumeUnit];

  // Convert to grams using density
  const gramAmount = mlAmount * density;

  // Convert to target weight unit
  const normalizedWeightUnit = normalizeUnit(targetWeightUnit);
  const convertedQuantity = gramAmount / WEIGHT_TO_GRAMS[normalizedWeightUnit];

  return {
    quantity: Math.round(convertedQuantity * 10000) / 10000,
    unit: targetWeightUnit,
    originalQuantity: quantity,
    originalUnit: volumeUnit,
  };
}

/**
 * Convert weight to volume using ingredient density
 */
export function weightToVolume(
  quantity: number,
  weightUnit: string,
  ingredientName: string,
  targetVolumeUnit: string = "cups"
): ConversionResult {
  if (!isWeightUnit(weightUnit)) {
    throw new Error(`${weightUnit} is not a weight unit`);
  }

  if (!isVolumeUnit(targetVolumeUnit)) {
    throw new Error(`${targetVolumeUnit} is not a volume unit`);
  }

  // Get ingredient density
  const ingredientKey = ingredientName.toLowerCase();
  const density =
    INGREDIENT_DENSITIES[ingredientKey] || INGREDIENT_DENSITIES.default;

  // Convert to grams first
  const normalizedWeightUnit = normalizeUnit(weightUnit);
  const gramAmount = quantity * WEIGHT_TO_GRAMS[normalizedWeightUnit];

  // Convert to ml using density
  const mlAmount = gramAmount / density;

  // Convert to target volume unit
  const normalizedVolumeUnit = normalizeUnit(targetVolumeUnit);
  const convertedQuantity = mlAmount / VOLUME_TO_ML[normalizedVolumeUnit];

  return {
    quantity: Math.round(convertedQuantity * 10000) / 10000,
    unit: targetVolumeUnit,
    originalQuantity: quantity,
    originalUnit: weightUnit,
  };
}

/**
 * Scale recipe quantities based on guest count
 */
export function scaleQuantity(
  originalQuantity: number,
  originalServings: number,
  targetServings: number
): number {
  const scaleFactor = targetServings / originalServings;
  return Math.round(originalQuantity * scaleFactor * 10000) / 10000;
}

/**
 * Calculate percentage of ingredient in recipe
 */
export function calculateIngredientPercentage(
  ingredientQuantity: number,
  ingredientUnit: string,
  ingredientName: string,
  totalRecipeWeight: number,
  totalRecipeWeightUnit: string = "g"
): number {
  try {
    // Convert ingredient to grams if it's not already
    let ingredientInGrams: number;

    if (isWeightUnit(ingredientUnit)) {
      const conversion = convertSameType(
        ingredientQuantity,
        ingredientUnit,
        "g"
      );
      ingredientInGrams = conversion.quantity;
    } else if (isVolumeUnit(ingredientUnit)) {
      const conversion = volumeToWeight(
        ingredientQuantity,
        ingredientUnit,
        ingredientName,
        "g"
      );
      ingredientInGrams = conversion.quantity;
    } else {
      // For count units, can't calculate percentage
      return 0;
    }

    // Convert total recipe weight to grams
    const totalInGrams = isWeightUnit(totalRecipeWeightUnit)
      ? convertSameType(totalRecipeWeight, totalRecipeWeightUnit, "g").quantity
      : totalRecipeWeight;

    return Math.round((ingredientInGrams / totalInGrams) * 100 * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error("Error calculating ingredient percentage:", error);
    return 0;
  }
}

/**
 * Adjust ingredient quantities when one ingredient is modified to maintain proportions
 */
export function adjustRecipeProportions(
  ingredients: Array<{
    id: string;
    quantity: number;
    unit: string;
    name: string;
    originalPercentage: number;
  }>,
  modifiedIngredientId: string,
  newQuantity: number
): Array<{
  id: string;
  quantity: number;
  unit: string;
  name: string;
  adjustedQuantity: number;
}> {
  const modifiedIngredient = ingredients.find(
    (ing) => ing.id === modifiedIngredientId
  );
  if (!modifiedIngredient) {
    throw new Error("Modified ingredient not found");
  }

  // Calculate the scale factor based on the modified ingredient
  const originalQuantity = modifiedIngredient.quantity;
  const scaleFactor = newQuantity / originalQuantity;

  return ingredients.map((ingredient) => ({
    ...ingredient,
    adjustedQuantity:
      ingredient.id === modifiedIngredientId
        ? newQuantity
        : Math.round(ingredient.quantity * scaleFactor * 10000) / 10000,
  }));
}

/**
 * Get all possible units for display in dropdowns
 */
export function getAllUnits(): {
  volume: string[];
  weight: string[];
  count: string[];
} {
  return {
    volume: Object.keys(VOLUME_TO_ML),
    weight: Object.keys(WEIGHT_TO_GRAMS),
    count: ["piece", "pieces", "each", "whole", "slice", "slices"],
  };
}
