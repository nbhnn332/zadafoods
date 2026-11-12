import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>{children}</AuthProvider>
  </ToastProvider>
);

describe('Authentication Flow (Decision #2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes unauthenticated visitor strictly as guest (null user) with zero identity leakage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('registers a new customer with email and password', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.register(
        'Amina Kozhikode',
        'amina@example.com',
        'password123',
        '+91 99988 77766'
      );
    });

    expect(response.success).toBe(true);
    expect(result.current.user?.fullName).toBe('Amina Kozhikode');
    expect(result.current.user?.email).toBe('amina@example.com');
  });

  it('toggles admin role for development and testing', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.toggleAdminRole();
    });

    expect(result.current.isAdmin).toBe(true);

    act(() => {
      result.current.toggleAdminRole();
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('logs out user cleanly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
