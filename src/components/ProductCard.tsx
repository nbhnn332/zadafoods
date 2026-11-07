import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { FestivalCardBadge } from './festival/FestivalCardBadge';

interface ProductCardProps {
  product: Product;
  compactButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compactButton = false
}) => {
  const { addToCart } = useCart();
  const defaultVar = product.variants.find((v) => v.isDefault) || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVar);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');

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

  const isOutOfStock = selectedVariant.stockQuantity <= 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE5DC] hover:border-[#D4A373]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full focus-within:ring-2 focus-within:ring-brand-primary/40">
      <div className="flex flex-col flex-1">
        {/* Standardized Media Container (4:3 aspect ratio across all screen sizes) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF6EE]/50">
          <Link to={`/product/${product.slug}`} className="block w-full h-full" tabIndex={0} aria-label={`View details for ${product.name}`}>
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Clean, Unclipped Badges inside Image Bounds with consistent 10px inset */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
            {product.isBestseller && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAD982] text-[#1C1917] text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-[#E5C368]/50 whitespace-nowrap">
                BEST SELLER
              </span>
            )}

            {product.isOnOffer && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#EA580C] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-[#C2410C]/40 whitespace-nowrap">
                ON OFFER
              </span>
            )}

            {/* Subtle Festival Badge */}
            <FestivalCardBadge productId={product.id} isOffer={product.isOnOffer} />
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs text-content-primary hover:text-rose-500 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#71717A]'
              }`}
            />
          </button>
        </div>

        {/* Product Details with Stable Min-Heights */}
        <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] line-clamp-1 hover:text-brand-primary transition-colors" title={product.name}>
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-xs text-[#71717A]">
            {product.reviewCount > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                <span className="font-bold text-[#1C1917]">{product.averageRating}</span>
                <span>({product.reviewCount > 999 ? `${(product.reviewCount / 1000).toFixed(1)}K` : product.reviewCount})</span>
              </>
            ) : (
              <span className="text-[11px] text-[#A1A1AA]">No reviews yet</span>
            )}
          </div>

          {/* Pricing Row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap min-h-[1.5rem]">
            <span className="font-bold text-sm sm:text-base text-[#1C1917]">
              ₹{selectedVariant.sellingPrice}
            </span>
            {selectedVariant.mrp > selectedVariant.sellingPrice && (
              <span className="text-xs text-[#9CA3AF] line-through">
                ₹{selectedVariant.mrp}
              </span>
            )}
            {selectedVariant.discountPercentage > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#FFE4E6] text-[#E11D48] text-[9px] font-bold tracking-wide">
                {selectedVariant.discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Standardized Card Controls Footer */}
      <div className="px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 pt-0 flex items-center gap-2 mt-auto">
        {/* Pack Size Selector Dropdown */}
        <div className="relative flex-1">
          <select
            value={selectedVariant.id}
            onChange={handleVariantChange}
            aria-label={`Select pack size for ${product.name}`}
            className="w-full h-9 text-[11px] font-semibold py-1 pl-2 pr-5 rounded-xl bg-white border border-[#EAE5DC] text-[#1C1917] focus:outline-none focus:border-brand-primary appearance-none cursor-pointer truncate shadow-2xs"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.weightLabel}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-content-muted text-[8px]">
            ▼
          </span>
        </div>

        {/* Add To Cart Action with unmistakable feedback */}
        {compactButton ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-9 w-9 rounded-xl text-white transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-[#07382A]'
                : 'bg-[#A67732] hover:bg-[#8F6428]'
            }`}
            title={isOutOfStock ? 'Out of stock' : cartState === 'added' ? 'Added to Cart' : `Add ${product.name} to cart`}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : cartState === 'added' ? `${product.name} added to cart` : `Add ${product.name} to cart`}
          >
            {cartState === 'adding' ? (
              <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
            ) : cartState === 'added' ? (
              <Check className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-4 h-4 stroke-[2]" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || cartState === 'adding'}
            className={`h-9 px-3 sm:px-3.5 rounded-xl text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
              isOutOfStock
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : cartState === 'added'
                ? 'bg-[#07382A]'
                : 'bg-[#A67732] hover:bg-[#8F6428]'
            }`}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : cartState === 'added' ? `${product.name} added to cart` : `Add ${product.name} to cart`}
          >
            {cartState === 'adding' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                <span className="hidden sm:inline">Adding</span>
              </>
            ) : cartState === 'added' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" />
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
