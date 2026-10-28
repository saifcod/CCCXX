import React, { useState } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { ProductCard } from './ProductCard';

export const FeaturedProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'electronics' | 'winter'>('all');

  const filteredProducts: Product[] = PRODUCTS.filter((product) => {
    if (activeTab === 'winter') return product.isWinter;
    if (activeTab === 'electronics') return !product.isWinter;
    return true;
  });

  return (
    <section id="featured-products" className="py-12 sm:py-16 md:py-20 bg-[#FAF8F5] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-[#E8E2D5] pb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#1C2024] font-display">
              Featured Products
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5D646D]">
              Explore our complete selection of authentic electronics and winter fashion essentials.
            </p>
          </div>

          {/* Clean Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE9DF] rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#143D2B] shadow-xs font-semibold'
                  : 'text-[#5A626A] hover:text-[#1C2024]'
              }`}
            >
              All Items ({PRODUCTS.length})
            </button>
            <button
              onClick={() => setActiveTab('winter')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'winter'
                  ? 'bg-white text-[#143D2B] shadow-xs font-semibold'
                  : 'text-[#5A626A] hover:text-[#1C2024]'
              }`}
            >
              Winter Wear (2)
            </button>
            <button
              onClick={() => setActiveTab('electronics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'electronics'
                  ? 'bg-white text-[#143D2B] shadow-xs font-semibold'
                  : 'text-[#5A626A] hover:text-[#1C2024]'
              }`}
            >
              Tech & Audio (3)
            </button>
          </div>
        </div>

        {/* 2-Column Mobile Grid strictly enforced (grid-cols-2), 3 on md, 3 or 4 on lg */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
