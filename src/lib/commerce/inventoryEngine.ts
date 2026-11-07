import { ProductVariant, PricingEvaluationItem } from '../../types';

export interface StockReservationResult {
  success: boolean;
  reservedItems: { variantId: string; quantity: number }[];
  failureReason?: string;
  outOfStockItems?: { variantId: string; requested: number; available: number }[];
}

export interface InventoryMovementRecord {
  id: string;
  variantId: string;
  movementType: 'PURCHASE' | 'SALE' | 'RETURN' | 'MANUAL_ADJUSTMENT' | 'RESERVATION_HOLD' | 'RELEASE_HOLD';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  reason?: string;
  createdAt: string;
}

/**
 * Server-Side Inventory Verification & Atomic Decrement Simulator
 * Mirror of PostgreSQL:
 * UPDATE product_variants SET stock_quantity = stock_quantity - :qty
 * WHERE id = :id AND stock_quantity >= :qty
 */
export class InventoryEngine {
  private static movements: InventoryMovementRecord[] = [];

  /**
   * Verify all requested variants have sufficient available stock
   */
  public static verifyStockSufficiency(
    items: PricingEvaluationItem[],
    currentVariants: ProductVariant[]
  ): StockReservationResult {
    const outOfStock: { variantId: string; requested: number; available: number }[] = [];

    for (const item of items) {
      const variant = currentVariants.find((v) => v.id === item.variantId);
      if (!variant) {
        return {
          success: false,
          reservedItems: [],
          failureReason: `Variant ID ${item.variantId} not found in inventory.`
        };
      }

      if (variant.stockQuantity < item.quantity) {
        outOfStock.push({
          variantId: variant.id,
          requested: item.quantity,
          available: variant.stockQuantity
        });
      }
    }

    if (outOfStock.length > 0) {
      return {
        success: false,
        reservedItems: [],
        outOfStockItems: outOfStock,
        failureReason: `Insufficient stock for ${outOfStock.length} item(s).`
      };
    }

    return {
      success: true,
      reservedItems: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    };
  }

  /**
   * Perform atomic stock decrement and record movement
   */
  public static executeAtomicStockDecrement(
    items: PricingEvaluationItem[],
    variants: ProductVariant[],
    orderId: string
  ): { updatedVariants: ProductVariant[]; success: boolean } {
    const verification = this.verifyStockSufficiency(items, variants);
    if (!verification.success) {
      throw new Error(verification.failureReason || 'Stock decrement rejected.');
    }

    const updatedVariants = variants.map((v) => {
      const requested = items.find((i) => i.variantId === v.id);
      if (!requested) return v;

      const previousStock = v.stockQuantity;
      const newStock = previousStock - requested.quantity;

      const movement: InventoryMovementRecord = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        variantId: v.id,
        movementType: 'SALE',
        quantityChange: -requested.quantity,
        previousStock,
        newStock,
        orderId,
        reason: `Order ${orderId} confirmed via verified payment`,
        createdAt: new Date().toISOString()
      };
      this.movements.push(movement);

      return {
        ...v,
        stockQuantity: newStock
      };
    });

    return { updatedVariants, success: true };
  }

  public static getMovementAuditLogs(): InventoryMovementRecord[] {
    return [...this.movements];
  }
}
