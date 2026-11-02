import React, { useState, useEffect } from 'react';
import { Product, PRODUCTS, BRAND_CONFIG } from '../data/products';
import { useRouter } from '../router';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Truck,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Phone,
  RefreshCw,
  Info,
  Copy,
  AlertCircle,
  X,
  Maximize2,
  ZoomIn,
} from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { addItem, openCheckout } = useCart();
  const { getProductBySlug, fetchProductBySlug, products, loading: contextLoading } = useProducts();

  const [resolvedProduct, setResolvedProduct] = useState<Product | null>(() => {
    return getProductBySlug(slug) || null;
  });
  const [isResolving, setIsResolving] = useState<boolean>(!resolvedProduct);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Authoritative product resolution effect
  useEffect(() => {
    let isCancelled = false;

    // Check memory cache first
    const cached = getProductBySlug(slug);
    if (cached) {
      setResolvedProduct(cached);
      setIsResolving(false);
      setResolveError(null);
      return;
    }

    // Direct asynchronous lookup fallback
    setIsResolving(true);
    setResolveError(null);

    fetchProductBySlug(slug)
      .then((found) => {
        if (isCancelled) return;
        setResolvedProduct(found);
        setIsResolving(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Error fetching product by slug:', err);
        setResolveError('Unable to load product information right now. Please check your network connection.');
        setIsResolving(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [slug, products, getProductBySlug, fetchProductBySlug]);

  const product = resolvedProduct;

  // SEO & OpenGraph Social Sharing Metadata Effect
  useEffect(() => {
    if (product) {
      const canonicalUrl = `${window.location.origin}/products/${product.slug}`;
      const pageTitle = `${product.name} | CORELUX Bangladesh`;
      document.title = pageTitle;

      // Update Canonical Link
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);

      // Helper to update/create meta tag
      const setMetaTag = (attrName: string, attrVal: string, content: string) => {
        let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attrName, attrVal);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      const metaDescription = `${product.name} - ${product.tagline}. Price: ${product.priceDisplay}. Cash on delivery available across all 64 districts in Bangladesh. ${product.description.substring(0, 130)}...`;

      setMetaTag('name', 'description', metaDescription);
      setMetaTag('property', 'og:title', pageTitle);
      setMetaTag('property', 'og:description', metaDescription);
      setMetaTag('property', 'og:type', 'product');
      setMetaTag('property', 'og:url', canonicalUrl);

      const fullImageUrl = product.image.startsWith('http')
        ? product.image
        : `${window.location.origin}${product.image}`;
      setMetaTag('property', 'og:image', fullImageUrl);

      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:title', pageTitle);
      setMetaTag('name', 'twitter:description', metaDescription);
      setMetaTag('name', 'twitter:image', fullImageUrl);

      // Schema.org JSON-LD Structured Data for Google Rich Product Results
      const schemaScriptId = 'product-json-ld';
      let schemaScript = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = schemaScriptId;
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: [fullImageUrl],
        description: product.description,
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: 'CORELUX',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'BDT',
          price: product.price,
          availability:
            product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'CORELUX Bangladesh',
          },
        },
      });

      // Synchronize address bar to canonical /products/:slug if accessed via alias or /product/
      if (typeof window !== 'undefined' && window.location.pathname !== `/products/${product.slug}`) {
        window.history.replaceState(null, '', `/products/${product.slug}`);
      }

      return () => {
        document.title = 'CORELUX | Premium Storefront Bangladesh';
        const s = document.getElementById(schemaScriptId);
        if (s) s.remove();
      };
    } else {
      document.title = 'Product Not Found | CORELUX Bangladesh';
    }
  }, [product, slug]);

  // Options state
  const [selectedSize, setSelectedSize] = useState<'L' | 'XL' | ''>(
    product?.requiresSize ? 'L' : ''
  );

  const [selectedColor, setSelectedColor] = useState<string>(
    product?.requiresColor && product?.availableColors
      ? product.availableColors[0].name
      : ''
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Gallery image & modal states (Star Tech style)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // Compute all available unique images for this product (Main + up to 3 additional)
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.image && typeof product.image === 'string' && product.image.trim()) {
      list.push(product.image.trim());
    }
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list.length > 0 ? list.slice(0, 4) : ['/assets/aistudio/hodie_and_dropshoulder_combo_48679659.jpg'];
  }, [product]);

  // Reset options and gallery when slug changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.requiresSize ? 'L' : '');
      if (product.requiresColor && product.availableColors) {
        setSelectedColor(product.availableColors[0].name);
      } else {
        setSelectedColor('');
      }
      setQuantity(1);
      setCopiedLink(false);
      setAddedNotice(false);
      setValidationError(null);
      setSelectedImageIndex(0);
      setModalImageIndex(0);
      setIsGalleryModalOpen(false);
      window.scrollTo(0, 0);
    }
  }, [slug, product]);

  const handleOpenModal = (index: number) => {
    setModalImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const handlePrevModalImage = () => {
    if (galleryImages.length <= 1) return;
    setModalImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextModalImage = () => {
    if (galleryImages.length <= 1) return;
    setModalImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  // Keyboard navigation for image modal (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isGalleryModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGalleryModalOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setModalImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === 'ArrowRight') {
        setModalImageIndex((prev) => (prev + 1) % galleryImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryModalOpen, galleryImages.length]);

  // 1. Loading State: Display premium animated skeleton while initializing or fetching from Firestore
  if (isResolving || (contextLoading && !product)) {
    return (
      <div className="min-h-[75vh] bg-[#FAF8F5] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-3.5 w-16 bg-[#E8E2D5] rounded animate-pulse" />
            <span className="text-[#C5CDC0]">/</span>
            <div className="h-3.5 w-24 bg-[#E8E2D5] rounded animate-pulse" />
            <span className="text-[#C5CDC0]">/</span>
            <div className="h-3.5 w-32 bg-[#E8E2D5] rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Image Skeleton */}
            <div className="lg:col-span-7 space-y-4">
              <div className="aspect-square w-full rounded-2xl bg-white border border-[#E0D9CD] shadow-xs flex items-center justify-center relative overflow-hidden animate-pulse">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8C6D2D]">
                  <RefreshCw className="w-7 h-7 animate-spin text-[#143D2B]/50" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-[#E8E2D5] animate-pulse" />
                <div className="w-20 h-20 rounded-lg bg-[#E8E2D5] animate-pulse" />
                <div className="w-20 h-20 rounded-lg bg-[#E8E2D5] animate-pulse" />
              </div>
            </div>

            {/* Right Column: Content Skeleton */}
            <div className="lg:col-span-5 space-y-4">
              <div className="h-5 w-28 bg-[#E8E2D5] rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-4/5 bg-[#E8E2D5] rounded animate-pulse" />
                <div className="h-4 w-3/5 bg-[#E8E2D5] rounded animate-pulse" />
              </div>
              <div className="h-10 w-44 bg-[#E8E2D5] rounded animate-pulse" />
              <div className="h-20 w-full bg-white rounded-xl border border-[#E8E2D5] animate-pulse" />
              <div className="space-y-3 pt-4">
                <div className="h-12 w-full bg-[#143D2B]/20 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-[#E8E2D5] rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State: Network or server request failure (Provides retry button)
  if (resolveError && !product) {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center space-y-5 bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-[#1C2024]">Connection Error</h2>
            <p className="text-xs text-[#6A717B]">{resolveError}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsResolving(true);
                setResolveError(null);
                fetchProductBySlug(slug)
                  .then((p) => {
                    setResolvedProduct(p);
                    setIsResolving(false);
                  })
                  .catch((e) => {
                    setResolveError('Still unable to connect. Please check your internet connection.');
                    setIsResolving(false);
                  });
              }}
              className="px-5 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 border border-[#D5CDC0] text-[#5D646D] hover:bg-[#FAF8F5] text-xs font-semibold rounded-md"
            >
              Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fallback state: Only triggered after all lookups definitively complete with no match
  if (!product) {
    const suggestedProducts = products.length > 0 ? products.slice(0, 4) : PRODUCTS.slice(0, 4);

    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-stone-100 border border-[#E8E2D5] flex items-center justify-center mx-auto text-[#8C6D2D]">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1C2024]">
              Product Not Found
            </h1>
            <p className="text-xs sm:text-sm text-[#6A717B] max-w-md mx-auto">
              We couldn't locate any product at <code className="bg-stone-100 px-2 py-0.5 rounded text-[#143D2B] font-mono text-xs">/products/{slug}</code>. The link may be mistyped or the item moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Return to Storefront
            </button>
            <button
              onClick={() => navigate('/#gadget-tech')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md transition-colors"
            >
              Browse Gadgets & Tech
            </button>
            <button
              onClick={() => navigate('/#winter-collection')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md transition-colors"
            >
              Browse Winter Collection
            </button>
          </div>

          {/* Suggested Items */}
          <div className="pt-12 border-t border-[#E8E2D5] text-left">
            <h3 className="text-base font-semibold text-[#1C2024] font-display mb-4">
              Explore Available CORELUX Products:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {suggestedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable =
    product.inStock !== false && !product.stockStatus.toLowerCase().includes('out of stock');

  const validateOptions = (): boolean => {
    if (!isAvailable) {
      setValidationError('This product is currently out of stock.');
      return false;
    }

    if (product.requiresSize) {
      if (!selectedSize || (selectedSize !== 'L' && selectedSize !== 'XL')) {
        setValidationError('Please select a valid size (L or XL) before proceeding.');
        return false;
      }
    }

    if (product.requiresColor) {
      const validColors = ['Off White', 'Navy Blue', 'Jet Black', 'Coffee'];
      if (!selectedColor || !validColors.includes(selectedColor)) {
        setValidationError('Please select an available colorway before proceeding.');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleShare = async () => {
    const canonicalUrl = `${window.location.origin}/products/${product.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | CORELUX`,
          text: `${product.name} - ${product.priceDisplay}`,
          url: canonicalUrl,
        });
        return;
      } catch {
        // User dismissed share dialog or permission denied, fall through to clipboard
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleAddToCart = () => {
    if (!validateOptions()) return;

    addItem(
      product,
      quantity,
      product.requiresSize ? (selectedSize as 'L' | 'XL') : undefined,
      product.requiresColor ? selectedColor : undefined
    );
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleOrderNow = () => {
    if (!validateOptions()) return;

    addItem(
      product,
      quantity,
      product.requiresSize ? (selectedSize as 'L' | 'XL') : undefined,
      product.requiresColor ? selectedColor : undefined
    );
    openCheckout();
  };

  // Construct direct WhatsApp message
  const whatsappOrderText = encodeURIComponent(
    `Hello CORELUX Bangladesh,\nI would like to order:\n\n• Product: ${product.name}\n• Price: ${product.priceDisplay}\n• Quantity: ${quantity}${
      product.requiresSize ? `\n• Size: ${selectedSize}` : ''
    }${
      product.requiresColor ? `\n• Color: ${selectedColor}` : ''
    }\n\nPlease advise Cash on Delivery details.`
  );

  const whatsappDirectUrl = `https://wa.me/8801967233934?text=${whatsappOrderText}`;

  // Other products for related recommendations
  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="w-full max-w-full overflow-hidden bg-[#FAF8F5] min-h-screen py-6 sm:py-10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation & Share Button */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-[#7A828B]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#1C2024] transition-colors"
            >
              Home
            </button>
            <span>/</span>
            {product.isWinter ? (
              <button
                onClick={() => navigate('/#winter-collection')}
                className="hover:text-[#1C2024] transition-colors"
              >
                Winter Collection
              </button>
            ) : (
              <button
                onClick={() => navigate('/#gadget-tech')}
                className="hover:text-[#1C2024] transition-colors"
              >
                Gadget & Tech
              </button>
            )}
            <span>/</span>
            <span className="text-[#1C2024] font-medium truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E0D9CC] bg-white text-xs font-medium text-[#1C2024] hover:bg-[#FAF8F5] transition-all min-h-[36px]"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#143D2B]" />
                <span className="text-[#143D2B] font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#8C6D2D]" />
                <span>Share Product</span>
              </>
            )}
          </button>
        </div>

        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#143D2B] hover:text-[#0E2E20] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Products</span>
          </button>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="bg-white rounded-xl border border-[#E8E2D5] p-4 sm:p-8 lg:p-10 shadow-xs mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Product Image & Gallery */}
            <div className="lg:col-span-6 flex flex-col">
              {/* Main Image Container */}
              <div
                onClick={() => handleOpenModal(selectedImageIndex)}
                className="group relative aspect-square w-full rounded-lg bg-[#FAF8F5] border border-[#F0EBE1] p-6 sm:p-10 flex items-center justify-center overflow-hidden cursor-zoom-in transition-all"
                title="Click to open full-screen gallery"
              >
                <img
                  src={galleryImages[selectedImageIndex] || product.image}
                  alt={`${product.name} - Photo ${selectedImageIndex + 1}`}
                  fetchPriority="high"
                  decoding="async"
                  width={500}
                  height={500}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                  }}
                />

                {product.isMasterCopy && (
                  <div className="absolute top-4 left-4 bg-[#1C2024] text-white text-xs font-medium tracking-wider px-2.5 py-1 rounded uppercase z-10 shadow-2xs">
                    Master Copy Edition
                  </div>
                )}

                {product.isWinter && (
                  <div className="absolute top-4 right-4 bg-[#143D2B] text-white text-xs font-medium tracking-wider px-2.5 py-1 rounded uppercase z-10 shadow-2xs">
                    Winter Essential
                  </div>
                )}

                {/* Star Tech-style Zoom Prompt Overlay */}
                <div className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#1C2024] border border-[#E0D9CD] shadow-xs rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-medium transition-all opacity-85 group-hover:opacity-100 group-hover:shadow-sm">
                  <Maximize2 className="w-3.5 h-3.5 text-[#143D2B]" />
                  <span>Click to Zoom</span>
                </div>
              </div>

              {/* Thumbnails Underneath (Only if multiple images exist) */}
              {galleryImages.length > 1 && (
                <div className="mt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1 select-none">
                  {galleryImages.map((imgUrl, idx) => {
                    const isSelected = idx === selectedImageIndex;
                    return (
                      <button
                        key={`product-thumb-${idx}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        onDoubleClick={() => handleOpenModal(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg p-1.5 bg-[#FAF8F5] border transition-all shrink-0 flex items-center justify-center overflow-hidden cursor-pointer ${
                          isSelected
                            ? 'border-[#143D2B] ring-2 ring-[#143D2B]/25 shadow-xs bg-white scale-[1.02]'
                            : 'border-[#E0D9CD] hover:border-[#143D2B]/50 bg-white opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-image caption with Open Gallery action */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#8F969E] px-1">
                <span>Actual product photograph by CORELUX</span>
                <button
                  type="button"
                  onClick={() => handleOpenModal(selectedImageIndex)}
                  className="text-[#143D2B] font-semibold hover:underline flex items-center gap-1 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>
                    {galleryImages.length > 1
                      ? `View Gallery (${galleryImages.length} Images)`
                      : 'View Large Image'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Product Details, Options, & Actions */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {/* Styled Stock Status Badge */}
                <div className="mb-3">
                  {product.inStock !== false && !product.stockStatus.toLowerCase().includes('out of stock') ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF7EE] text-[#14532D] border border-[#BDE8C9] shadow-[0_0_12px_rgba(34,197,94,0.22)] transition-shadow">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A] shrink-0" />
                      <span>In Stock</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] shadow-[0_0_12px_rgba(239,68,68,0.18)] transition-shadow">
                      <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                      <span>Out of Stock</span>
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1C2024] font-sans mb-3 leading-snug tracking-tight">
                  {product.name}
                </h1>

                {/* Price Display with Discount */}
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-5 pb-4 border-b border-[#F0EBE1]">
                  {product.originalPriceDisplay && (
                    <span className="text-base sm:text-lg text-stone-400 line-through font-normal">
                      {product.originalPriceDisplay}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-[#143D2B] tracking-tight">
                    {product.priceDisplay}
                  </span>
                  {product.discountDisplay && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EAF7EE] text-[#14532D] border border-[#BDE8C9]">
                      {product.discountDisplay}
                    </span>
                  )}
                </div>

                {/* Clear Master Copy Transparency Notice */}
                {product.isMasterCopy && (
                  <div className="mb-6 p-4 rounded-lg bg-[#F9F7F2] border border-[#E4DCCE] flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#8C6D2D] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#4A5057] space-y-1">
                      <p className="font-semibold text-[#1C2024]">
                        Master Copy Transparency Guarantee
                      </p>
                      <p>
                        This product is clearly identified as a premium 1:1 master copy edition with matte black exterior and quality stereo acoustics. It is <strong className="text-[#1C2024]">NOT</strong> an original Apple Inc. manufactured device.
                      </p>
                    </div>
                  </div>
                )}

                {/* Short Tagline / Summary */}
                <p className="text-xs sm:text-sm text-[#4E555D] leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* WINTER REQUIREMENT 1: Size Selector for Hoodies */}
                {product.requiresSize && (
                  <div className="mb-6 p-4 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-semibold text-[#1C2024] uppercase tracking-wide">
                        Select Size: <span className="text-[#143D2B]">{selectedSize}</span>
                      </label>
                      <span className="text-[11px] text-[#8C6D2D]">Standard Bangladesh Fit</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {product.availableSizes?.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[60px] min-h-[44px] px-4 py-2 text-xs font-bold rounded-md border transition-all ${
                            selectedSize === size
                              ? 'border-[#143D2B] bg-[#143D2B] text-white shadow-xs'
                              : 'border-[#D5CDC0] bg-white text-[#1C2024] hover:border-[#143D2B]'
                          }`}
                        >
                          Size {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* WINTER REQUIREMENT 2: Color Selector for Pullover Hoodie */}
                {product.requiresColor && product.availableColors && (
                  <div className="mb-6 p-4 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-semibold text-[#1C2024] uppercase tracking-wide">
                        Select Colorway: <span className="text-[#143D2B]">{selectedColor}</span>
                      </label>
                      <span className="text-[11px] text-[#7A828B]">4 Colorways Available</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {product.availableColors.map((color) => {
                        const isSelected = selectedColor === color.name;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(color.name)}
                            className={`min-h-[44px] px-3 py-2 rounded-md border flex items-center gap-2 text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-[#143D2B] bg-white text-[#143D2B] ring-1 ring-[#143D2B] font-semibold'
                                : 'border-[#D5CDC0] bg-white text-[#4A5057] hover:border-[#8C6D2D]'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="truncate">{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#1C2024] uppercase tracking-wide">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-[#D5CDC0] rounded-md bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-[#1C2024] hover:bg-[#FAF8F5] text-sm font-semibold transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-xs font-bold text-[#1C2024]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#1C2024] hover:bg-[#FAF8F5] text-sm font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Primary CTA Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={handleOrderNow}
                      className={`min-h-[48px] px-6 py-3 text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-all ${
                        isAvailable
                          ? 'bg-[#143D2B] hover:bg-[#0E2E20] text-white active:scale-[0.99]'
                          : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <span>{isAvailable ? 'Order Now (Cash on Delivery)' : 'Out of Stock'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={handleAddToCart}
                      className={`min-h-[48px] px-5 py-3 border text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
                        isAvailable
                          ? 'bg-white hover:bg-[#FAF8F5] text-[#1C2024] border-[#D5CDC0] active:scale-[0.99]'
                          : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className={`w-4 h-4 ${isAvailable ? 'text-[#143D2B]' : 'text-stone-400'}`} />
                      <span>{isAvailable ? (addedNotice ? 'Added to Bag!' : 'Add to Bag') : 'Unavailable'}</span>
                    </button>
                  </div>

                  {/* WhatsApp Direct Option */}
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] px-4 py-2.5 bg-[#1F2C24] hover:bg-[#142019] text-[#FAF8F5] text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Order via WhatsApp (Instant Support)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Specs and Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Key Features Checklist */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-[#E8E2D5] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#1C2024] font-display mb-4">
              Key Features & Performance
            </h3>
            <ul className="space-y-3">
              {product.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#4E555D]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF5EF] text-[#143D2B] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Specifications Table */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-[#E8E2D5] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#1C2024] font-display mb-4">
              Detailed Specifications
            </h3>
            <div className="divide-y divide-[#F0EBE1]">
              {product.specs.map((spec, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between text-xs sm:text-sm gap-4">
                  <span className="font-medium text-[#707780] w-1/3 shrink-0">
                    {spec.label}
                  </span>
                  <span className="font-semibold text-[#1C2024] text-right w-2/3">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0EBE1] flex items-center gap-2 text-xs text-[#8C6D2D]">
              <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>Inspection allowed at doorstep before payment.</span>
            </div>
          </div>
        </div>

        {/* More Products / Related Section (2 columns on mobile strictly) */}
        <div className="border-t border-[#E8E2D5] pt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-[#1C2024] font-display">
              More from CORELUX
            </h3>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-[#143D2B] hover:underline"
            >
              View All Items
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Quick Order / Add to Bag Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E5DFD4] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5 safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] text-[#7A828B] font-medium uppercase tracking-wider">
              {isAvailable ? 'Cash on Delivery' : 'Status'}
            </div>
            <div className="text-base font-bold text-[#143D2B] truncate leading-tight">
              {product.priceDisplay}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleAddToCart}
              aria-label="Add to Bag"
              className={`min-h-[42px] px-3.5 py-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isAvailable
                  ? 'bg-white hover:bg-[#FAF8F5] text-[#1C2024] border-[#D5CDC0] active:scale-95'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#143D2B]" />
              <span className="hidden xs:inline">{addedNotice ? 'Added' : 'Bag'}</span>
            </button>

            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleOrderNow}
              className={`min-h-[42px] px-4 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                isAvailable
                  ? 'bg-[#143D2B] hover:bg-[#0E2E20] text-white active:scale-95'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <span>{isAvailable ? 'Order Now (COD)' : 'Out of Stock'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          STAR TECH INSPIRED IMAGE GALLERY MODAL / LIGHTBOX
      ======================================================= */}
      {isGalleryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Title, Counter & Close Button */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2.5 truncate pr-3">
                <span className="font-bold text-sm sm:text-base text-[#1C2024] truncate">
                  {product.name}
                </span>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E0D9CD] text-[11px] sm:text-xs font-semibold text-[#143D2B]">
                  {modalImageIndex + 1} of {galleryImages.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                aria-label="Close image modal"
                className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Main Image Display on Clean Pure White Background */}
            <div className="relative flex-1 bg-white min-h-[300px] sm:min-h-[460px] max-h-[62vh] flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
              <img
                src={galleryImages[modalImageIndex] || galleryImages[0] || product.image}
                alt={`${product.name} - View ${modalImageIndex + 1}`}
                className="max-h-[56vh] max-w-full object-contain drop-shadow-xs transition-opacity duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                }}
              />

              {/* Previous Navigation Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevModalImage();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-[#1C2024] border border-stone-200 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Next Navigation Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextModalImage();
                  }}
                  aria-label="Next image"
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-[#1C2024] border border-stone-200 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip (Star Tech Style) */}
            {galleryImages.length > 1 && (
              <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = idx === modalImageIndex;
                  return (
                    <button
                      key={`modal-thumb-${idx}`}
                      type="button"
                      onClick={() => setModalImageIndex(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg p-1 bg-white border transition-all shrink-0 flex items-center justify-center overflow-hidden cursor-pointer ${
                        isActive
                          ? 'border-2 border-[#143D2B] ring-2 ring-[#143D2B]/20 shadow-xs scale-105'
                          : 'border-stone-200 opacity-60 hover:opacity-100 hover:border-stone-400'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Modal Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
