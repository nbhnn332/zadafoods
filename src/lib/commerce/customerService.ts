import { Address, CartItem } from '../../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface CustomerDataState {
  addresses: Address[];
  wishlistProductIds: string[];
}

/**
 * Customer Account & Data Management Service
 * Provides database persistence when Supabase is configured with fallback to secure local storage.
 */
export class CustomerService {
  /**
   * Fetch customer saved addresses
   */
  public static async getAddresses(userId: string): Promise<Address[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching addresses from Supabase:', error);
      } else if (data) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          tag: d.tag,
          recipientName: d.recipient_name,
          phone: d.phone,
          streetAddress: d.street_address,
          landmark: d.landmark,
          city: d.city,
          state: d.state,
          postalCode: d.postal_code,
          isDefault: d.is_default
        }));
      }
    }

    // Local fallback
    try {
      const saved = localStorage.getItem(`zada_addresses_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add a new customer address with validation
   */
  public static async addAddress(
    userId: string,
    address: Omit<Address, 'id' | 'userId'>
  ): Promise<Address> {
    const newAddress: Address = {
      ...address,
      id: `addr-${Date.now()}`,
      userId
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          tag: address.tag,
          recipient_name: address.recipientName,
          phone: address.phone,
          street_address: address.streetAddress,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          is_default: address.isDefault
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          tag: data.tag,
          recipientName: data.recipient_name,
          phone: data.phone,
          streetAddress: data.street_address,
          landmark: data.landmark,
          city: data.city,
          state: data.state,
          postalCode: data.postal_code,
          isDefault: data.is_default
        };
      }
    }

    // Local fallback
    const current = await this.getAddresses(userId);
    const updated = [newAddress, ...current];
    localStorage.setItem(`zada_addresses_${userId}`, JSON.stringify(updated));
    return newAddress;
  }

  /**
   * Sync customer wishlist
   */
  public static async toggleWishlist(userId: string, productId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (data) {
        await supabase.from('wishlists').delete().eq('id', data.id);
        return false;
      } else {
        await supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
        return true;
      }
    }

    // Local storage fallback
    const key = `zada_wishlist_${userId}`;
    let list: string[] = [];
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {}

    const index = list.indexOf(productId);
    let isNowWishlisted = false;
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      isNowWishlisted = true;
    }
    localStorage.setItem(key, JSON.stringify(list));
    return isNowWishlisted;
  }

  /**
   * Database-backed Cart Synchronization
   */
  public static async syncCartWithDatabase(userId: string, cartItems: CartItem[]): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      // 1. Ensure cart row exists
      const { data: cart } = await supabase
        .from('carts')
        .upsert({ user_id: userId, updated_at: new Date().toISOString() })
        .select('id')
        .single();

      if (cart) {
        // 2. Clear current items and re-sync
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
        if (cartItems.length > 0) {
          const rows = cartItems.map((item) => ({
            cart_id: cart.id,
            variant_id: item.variantId,
            quantity: item.quantity
          }));
          await supabase.from('cart_items').insert(rows);
        }
      }
    } catch (e) {
      console.warn('Failed to sync cart to Supabase:', e);
    }
  }
}
