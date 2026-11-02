import React from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

export const WinterSection: React.FC = () => {
  const { winterProducts } = useProducts();

  return (
    <section id="winter-collection" className="w-full max-w-full overflow-hidden py-8 sm:py-10 md:py-12 bg-[#F5F1E8]/60 border-b border-[#E6DFC2]/60 scroll-mt-16 sm:scroll-mt-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8 border-b border-[#E6DFC2] pb-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#1C2024] font-display">
            Winter Collection
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5D646D]">
            Heavyweight thermal combed cotton fleece engineered for genuine warmth and effortless style. Available in sizes L & XL.
          </p>
        </div>

        {/* 2 Product Columns on Mobile Grid strictly adhered */}
        <div className="grid grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto gap-3 sm:gap-5 lg:gap-6">
          {winterProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Winter Fabric & Quality Guarantee Note */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg border border-[#E8E1D3] p-4 sm:p-5 max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-semibold text-[#1C2024]">
              Need help picking your winter size or colorway?
            </h4>
            <p className="text-[11px] sm:text-xs text-[#6B7280]">
              Our customer team is available on WhatsApp to assist with exact measurements and color verification.
            </p>
          </div>

          <a
            href="https://wa.me/8801967233934?text=Hello%20CORELUX,%20I%20have%20a%20question%20about%20the%20Winter%20Collection%20hoodies"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 min-h-[40px] px-3.5 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Ask via WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
          </a>
        </div>
      </div>
    </section>
  );
};
