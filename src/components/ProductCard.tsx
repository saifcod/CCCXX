import React from 'react';
import { Product } from '../data/products';
import { useRouter } from '../router';
import { ArrowUpRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate } = useRouter();
  const productUrl = `/products/${product.slug}`;

  const handleLinkClick = (e: React.MouseEvent) => {
    // Only intercept plain primary left-clicks; allow Ctrl/Cmd/Shift/Middle clicks to open new tab natively
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      navigate(productUrl);
    }
  };

  return (
    <a
      href={productUrl}
      onClick={handleLinkClick}
      className="group cursor-pointer flex flex-col bg-white rounded-lg border border-[#E8E2D5] overflow-hidden hover:border-[#C5A059]/60 hover:shadow-[0_8px_24px_-6px_rgba(20,61,43,0.08)] active:scale-[0.99] transition-all duration-200 no-underline text-inherit"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square sm:aspect-[4/4] bg-[#FAF8F5] overflow-hidden p-3 sm:p-4 flex items-center justify-center border-b border-[#F0EBE1]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={360}
          height={360}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-102 transition-transform duration-300"
        />

        {/* Quiet Subtitle Indicators - Unboxed & Honest */}
        {product.isMasterCopy && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#1C2024]/90 text-white text-[10px] sm:text-[11px] font-medium tracking-wider px-2 py-0.5 rounded-sm uppercase">
            Master Copy
          </div>
        )}

        {product.isWinter && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#143D2B] text-[#FAF8F5] text-[10px] sm:text-[11px] font-medium tracking-wider px-2 py-0.5 rounded-sm uppercase">
            Winter Spec
          </div>
        )}
      </div>

      {/* Product Info Block */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category / Quiet Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#7A828B] mb-1 uppercase tracking-wider font-medium truncate">
            <span>{product.category}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-semibold text-[#1C2024] group-hover:text-[#143D2B] line-clamp-2 leading-snug mb-2 font-sans transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Options hints for winter wear without clutter */}
          {product.requiresSize && (
            <div className="text-[10px] sm:text-[11px] text-[#8C6D2D] mb-2 truncate">
              Sizes: {product.availableSizes?.join(', ')}
              {product.requiresColor && (
                <span> · {product.availableColors?.length} Colorways</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 border-t border-[#F4EFE6] mt-2">
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-2.5">
            {product.originalPriceDisplay && (
              <span className="text-xs sm:text-sm text-stone-400 line-through font-normal">
                {product.originalPriceDisplay}
              </span>
            )}
            <span className="text-sm sm:text-base font-bold text-[#143D2B] tracking-tight">
              {product.priceDisplay}
            </span>
            {product.discountDisplay && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#EAF7EE] text-[#14532D] border border-[#BDE8C9]">
                {product.discountDisplay}
              </span>
            )}
          </div>

          <div
            className="w-full min-h-[42px] sm:min-h-[44px] bg-[#143D2B] group-hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-medium rounded-md px-3 py-2 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A059]" />
          </div>
        </div>
      </div>
    </a>
  );
};

