import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../router';
import { useProducts } from '../context/ProductContext';
import { DEFAULT_HERO_CONFIG } from '../lib/admin';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { navigate } = useRouter();
  const { heroConfig } = useProducts();

  // Active slides (Up to 8 slides supported)
  const rawSlides = heroConfig?.slides?.filter((s) => s.isActive) || [];
  const slides = rawSlides.length > 0 ? rawSlides.slice(0, 8) : [
    {
      id: 'default-1',
      imageUrl: '/assets/aistudio/ae200b2a-8528-4ef4-ae8b-c79087dfa79f_b451b3b7.png',
      title: '928 Type Heavy-Duty Tactical Flashlight',
      subtitle: 'High-Power Multi-Functional Defense Flashlight with High Lumen Beam',
      badge: 'TOP FEATURED',
      linkUrl: '/products/sl-720-mini-body-massage-gun',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'default-2',
      imageUrl: '/assets/aistudio/hodie_and_dropshoulder_combo_48679659.jpg',
      title: 'Winter 2025 Thermal Essentials',
      subtitle: 'Heavyweight Minimalist Hoodies & Pullovers crafted for comfort in Bangladesh',
      badge: 'WINTER COLLECTION',
      linkUrl: '/products/premium-solid-color-pullover-hoodie',
      isActive: true,
      sortOrder: 2,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSlideInterval = heroConfig?.autoSlideInterval || 4500;

  // Auto-sliding interval logic
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused, autoSlideInterval]);

  // Keep index within bounds if slides count changes
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleSlideClick = (slide: typeof slides[0]) => {
    if (slide.linkUrl) {
      if (slide.linkUrl.startsWith('http')) {
        window.open(slide.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(slide.linkUrl);
      }
    }
  };

  return (
    <section className="w-full max-w-full bg-[#FAF8F5] border-b border-[#E8E2D5] overflow-hidden">
      {/* 1. HERO AUTO-SLIDING BANNER CAROUSEL (Max 3 slides) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div
          className="relative rounded-2xl overflow-hidden bg-black shadow-md border border-[#E0D9CD] group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Banner Aspect Container */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] max-h-[500px] overflow-hidden">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <div
                    onClick={() => handleSlideClick(slide)}
                    className={`w-full h-full relative ${slide.linkUrl ? 'cursor-pointer' : ''}`}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || `CORELUX Banner Slide ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />

                    {/* Gradient Overlay for subtle text elegance */}
                    {(slide.title || slide.badge || slide.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-8 md:p-10">
                        {slide.badge && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#143D2B]/90 backdrop-blur-md border border-[#C5A059]/40 text-[#C5A059] text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 w-fit">
                            <Sparkles className="w-3 h-3" />
                            <span>{slide.badge}</span>
                          </div>
                        )}
                        {slide.title && (
                          <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-bold font-display tracking-tight max-w-2xl drop-shadow-sm">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-stone-200 text-xs sm:text-sm font-medium max-w-xl mt-1 line-clamp-2 drop-shadow-xs">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows (Visible when more than 1 slide) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Slide Indicator Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'w-6 bg-[#C5A059]'
                      : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CONTINUOUSLY MOVING ANNOUNCEMENT TICKER (STAR TECH MINIMAL STYLE) */}
      {(() => {
        const tickerMessage =
          (heroConfig?.tickerText && heroConfig.tickerText.trim()) ||
          DEFAULT_HERO_CONFIG.tickerText ||
          'Special Flash Sale: Cash on Delivery Nationwide in Bangladesh (All 64 Districts) | Delivery in 2–3 Days | Genuine Products with Physical Inspection Allowed Before Payment | Customer Helpline: 01967-233934';

        // Prepare segments: if message contains '|', split for clean separator rhythm, else repeat the full message
        const rawSegments = tickerMessage.includes(' | ')
          ? tickerMessage.split(' | ').map((s) => s.trim()).filter(Boolean)
          : [tickerMessage];

        // Ensure sufficient width so wide monitors never run out of text during translation
        const segments = rawSegments.length < 4
          ? [...rawSegments, ...rawSegments, ...rawSegments]
          : rawSegments;

          return (
            <div className="w-full max-w-full bg-white border-y border-[#E5E7EB] select-none overflow-hidden">
              <div className="w-full max-w-7xl mx-auto border-x border-[#E5E7EB] overflow-hidden py-2 sm:py-2.5 relative flex items-center">
              {/* Subtle Edge Fade Overlays (pure white) */}
              <div className="absolute left-0 inset-y-0 w-6 sm:w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 inset-y-0 w-6 sm:w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              {/* Infinite Continuous Right-to-Left Ticker */}
              <div className="animate-tv-ticker flex items-center">
                {/* Copy 1 (0% to 50%) */}
                <div className="inline-flex items-center shrink-0">
                  {segments.map((segment, idx) => (
                    <div key={`track1-${idx}`} className="inline-flex items-center gap-3.5 px-6 sm:px-8">
                      <span className="text-xs sm:text-[13px] font-medium tracking-normal text-[#1C2024] whitespace-nowrap">
                        {segment}
                      </span>
                      <span className="text-stone-300 text-xs select-none">•</span>
                    </div>
                  ))}
                </div>

                {/* Copy 2 (50% to 100% - Identical duplicate for seamless wrap without gap/reset) */}
                <div className="inline-flex items-center shrink-0" aria-hidden="true">
                  {segments.map((segment, idx) => (
                    <div key={`track2-${idx}`} className="inline-flex items-center gap-3.5 px-6 sm:px-8">
                      <span className="text-xs sm:text-[13px] font-medium tracking-normal text-[#1C2024] whitespace-nowrap">
                        {segment}
                      </span>
                      <span className="text-stone-300 text-xs select-none">•</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
