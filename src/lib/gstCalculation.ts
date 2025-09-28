// GST calculation utilities for New Zealand (15% GST)

export const GST_RATE = 0.15;

/**
 * Calculate GST amount from a GST-exclusive price
 */
export function calculateGST(exclusivePrice: number): number {
  return exclusivePrice * GST_RATE;
}

/**
 * Calculate GST-inclusive price from a GST-exclusive price
 */
export function addGST(exclusivePrice: number): number {
  return exclusivePrice * (1 + GST_RATE);
}

/**
 * Calculate GST-exclusive price from a GST-inclusive price
 */
export function removeGST(inclusivePrice: number): number {
  return inclusivePrice / (1 + GST_RATE);
}

/**
 * Get GST amount from a GST-inclusive price
 */
export function getGSTFromInclusive(inclusivePrice: number): number {
  return inclusivePrice - removeGST(inclusivePrice);
}

/**
 * Format currency with proper NZ dollar formatting
 */
export function formatNZCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate total values with GST breakdown
 */
export function calculateTotalWithGST(
  items: Array<{
    currentStock: number;
    pricePerUnit: number;
    gstInclusive?: boolean;
  }>
) {
  let totalExclusive = 0;
  let totalGST = 0;

  items.forEach((item) => {
    const itemTotal = item.currentStock * item.pricePerUnit;

    if (item.gstInclusive) {
      // Price includes GST, extract exclusive amount
      const exclusiveAmount = removeGST(itemTotal);
      const gstAmount = getGSTFromInclusive(itemTotal);

      totalExclusive += exclusiveAmount;
      totalGST += gstAmount;
    } else {
      // Price is GST exclusive
      const gstAmount = calculateGST(itemTotal);

      totalExclusive += itemTotal;
      totalGST += gstAmount;
    }
  });

  return {
    totalExclusive,
    totalGST,
    totalInclusive: totalExclusive + totalGST,
  };
}
