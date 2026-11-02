import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, PRODUCTS } from '../data/products';
import { lookupProduct, normalizeProduct, generateSlugBase } from '../lib/productService';
import { HeroConfig, DEFAULT_HERO_CONFIG, getHeroConfig, PRODUCTS_CACHE_KEY, HERO_CONFIG_CACHE_KEY } from '../lib/admin';

interface ProductContextType {
  products: Product[];
  gadgetProducts: Product[];
  winterProducts: Product[];
  getProductBySlug: (slug: string) => Product | undefined;
  fetchProductBySlug: (slug: string) => Promise<Product | null>;
  getProductById: (id: string) => Product | undefined;
  loading: boolean;
  refreshProducts: () => Promise<void>;
  heroConfig: HeroConfig;
  refreshHeroConfig: () => Promise<void>;
}

const getInitialProducts = (): Product[] => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached products:', e);
  }
  return PRODUCTS;
};

const getInitialHeroConfig = (): HeroConfig => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(HERO_CONFIG_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_HERO_CONFIG,
            ...parsed,
          };
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached heroConfig:', e);
  }
  return DEFAULT_HERO_CONFIG;
};

const ProductContext = createContext<ProductContextType>({
  products: PRODUCTS,
  gadgetProducts: PRODUCTS.filter((p) => !p.isWinter),
  winterProducts: PRODUCTS.filter((p) => p.isWinter),
  getProductBySlug: () => undefined,
  fetchProductBySlug: async () => null,
  getProductById: () => undefined,
  loading: false,
  refreshProducts: async () => {},
  heroConfig: DEFAULT_HERO_CONFIG,
  refreshHeroConfig: async () => {},
});

export const useProducts = () => useContext(ProductContext);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous initial cache retrieval eliminates the 1-3 second network delay for admin-added products
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      }
    } catch {
      // ignore
    }
    return true;
  });
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(getInitialHeroConfig);

  // 1. Synchronize products collection in real time
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreProducts: Product[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.isDeleted) return;
              firestoreProducts.push(normalizeProduct(data, docSnap.id));
            });

            if (firestoreProducts.length > 0) {
              setProducts(firestoreProducts);
              try {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(firestoreProducts));
                }
              } catch (e) {
                console.warn('Failed to persist products cache:', e);
              }
            } else {
              setProducts(PRODUCTS);
            }
          } else {
            setProducts(PRODUCTS);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore products subscription warning:', error);
          setProducts((prev) => (prev.length > 0 ? prev : PRODUCTS));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not attach Firestore products snapshot listener:', e);
      setProducts((prev) => (prev.length > 0 ? prev : PRODUCTS));
      setLoading(false);
    }
  }, []);

  // 2. Synchronize heroConfig settings in real time
  useEffect(() => {
    try {
      const unsubscribeHero = onSnapshot(
        doc(db, 'settings', 'heroConfig'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<HeroConfig>;
            const freshConfig: HeroConfig = {
              slides: Array.isArray(data.slides) && data.slides.length > 0
                ? data.slides.slice(0, 8)
                : DEFAULT_HERO_CONFIG.slides,
              featuredProductIds: Array.isArray(data.featuredProductIds) && data.featuredProductIds.length >= 2
                ? data.featuredProductIds.slice(0, 2)
                : DEFAULT_HERO_CONFIG.featuredProductIds,
              featuredSectionTitle: data.featuredSectionTitle || DEFAULT_HERO_CONFIG.featuredSectionTitle,
              featuredSectionSubtitle: data.featuredSectionSubtitle || DEFAULT_HERO_CONFIG.featuredSectionSubtitle,
              autoSlideInterval: data.autoSlideInterval || DEFAULT_HERO_CONFIG.autoSlideInterval,
              tickerText: typeof data.tickerText === 'string' ? data.tickerText : DEFAULT_HERO_CONFIG.tickerText,
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            setHeroConfig(freshConfig);
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem(HERO_CONFIG_CACHE_KEY, JSON.stringify(freshConfig));
              }
            } catch (e) {
              console.warn('Failed to persist heroConfig cache:', e);
            }
          } else {
            setHeroConfig(DEFAULT_HERO_CONFIG);
          }
        },
        (error) => {
          console.warn('Hero config subscription notice:', error);
        }
      );

      return () => unsubscribeHero();
    } catch (e) {
      console.warn('Could not attach hero config listener:', e);
    }
  }, []);

  const gadgetProducts = products.filter((p) => !p.isWinter);
  const winterProducts = products.filter((p) => p.isWinter);

  /**
   * Synchronous cache lookup for instant rendering if already loaded in memory
   */
  const getProductBySlug = (slug: string): Product | undefined => {
    if (!slug) return undefined;
    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

    // 1. Exact slug match
    const exactMatch = products.find((p) => p.slug?.toLowerCase() === cleanSlug);
    if (exactMatch) return exactMatch;

    // 2. Exact stable product ID match
    const idMatch = products.find((p) => p.id?.toLowerCase() === cleanSlug);
    if (idMatch) return idMatch;

    // 3. Registered aliases match
    const aliasMatch = products.find((p) =>
      p.aliases?.some((a) => a.toLowerCase() === cleanSlug)
    );
    if (aliasMatch) return aliasMatch;

    // 4. Normalized slug base match
    const normalizedMatch = products.find(
      (p) => generateSlugBase(p.name) === cleanSlug
    );
    if (normalizedMatch) return normalizedMatch;

    // 5. Partial prefix match tolerance for slug suffixes
    const prefixMatch = products.find((p) => {
      const pSlug = p.slug?.toLowerCase() || '';
      return pSlug.startsWith(cleanSlug) || cleanSlug.startsWith(pSlug);
    });
    if (prefixMatch) return prefixMatch;

    return undefined;
  };

  /**
   * Authoritative asynchronous lookup: checks memory cache first, then executes direct Firestore query fallback.
   * Guarantees newly created Firestore products resolve directly on fresh tabs or direct links.
   */
  const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
    // Check in-memory first
    const cached = getProductBySlug(slug);
    if (cached) return cached;

    // Query Firestore directly via centralized lookup service
    const resolved = await lookupProduct(slug, products);
    if (resolved) {
      // Warm up local cache so subsequent sync looks succeed instantly
      setProducts((prev) => {
        if (prev.some((p) => p.id === resolved.id)) return prev;
        return [...prev, resolved];
      });
      return resolved;
    }

    return null;
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  const refreshProducts = async () => {
    // onSnapshot handles real-time updates automatically
  };

  const refreshHeroConfig = async () => {
    const config = await getHeroConfig();
    setHeroConfig(config);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        gadgetProducts,
        winterProducts,
        getProductBySlug,
        fetchProductBySlug,
        getProductById,
        loading,
        refreshProducts,
        heroConfig,
        refreshHeroConfig,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
