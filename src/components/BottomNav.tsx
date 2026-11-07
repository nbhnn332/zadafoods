import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Tag, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isOrderTracking = location.pathname.startsWith('/order-tracking');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EAE5DC] py-2 px-6 shadow-sm md:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[#A67732]' : 'text-[#71717A] hover:text-[#1C1917]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 stroke-[2] ${isActive ? 'fill-current' : ''}`} />
              <span>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive || location.pathname.startsWith('/category') ? 'text-[#A67732]' : 'text-[#71717A] hover:text-[#1C1917]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Search className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              <span>Shop</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/shop?filter=offers"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-[#A67732]' : 'text-[#71717A] hover:text-[#1C1917]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Tag className={`w-5 h-5 stroke-[2] ${isActive ? 'fill-current' : ''}`} />
              <span>Offers</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive || isOrderTracking ? 'text-[#A67732]' : 'text-[#71717A] hover:text-[#1C1917]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <User className={`w-5 h-5 stroke-[2] ${isActive || isOrderTracking ? 'fill-current' : ''}`} />
              <span>Account</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
