import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { useFestival } from '../context/FestivalContext';
import { FestivalCardBadge } from './festival/FestivalCardBadge';
import { FestivalMotif } from './festival/FestivalMotifs';

interface ProductCardProps {
  product: Product;
  compactButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compactButton = false,
}) => {
  const { addToCart } = useCart();
  const { effectiveTheme, isFestivalActive } = useFestival();

  const fallbackVar: ProductVariant = useMemo(() => {
    const rawPrice = (product as any).price || 199;
    const rawStock = (product as any).stockQuantity ?? 50;
    return {
      id: `${product.id || 'prod'}-default`,
      productId: product.id || 'prod',
      sku: `ZADA-${(product.slug || 'item').toUpperCase()}-STD`,
      weightValue: 250,
      weightUnit: 'g',
      weightLabel: 'Standard Pack',
      sellingPrice: rawPrice,
      mrp: Math.round(rawPrice * 1.25),
      discountPercentage: 0,
      stockQuantity: rawStock,
      lowStockThreshold: 10,
      isDefault: true
    };
  }, [product.id, product.slug, (product as any).price, (product as any).stockQuantity]);

  const defaultVar = (product.variants && product.variants.length > 0)
    ? (product.variants.find((v) => v.isDefault) || product.variants[0])
    : fallbackVar;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVar || fallbackVar);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');

  useEffect(() => {
    const nextVar = (product.variants && product.variants.length > 0)
      ? (product.variants.find((v) => v.isDefault) || product.variants[0])
      : fallbackVar;
    setSelectedVariant(nextVar);
  }, [product.id, product.variants, fallbackVar]);

  const activeVariant = selectedVariant || defaultVar || fallbackVar;

  const isFestiveActive = Boolean(isFestivalActive && effectiveTheme && effectiveTheme.preset !== 'default');
  const showRibbon = Boolean(
    isFestiveActive &&
    effectiveTheme?.placements?.cardRibbons !== false &&
    (product.isBestseller || product.isOnOffer || effectiveTheme?.featuredProductIds?.includes(product.id) || effectiveTheme?.productBadges?.[product.id])
  );

  const ribbonLabel =
    effectiveTheme?.preset === 'christmas' ? 'HOLIDAY PICK' :
    effectiveTheme?.preset === 'onam' ? 'ONASADHYA' :
    effectiveTheme?.preset === 'diwali' ? 'FESTIVE PICK' :
    effectiveTheme?.preset === 'eid' ? 'EID BARAKAH' :
    effectiveTheme?.preset === 'new_year' ? '2027 PICK' : 'FESTIVE';

  const ribbonBg =
    effectiveTheme?.preset === 'christmas' ? '#801826' :
    effectiveTheme?.preset === 'onam' ? '#C88A10' :
    effectiveTheme?.preset === 'diwali' ? '#D97706' :
    effectiveTheme?.preset === 'eid' ? '#055C41' :
    effectiveTheme?.preset === 'new_year' ? '#B45309' : (effectiveTheme?.accentColor || '#A67732');

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = (product.variants || []).find((v) => v.id === e.target.value);
    if (found) setSelectedVariant(found);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartState !== 'idle' || activeVariant.stockQuantity <= 0) return;

    setCartState('added');
    addToCart(product, activeVariant, 1);

    setTimeout(() => {
      setCartState('idle');
    }, 1500);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const hasValidImage = Boolean(
    product.images &&
    product.images.length > 0 &&
    product.images[0]?.imageUrl &&
    !product.images[0]?.imageUrl.includes('placeholder')
  );

  const [imageSrc, setImageSrc] = useState(hasValidImage ? product.images[0].imageUrl : '');
  const [imgError, setImgError] = useState(!hasValidImage);

  React.useEffect(() => {
    const valid = Boolean(
      product.images &&
      product.images.length > 0 &&
      product.images[0]?.imageUrl &&
      !product.images[0]?.imageUrl.includes('placeholder')
    );
    setImageSrc(valid ? product.images[0].imageUrl : '');
    setImgError(!valid);
  }, [product.id, product.images]);

  const isOutOfStock = activeVariant.stockQuantity <= 0;

  // Refined brand initials for missing or image-free products
  const nameInitial = product.name ? product.name.charAt(0).toUpperCase() : 'Z';

  const hasMultipleVariants = (product.variants || []).length > 1;

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <div className="group bg-[var(--color-surface,#FFFFFF)] rounded-2xl overflow-hidden border border-[var(--color-border,#EAE3D6)]/80 hover:border-[var(--color-primary,#A67732)]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full">

      {/* ── Image Container ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface-subtle,#F7F4EE)]">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full"
          tabIndex={0}
          aria-label={`View details for ${product.name}`}
        >
          {imgError || !imageSrc ? (
            /* Clean luxury gold/ivory branded monogram placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#FBF8F2] to-[#F5EFE6] p-4 text-center border border-[#EAE3D6]/50 select-none">
              <div className="w-11 h-11 rounded-full bg-[#A67732]/10 border border-[#A67732]/25 flex items-center justify-center mb-1 shadow-2xs">
                <span className="font-serif text-2xl font-bold text-[#A67732]">
                  {nameInitial}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#A67732]">
                ZaDa Foods
              </span>
              <span className="text-[9px] text-[#78716C] font-medium truncate max-w-full px-2 mt-0.5">
                Authentic Malabar
              </span>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              onError={handleImageError}
            />
          )}
        </Link>

        {/* Badges — top-left stack matching 1 home ui.png */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
          {product.isBestseller && (
            <span className="bg-[#FAD982] text-[#1C1917] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-[#E5C368]/50 whitespace-nowrap">
              BEST SELLER
            </span>
          )}
          {product.isOnOffer && (
            <span className="bg-[#EA580C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
              ON OFFER
            </span>
          )}
          <FestivalCardBadge productId={product.id} isOffer={product.isOnOffer} />
        </div>

        {/* Wishlist button — top-right matching 1 home ui.png */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-xs text-white transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-white stroke-[2]'
            }`}
          />
        </button>

        {/* Festive Corner Ribbon (Top Right below wishlist) */}
        {showRibbon && (
          <div className="absolute top-10 right-2 z-10 pointer-events-none">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider text-white shadow-xs border border-white/20"
              style={{ backgroundColor: ribbonBg }}
            >
              <FestivalMotif preset={effectiveTheme!.preset} size={10} color="#FFFFFF" />
              <span>{ribbonLabel}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Product Info ── */}
      <div className="p-3 pt-2.5 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-semibold text-[13px] text-[var(--color-heading,#1C1917)] leading-tight line-clamp-2 hover:text-[var(--color-primary,#072C20)] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating row — only when reviewCount > 0 */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-text-muted,#71717A)]">
            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="font-bold text-[var(--color-text,#1C1917)]">{product.averageRating}</span>
            <span>
              (
              {product.reviewCount > 999
                ? `${(product.reviewCount / 1000).toFixed(1)}K`
                : product.reviewCount}
              )
            </span>
          </div>
        )}

        {/* Price row matching 1 home ui.png */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="font-bold text-sm sm:text-base text-[var(--color-price,#1C1917)]">
            ₹{activeVariant.sellingPrice}
          </span>
          {activeVariant.mrp > activeVariant.sellingPrice && (
            <span className="text-xs text-[var(--color-price-mrp,#9CA3AF)] line-through">
              ₹{activeVariant.mrp}
            </span>
          )}
          {activeVariant.discountPercentage > 0 && (
            <span className="ml-auto text-[9px] font-bold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">
              {activeVariant.discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>

      {/* ── Controls Footer matching 1 home ui.png ── */}
      <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 pt-0 mt-auto flex items-center gap-2">

        {/* Variant selector */}
        {hasMultipleVariants ? (
          <div className="relative flex-1 min-w-0">
            <select
              value={activeVariant.id}
              onChange={handleVariantChange}
              aria-label={`Select pack size for ${product.name}`}
              className="w-full appearance-none bg-[var(--color-surface,#FFFFFF)] border border-[var(--color-border,#EAE5DC)] text-[var(--color-text,#1C1917)] text-[11px] sm:text-xs font-semibold py-1.5 pl-2 pr-5 rounded-xl focus:outline-none focus:border-[var(--color-primary,#A67732)] cursor-pointer truncate shadow-2xs"
            >
              {(product.variants || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.weightLabel}
                </option>
              ))}
            </select>
            {/* Custom chevron overlay */}
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#77736C] text-[8px]">
              ▼
            </span>
          </div>
        ) : (
          /* Single variant */
          <span className="bg-[var(--color-surface,#FFFFFF)] text-[var(--color-text,#1C1917)] text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[var(--color-border,#EAE5DC)] whitespace-nowrap shrink-0 shadow-2xs">
            {activeVariant.weightLabel}
          </span>
        )}

        {/* Add to Cart Button matching 1 home ui.png */}
        {compactButton ? (
          /* Icon-only button */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-8 sm:h-9 w-8 sm:w-9 rounded-xl text-white flex items-center justify-center shrink-0 transition-all active:scale-[0.98] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732] ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-emerald-700'
                : 'bg-[var(--color-button-bg,#A67732)] hover:opacity-90 text-[var(--color-button-text,#FFFFFF)]'
            }`}
            title={
              isOutOfStock
                ? 'Out of stock'
                : cartState === 'added'
                ? 'Added to Cart'
                : `Add ${product.name} to cart`
            }
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : cartState === 'added'
                ? `${product.name} added to cart`
                : `Add ${product.name} to cart`
            }
          >
            {cartState === 'added' ? (
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-4 h-4 stroke-[2]" />
            )}
          </button>
        ) : (
          /* Primary Pill Button */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-8 sm:h-9 px-3 rounded-xl text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-[0.98] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732] ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-emerald-700'
                : 'bg-[var(--color-button-bg,#A67732)] hover:opacity-90 text-[var(--color-button-text,#FFFFFF)]'
            }`}
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : cartState === 'added'
                ? `${product.name} added to cart`
                : `Add ${product.name} to cart`
            }
          >
            {cartState === 'added' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2]" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
