import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Check } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { FestivalCardBadge } from './festival/FestivalCardBadge';

interface ProductCardProps {
  product: Product;
  compactButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compactButton = false,
}) => {
  const { addToCart } = useCart();
  const defaultVar = product.variants.find((v) => v.isDefault) || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVar);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [imgError, setImgError] = useState(false);

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = product.variants.find((v) => v.id === e.target.value);
    if (found) setSelectedVariant(found);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartState !== 'idle' || selectedVariant.stockQuantity <= 0) return;

    setCartState('added');
    addToCart(product, selectedVariant, 1);

    setTimeout(() => {
      setCartState('idle');
    }, 1500);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const primaryImage =
    product.images[0]?.imageUrl ||
    `/assets/cat-${product.categorySlug || 'chips'}.png`;

  const fallbackCatImage = `/assets/cat-${product.categorySlug || 'chips'}.png`;
  const [imageSrc, setImageSrc] = useState(primaryImage);

  React.useEffect(() => {
    setImageSrc(product.images[0]?.imageUrl || fallbackCatImage);
    setImgError(false);
  }, [product.id, fallbackCatImage]);

  const isOutOfStock = selectedVariant.stockQuantity <= 0;

  // Fallback initial letter for missing images
  const nameInitial = product.name.charAt(0).toUpperCase();

  const hasMultipleVariants = product.variants.length > 1;

  const handleImageError = () => {
    if (imageSrc !== fallbackCatImage) {
      setImageSrc(fallbackCatImage);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE3D6]/80 hover:border-[#A67732]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full">

      {/* ── Image Container ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7F4EE]">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full"
          tabIndex={0}
          aria-label={`View details for ${product.name}`}
        >
          {imgError ? (
            /* Broken-image fallback: centred initial on warm bg */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F4EE] p-3 text-center">
              <span className="font-serif text-3xl font-bold text-[#A67732]/70 select-none">
                {nameInitial}
              </span>
              <span className="text-[10px] text-[#77736C] font-medium mt-1 truncate max-w-full">
                {product.categorySlug || 'ZaDa Foods'}
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

        {/* Badges — top-left stack */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
          {product.isBestseller && (
            <span className="bg-[#A67732] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
              BEST SELLER
            </span>
          )}
          {product.isOnOffer && (
            <span className="bg-[#E84C30] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
              ON OFFER
            </span>
          )}
          <FestivalCardBadge productId={product.id} isOffer={product.isOnOffer} />
        </div>

        {/* Wishlist button — top-right */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-xs shadow-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#072C20]"
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#71717A]'
            }`}
          />
        </button>
      </div>

      {/* ── Product Info ── */}
      <div className="p-3 pt-2.5 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-semibold text-[13px] text-[#1C1917] leading-tight line-clamp-2 hover:text-[#072C20] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating row — only when reviewCount > 0 */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[#71717A]">
            <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="font-bold text-[#1C1917]">{product.averageRating}</span>
            <span>
              (
              {product.reviewCount > 999
                ? `${(product.reviewCount / 1000).toFixed(1)}K`
                : product.reviewCount}
              )
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center flex-wrap gap-1 mt-1.5">
          <span className="font-bold text-[15px] text-[#1C1917]">
            ₹{selectedVariant.sellingPrice}
          </span>
          {selectedVariant.mrp > selectedVariant.sellingPrice && (
            <span className="text-[12px] text-[#9CA3AF] line-through ml-1">
              ₹{selectedVariant.mrp}
            </span>
          )}
          {selectedVariant.discountPercentage > 0 && (
            <span className="text-[10px] font-bold text-[#E84C30] bg-[#FFF0EE] px-1.5 py-0.5 rounded-md ml-1">
              {selectedVariant.discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>

      {/* ── Controls Footer ── */}
      <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3 pt-0 mt-auto flex items-center gap-1.5 sm:gap-2">

        {/* Variant selector */}
        {hasMultipleVariants ? (
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedVariant.id}
              onChange={handleVariantChange}
              aria-label={`Select pack size for ${product.name}`}
              className="w-full appearance-none bg-[#F7F4EE] border border-[#EAE3D6] text-[#1C1917] text-[11px] font-medium py-1.5 pl-2 pr-4 rounded-xl focus:outline-none focus:border-[#A67732] cursor-pointer truncate shadow-2xs"
            >
              {product.variants.map((v) => (
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
          /* Single variant — readonly pill */
          <span className="bg-[#F7F4EE] text-[#77736C] text-[11px] font-medium px-2 py-1 rounded-lg border border-[#EAE3D6] whitespace-nowrap shrink-0">
            {selectedVariant.weightLabel}
          </span>
        )}

        {/* Add to Cart */}
        {compactButton ? (
          /* Icon-only square button */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-8 sm:h-9 w-8 sm:w-9 rounded-xl text-white flex items-center justify-center shrink-0 transition-all active:scale-[0.98] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#072C20] ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-emerald-700'
                : 'bg-[#072C20] hover:bg-[#031D16]'
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
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-4 h-4 stroke-[2]" />
            )}
          </button>
        ) : (
          /* Pill button */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-all active:scale-[0.98] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#072C20] ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-emerald-700'
                : 'bg-[#072C20] hover:bg-[#031D16]'
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
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2]" />
                <span>Add</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
