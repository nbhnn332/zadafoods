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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBF8F4]/96 backdrop-blur-md border-t border-[#EAE3D6]/70 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around max-w-md mx-auto h-14">

        {/* Home */}
        <NavLink
          to="/"
          end
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-[#A67732]" />
              )}
              <Home
                className="w-5 h-5"
                style={{
                  color: isActive ? '#A67732' : '#9CA3AF',
                  fill: isActive ? '#A67732' : 'none',
                  strokeWidth: 2,
                }}
              />
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? '#A67732' : '#9CA3AF' }}
              >
                Home
              </span>
            </>
          )}
        </NavLink>

        {/* Explore / Shop */}
        <NavLink
          to="/shop"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
        >
          {({ isActive }) => {
            const active = isActive || isShopActive;
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-[#A67732]" />
                )}
                <Search
                  className="w-5 h-5"
                  style={{
                    color: active ? '#A67732' : '#9CA3AF',
                    strokeWidth: active ? 2.5 : 2,
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? '#A67732' : '#9CA3AF' }}
                >
                  Explore
                </span>
              </>
            );
          }}
        </NavLink>

        {/* Offers */}
        <NavLink
          to="/shop?filter=offers"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
        >
          {({ isActive }) => {
            const active = isActive || isOffersActive;
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-[#A67732]" />
                )}
                <Tag
                  className="w-5 h-5"
                  style={{
                    color: active ? '#A67732' : '#9CA3AF',
                    fill: active ? '#A67732' : 'none',
                    strokeWidth: 2,
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? '#A67732' : '#9CA3AF' }}
                >
                  Offers
                </span>
              </>
            );
          }}
        </NavLink>

        {/* Account */}
        <NavLink
          to="/account"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
        >
          {({ isActive }) => {
            const active = isActive || isAccountActive;
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-[#A67732]" />
                )}
                <User
                  className="w-5 h-5"
                  style={{
                    color: active ? '#A67732' : '#9CA3AF',
                    fill: active ? '#A67732' : 'none',
                    strokeWidth: 2,
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? '#A67732' : '#9CA3AF' }}
                >
                  Account
                </span>
              </>
            );
          }}
        </NavLink>

      </div>
    </nav>
  );
};
