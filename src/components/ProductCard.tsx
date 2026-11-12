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

  const isOutOfStock = selectedVariant.stockQuantity <= 0;

  // Refined brand initials for missing or image-free products
  const nameInitial = product.name ? product.name.charAt(0).toUpperCase() : 'Z';

  const hasMultipleVariants = product.variants.length > 1;

  const handleImageError = () => {
    setImgError(true);
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

        {/* Price row matching 1 home ui.png */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="font-bold text-sm sm:text-base text-[#1C1917]">
            ₹{selectedVariant.sellingPrice}
          </span>
          {selectedVariant.mrp > selectedVariant.sellingPrice && (
            <span className="text-xs text-[#9CA3AF] line-through">
              ₹{selectedVariant.mrp}
            </span>
          )}
          {selectedVariant.discountPercentage > 0 && (
            <span className="ml-auto text-[9px] font-bold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">
              {selectedVariant.discountPercentage}% OFF
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
              value={selectedVariant.id}
              onChange={handleVariantChange}
              aria-label={`Select pack size for ${product.name}`}
              className="w-full appearance-none bg-white border border-[#EAE5DC] text-[#1C1917] text-[11px] sm:text-xs font-semibold py-1.5 pl-2 pr-5 rounded-xl focus:outline-none focus:border-[#A67732] cursor-pointer truncate shadow-2xs"
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
          /* Single variant */
          <span className="bg-white text-[#1C1917] text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#EAE5DC] whitespace-nowrap shrink-0 shadow-2xs">
            {selectedVariant.weightLabel}
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
                : 'bg-[#A67732] hover:bg-[#8F6428]'
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
                : 'bg-[#A67732] hover:bg-[#8F6428]'
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
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
