import { StoreSettings } from '../../types';

export interface CodAdvanceCalculationResult {
  isAdvanceRequired: boolean;
  advanceAmount: number;
  remainingAmount: number;
  calculationType: 'FIXED' | 'PERCENTAGE';
  configuredValue: number;
  breakdownSummary: string;
}

/**
 * Calculates the global Cash on Delivery (COD) advance payment once per order.
 * 
 * CRITICAL DESIGN LAW:
 * The advance is calculated ONCE PER ORDER, regardless of how many products
 * or quantities are in the customer's cart. The number of products or quantities
 * must NEVER multiply the advance amount.
 * 
 * @param orderTotal - Final payable order total (subtotal - discount + shipping)
 * @param settings - Authoritative store & payment settings
 */
export function calculateCodAdvance(
  orderTotal: number,
  settings?: StoreSettings | null
): CodAdvanceCalculationResult {
  const safeTotal = Math.max(0, Number(orderTotal) || 0);

  // If COD or COD Advance is disabled in global settings
  if (!settings || !settings.isCodGloballyEnabled || !settings.isCodAdvanceEnabled) {
    return {
      isAdvanceRequired: false,
      advanceAmount: 0,
      remainingAmount: safeTotal,
      calculationType: settings?.codAdvanceType || 'FIXED',
      configuredValue: settings?.codAdvanceValue || 0,
      breakdownSummary: 'Standard COD: No advance payment required.'
    };
  }

  // Minimum order threshold check (e.g. only orders >= ₹500 require advance)
  const minOrderThreshold = Number(settings.codAdvanceMinOrderValue) || 0;
  if (minOrderThreshold > 0 && safeTotal < minOrderThreshold) {
    return {
      isAdvanceRequired: false,
      advanceAmount: 0,
      remainingAmount: safeTotal,
      calculationType: settings.codAdvanceType || 'FIXED',
      configuredValue: settings.codAdvanceValue || 0,
      breakdownSummary: `Order total (₹${safeTotal}) is below minimum threshold (₹${minOrderThreshold}) for mandatory advance.`
    };
  }

  const calcType = settings.codAdvanceType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
  const rawValue = Math.max(0, Number(settings.codAdvanceValue) || 0);
  const minAmount = Number(settings.codAdvanceMinAmount) || 0;
  const maxAmount = Number(settings.codAdvanceMaxAmount) || 0;

  let calculatedAdvance = 0;

  if (calcType === 'PERCENTAGE') {
    // Percentage of eligible final order value
    calculatedAdvance = Math.round((safeTotal * rawValue) / 100);

    // Apply minimum floor if configured
    if (minAmount > 0 && calculatedAdvance < minAmount) {
      calculatedAdvance = minAmount;
    }

    // Apply maximum cap if configured
    if (maxAmount > 0 && calculatedAdvance > maxAmount) {
      calculatedAdvance = maxAmount;
    }
  } else {
    // Fixed amount per order
    calculatedAdvance = rawValue;

    // Apply floor/cap if configured
    if (minAmount > 0 && calculatedAdvance < minAmount) {
      calculatedAdvance = minAmount;
    }
    if (maxAmount > 0 && calculatedAdvance > maxAmount) {
      calculatedAdvance = maxAmount;
    }
  }

  // Advance must never exceed total order payable
  calculatedAdvance = Math.min(calculatedAdvance, safeTotal);
  calculatedAdvance = Math.max(0, calculatedAdvance);

  const remaining = Math.max(0, safeTotal - calculatedAdvance);
  const isRequired = calculatedAdvance > 0;

  const breakdownSummary = isRequired
    ? `COD Advance: ₹${calculatedAdvance} payable now via online gateway. Remaining balance: ₹${remaining} payable in cash upon doorstep delivery.`
    : 'Standard COD: No advance payment required.';

  return {
    isAdvanceRequired: isRequired,
    advanceAmount: calculatedAdvance,
    remainingAmount: remaining,
    calculationType: calcType,
    configuredValue: rawValue,
    breakdownSummary
  };
}
