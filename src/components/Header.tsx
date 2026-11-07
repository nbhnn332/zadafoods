import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, ArrowLeft, Search, Heart, ShieldAlert, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFestival } from '../context/FestivalContext';
import { FestivalAnnouncementBar } from './festival/FestivalAnnouncementBar';
import { FestivalMotif } from './festival/FestivalMotifs';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showWishlist?: boolean;
  hideLogo?: boolean;
  hideCartIcon?: boolean;
  onBackClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showSearch = true,
  showWishlist = false,
  hideLogo = false,
  hideCartIcon = false,
  onBackClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUniqueItems } = useCart();
  const { user, isAdmin, toggleAdminRole } = useAuth();
  const { effectiveTheme, isFestivalActive } = useFestival();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasFestiveHeaderMotif = Boolean(
    isFestivalActive &&
    effectiveTheme &&
    effectiveTheme.preset !== 'default' &&
    effectiveTheme.placements?.headerMotif !== false
  );

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-border-subtle/60 transition-all">
      {/* Festival Announcement Bar on Customer Storefront */}
      {!location.pathname.startsWith('/admin') && <FestivalAnnouncementBar />}

      {/* Top Banner shown only on admin routes */}
      {location.pathname.startsWith('/admin') && (
        <div className="bg-brand-secondary text-white text-xs px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium tracking-wide">Free Shipping on orders above ₹499 across India</span>
          </div>
          <div className="flex items-center gap-3">
            {!import.meta.env.PROD && (
              <button
                onClick={toggleAdminRole}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                  isAdmin
                    ? 'bg-amber-400 text-brand-secondary font-bold'
                    : 'bg-white/15 text-white/90 hover:bg-white/25'
                }`}
                title="Toggle between Customer Storefront and Admin Console view"
              >
                {isAdmin ? <ShieldAlert className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {isAdmin ? 'Admin Mode (Active)' : 'Customer Mode'}
              </button>
            )}
            <Link
              to="/admin/dashboard"
              className="hidden sm:inline-block underline text-[11px] font-medium text-amber-300 hover:text-amber-200"
            >
              Open Admin Console →
            </Link>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3.5 py-1.5 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left Action / Brand */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-canvas-subtle text-content-primary transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
              </button>
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 -ml-1.5 text-content-primary"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6 stroke-[2]" />
              </button>
            )}

            {/* Title / Brand Display */}
            {title ? (
              <div className="md:hidden">
                <h1 className="text-xl font-bold font-sans text-content-primary leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-content-muted font-medium">{subtitle}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Centered Brand Logo: always visible on desktop; visible on mobile when no title */}
          <Link
            to="/"
            className={`items-center justify-center gap-1.5 ${
              title ? 'hidden md:flex' : 'flex-1 md:flex-initial flex'
            } ${hideLogo ? 'hidden md:flex' : ''}`}
          >
            <img
              src="/assets/logo.svg"
              alt="ZaDa Foods"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            {hasFestiveHeaderMotif && effectiveTheme && (
              <span
                className="inline-flex items-center -ml-0.5 transition-transform hover:scale-110"
                title={`${effectiveTheme.name} Festive Selection`}
              >
                <FestivalMotif
                  preset={effectiveTheme.preset}
                  size={18}
                  color={effectiveTheme.accentColor}
                />
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links — Strictly 4 Primary Destinations */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-content-secondary">
            <Link
              to="/"
              className={`hover:text-brand-primary transition-colors ${
                location.pathname === '/' ? 'text-brand-primary font-bold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`hover:text-brand-primary transition-colors ${
                location.pathname === '/shop' || location.pathname.startsWith('/category')
                  ? 'text-brand-primary font-bold'
                  : ''
              }`}
            >
              Shop
            </Link>
            <Link
              to="/our-story"
              className={`hover:text-brand-primary transition-colors ${
                location.pathname === '/our-story' || location.pathname === '/about'
                  ? 'text-brand-primary font-bold'
                  : ''
              }`}
            >
              Our Story
            </Link>
            <Link
              to="/bulk-orders"
              className={`hover:text-brand-primary transition-colors ${
                location.pathname === '/bulk-orders' || location.pathname === '/bulk-enquiries'
                  ? 'text-brand-primary font-bold'
                  : ''
              }`}
            >
              Bulk Orders
            </Link>
          </nav>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Desktop Unified Search: fits into single compact header row */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-44 lg:w-56 xl:w-64"
            >
              <Search className="w-4 h-4 text-content-muted absolute left-3 pointer-events-none stroke-[2]" />
              <input
                type="text"
                placeholder="Search snacks, sweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-border-subtle bg-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-[#9CA3AF]"
              />
            </form>

            {/* Mobile Header Search Icon (visible on subpages when showSearch is true) */}
            {title && showSearch && (
              <Link
                to="/category/chips"
                className="md:hidden p-1.5 text-content-primary hover:text-brand-primary transition-colors"
                aria-label="Search"
              >
                <Search className="w-6 h-6 stroke-[2.2]" />
              </Link>
            )}

            {showWishlist ? (
              <button
                className="p-1.5 text-content-primary hover:text-brand-primary transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-6 h-6 stroke-[2]" />
              </button>
            ) : (
              <Link
                to="/account"
                className="hidden sm:flex p-2 text-content-primary hover:text-brand-primary transition-colors"
                aria-label="Wishlist"
                title="Saved Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Cart Button with Count Badge matching Screen 1, 2, 3 */}
            {!hideCartIcon && (
              <Link
                to="/cart"
                className="relative p-1.5 text-content-primary hover:text-brand-primary transition-colors"
                aria-label="View Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6 stroke-[2]" />
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A67732] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {totalUniqueItems > 0 ? totalUniqueItems : 3}
                </span>
              </Link>
            )}

            {/* User Profile Pill on Desktop */}
            <Link
              to="/account"
              className="hidden sm:flex items-center gap-2 pl-2 border-l border-border-subtle text-xs font-semibold text-content-primary hover:text-brand-primary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-brand-secondary text-white flex items-center justify-center font-bold text-xs">
                {user ? user.fullName[0].toUpperCase() : 'N'}
              </div>
              <span className="hidden xl:inline">{user ? user.fullName.split(' ')[0] : 'Sign In'}</span>
            </Link>
          </div>
        </div>

        {/* Mobile-Only Search Bar shown on Homepage matching Screen 1 (hidden on desktop to maintain single compact row) */}
        {showSearch && !title && (
          <form onSubmit={handleSearchSubmit} className="mt-1.5 sm:mt-2 md:hidden">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none stroke-[2]" />
              <input
                type="text"
                placeholder="Search snacks, sweets, combos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-xs rounded-xl border border-[#E7E2D8] bg-[#F7F5EE]/80 text-content-primary placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-brand-primary transition-all"
              />
            </div>
          </form>
        )}
      </div>

      {/* Mobile Drawer Menu — Strictly 4 Primary Destinations */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border-subtle px-4 py-3 space-y-1 animate-in fade-in duration-150">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-content-primary hover:text-brand-primary border-b border-border-subtle/40"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-content-primary hover:text-brand-primary border-b border-border-subtle/40"
          >
            Shop
          </Link>
          <Link
            to="/our-story"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-content-primary hover:text-brand-primary border-b border-border-subtle/40"
          >
            Our Story
          </Link>
          <Link
            to="/bulk-orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-brand-primary hover:underline border-b border-border-subtle/40"
          >
            Bulk Orders
          </Link>
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-amber-700 bg-amber-50 px-2 rounded mt-2"
            >
              ⚡ Enter Admin Operations Console
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
