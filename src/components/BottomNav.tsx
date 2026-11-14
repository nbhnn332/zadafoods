import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Tag, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isOrderTracking = location.pathname.startsWith('/order-tracking');

  const isShopActive =
    location.pathname === '/shop' || location.pathname.startsWith('/category');

  const isAccountActive =
    location.pathname === '/account' || isOrderTracking;

  const isOffersActive = location.pathname === '/shop' && location.search.includes('filter=offers');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface,#FFFFFF)] border-t border-[var(--color-border,#EAE5DC)] py-2 px-6 shadow-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">

        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[var(--color-primary,#A67732)]' : 'text-[var(--color-text-muted,#71717A)] hover:text-[var(--color-text,#1C1917)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 stroke-[2] ${isActive ? 'fill-[var(--color-primary,#A67732)]' : ''}`} />
              <span>Home</span>
            </>
          )}
        </NavLink>

        {/* Shop */}
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive || isShopActive ? 'text-[var(--color-primary,#A67732)]' : 'text-[var(--color-text-muted,#71717A)] hover:text-[var(--color-text,#1C1917)]'
            }`
          }
        >
          {({ isActive }) => {
            const active = isActive || isShopActive;
            return (
              <>
                <Search className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                <span>Shop</span>
              </>
            );
          }}
        </NavLink>

        {/* Offers */}
        <NavLink
          to="/shop?filter=offers"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive || isOffersActive ? 'text-[var(--color-primary,#A67732)]' : 'text-[var(--color-text-muted,#71717A)] hover:text-[var(--color-text,#1C1917)]'
            }`
          }
        >
          {({ isActive }) => {
            const active = isActive || isOffersActive;
            return (
              <>
                <Tag className={`w-5 h-5 stroke-[2] ${active ? 'fill-[var(--color-primary,#A67732)]' : ''}`} />
                <span>Offers</span>
              </>
            );
          }}
        </NavLink>

        {/* Account */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive || isAccountActive ? 'text-[var(--color-primary,#A67732)]' : 'text-[var(--color-text-muted,#71717A)] hover:text-[var(--color-text,#1C1917)]'
            }`
          }
        >
          {({ isActive }) => {
            const active = isActive || isAccountActive;
            return (
              <>
                <User className={`w-5 h-5 stroke-[2] ${active ? 'fill-[var(--color-primary,#A67732)]' : ''}`} />
                <span>Account</span>
              </>
            );
          }}
        </NavLink>
      </div>
    </nav>
  );
};
