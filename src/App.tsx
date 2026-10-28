/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './router';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { GadgetTechSection } from './components/GadgetTechSection';
import { WinterSection } from './components/WinterSection';
import { ProductDetailPage } from './components/ProductDetailPage';
import { AdminPanel } from './components/AdminPanel';
import {
  SignInView,
  SignUpView,
  ForgotPasswordView,
  AccountView,
} from './components/AuthPages';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { BRAND_CONFIG } from './data/products';
import { MessageCircle } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const StorefrontContent: React.FC = () => {
  const { path } = useRouter();
  const { openCheckout } = useCart();

  // If path is /checkout, automatically open checkout modal
  React.useEffect(() => {
    if (path === '/checkout') {
      openCheckout();
    }
  }, [path]);

  // Dedicated Admin Route
  if (path === '/admin') {
    return <AdminPanel />;
  }

  // Check if current route is a product detail page: /products/:slug or /product/:slug
  const isProductsPluralRoute = path.startsWith('/products/');
  const isProductSingularRoute = path.startsWith('/product/');
  const isProductRoute = isProductsPluralRoute || isProductSingularRoute;

  const rawSlug = isProductsPluralRoute
    ? path.replace('/products/', '')
    : isProductSingularRoute
    ? path.replace('/product/', '')
    : '';

  const productSlug = isProductRoute && rawSlug
    ? rawSlug.split('/')[0].split('?')[0].split('#')[0]
    : null;

  // Render view depending on path
  const renderMainContent = () => {
    if (path === '/signin' || path === '/login') {
      return <SignInView />;
    }
    if (path === '/signup' || path === '/register') {
      return <SignUpView />;
    }
    if (path === '/forgot-password') {
      return <ForgotPasswordView />;
    }
    if (path === '/account') {
      return <AccountView />;
    }
    if (isProductRoute && productSlug) {
      return <ProductDetailPage slug={productSlug} />;
    }
    return (
      <>
        <Hero />
        <GadgetTechSection />
        <WinterSection />
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C2024]">
      {/* Header with Navigation, Search & Customer Account */}
      <Header />

      {/* Main Dynamic View */}
      <main className="flex-1">{renderMainContent()}</main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
      <CheckoutModal />

      {/* Footer with verified contact & social links */}
      <Footer />

      {/* Floating Direct WhatsApp CTA for Bangladesh shoppers */}
      <a
        href={BRAND_CONFIG.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order or Chat on WhatsApp"
        className="fixed bottom-5 left-5 z-30 bg-[#25D366] hover:bg-[#1EBE5D] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group active:scale-95"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-semibold pl-0 group-hover:pl-2">
          Chat / Order
        </span>
      </a>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <StorefrontContent />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
