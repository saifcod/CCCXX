import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Phone, Menu, X, ArrowRight, MessageCircle, User } from 'lucide-react';
import { BRAND_CONFIG, PRODUCTS, Product } from '../data/products';
import { useRouter } from '../router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { DESIGNATED_ADMIN_UID } from '../lib/admin';

export const Header: React.FC = () => {
  const { path, navigate, searchQuery, setSearchQuery } = useRouter();
  const { totalQuantity, openCart } = useCart();
  const { user, customerProfile } = useAuth();
  const { products } = useProducts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Check if current user is admin
  const isOwnerAdmin = user?.uid === DESIGNATED_ADMIN_UID;

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults: Product[] = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectProduct = (slug: string) => {
    setSearchQuery('');
    setSearchFocused(false);
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

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE5DB]">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand Identity */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] rounded"
          >
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-md overflow-hidden bg-white p-1 border border-[#EBE5DB] shadow-xs flex items-center justify-center">
              <img
                src={BRAND_CONFIG.logo}
                alt="CORELUX Logo"
                width={56}
                height={56}
                fetchPriority="high"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#1C2024] font-display">
                CORELUX
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#8C6D2D] uppercase font-semibold">
                Bangladesh
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = path === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                    isActive
                      ? 'text-[#143D2B] font-semibold'
                      : 'text-[#4A5056] hover:text-[#1C2024]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C5A059]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Search & Cart Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input (Desktop & Tablet) */}
            <div ref={searchContainerRef} className="relative hidden sm:block w-48 md:w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full bg-white/90 border border-[#E0D9CD] rounded-md pl-9 pr-3 py-2 text-xs text-[#1C2024] placeholder-[#8F969E] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
                <Search className="w-4 h-4 text-[#8F969E] absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-[#8F969E] hover:text-[#1C2024]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search Dropdown */}
              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md border border-[#E0D9CD] shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-[#8F969E] uppercase">
                    Products ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[#707780]">
                      No matching products found.
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
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FAF8F5] flex items-center gap-3 transition-colors border-b border-[#F4EFE6] last:border-none no-underline text-inherit block"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded bg-[#F7F4EE] border border-[#EBE5DB]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1C2024] font-sans truncate">
                            {product.name}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            {product.originalPriceDisplay && (
                              <span className="text-[10px] text-stone-400 line-through">
                                {product.originalPriceDisplay}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#143D2B]">
                              {product.priceDisplay}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Customer & Admin Authentication Options (Desktop) */}
            {isOwnerAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#143D2B] text-[#E6DFC2] border border-[#C5A059]/40 text-xs font-semibold hover:bg-[#0E2E20] transition-all min-h-[40px] shadow-xs"
                title="Admin Control Center"
              >
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                <span>Admin</span>
              </button>
            )}

            {user ? (
              <button
                onClick={() => navigate('/account')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E0D9CD] bg-white text-xs font-semibold text-[#1C2024] hover:border-[#143D2B] hover:bg-[#FAF8F5] transition-all min-h-[40px] shadow-xs"
                title={user.email || 'Customer Account'}
              >
                <User className="w-3.5 h-3.5 text-[#143D2B]" />
                <span className="max-w-[110px] truncate">
                  {customerProfile?.displayName || user.displayName || 'Account'}
                </span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => navigate('/signin')}
                  className="px-2.5 py-2 text-xs font-semibold text-[#1C2024] hover:text-[#143D2B] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-3 py-2 rounded-md bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Mobile User Icon */}
            <button
              onClick={() => navigate(user ? '/account' : '/signin')}
              aria-label="Customer Account"
              className="sm:hidden p-2.5 rounded-md border border-[#E0D9CD] bg-white text-[#1C2024] hover:border-[#C5A059] transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <User className={`w-5 h-5 ${user ? 'text-[#16A34A]' : 'text-[#1C2024]'}`} />
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              aria-label="View Shopping Cart"
              className="relative p-2.5 rounded-md border border-[#E0D9CD] bg-white text-[#1C2024] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <ShoppingBag className="w-5 h-5 text-[#143D2B]" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C5A059] text-white font-bold text-[11px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="lg:hidden p-2.5 rounded-md border border-[#E0D9CD] bg-white text-[#1C2024] hover:bg-[#FAF8F5] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E0D9CD] rounded-md pl-9 pr-3 py-2 text-xs text-[#1C2024] placeholder-[#8F969E] focus:outline-none focus:border-[#C5A059]"
            />
            <Search className="w-4 h-4 text-[#8F969E] absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-[#8F969E]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim().length > 0 && (
            <div className="mt-2 bg-white rounded-md border border-[#E0D9CD] shadow-md max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-xs text-[#707780]">No products found.</div>
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
                    className="w-full text-left p-2.5 flex items-center gap-3 border-b border-[#F4EFE6] last:border-none no-underline text-inherit block"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded bg-[#F7F4EE]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1C2024] font-sans truncate">
                        {product.name}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        {product.originalPriceDisplay && (
                          <span className="text-[10px] text-stone-400 line-through">
                            {product.originalPriceDisplay}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#143D2B]">
                          {product.priceDisplay}
                        </span>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF8F5] border-b border-[#EBE5DB] px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Customer Authentication Section */}
          <div className="pb-3 border-b border-[#E8E2D5]">
            {user ? (
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/account');
                  }}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-[#143D2B] bg-[#EAF5EF] rounded-md flex items-center justify-between border border-[#C6E4D1]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span className="truncate">
                      My Account ({customerProfile?.displayName || user.email})
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#143D2B]" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signin');
                  }}
                  className="min-h-[40px] px-3 py-2 text-xs font-semibold text-[#1C2024] bg-white border border-[#D5CDC0] rounded-md text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  className="min-h-[40px] px-3 py-2 text-xs font-semibold text-white bg-[#143D2B] hover:bg-[#0E2E20] rounded-md text-center shadow-xs"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2.5 text-sm font-medium text-[#1C2024] hover:bg-white rounded-md flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8E2D5] space-y-2">
            <a
              href={BRAND_CONFIG.phoneTel}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1C2024] bg-white rounded-md border border-[#E0D9CD]"
            >
              <Phone className="w-4 h-4 text-[#C5A059]" />
              <span>Direct Call: {BRAND_CONFIG.phone}</span>
            </a>
            <a
              href={BRAND_CONFIG.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#143D2B] bg-[#EAF5EF] rounded-md border border-[#C6E4D1]"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp: {BRAND_CONFIG.whatsapp}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
