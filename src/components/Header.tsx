import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Phone, Menu, X, ArrowRight, MessageCircle, User } from 'lucide-react';
import { BRAND_CONFIG, Product } from '../data/products';
import { useRouter } from '../router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { DESIGNATED_ADMIN_UID } from '../lib/admin';

/**
 * Authentic CORELUX Crown SVG
 * Matches the reference emblem with 5 prongs and horizontal base bar.
 */
const CoreluxCrown: React.FC<{ className?: string }> = ({ className = 'w-9 h-7' }) => (
  <svg
    viewBox="0 0 48 38"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* 5-pointed crown body */}
    <path d="M7 26.5 L3 9 L15 17.5 L24 4 L33 17.5 L45 9 L41 26.5 Z" />
    {/* Base bar */}
    <rect x="5.5" y="30" width="37" height="4" rx="1" />
  </svg>
);

export const Header: React.FC = () => {
  const { path, navigate, searchQuery, setSearchQuery } = useRouter();
  const { totalQuantity, openCart } = useCart();
  const { user, customerProfile } = useAuth();
  const { products } = useProducts();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Check if current user is admin
  const isOwnerAdmin = user?.uid === DESIGNATED_ADMIN_UID;

  // Auto-focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  // Handle escape key and click outside to close search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const searchResults: Product[] = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectProduct = (slug: string) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(`/products/${slug}`);
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Gadget & Tech', href: '/#gadget-tech' },
    { label: 'Winter Collection', href: '/#winter-collection' },
    { label: 'Contact', href: '/#contact-details' },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    navigate(href);
  };

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/signin');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#06251B] shadow-md border-b border-[#041B13]">
      {/* Main Navigation Bar — Matching Reference Layout Exactly */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          
          {/* Left Column: Hamburger Menu Icon */}
          <div className="flex items-center justify-start flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="text-white hover:text-[#C5A059] transition-colors p-1.5 -ml-1.5 focus:outline-none flex items-center justify-center"
            >
              <Menu className="w-6 h-6 stroke-[1.85]" />
            </button>
          </div>

          {/* Center Column: Perfectly Centered CORELUX Gold Crown + Typography */}
          <div className="flex items-center justify-center shrink-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none text-left"
              aria-label="CORELUX Home"
            >
              {/* Gold Crown Emblem */}
              <CoreluxCrown className="w-8 h-6 sm:w-9 sm:h-7 text-[#C5A059] shrink-0 transition-transform group-hover:scale-105" />

              {/* Wordmark & Subtitle */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-white font-serif tracking-[0.22em] sm:tracking-[0.25em] text-base sm:text-lg font-bold uppercase leading-none select-none">
                  CORELUX
                </span>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1 w-full">
                  <span className="w-3 sm:w-5 h-[1px] bg-[#C5A059]/80" />
                  <span className="text-[#C5A059] text-[8px] sm:text-[9px] tracking-[0.26em] sm:tracking-[0.3em] font-semibold uppercase leading-none select-none">
                    BANGLADESH
                  </span>
                  <span className="w-3 sm:w-5 h-[1px] bg-[#C5A059]/80" />
                </div>
              </div>
            </button>
          </div>

          {/* Right Column: Three Clean White Icons (Search, Account, Cart) */}
          <div className="flex items-center justify-end flex-1 gap-3.5 sm:gap-5">
            {/* 1. Search Icon Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'Close Search' : 'Open Search'}
              className="text-white hover:text-[#C5A059] transition-colors p-1 focus:outline-none flex items-center justify-center"
            >
              {isSearchOpen ? (
                <X className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.85]" />
              ) : (
                <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.85]" />
              )}
            </button>

            {/* 2. Account Icon */}
            <button
              onClick={handleAccountClick}
              aria-label={user ? 'My Account' : 'Sign In'}
              className="text-white hover:text-[#C5A059] transition-colors p-1 focus:outline-none flex items-center justify-center relative"
              title={user ? (customerProfile?.displayName || user.email || 'My Account') : 'Sign In'}
            >
              <User className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.85]" />
              {user && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#22C55E] rounded-full ring-2 ring-[#06251B]" />
              )}
            </button>

            {/* 3. Shopping Bag Icon with Circular Red Badge */}
            <button
              onClick={openCart}
              aria-label="View Shopping Cart"
              className="text-white hover:text-[#C5A059] transition-colors p-1 focus:outline-none flex items-center justify-center relative"
            >
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[1.85]" />
              {/* Circular Red Badge Matching Reference Image Exactly */}
              <span className="absolute -top-1.5 -right-2 bg-[#E11D48] text-white text-[10px] font-bold w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full flex items-center justify-center leading-none shadow-sm pointer-events-none">
                {totalQuantity}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Expandable Search Overlay Panel */}
      {isSearchOpen && (
        <div
          ref={searchDropdownRef}
          className="bg-[#041A13] border-t border-[#093526] px-4 py-3 sm:py-4 shadow-xl animate-fadeIn"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#C5A059] absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products (projector, microphone, smartwatch, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#06251B] border border-[#0D4431] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear Search Input"
                  className="absolute right-3 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Product Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-2 bg-[#06251B] border border-[#0D4431] rounded-lg shadow-2xl max-h-80 overflow-y-auto divide-y divide-[#093526]">
                <div className="px-3.5 py-2 text-[11px] font-semibold tracking-wider text-[#C5A059] uppercase">
                  Products ({searchResults.length})
                </div>

                {searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-stone-400 text-center">
                    No products found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <a
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          handleSelectProduct(product.slug);
                        }
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#0A3325] transition-colors text-inherit no-underline"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded bg-stone-900 border border-[#0D4431] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {product.name}
                        </p>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          {product.originalPriceDisplay && (
                            <span className="text-[10px] text-stone-400 line-through">
                              {product.originalPriceDisplay}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#C5A059]">
                            {product.priceDisplay}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-out Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-[280px] sm:w-[320px] max-w-[85vw] bg-[#06251B] text-white h-full shadow-2xl flex flex-col border-r border-[#0D382A] z-10">
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-[#0D382A]">
              <div className="flex items-center gap-2.5">
                <CoreluxCrown className="w-7 h-5 text-[#C5A059]" />
                <div className="flex flex-col">
                  <span className="text-white font-serif tracking-[0.2em] text-sm font-bold uppercase leading-none">
                    CORELUX
                  </span>
                  <span className="text-[#C5A059] text-[7.5px] tracking-[0.25em] font-semibold uppercase mt-0.5">
                    BANGLADESH
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation Drawer"
                className="text-stone-300 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Account / Admin Section */}
            <div className="p-4 border-b border-[#0D382A]">
              {user ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/account');
                    }}
                    className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-[#0A3325] hover:bg-[#0E4230] rounded-lg flex items-center justify-between border border-[#0F4B37] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-4 h-4 text-[#22C55E] shrink-0" />
                      <span className="truncate">
                        {customerProfile?.displayName || user.email}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </button>

                  {isOwnerAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#E6DFC2] bg-[#082218] hover:bg-[#0A2E20] border border-[#C5A059]/40 rounded-lg flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                        <span>Admin Control Panel</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signin');
                    }}
                    className="py-2 px-3 text-xs font-semibold text-white bg-[#0A3325] hover:bg-[#0E4230] border border-[#0F4B37] rounded-lg text-center transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="py-2 px-3 text-xs font-semibold text-[#06251B] bg-[#C5A059] hover:bg-[#D4AF37] rounded-lg text-center font-bold transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold px-3 mb-2">
                Navigation
              </p>
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg flex items-center justify-between transition-colors ${
                    path === link.href
                      ? 'text-white bg-[#0A3325] font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-[#0A3325]/50'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                </a>
              ))}
            </div>

            {/* Direct Contact Footer */}
            <div className="p-4 border-t border-[#0D382A] space-y-2 bg-[#041A13]">
              <a
                href={BRAND_CONFIG.phoneTel}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-200 bg-[#06251B] hover:bg-[#0A3325] rounded-lg border border-[#0D382A] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Call: {BRAND_CONFIG.phone}</span>
              </a>
              <a
                href={BRAND_CONFIG.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#25D366] bg-[#06251B] hover:bg-[#0A3325] rounded-lg border border-[#0D382A] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp: {BRAND_CONFIG.whatsapp}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

