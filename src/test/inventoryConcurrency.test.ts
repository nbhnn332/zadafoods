import { describe, it, expect } from 'vitest';
import { InventoryEngine } from '../lib/commerce/inventoryEngine';
import { ProductVariant } from '../types';

describe('Inventory Concurrency & Atomic Decrement Engine', () => {
  const sampleVariants: ProductVariant[] = [
    {
      id: 'var-chips-250',
      productId: 'prod-1',
      sku: 'SKU-CHIPS-250',
      weightValue: 250,
      weightUnit: 'g',
      weightLabel: '250 g',
      sellingPrice: 180,
      mrp: 220,
      discountPercentage: 18,
      stockQuantity: 10, // Only 10 available
      lowStockThreshold: 2
    }
  ];

  it('verifies sufficiency when requested quantity is within available stock', () => {
    const result = InventoryEngine.verifyStockSufficiency(
      [{ productId: 'prod-1', variantId: 'var-chips-250', quantity: 5 }],
      sampleVariants
    );
    expect(result.success).toBe(true);
    expect(result.outOfStockItems).toBeUndefined();
  });

  it('rejects checkout when requested quantity exceeds available stock (preventing overselling)', () => {
    const result = InventoryEngine.verifyStockSufficiency(
      [{ productId: 'prod-1', variantId: 'var-chips-250', quantity: 15 }], // Requesting 15, only 10 exist
      sampleVariants
    );
    expect(result.success).toBe(false);
    expect(result.outOfStockItems?.[0].available).toBe(10);
    expect(result.outOfStockItems?.[0].requested).toBe(15);
  });

  it('atomically decrements inventory and logs movement', () => {
    const orderId = 'ord-atomic-test';
    const { updatedVariants, success } = InventoryEngine.executeAtomicStockDecrement(
      [{ productId: 'prod-1', variantId: 'var-chips-250', quantity: 4 }],
      sampleVariants,
      orderId
    );

    expect(success).toBe(true);
    expect(updatedVariants[0].stockQuantity).toBe(6); // 10 - 4 = 6

    const logs = InventoryEngine.getMovementAuditLogs();
    const lastLog = logs[logs.length - 1];
    expect(lastLog.orderId).toBe(orderId);
    expect(lastLog.quantityChange).toBe(-4);
    expect(lastLog.previousStock).toBe(10);
    expect(lastLog.newStock).toBe(6);
  });
});
