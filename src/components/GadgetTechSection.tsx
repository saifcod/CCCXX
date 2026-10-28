import React from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';

export const GadgetTechSection: React.FC = () => {
  const { gadgetProducts } = useProducts();

  return (
    <section id="gadget-tech" className="py-8 sm:py-10 md:py-12 bg-[#FAF8F5] scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8 border-b border-[#E8E2D5] pb-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#1C2024] font-display">
            Gadget & Tech
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5D646D]">
            High-performance wireless audio, therapeutic wellness gear, and verified tech essentials.
          </p>
        </div>

        {/* 2-Column Mobile Grid, 3-Column Tablet/Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {gadgetProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
