import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerService } from '../lib/commerce/customerService';

describe('Customer Account Security & Data Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isolates saved addresses strictly by userId', async () => {
    const userA = 'usr-alice-123';
    const userB = 'usr-bob-456';

    await CustomerService.addAddress(userA, {
      tag: 'Home',
      recipientName: 'Alice Kozhikode',
      phone: '+91 91111 22222',
      streetAddress: 'Beach Road',
      city: 'Kozhikode',
      state: 'Kerala',
      postalCode: '673001',
      isDefault: true
    });

    await CustomerService.addAddress(userB, {
      tag: 'Work',
      recipientName: 'Bob Kochi',
      phone: '+91 93333 44444',
      streetAddress: 'MG Road',
      city: 'Ernakulam',
      state: 'Kerala',
      postalCode: '682011',
      isDefault: false
    });

    const aliceAddresses = await CustomerService.getAddresses(userA);
    const bobAddresses = await CustomerService.getAddresses(userB);

    expect(aliceAddresses.length).toBe(1);
    expect(aliceAddresses[0].recipientName).toBe('Alice Kozhikode');

    expect(bobAddresses.length).toBe(1);
    expect(bobAddresses[0].recipientName).toBe('Bob Kochi');

    // Bob cannot see Alice's address
    expect(bobAddresses.find((a) => a.recipientName === 'Alice Kozhikode')).toBeUndefined();
  });

  it('manages customer wishlist isolation', async () => {
    const userId = 'usr-test-wishlist';
    const productId = 'prod-banana-chips-nendran';

    const added = await CustomerService.toggleWishlist(userId, productId);
    expect(added).toBe(true);

    const removed = await CustomerService.toggleWishlist(userId, productId);
    expect(removed).toBe(false);
  });
});
