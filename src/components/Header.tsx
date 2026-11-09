import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, ArrowLeft, Search, Heart, ShieldAlert, Store, X } from 'lucide-react';
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

  const closeDrawer = () => setMobileMenuOpen(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-[#FBF8F4]/96 backdrop-blur-md border-b border-[#EAE3D6]/60 transition-all"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
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

        {/* ── MOBILE LAYOUT (< md) ── */}
        <div className="md:hidden">
          {/* Row 1: Hamburger | Logo (centered) | Cart */}
          <div className="flex items-center px-3 h-[52px]">
            {/* Left: Back or Hamburger */}
            <div className="flex items-center" style={{ minWidth: 44 }}>
              {showBack ? (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-[44px] h-[44px] -ml-2 text-content-primary transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                </button>
              ) : (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex items-center justify-center w-[44px] h-[44px] -ml-2 text-content-primary transition-colors"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6 stroke-[2]" />
                </button>
              )}
            </div>

            {/* Center: Logo or Title — absolutely centered via flex-1 trick */}
            <div className="flex-1 flex items-center justify-center">
              {title ? (
                <div className="text-center">
                  <h1 className="text-[17px] font-bold font-sans text-content-primary leading-tight">{title}</h1>
                  {subtitle && (
                    <p className="text-[11px] text-content-muted font-medium">{subtitle}</p>
                  )}
                </div>
              ) : (
                !hideLogo && (
                  <Link to="/" className="flex items-center gap-1" aria-label="ZaDa Foods Home">
                    <img
                      src="/assets/logo.svg"
                      alt="ZaDa Foods"
                      className="h-8 w-auto object-contain"
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
                )
              )}
            </div>

            {/* Right: Wishlist / Search icon + Cart */}
            <div className="flex items-center gap-0.5" style={{ minWidth: 44 }}>
              {showWishlist ? (
                <button
                  className="flex items-center justify-center w-[44px] h-[44px] text-content-primary transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5 stroke-[2]" />
                </button>
              ) : title && showSearch ? (
                <Link
                  to="/shop"
                  className="flex items-center justify-center w-[44px] h-[44px] text-content-primary transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 stroke-[2.2]" />
                </Link>
              ) : null}

              {!hideCartIcon && (
                <Link
                  to="/cart"
                  className="relative flex items-center justify-center w-[44px] h-[44px] text-content-primary transition-colors"
                  aria-label="View Shopping Cart"
                >
                  <ShoppingCart className="w-6 h-6 stroke-[2]" />
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A67732] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {totalUniqueItems > 0 ? totalUniqueItems : 3}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Full-width pill search bar (homepage only) matching 1 home ui.png */}
          {showSearch && !title && (
            <form onSubmit={handleSearchSubmit} className="px-3.5 pb-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none stroke-[2]" />
                <input
                  type="text"
                  placeholder="Search snacks, sweets, combos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E7E2D8] bg-[#F7F5EE]/80 text-content-primary placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-brand-primary transition-all shadow-2xs"
                />
              </div>
            </form>
          )}
        </div>

        {/* ── DESKTOP LAYOUT (>= md) ── single compact row, unchanged */}
        <div className="hidden md:block max-w-6xl mx-auto px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back or Logo */}
            <div className="flex items-center gap-3">
              {showBack ? (
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-full hover:bg-canvas-subtle text-content-primary transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                </button>
              ) : null}

              {title ? (
                <div>
                  <h1 className="text-xl font-bold font-sans text-content-primary leading-tight">{title}</h1>
                  {subtitle && <p className="text-xs text-content-muted font-medium">{subtitle}</p>}
                </div>
              ) : null}
            </div>

            {/* Center: Brand Logo */}
            <Link
              to="/"
              className={`items-center justify-center gap-1.5 ${
                title ? 'hidden md:flex' : 'flex'
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

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Navigation" className="flex items-center gap-6 lg:gap-8 text-sm font-semibold text-content-secondary">
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
              {/* Desktop Search */}
              <form onSubmit={handleSearchSubmit} className="flex items-center relative w-44 lg:w-56 xl:w-64">
                <Search className="w-4 h-4 text-content-muted absolute left-3 pointer-events-none stroke-[2]" />
                <input
                  type="text"
                  placeholder="Search snacks, sweets, combos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-border-subtle bg-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-[#9CA3AF]"
                />
              </form>

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
        </div>
      </header>

      {/* ── MOBILE SIDE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#FBF8F4] shadow-2xl"
            style={{ animation: 'slideInLeft 0.25s ease-out' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE3D6]/60">
              <Link to="/" onClick={closeDrawer} className="flex items-center gap-1.5">
                <img
                  src="/assets/logo.svg"
                  alt="ZaDa Foods"
                  className="h-8 w-auto object-contain"
                />
                {hasFestiveHeaderMotif && effectiveTheme && (
                  <FestivalMotif
                    preset={effectiveTheme.preset}
                    size={16}
                    color={effectiveTheme.accentColor}
                  />
                )}
              </Link>
              <button
                onClick={closeDrawer}
                className="flex items-center justify-center w-[44px] h-[44px] -mr-2 text-content-secondary hover:text-content-primary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col flex-1 overflow-y-auto">
              <Link
                to="/"
                onClick={closeDrawer}
                className={`py-4 px-6 text-sm font-semibold border-b border-[#EAE3D6]/40 transition-colors ${
                  location.pathname === '/'
                    ? 'text-[#A67732]'
                    : 'text-content-primary hover:text-[#A67732]'
                }`}
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={closeDrawer}
                className={`py-4 px-6 text-sm font-semibold border-b border-[#EAE3D6]/40 transition-colors ${
                  location.pathname === '/shop' || location.pathname.startsWith('/category')
                    ? 'text-[#A67732]'
                    : 'text-content-primary hover:text-[#A67732]'
                }`}
              >
                Shop
              </Link>
              <Link
                to="/our-story"
                onClick={closeDrawer}
                className={`py-4 px-6 text-sm font-semibold border-b border-[#EAE3D6]/40 transition-colors ${
                  location.pathname === '/our-story' || location.pathname === '/about'
                    ? 'text-[#A67732]'
                    : 'text-content-primary hover:text-[#A67732]'
                }`}
              >
                Our Story
              </Link>
              <Link
                to="/bulk-orders"
                onClick={closeDrawer}
                className={`py-4 px-6 text-sm font-semibold border-b border-[#EAE3D6]/40 transition-colors ${
                  location.pathname === '/bulk-orders' || location.pathname === '/bulk-enquiries'
                    ? 'text-[#A67732]'
                    : 'text-content-primary hover:text-[#A67732]'
                }`}
              >
                Bulk Orders
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={closeDrawer}
                  className="mt-4 mx-4 py-3 px-4 text-sm font-bold text-amber-700 bg-amber-50 rounded-lg flex items-center gap-2 border border-amber-200/60"
                >
                  ⚡ Enter Admin Operations Console
                </Link>
              )}
            </nav>

            {/* Drawer Footer — Account */}
            <div className="border-t border-[#EAE3D6]/60 p-5">
              <Link
                to="/account"
                onClick={closeDrawer}
                className="flex items-center gap-3 text-sm font-semibold text-content-primary hover:text-[#A67732] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-secondary text-white flex items-center justify-center font-bold text-sm">
                  {user ? user.fullName[0].toUpperCase() : 'N'}
                </div>
                <span>{user ? user.fullName.split(' ')[0] : 'Sign In'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Drawer slide-in keyframe */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
