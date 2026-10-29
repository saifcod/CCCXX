import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router';
import { SavedOrder } from '../lib/firebase';
import {
  checkIsAdmin,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getFirestoreProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  seedInitialProductsToFirestore,
  DESIGNATED_ADMIN_UID,
  ADMIN_WHITELIST_EMAILS,
  ORDER_STATUS_LIST,
  OrderStatus,
  StoreBanner,
  getStoreBanner,
  saveStoreBanner,
  HeroSlide,
  HeroConfig,
  getHeroConfig,
  saveHeroConfig,
  DEFAULT_HERO_CONFIG,
} from '../lib/admin';
import { Product, PRODUCTS, BRAND_CONFIG, generateProductSlug } from '../data/products';
import { generateUniqueProductSlug } from '../lib/productService';
import { useProducts } from '../context/ProductContext';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Phone,
  MessageCircle,
  LogOut,
  ExternalLink,
  ChevronDown,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  X,
  Layers,
  Sparkles,
  KeyRound,
  Mail,
  Megaphone,
  Upload,
  Percent,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Sliders,
  Radio,
} from 'lucide-react';

/**
 * Human-readable error translator for Firebase Auth exceptions on Admin login
 */
export interface AdminAuthError {
  title: string;
  message: string;
  isCredentialError?: boolean;
}

export function getAdminAuthErrorMessage(err: any): AdminAuthError {
  const code = err?.code || '';
  const rawMsg = err?.message || '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    rawMsg.includes('auth/invalid-credential')
  ) {
    return {
      title: 'Invalid Email or Password',
      message:
        'The email or password does not match any record in this Firebase project. If you registered via Google or forgot your password, you can sign in directly with Google or click "Forgot Password" to receive a reset link.',
      isCredentialError: true,
    };
  }

  if (code === 'auth/invalid-email' || rawMsg.includes('auth/invalid-email')) {
    return {
      title: 'Invalid Email Format',
      message: 'Please check that the administrator email is typed correctly without unexpected spaces.',
    };
  }

  if (code === 'auth/user-disabled' || rawMsg.includes('auth/user-disabled')) {
    return {
      title: 'Account Disabled',
      message: 'This administrator account has been disabled in the Firebase Console.',
    };
  }

  if (code === 'auth/too-many-requests' || rawMsg.includes('auth/too-many-requests')) {
    return {
      title: 'Too Many Attempts',
      message:
        'Access temporarily blocked due to multiple failed sign-in attempts. Please wait a few moments or click "Forgot Password" to reset.',
      isCredentialError: true,
    };
  }

  if (code === 'auth/network-request-failed' || rawMsg.includes('auth/network-request-failed')) {
    return {
      title: 'Network Connection Error',
      message: 'Unable to reach Firebase authentication servers. Please verify your internet connection and retry.',
    };
  }

  if (code === 'auth/operation-not-allowed' || rawMsg.includes('auth/operation-not-allowed')) {
    return {
      title: 'Sign-in Method Disabled',
      message:
        'Email/Password sign-in is disabled in Firebase Authentication. Enable Email/Password in your Firebase Console (Authentication > Sign-in method), or use Google Sign-In below.',
    };
  }

  if (code === 'auth/unauthorized-domain' || rawMsg.includes('auth/unauthorized-domain')) {
    return {
      title: 'Domain Not Authorized',
      message: 'This domain (coreluxbd.netlify.app) must be added to Authorized Domains in Firebase Console (Authentication > Settings).',
    };
  }
 
  if (code === 'auth/popup-blocked' || rawMsg.includes('auth/popup-blocked')) {
    return {
      title: 'Popup Blocked',
      message: 'The sign-in popup was blocked by your browser. Please allow popups or try again.',
    };
  }

  if (code === 'auth/popup-closed-by-user' || rawMsg.includes('auth/popup-closed-by-user')) {
    return {
      title: 'Google Sign-in Cancelled',
      message: 'The Google Sign-in popup was closed before completing authentication.',
    };
  }

  return {
    title: 'Authentication Error',
    message: rawMsg || 'An error occurred during administrator authentication. Please try again.',
  };
}

export type AdminTab = 'overview' | 'orders' | 'products' | 'banner';

export const AdminPanel: React.FC = () => {
  const { user, signInWithEmail, signInWithGoogle, sendPasswordReset, logout } = useAuth();
  const { navigate } = useRouter();
  const { products, refreshProducts, heroConfig, refreshHeroConfig } = useProducts();

  // Admin Auth Verification State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Admin Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<AdminAuthError | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  // Password Reset Modal / Card State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Orders State
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<SavedOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderActionMessage, setOrderActionMessage] = useState<string | null>(null);

  // Products State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [additionalImages, setAdditionalImages] = useState<string[]>(['', '', '']);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Store Banner State (Stored in Firestore settings/banner)
  const [bannerForm, setBannerForm] = useState<Partial<StoreBanner>>({
    title: 'Special Flash Sale: Cash on Delivery Nationwide in Bangladesh!',
    subtitle: 'Authentic Lifestyle & Gadget Products Delivered in 2–3 Days',
    badgeText: 'FLASH SALE',
    buttonText: 'Order Now',
    buttonLink: '/#catalog',
    isActive: true,
  });
  const [savingBanner, setSavingBanner] = useState(false);

  // Hero Slider State (Stored in Firestore settings/heroConfig)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_CONFIG.slides);
  const [tickerText, setTickerText] = useState<string>(
    heroConfig?.tickerText || DEFAULT_HERO_CONFIG.tickerText || ''
  );
  const [savingTicker, setSavingTicker] = useState<boolean>(false);

  useEffect(() => {
    if (typeof heroConfig?.tickerText === 'string') {
      setTickerText(heroConfig.tickerText);
    }
  }, [heroConfig?.tickerText]);

  // Hero Slide Modal State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState<Partial<HeroSlide>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    badge: '',
    linkUrl: '',
    isActive: true,
  });

  // In-app Delete Confirmation Modal State (replaces browser window.confirm which is blocked in iframes)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'product' | 'order' | 'slide';
    id: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const executeConfirmedDelete = async () => {
    if (!deleteConfirmation) return;
    setIsDeletingItem(true);
    const { type, id, title } = deleteConfirmation;

    try {
      if (type === 'product') {
        await deleteProductFromFirestore(id);
        await refreshProducts();
        setFeedbackNotice(`Product "${title}" deleted successfully.`);
        setTimeout(() => setFeedbackNotice(null), 3500);
      } else if (type === 'order') {
        await deleteOrder(id);
        setOrders((prev) => prev.filter((o) => o.id !== id));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(null);
        }
        setOrderActionMessage(`Order #${title} deleted successfully.`);
        setTimeout(() => setOrderActionMessage(null), 3500);
      } else if (type === 'slide') {
        const updatedSlides = heroSlides.filter((s) => s.id !== id);
        setHeroSlides(updatedSlides);
        await saveHeroConfig({
          slides: updatedSlides,
        });
        await refreshHeroConfig();
        setFeedbackNotice(`Hero slide removed successfully.`);
        setTimeout(() => setFeedbackNotice(null), 3500);
      }
      setDeleteConfirmation(null);
    } catch (err: any) {
      console.error('Delete action failed:', err);
      const errMsg = err?.message || 'Delete operation failed';
      setFeedbackNotice(`Delete failed: ${errMsg}`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Check admin authorization when user changes
  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      setCheckingAuth(true);
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setCheckingAuth(false);
        }
        return;
      }

      try {
        const authorized = await checkIsAdmin(user);
        if (isMounted) {
          setIsAdmin(authorized);
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error('Admin verification error:', err);
        if (isMounted) {
          const email = (user.email || '').toLowerCase().trim();
          const match = user.uid === DESIGNATED_ADMIN_UID || ADMIN_WHITELIST_EMAILS.some((e) => e.toLowerCase() === email);
          setIsAdmin(match);
          setCheckingAuth(false);
        }
      }
    };

    verifyAdmin();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load real data when authorized
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadBanner = async () => {
    try {
      const data = await getStoreBanner();
      if (data) {
        setBannerForm(data);
      }
    } catch (err) {
      console.warn('Failed to load banner:', err);
    }
  };

  const loadHeroConfig = async () => {
    try {
      const cfg = await getHeroConfig();
      if (cfg) {
        setHeroSlides(cfg.slides || []);
        if (typeof cfg.tickerText === 'string') {
          setTickerText(cfg.tickerText);
        }
      }
    } catch (err) {
      console.warn('Failed to load hero config:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
      loadBanner();
      loadHeroConfig();
    }
  }, [isAdmin]);

  // Handle Admin Email/Password Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const sanitizedEmail = loginEmail.trim();
      if (!sanitizedEmail) {
        setLoginError({
          title: 'Email Required',
          message: 'Please enter your administrator email address.',
        });
        setIsLoggingIn(false);
        return;
      }
      if (!loginPassword) {
        setLoginError({
          title: 'Password Required',
          message: 'Please enter your administrator password.',
        });
        setIsLoggingIn(false);
        return;
      }
      await signInWithEmail(sanitizedEmail, loginPassword);
      // Auth state listener in useEffect handles admin verification
    } catch (err: any) {
      console.error('Admin sign-in failed:', err);
      setLoginError(getAdminAuthErrorMessage(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Google Sign-In
  const handleAdminGoogleLogin = async () => {
    setLoginError(null);
    setIsGoogleLoggingIn(true);
    try {
      await signInWithGoogle();
      // Auth state listener in useEffect handles admin verification
    } catch (err: any) {
      console.error('Admin Google sign-in failed:', err);
      setLoginError(getAdminAuthErrorMessage(err));
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  // Handle Admin Password Reset Email Dispatch
  const handleAdminPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (resetEmail || loginEmail).trim();
    if (!targetEmail) {
      setResetErrorMessage('Please provide your administrator email address.');
      return;
    }
    setResetSending(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);
    try {
      await sendPasswordReset(targetEmail);
      setResetSuccessMessage(
        `A password reset email has been sent to ${targetEmail}. Please check your inbox (and spam/junk folder) and click the link to set your new password.`
      );
    } catch (err: any) {
      console.error('Admin password reset failed:', err);
      const parsed = getAdminAuthErrorMessage(err);
      setResetErrorMessage(parsed.message);
    } finally {
      setResetSending(false);
    }
  };

  // Status Update Handler
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local state immediately
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setOrderActionMessage(`Order ${orderId} updated to "${newStatus}"`);
      setTimeout(() => setOrderActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update order status. Please check your connection.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Prompt Delete Order Confirmation
  const promptDeleteOrder = (order: { id: string; orderNumber?: string; customerName?: string; total?: number }) => {
    setDeleteConfirmation({
      type: 'order',
      id: order.id,
      title: order.orderNumber || order.id,
      subtitle: `${order.customerName || 'Customer'} • ৳${order.total?.toLocaleString() || 0}`,
    });
  };

  // Seed baseline products into Firestore
  const handleSeedCatalog = async () => {
    setSeedingLoading(true);
    try {
      const result = await seedInitialProductsToFirestore();
      await refreshProducts();
      setFeedbackNotice(`Successfully synced catalog! ${result.added} items freshly populated.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err) {
      console.error('Failed to seed catalog:', err);
      alert('Failed to sync catalog.');
    } finally {
      setSeedingLoading(false);
    }
  };

  // Open Product Modal for Add / Edit
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ ...product });
      // Extract up to 3 additional gallery images
      const rawImages = Array.isArray(product.images) ? product.images : [];
      const primary = product.image || rawImages[0] || '';
      const extras = rawImages.filter((img) => img && img !== primary);
      setAdditionalImages([extras[0] || '', extras[1] || '', extras[2] || '']);
    } else {
      setEditingProduct(null);
      setProductForm({
        id: `prod-${Date.now()}`,
        slug: '',
        name: '',
        price: 990,
        priceDisplay: '৳990',
        originalPrice: 1190,
        originalPriceDisplay: '৳1,190',
        discountAmount: 200,
        discountDisplay: '৳200 OFF',
        image: '/assets/aistudio/mic_92c80436.webp',
        category: 'Gadget & Tech',
        isWinter: false,
        inStock: true,
        stockStatus: 'In Stock (Ready to Dispatch)',
        tagline: 'Premium quality gadget in Bangladesh',
        description: 'Engineered for reliability, long performance and everyday use.',
        features: ['Premium construction', 'Nationwide Cash on Delivery'],
        specs: [{ label: 'Warranty', value: '7 Days Replacement' }],
        deliveryInfo: 'Cash on delivery available nationwide in Bangladesh. Delivery in 2–3 business days.',
      });
      setAdditionalImages(['', '', '']);
    }
    setIsProductModalOpen(true);
  };

  // Save Product to Firestore
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name?.trim() || productForm.price === undefined || productForm.price === null || isNaN(Number(productForm.price))) {
      alert('Please fill out Product Name and a valid numeric Price.');
      return;
    }
    setSavingProduct(true);
    try {
      const numericPrice = Number(productForm.price);
      const formattedPriceDisplay = `৳${numericPrice.toLocaleString()}`;
      
      const hasOriginalPrice = 
        productForm.originalPrice !== undefined && 
        productForm.originalPrice !== null && 
        productForm.originalPrice !== 0 && 
        !isNaN(Number(productForm.originalPrice)) &&
        Number(productForm.originalPrice) > numericPrice;

      const numericOriginalPrice = hasOriginalPrice ? Number(productForm.originalPrice) : undefined;
      const originalPriceDisplay = hasOriginalPrice ? `৳${numericOriginalPrice!.toLocaleString()}` : undefined;
      const discountAmount = hasOriginalPrice ? numericOriginalPrice! - numericPrice : undefined;
      const discountPercentage = (hasOriginalPrice && numericOriginalPrice! > 0)
        ? Math.round(((numericOriginalPrice! - numericPrice) / numericOriginalPrice!) * 100)
        : undefined;
      const discountDisplay = hasOriginalPrice
        ? `${discountPercentage}% OFF (৳${discountAmount!.toLocaleString()})`
        : undefined;

      const cleanSlug = productForm.slug?.trim()
        ? generateUniqueProductSlug(productForm.slug, products, editingProduct?.id)
        : generateUniqueProductSlug(productForm.name, products, editingProduct?.id);

      // Preserve previous slugs as aliases so existing links never break
      const existingAliases = editingProduct?.aliases || [];
      const updatedAliases = [...existingAliases];
      if (editingProduct && editingProduct.slug && editingProduct.slug !== cleanSlug && !updatedAliases.includes(editingProduct.slug)) {
        updatedAliases.push(editingProduct.slug);
      }

      // Default color options if requiresColor is enabled
      const defaultColors = [
        { name: 'Off White', hex: '#EDE8DF', bgClass: 'bg-[#EDE8DF]' },
        { name: 'Navy Blue', hex: '#1C2942', bgClass: 'bg-[#1C2942]' },
        { name: 'Jet Black', hex: '#171717', bgClass: 'bg-[#171717]' },
        { name: 'Coffee', hex: '#634735', bgClass: 'bg-[#634735]' },
      ];

      const primaryImage = productForm.image?.trim() || '/assets/aistudio/mic_92c80436.webp';
      const cleanExtras = additionalImages
        .map((img) => img?.trim() || '')
        .filter((img) => img.length > 0 && img !== primaryImage)
        .slice(0, 3);
      const allProductImages = [primaryImage, ...cleanExtras];

      const completeProduct: Product = {
        ...editingProduct, // Preserve all existing fields (including availableColors, etc.)
        id: productForm.id || `prod-${Date.now()}`,
        slug: cleanSlug,
        aliases: updatedAliases,
        name: productForm.name.trim(),
        price: numericPrice,
        priceDisplay: formattedPriceDisplay,
        originalPrice: numericOriginalPrice,
        originalPriceDisplay,
        discountAmount,
        discountPercentage,
        discountDisplay,
        image: primaryImage,
        images: allProductImages,
        category: productForm.category || 'Gadget & Tech',
        isWinter: Boolean(productForm.isWinter),
        inStock: productForm.inStock !== false,
        stockStatus: productForm.stockStatus || (productForm.inStock === false ? 'Out of Stock' : 'In Stock (Ready to Dispatch)'),
        tagline: productForm.tagline?.trim() || '',
        description: productForm.description?.trim() || '',
        features: (productForm.features && productForm.features.length > 0) ? productForm.features : ['Premium quality product in Bangladesh', 'Nationwide Cash on Delivery'],
        specs: productForm.specs || [],
        requiresSize: Boolean(productForm.requiresSize),
        availableSizes: productForm.requiresSize ? (productForm.availableSizes || ['L', 'XL']) : undefined,
        requiresColor: Boolean(productForm.requiresColor),
        availableColors: productForm.requiresColor ? (productForm.availableColors || defaultColors) : undefined,
        deliveryInfo:
          productForm.deliveryInfo?.trim() ||
          'Cash on delivery available nationwide in Bangladesh. Delivery in 2–3 business days.',
      };

      await saveProductToFirestore(completeProduct);
      await refreshProducts();
      setIsProductModalOpen(false);
      setFeedbackNotice(`Product "${completeProduct.name}" saved successfully!`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      const errMsg = err?.message || 'Could not save product to Firestore.';
      alert(`Could not save product: ${errMsg}`);
    } finally {
      setSavingProduct(false);
    }
  };

  // Photo Upload Handler for Product Modal (Primary Photo)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProductForm((prev) => ({ ...prev, image: dataUrl }));
      setFeedbackNotice('Photo added & preview ready!');
      setTimeout(() => setFeedbackNotice(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Handler for uploading one of the 3 additional gallery images
  const handleAdditionalImageUpload = (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAdditionalImages((prev) => {
        const next = [...prev];
        next[slotIndex] = dataUrl;
        return next;
      });
      setFeedbackNotice(`Gallery photo ${slotIndex + 1} added!`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Toggle Stock availability directly
  const handleToggleStock = async (product: Product) => {
    const updatedStock = !product.inStock;
    const updatedStatus = updatedStock ? 'In Stock (Ready to Dispatch)' : 'Out of Stock';
    try {
      await saveProductToFirestore({
        ...product,
        inStock: updatedStock,
        stockStatus: updatedStatus,
      });
      await refreshProducts();
      setFeedbackNotice(`"${product.name}" stock updated to ${updatedStock ? 'In Stock' : 'Out of Stock'}`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  // Prompt Delete Product Confirmation
  const promptDeleteProduct = (product: Product) => {
    setDeleteConfirmation({
      type: 'product',
      id: product.id,
      title: product.name,
      subtitle: product.priceDisplay || `৳${product.price?.toLocaleString() || ''}`,
    });
  };

  // Store Banner Action Handler
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title?.trim()) {
      alert('Please enter a banner title.');
      return;
    }
    setSavingBanner(true);
    try {
      const bannerData: StoreBanner = {
        id: 'banner',
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle?.trim() || '',
        badgeText: bannerForm.badgeText?.trim() || 'PROMO',
        buttonText: bannerForm.buttonText?.trim() || 'Order Now',
        buttonLink: bannerForm.buttonLink?.trim() || '/#catalog',
        imageUrl: bannerForm.imageUrl?.trim() || '',
        isActive: bannerForm.isActive !== false,
        updatedAt: new Date().toISOString(),
      };
      await saveStoreBanner(bannerData);
      setFeedbackNotice('Store banner saved successfully!');
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err: any) {
      alert('Could not save banner: ' + (err?.message || 'Error'));
    } finally {
      setSavingBanner(false);
    }
  };

  // Moving TV Announcement Ticker Action Handler
  const handleSaveTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText.trim()) {
      alert('Please enter an announcement ticker message.');
      return;
    }
    setSavingTicker(true);
    try {
      await saveHeroConfig({
        tickerText: tickerText.trim(),
      });
      await refreshHeroConfig();
      setFeedbackNotice('TV announcement ticker message saved to database!');
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err: any) {
      alert('Could not save announcement ticker: ' + (err?.message || 'Error'));
    } finally {
      setSavingTicker(false);
    }
  };

  // ============================================================================
  // HERO SLIDER & 2 FEATURED PRODUCTS HANDLERS
  // ============================================================================
  const openSlideModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideForm({ ...slide });
    } else {
      if (heroSlides.length >= 3) {
        alert('Maximum 3 banner slides allowed. Please edit or delete an existing slide.');
        return;
      }
      setEditingSlide(null);
      setSlideForm({
        id: `slide-${Date.now()}`,
        imageUrl: '',
        title: '',
        subtitle: '',
        badge: '',
        linkUrl: '',
        isActive: true,
        sortOrder: heroSlides.length + 1,
      });
    }
    setIsSlideModalOpen(true);
  };

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Slide image must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setSlideForm((prev) => ({ ...prev, imageUrl: compressed }));
        }
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.imageUrl?.trim()) {
      alert('Please upload an image or provide an Image URL for this slide.');
      return;
    }

    let updatedList: HeroSlide[];
    if (editingSlide) {
      updatedList = heroSlides.map((s) =>
        s.id === editingSlide.id ? ({ ...s, ...slideForm } as HeroSlide) : s
      );
    } else {
      if (heroSlides.length >= 3) {
        alert('Maximum 3 banner slides allowed.');
        return;
      }
      const newSlide: HeroSlide = {
        id: slideForm.id || `slide-${Date.now()}`,
        imageUrl: slideForm.imageUrl.trim(),
        title: slideForm.title?.trim() || undefined,
        subtitle: slideForm.subtitle?.trim() || undefined,
        badge: slideForm.badge?.trim() || undefined,
        linkUrl: slideForm.linkUrl?.trim() || undefined,
        isActive: slideForm.isActive !== false,
        sortOrder: heroSlides.length + 1,
      };
      updatedList = [...heroSlides, newSlide].slice(0, 3);
    }

    setHeroSlides(updatedList);
    setIsSlideModalOpen(false);

    try {
      await saveHeroConfig({
        slides: updatedList,
      });
      await refreshHeroConfig();
      setFeedbackNotice('Hero banner slide updated & saved to Firestore!');
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err: any) {
      console.error('Failed to auto-save slide to Firestore:', err);
    }
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;

    const list = [...heroSlides];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reordered = list.map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
    setHeroSlides(reordered);

    try {
      await saveHeroConfig({
        slides: reordered,
      });
      await refreshHeroConfig();
      setFeedbackNotice('Slide order updated.');
      setTimeout(() => setFeedbackNotice(null), 2500);
    } catch (e) {
      console.warn('Failed to save reordered slides:', e);
    }
  };

  const handleToggleSlideActive = async (slideId: string) => {
    const updated = heroSlides.map((s) => (s.id === slideId ? { ...s, isActive: !s.isActive } : s));
    setHeroSlides(updated);

    try {
      await saveHeroConfig({
        slides: updated,
      });
      await refreshHeroConfig();
    } catch (e) {
      console.warn('Failed to toggle slide:', e);
    }
  };

  const promptDeleteSlide = (slide: HeroSlide) => {
    setDeleteConfirmation({
      type: 'slide',
      id: slide.id,
      title: slide.title || 'Hero Banner Slide',
      subtitle: slide.imageUrl,
    });
  };

  // Filtered Orders Calculation
  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    // Payment filter
    if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;
    // Search query
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchNumber = o.orderNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.toLowerCase().includes(q);
      const matchAddress = o.deliveryAddress?.toLowerCase().includes(q);
      return matchNumber || matchName || matchPhone || matchAddress;
    }
    return true;
  });

  // KPI Calculations for Dashboard
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending Confirmation' || o.status === 'Pending').length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'Confirmed').length;
  const processingOrdersCount = orders.filter((o) => o.status === 'Processing').length;
  const shippedOrdersCount = orders.filter((o) => o.status === 'Shipped').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'Cancelled').length;

  // Render Loading Screen while verifying auth
  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#143D2B] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#1C2024]">Verifying Administrative Clearance...</p>
        <p className="text-xs text-[#707780] mt-1">Checking secure database credentials</p>
      </div>
    );
  }

  // 1. If not logged in, render Admin Sign-In Portal
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#FAF8F5]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#E8E2D5] p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#143D2B]/10 text-[#143D2B] mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C2024] font-display">
              CORELUX Admin Portal
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Authorized administrative sign-in for store operations
            </p>
          </div>

          {/* Error Banner with helpful troubleshooting */}
          {loginError && !showResetModal && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">{loginError.title}</div>
                  <div className="text-red-700 mt-0.5 leading-relaxed">{loginError.message}</div>
                </div>
              </div>

              {loginError.isCredentialError && (
                <div className="pt-2 border-t border-red-200/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail.trim());
                      setShowResetModal(true);
                      setResetSuccessMessage(null);
                      setResetErrorMessage(null);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-red-100 text-red-800 border border-red-300 rounded font-medium text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <KeyRound className="w-3 h-3 text-red-600" />
                    <span>Reset Password</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleLoggingIn}
                    onClick={handleAdminGoogleLogin}
                    className="px-2.5 py-1 bg-white hover:bg-stone-50 text-[#1C2024] border border-[#D5CDC0] rounded font-medium text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>Sign In with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INLINE PASSWORD RESET VIEW */}
          {showResetModal ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#EAF5EF] border border-[#C6E4D1] rounded-lg text-xs text-[#143D2B]">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-4 h-4 text-[#16A34A]" />
                  <span>Reset Administrator Password</span>
                </div>
                <p className="text-[11px] text-[#2E5E43] leading-relaxed">
                  Enter your administrator email. Firebase Authentication will email you a secure link to reset your password.
                </p>
              </div>

              {resetSuccessMessage ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Password Reset Link Dispatched!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{resetSuccessMessage}</p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(false);
                        setResetSuccessMessage(null);
                      }}
                      className="w-full py-2 bg-[#143D2B] text-white font-semibold rounded text-xs transition-colors"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAdminPasswordReset} className="space-y-4">
                  {resetErrorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{resetErrorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={resetEmail || loginEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@corelux.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-xs text-[#1C2024] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                      />
                      <Mail className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={resetSending}
                      className={`flex-1 py-2.5 px-4 bg-[#143D2B] hover:bg-[#0E2E20] text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 ${
                        resetSending ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {resetSending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#1C2024] border border-[#D5CDC0] font-semibold text-xs rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* STANDARD EMAIL / PASSWORD & GOOGLE SIGN IN */
            <>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@corelux.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-xs text-[#1C2024] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                    />
                    <Mail className="w-4 h-4 text-[#8C6D2D] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#1C2024]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginEmail.trim());
                        setShowResetModal(true);
                        setResetSuccessMessage(null);
                        setResetErrorMessage(null);
                      }}
                      className="text-xs text-[#143D2B] hover:text-[#0E2E20] font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-xs text-[#1C2024] focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#707780] hover:text-[#1C2024]"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || isGoogleLoggingIn}
                  className={`w-full py-2.5 px-4 bg-[#143D2B] hover:bg-[#0E2E20] text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 ${
                    isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                      <span>Enter Admin Portal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#E8E2D5] w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#8F969E] absolute">
                  or sign in with
                </span>
              </div>

              {/* Google Sign-in for Admin */}
              <button
                type="button"
                disabled={isLoggingIn || isGoogleLoggingIn}
                onClick={handleAdminGoogleLogin}
                className={`w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-medium rounded-md flex items-center justify-center gap-2.5 transition-colors shadow-xs active:scale-[0.99] ${
                  isGoogleLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isGoogleLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#143D2B]" />
                    <span>Connecting Google Account...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google (Owner Account)</span>
                  </>
                )}
              </button>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <button
              onClick={() => navigate('/')}
              className="text-[#6B7280] hover:text-[#1C2024] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>
            <span className="text-[10px] text-[#9CA3AF] font-mono">
              Owner UID: {DESIGNATED_ADMIN_UID.substring(0, 12)}...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. If logged in but NOT authorized as Admin, render Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-[#FAF8F5]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-red-200 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1C2024] mb-2 font-display">
            Access Restricted
          </h2>
          <p className="text-xs text-[#5D646D] mb-4">
            Your current authenticated account does not possess owner administrator clearance.
          </p>

          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-md p-3 text-left text-xs mb-6 space-y-1">
            <p className="text-[#707780]">
              <span className="font-semibold text-[#1C2024]">Current Account:</span> {user.email || 'Anonymous'}
            </p>
            <p className="text-[#707780] break-all">
              <span className="font-semibold text-[#1C2024]">Your UID:</span> {user.uid}
            </p>
            <p className="text-[#707780] break-all">
              <span className="font-semibold text-[#1C2024]">Required Owner UID:</span> {DESIGNATED_ADMIN_UID}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                await logout();
              }}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Switch</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#1C2024] border border-[#D5CDC0] font-semibold text-xs rounded-md transition-colors"
            >
              Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#F4EFE6]/60 pb-16">
      {/* Top Admin Bar */}
      <header className="bg-[#143D2B] text-white border-b border-[#0E2E20] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#C5A059] flex items-center justify-center text-[#143D2B] font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-wide font-display text-white">
                    CORELUX Admin Portal
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-[#22C55E]/20 text-[#86EFAC] px-2 py-0.5 rounded-full border border-[#22C55E]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                    Live Connected
                  </span>
                </div>
                <p className="text-[11px] text-[#A3B899] truncate max-w-xs sm:max-w-md">
                  Admin: {user.email || 'Owner'} | UID: {user.uid}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 rounded-md bg-[#1F4D38] hover:bg-[#286047] text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#3A7558]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline">View Store</span>
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="px-3 py-1.5 rounded-md bg-red-900/60 hover:bg-red-800 text-red-100 text-xs font-medium flex items-center gap-1.5 transition-colors border border-red-700/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[#1C523B] overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-white text-[#143D2B] shadow-xs'
                  : 'text-[#C5DAC9] hover:text-white hover:bg-[#1C523B]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shrink-0 relative ${
                activeTab === 'orders'
                  ? 'bg-white text-[#143D2B] shadow-xs'
                  : 'text-[#C5DAC9] hover:text-white hover:bg-[#1C523B]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-[#C5A059] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'products'
                  ? 'bg-white text-[#143D2B] shadow-xs'
                  : 'text-[#C5DAC9] hover:text-white hover:bg-[#1C523B]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('banner')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'banner'
                  ? 'bg-white text-[#143D2B] shadow-xs'
                  : 'text-[#C5DAC9] hover:text-white hover:bg-[#1C523B]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Hero Slider & Banners</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Notifications */}
      {orderActionMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#143D2B] text-white px-4 py-2.5 rounded-lg shadow-xl border border-[#C5A059] text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#C5A059]" />
          <span>{orderActionMessage}</span>
        </div>
      )}

      {feedbackNotice && (
        <div className="fixed top-20 right-4 z-50 bg-[#1C2024] text-white px-4 py-2.5 rounded-lg shadow-xl border border-[#4ADE80] text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4ADE80]" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* =======================================================
            TAB 1: DASHBOARD OVERVIEW
        ======================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E8E2D5] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#707780] mb-1 font-medium">
                  <span>Gross Sales</span>
                  <DollarSign className="w-4 h-4 text-[#16A34A]" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#1C2024]">
                  ৳{totalRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#707780] mt-1">
                  Excluding cancelled orders
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E8E2D5] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#707780] mb-1 font-medium">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-[#143D2B]" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#1C2024]">
                  {orders.length}
                </div>
                <div className="text-[11px] text-[#707780] mt-1">
                  {pendingOrdersCount} pending confirmation
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E8E2D5] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#707780] mb-1 font-medium">
                  <span>Products in Store</span>
                  <Package className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#1C2024]">
                  {products.length}
                </div>
                <div className="text-[11px] text-[#707780] mt-1">
                  {products.filter((p) => p.inStock !== false).length} in stock
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E8E2D5] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#707780] mb-1 font-medium">
                  <span>Delivered Orders</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {deliveredOrdersCount}
                </div>
                <div className="text-[11px] text-[#707780] mt-1">
                  Completed deliveries
                </div>
              </div>
            </div>

            {/* Status Breakdown Bar */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-[#1C2024] mb-3">Order Status Pipeline</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-amber-800 font-bold text-lg">{pendingOrdersCount}</div>
                  <div className="text-amber-900 text-[11px] font-semibold mt-0.5">Pending Conf.</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-800 font-bold text-lg">{confirmedOrdersCount}</div>
                  <div className="text-blue-900 text-[11px] font-semibold mt-0.5">Confirmed</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-purple-800 font-bold text-lg">{processingOrdersCount}</div>
                  <div className="text-purple-900 text-[11px] font-semibold mt-0.5">Processing</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="text-indigo-800 font-bold text-lg">{shippedOrdersCount}</div>
                  <div className="text-indigo-900 text-[11px] font-semibold mt-0.5">Shipped</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-800 font-bold text-lg">{deliveredOrdersCount}</div>
                  <div className="text-green-900 text-[11px] font-semibold mt-0.5">Delivered</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 font-bold text-lg">{cancelledOrdersCount}</div>
                  <div className="text-red-900 text-[11px] font-semibold mt-0.5">Cancelled</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Seed Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs">
                <h3 className="text-sm font-bold text-[#1C2024] mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#143D2B]" />
                  <span>Firestore Catalog Synchronization</span>
                </h3>
                <p className="text-xs text-[#5D646D] mb-4">
                  Sync the initial 5 store baseline items (Mic, Massage Gun, AirPods Master Copy, Paisley Combo, Pullover Hoodie) directly into your Firestore `products` collection for custom editing and price changes.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSeedCatalog}
                    disabled={seedingLoading}
                    className="min-h-[38px] px-4 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seedingLoading ? 'animate-spin' : ''}`} />
                    <span>{seedingLoading ? 'Syncing...' : 'Sync Catalog to Firestore'}</span>
                  </button>
                  <button
                    onClick={() => openProductModal()}
                    className="min-h-[38px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#143D2B] border border-[#143D2B] text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Product</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs">
                <h3 className="text-sm font-bold text-[#1C2024] mb-2 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                  <span>Recent Customer Orders</span>
                </h3>
                <p className="text-xs text-[#5D646D] mb-3">
                  Jump straight to review and confirm recent orders placed by customers across Bangladesh.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1C2024]">
                    {orders.length} Total Orders Recorded
                  </span>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#143D2B] hover:underline"
                  >
                    View All Orders &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: ORDER MANAGEMENT
        ======================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#8F969E] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search order #, customer, phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E0D9CD] rounded-md pl-9 pr-3 py-2 text-xs text-[#1C2024] placeholder-[#8F969E] focus:outline-none focus:border-[#143D2B]"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-xs text-[#8F969E]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={loadOrders}
                    disabled={ordersLoading}
                    className="px-3 py-2 rounded-md border border-[#E0D9CD] bg-[#FAF8F5] text-xs font-semibold text-[#1C2024] hover:bg-white flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F0EBE1] text-xs">
                <span className="text-[#707780] font-medium mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Status:</span>
                </span>
                {['all', 'Pending Confirmation', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
                        statusFilter === status
                          ? 'bg-[#143D2B] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#5D646D] hover:bg-[#F0EBE1]'
                      }`}
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div className="bg-white rounded-xl border border-[#E8E2D5] p-12 text-center shadow-xs">
                <RefreshCw className="w-6 h-6 text-[#143D2B] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#5D646D]">Loading orders from Firestore...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8E2D5] p-12 text-center shadow-xs">
                <ShoppingBag className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-[#1C2024]">No Orders Found</h4>
                <p className="text-xs text-[#707780] mt-1 max-w-sm mx-auto">
                  {orderSearchQuery || statusFilter !== 'all'
                    ? 'No orders match your filter criteria. Try clearing filters.'
                    : 'No customer orders have been recorded in Firestore yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E8E2D5] text-[#5D646D] uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Order Ref</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Delivery Zone</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE1]">
                      {filteredOrders.map((order) => {
                        return (
                          <tr key={order.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#1C2024] whitespace-nowrap">
                              #{order.orderNumber || order.id}
                              <div className="text-[10px] text-[#8F969E] font-normal">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#1C2024]">{order.customerName}</div>
                              <div className="text-[10px] text-[#707780] truncate max-w-xs">
                                {order.deliveryAddress}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="font-medium text-[#143D2B] hover:underline"
                              >
                                {order.customerPhone}
                              </a>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {order.deliveryZone === 'inside_dhaka' ? (
                                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Inside Dhaka (৳70)
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  Outside Dhaka (৳130)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#143D2B] whitespace-nowrap">
                              ৳{order.total?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-[11px] font-medium uppercase text-[#5D646D]">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {/* Quick Status Dropdown */}
                              <select
                                value={order.status}
                                disabled={updatingOrderId === order.id}
                                onChange={(e) =>
                                  handleUpdateStatus(order.id, e.target.value as OrderStatus)
                                }
                                className={`text-[11px] font-semibold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                                  order.status === 'Pending Confirmation' || order.status === 'Pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : order.status === 'Confirmed'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : order.status === 'Processing'
                                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                                    : order.status === 'Shipped'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                    : order.status === 'Delivered'
                                    ? 'bg-green-50 text-green-800 border-green-300'
                                    : 'bg-red-50 text-red-800 border-red-300'
                                }`}
                              >
                                {ORDER_STATUS_LIST.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-1.5 text-[#143D2B] hover:bg-[#EAF5EF] rounded transition-colors"
                                  title="View Order Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => promptDeleteOrder(order)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB 3: PRODUCT CATALOG MANAGEMENT
        ======================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Product Actions Header */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C2024]">Store Product Catalog</h3>
                <p className="text-xs text-[#5D646D]">
                  Manage prices, original prices, discounts, stock availability, sizes & colours.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSeedCatalog}
                  disabled={seedingLoading}
                  className="px-3 py-2 bg-[#FAF8F5] border border-[#E0D9CD] hover:bg-white text-xs font-semibold text-[#1C2024] rounded-md flex items-center gap-1.5 transition-colors"
                  title="Upload the initial 5 products to Firestore if not already seeded"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${seedingLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Defaults</span>
                </button>
                <button
                  onClick={() => openProductModal()}
                  className="px-4 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#C5A059]" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const isOutOfStock = product.inStock === false;
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-[#E8E2D5] shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image and Badges */}
                      <div className="relative aspect-4/3 bg-[#FAF8F5] border-b border-[#E8E2D5]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-4"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#143D2B] text-white shadow-xs">
                            {product.category}
                          </span>
                          {product.discountDisplay && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A059] text-white shadow-xs">
                              {product.discountDisplay}
                            </span>
                          )}
                        </div>

                        {/* Stock Pill Badge */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => handleToggleStock(product)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${
                              !isOutOfStock
                                ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] shadow-[0_0_8px_rgba(34,197,94,0.25)]'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                            title="Click to toggle stock status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                !isOutOfStock ? 'bg-[#22C55E]' : 'bg-red-500'
                              }`}
                            />
                            <span>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-2">
                        <h4 className="text-sm font-bold text-[#1C2024] line-clamp-1 font-sans">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#5D646D] line-clamp-2">{product.tagline}</p>

                        {/* Pricing details */}
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-base font-bold text-[#143D2B]">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-stone-400 line-through">
                              ৳{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                          {product.discountAmount && (
                            <span className="text-[11px] font-semibold text-[#8C6D2D]">
                              (Save ৳{product.discountAmount})
                            </span>
                          )}
                        </div>

                        {/* Option details */}
                        <div className="flex flex-wrap gap-1 text-[10px] text-[#707780] pt-1">
                          {product.requiresSize && (
                            <span className="bg-[#FAF8F5] border border-[#E0D9CD] px-1.5 py-0.5 rounded">
                              Sizes: L, XL
                            </span>
                          )}
                          {product.requiresColor && (
                            <span className="bg-[#FAF8F5] border border-[#E0D9CD] px-1.5 py-0.5 rounded">
                              Colors: 4 Available
                            </span>
                          )}
                          {product.isWinter && (
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                              Winter Collection
                            </span>
                          )}
                        </div>

                        {/* Direct URL path */}
                        <div className="pt-1 text-[11px] font-mono text-[#7A828B] truncate">
                          /products/{product.slug}
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E2D5] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStock(product)}
                        className="text-xs text-[#5D646D] hover:text-[#1C2024] font-medium"
                      >
                        Toggle Stock
                      </button>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#143D2B] hover:bg-[#EAF5EF] border border-[#D5CDC0] rounded transition-colors"
                          title="View Live Product Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openProductModal(product)}
                          className="px-2.5 py-1.5 bg-white border border-[#D5CDC0] text-[#1C2024] hover:border-[#143D2B] rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3 h-3 text-[#143D2B]" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => promptDeleteProduct(product)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 4: HERO SLIDER & STORE BANNER MANAGEMENT
        ======================================================= */}
        {activeTab === 'banner' && (
          <div className="space-y-6">
            {/* 1. HERO SLIDER BANNER CAROUSEL (Max 3 Slides Enforced) */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EBE1] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#1C2024] flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#143D2B]" />
                      <span>Homepage Hero Auto-Slider</span>
                    </h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF5EF] text-[#143D2B] border border-[#143D2B]/20">
                      {heroSlides.length} / 3 Slides (Max 3)
                    </span>
                  </div>
                  <p className="text-xs text-[#707780] mt-0.5">
                    High-impact responsive hero banner carousel displayed prominently at the top of the homepage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openSlideModal()}
                    disabled={heroSlides.length >= 3}
                    className={`min-h-[38px] px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors ${
                      heroSlides.length >= 3
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-[#143D2B] hover:bg-[#0E2E20] text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Slide</span>
                  </button>
                </div>
              </div>

              {/* Slides List */}
              {heroSlides.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#D5CDC0]">
                  <ImageIcon className="w-10 h-10 text-[#8C6D2D] mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[#1C2024]">No Banner Slides Configured</p>
                  <p className="text-[11px] text-[#707780] mt-1">
                    Click "Add New Slide" to add up to 3 banner images for the homepage slider.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={slide.id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] hover:bg-white hover:border-[#C5A059] transition-all"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-24 sm:w-32 h-16 rounded-lg bg-black border border-[#D5CDC0] overflow-hidden shrink-0 relative flex items-center justify-center">
                          <img
                            src={slide.imageUrl}
                            alt={slide.title || `Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {!slide.isActive && (
                            <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                              Hidden
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#D5CDC0] text-[#707780]">
                              Slide #{index + 1}
                            </span>
                            {slide.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A059] text-white uppercase tracking-wider">
                                {slide.badge}
                              </span>
                            )}
                            {slide.isActive ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Active on Store
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                Draft / Hidden
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-[#1C2024] truncate">
                            {slide.title || 'Untitled Banner Slide'}
                          </h4>
                          {slide.subtitle && (
                            <p className="text-[11px] text-[#707780] truncate">
                              {slide.subtitle}
                            </p>
                          )}
                          {slide.linkUrl && (
                            <p className="text-[10px] font-mono text-[#143D2B] truncate">
                              Link: {slide.linkUrl}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls: Reorder, Active Toggle, Edit, Delete */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E8E2D5] w-full sm:w-auto justify-end">
                        {/* Order Buttons */}
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(index, 'up')}
                          disabled={index === 0}
                          title="Move slide up"
                          className="p-1.5 rounded border border-[#D5CDC0] bg-white text-[#5D646D] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(index, 'down')}
                          disabled={index === heroSlides.length - 1}
                          title="Move slide down"
                          className="p-1.5 rounded border border-[#D5CDC0] bg-white text-[#5D646D] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleSlideActive(slide.id)}
                          title={slide.isActive ? 'Hide slide' : 'Show slide'}
                          className={`px-2.5 py-1.5 rounded text-xs font-semibold border flex items-center gap-1 transition-colors ${
                            slide.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span className="hidden md:inline">{slide.isActive ? 'Active' : 'Hidden'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openSlideModal(slide)}
                          className="p-1.5 rounded border border-[#D5CDC0] bg-white text-[#143D2B] hover:bg-[#EAF5EF] transition-colors"
                          title="Edit / Replace Slide"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => promptDeleteSlide(slide)}
                          className="p-1.5 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. STOREFRONT ANNOUNCEMENT TICKER BANNER */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1] mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1C2024] flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#143D2B]" />
                    <span>Storefront Top Announcement Bar</span>
                  </h3>
                  <p className="text-xs text-[#707780]">
                    Customize the top header announcement ticker seen by all visitors
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-[#FAF8F5] border border-[#D5CDC0] px-3 py-1.5 rounded-md">
                  <input
                    type="checkbox"
                    checked={bannerForm.isActive !== false}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                  />
                  <span className="text-xs font-semibold text-[#1C2024]">
                    Top Bar Enabled
                  </span>
                </label>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1C2024] mb-1">
                      Badge Text (e.g. FLASH SALE, OFFER, EID)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.badgeText || ''}
                      onChange={(e) =>
                        setBannerForm((prev) => ({ ...prev, badgeText: e.target.value }))
                      }
                      placeholder="FLASH SALE"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C2024] mb-1">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.buttonText || ''}
                      onChange={(e) =>
                        setBannerForm((prev) => ({ ...prev, buttonText: e.target.value }))
                      }
                      placeholder="Order Now"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Main Headline / Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title || ''}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Cash on Delivery Nationwide in Bangladesh!"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Subtitle / Supporting Info
                  </label>
                  <input
                    type="text"
                    value={bannerForm.subtitle || ''}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Authentic Lifestyle & Gadget Products Delivered in 2–3 Days"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Button Target Link
                  </label>
                  <input
                    type="text"
                    value={bannerForm.buttonLink || ''}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, buttonLink: e.target.value }))
                    }
                    placeholder="/#catalog or /products/your-slug"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>

                <div className="pt-3 border-t border-[#F0EBE1] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingBanner}
                    className="px-5 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    {savingBanner ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Top Bar Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 3. HOMEPAGE TV-STYLE ANNOUNCEMENT TICKER (Directly Below Hero Slider) */}
            <div className="bg-white rounded-xl border border-[#E8E2D5] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EBE1] mb-5 gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1C2024] flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#143D2B]" />
                    <span>Homepage TV-Style Moving Announcement Ticker</span>
                  </h3>
                  <p className="text-xs text-[#707780]">
                    Continuously moving marquee text displayed directly beneath the Hero Slider on the homepage
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF5EF] text-[#143D2B] border border-[#143D2B]/20 shrink-0">
                  Live Synced to Firestore
                </span>
              </div>

              {/* Live Preview */}
              <div className="mb-5">
                <label className="block font-semibold text-[#1C2024] mb-2 text-xs">
                  Live Ticker Preview (Displays exact text saved below):
                </label>
                <div className="w-full bg-white border border-[#E5E7EB] rounded-md overflow-hidden py-2 select-none relative flex items-center">
                  <div className="absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 inset-y-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                  <div className="animate-tv-ticker flex items-center">
                    <div className="inline-flex items-center shrink-0">
                      <span className="text-xs font-medium text-[#1C2024] px-4 whitespace-nowrap">
                        {tickerText.trim() || 'Your announcement ticker message will scroll continuously here...'}
                      </span>
                      <span className="text-neutral-400 text-xs select-none">•</span>
                    </div>
                    <div className="inline-flex items-center shrink-0" aria-hidden="true">
                      <span className="text-xs font-medium text-[#1C2024] px-4 whitespace-nowrap">
                        {tickerText.trim() || 'Your announcement ticker message will scroll continuously here...'}
                      </span>
                      <span className="text-neutral-400 text-xs select-none">•</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveTicker} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Announcement Ticker Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={tickerText}
                    onChange={(e) => setTickerText(e.target.value)}
                    placeholder="e.g. Special Flash Sale: Cash on Delivery Nationwide in Bangladesh | Delivery in 2–3 Days | Helpline: 01967-233934"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B] font-medium"
                  />
                  <p className="text-[11px] text-[#707780] mt-1">
                    Tip: Separate multiple announcements with <span className="font-mono font-bold text-[#143D2B]"> | </span> (vertical bar) to automatically format them with clean bullet dividers between each announcement.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTickerText(DEFAULT_HERO_CONFIG.tickerText || '')}
                    className="text-[11px] text-[#707780] hover:text-[#1C2024] underline"
                  >
                    Reset to Default Message
                  </button>

                  <button
                    type="submit"
                    disabled={savingTicker}
                    className="px-5 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    {savingTicker ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Ticker to Firestore...</span>
                      </>
                    ) : (
                      <span>Save Announcement Ticker</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* =======================================================
          ORDER DETAILS MODAL / DRAWER
      ======================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8E2D5] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D5] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-[#1C2024]">
                  Order #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
                <p className="text-xs text-[#707780]">
                  Placed on{' '}
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString('en-GB')
                    : 'Recent'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-[#707780] hover:text-[#1C2024] rounded-lg hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-xs">
              {/* Order Status Changer */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D5] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#1C2024]">Current Order Status</div>
                  <div className="text-[11px] text-[#707780]">
                    Select new status to immediately notify system & customer records
                  </div>
                </div>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)
                  }
                  className="font-bold text-xs px-3 py-2 rounded-md border border-[#D5CDC0] bg-white focus:outline-none focus:border-[#143D2B]"
                >
                  {ORDER_STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Contact & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-[#1C2024] border-b border-[#F0EBE1] pb-1.5 flex items-center justify-between">
                    <span>Customer Information</span>
                    {selectedOrder.customerId ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Registered User
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                        Guest Checkout
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-[#1C2024]">
                      {selectedOrder.customerName}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrder.customerPhone}`}
                        className="px-2.5 py-1.5 bg-[#143D2B] text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-[#C5A059]" />
                        <span>Call {selectedOrder.customerPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/88${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedOrder.customerName)},%20this%20is%20CORELUX%20regarding%20your%20Order%20${encodeURIComponent(selectedOrder.orderNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-[#25D366] text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                    {selectedOrder.customerEmail && (
                      <p className="text-[#707780] pt-1">Email: {selectedOrder.customerEmail}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#E8E2D5] p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-[#1C2024] border-b border-[#F0EBE1] pb-1.5">
                    Delivery Address
                  </h4>
                  <p className="text-[#1C2024] leading-relaxed">
                    {selectedOrder.deliveryAddress}
                  </p>
                  <div className="pt-2">
                    <span className="font-semibold text-[#143D2B]">
                      {selectedOrder.deliveryZone === 'inside_dhaka'
                        ? 'Inside Dhaka (৳70 Delivery Fee)'
                        : 'Outside Dhaka (৳130 Delivery Fee)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div className="border border-[#E8E2D5] rounded-lg overflow-hidden">
                <div className="bg-[#FAF8F5] px-4 py-2 border-b border-[#E8E2D5] font-bold text-[#1C2024]">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </div>
                <div className="divide-y divide-[#F0EBE1]">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#1C2024] text-xs">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-[#707780] flex items-center gap-2 mt-0.5">
                          {item.size && (
                            <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E0D9CD]">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E0D9CD]">
                              Colour: {item.color}
                            </span>
                          )}
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: ৳{item.unitPrice}</span>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-[#143D2B]">
                        ৳{(item.lineTotal || item.unitPrice * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D5] p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-[#5D646D]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1C2024]">
                    ৳{selectedOrder.subtotal?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#5D646D]">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-[#143D2B]">
                    ৳{selectedOrder.deliveryFee}
                  </span>
                </div>
                <div className="border-t border-[#E8E2D5] pt-2 flex justify-between text-sm font-bold text-[#1C2024]">
                  <span>Total Payable</span>
                  <span className="text-base text-[#143D2B]">
                    ৳{selectedOrder.total?.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-[#8C6D2D] font-medium pt-1">
                  Payment Method: {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E2D5] flex items-center justify-between">
              <button
                onClick={() => promptDeleteOrder(selectedOrder)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#143D2B] text-white rounded-md text-xs font-semibold hover:bg-[#0E2E20]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PRODUCT CREATE / EDIT MODAL
      ======================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8E2D5] max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#E8E2D5] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-[#1C2024]">
                {editingProduct ? 'Edit Product' : 'Add New Product to Store'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-[#707780] hover:text-[#1C2024]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setProductForm((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug || slug,
                    }));
                  }}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">
                  URL Slug (Unique path identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.slug || ''}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Selling Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.price ?? ''}
                    onChange={(e) =>
                      setProductForm((prev) => ({ 
                        ...prev, 
                        price: e.target.value === '' ? undefined : Number(e.target.value) 
                      }))
                    }
                    placeholder="e.g. 990"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Original Price (৳) <span className="text-[10px] text-[#707780] font-normal">(Optional, for discount badge)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.originalPrice ?? ''}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        originalPrice: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g. 1190"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>
              </div>

              {/* Dynamic Real-time Discount & Savings Indicator */}
              {(() => {
                const p = Number(productForm.price) || 0;
                const orig = Number(productForm.originalPrice) || 0;
                if (orig > p && p > 0) {
                  const savings = orig - p;
                  const discountPct = Math.round((savings / orig) * 100);
                  return (
                    <div className="bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] px-3 py-2 rounded-md flex items-center justify-between text-xs font-semibold shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#15803D]" />
                        <span>Auto-Adjusted Discount: {discountPct}% OFF</span>
                      </div>
                      <span className="text-[#166534]">Customer Saves: ৳{savings.toLocaleString()}</span>
                    </div>
                  );
                } else if (orig > 0 && orig <= p) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-md text-[11px]">
                      Notice: Original price should be higher than Selling price to auto-generate a discount badge.
                    </div>
                  );
                }
                return null;
              })()}

              {/* Product Photo: Direct Device Upload + URL Input + Live Preview */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#1C2024]">
                    Product Photo *
                  </label>
                  <span className="text-[10px] text-[#707780]">Device upload or image URL</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label
                    htmlFor="product-device-photo-input"
                    className="cursor-pointer px-3 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </label>
                  <input
                    type="file"
                    id="product-device-photo-input"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />

                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={productForm.image || ''}
                      onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="/assets/aistudio/... or https://..."
                      className="w-full px-3 py-2 bg-white border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                    />
                  </div>
                </div>

                {/* Instant Photo Preview Thumbnail */}
                {productForm.image && (
                  <div className="flex items-center gap-3 p-2 bg-white border border-[#E8E2D5] rounded-md">
                    <img
                      src={productForm.image}
                      alt="Product Preview"
                      className="w-14 h-14 object-cover rounded-md border border-[#E0D9CD] bg-stone-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                      }}
                    />
                    <div className="flex-1 min-w-0 text-[11px]">
                      <p className="font-semibold text-[#1C2024] truncate">
                        {productForm.image.startsWith('data:image')
                          ? 'Device Photo Uploaded'
                          : productForm.image}
                      </p>
                      <p className="text-[#707780]">Primary product photo</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductForm((prev) => ({ ...prev, image: '' }))}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Gallery Photos (Up to 3 Images) */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#1C2024] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#143D2B]" />
                    <span>Additional Gallery Images (Up to 3 Photos)</span>
                  </label>
                  <span className="text-[10px] text-[#707780]">Thumbnails & Zoom Modal</span>
                </div>
                <p className="text-[11px] text-[#707780]">
                  Upload or paste image URLs for up to 3 additional photos. These will appear as interactive thumbnails underneath the main image and inside the Star Tech-style zoom lightbox modal.
                </p>

                <div className="space-y-2.5">
                  {[0, 1, 2].map((slotIndex) => {
                    const currentImg = additionalImages[slotIndex] || '';
                    return (
                      <div
                        key={`extra-slot-${slotIndex}`}
                        className="p-2.5 bg-white border border-[#E8E2D5] rounded-md space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#1C2024]">
                            Gallery Image {slotIndex + 1} <span className="text-[#707780] font-normal">(Optional)</span>
                          </span>
                          {currentImg && (
                            <button
                              type="button"
                              onClick={() =>
                                setAdditionalImages((prev) => {
                                  const next = [...prev];
                                  next[slotIndex] = '';
                                  return next;
                                })
                              }
                              className="text-xs text-red-600 hover:text-red-700 font-semibold px-1.5 py-0.5 hover:bg-red-50 rounded"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label
                            htmlFor={`product-additional-photo-${slotIndex}`}
                            className="cursor-pointer px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#143D2B] border border-[#D5CDC0] rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                          >
                            <Upload className="w-3 h-3 text-[#143D2B]" />
                            <span>Upload from Device</span>
                          </label>
                          <input
                            type="file"
                            id={`product-additional-photo-${slotIndex}`}
                            accept="image/*"
                            onChange={(e) => handleAdditionalImageUpload(slotIndex, e)}
                            className="hidden"
                          />

                          <input
                            type="text"
                            value={currentImg}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalImages((prev) => {
                                const next = [...prev];
                                next[slotIndex] = val;
                                return next;
                              });
                            }}
                            placeholder="Or paste photo URL (https://... or /assets/...)"
                            className="flex-1 px-2.5 py-1.5 bg-[#FAF8F5] border border-[#D5CDC0] rounded text-xs text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                          />
                        </div>

                        {/* Thumbnail Preview */}
                        {currentImg && (
                          <div className="flex items-center gap-2.5 p-1.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded">
                            <img
                              src={currentImg}
                              alt={`Gallery Preview ${slotIndex + 1}`}
                              className="w-12 h-12 object-cover rounded border border-[#E0D9CD] bg-white shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/aistudio/mic_92c80436.webp';
                              }}
                            />
                            <div className="flex-1 min-w-0 text-[11px]">
                              <p className="font-semibold text-[#1C2024] truncate">
                                {currentImg.startsWith('data:image')
                                  ? `Device Photo Added (Slot ${slotIndex + 1})`
                                  : currentImg}
                              </p>
                              <p className="text-[10px] text-[#707780]">Ready for product gallery</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">Category</label>
                  <select
                    value={productForm.category || 'Gadget & Tech'}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                        isWinter: e.target.value === 'Winter Collection',
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  >
                    <option value="Electronics & Audio">Electronics & Audio</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Audio & Wearables">Audio & Wearables</option>
                    <option value="Winter Collection">Winter Collection</option>
                    <option value="Gadget & Tech">Gadget & Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Stock Availability
                  </label>
                  <select
                    value={productForm.inStock !== false ? 'in_stock' : 'out_of_stock'}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        inStock: e.target.value === 'in_stock',
                        stockStatus:
                          e.target.value === 'in_stock'
                            ? 'In Stock (Ready to Dispatch)'
                            : 'Out of Stock',
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">Tagline</label>
                <input
                  type="text"
                  value={productForm.tagline || ''}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, tagline: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description || ''}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              {/* Toggles for Hoodies / Clothing */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.requiresSize)}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        requiresSize: e.target.checked,
                      }))
                    }
                    className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                  />
                  <span className="font-semibold text-[#1C2024]">
                    Requires Size Selection (L and XL)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.requiresColor)}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        requiresColor: e.target.checked,
                      }))
                    }
                    className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                  />
                  <span className="font-semibold text-[#1C2024]">
                    Requires Colour Selection (Off White, Navy Blue, Jet Black, Coffee)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-[#D5CDC0] rounded-md text-xs font-semibold text-[#5D646D] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* =======================================================
          HERO SLIDE CREATE / EDIT MODAL (Max 3 Enforced)
      ======================================================= */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8E2D5] max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b border-[#E8E2D5] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-[#1C2024]">
                  {editingSlide ? 'Edit Banner Slide' : 'Add New Hero Banner Slide'}
                </h3>
                <p className="text-[11px] text-[#707780]">
                  Configure banner image and optional copy/link (Maximum 3 slides allowed)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="p-1.5 text-[#707780] hover:text-[#1C2024]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-5 space-y-4 text-xs">
              {/* Image Upload / URL Section */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#1C2024]">
                    Banner Image *
                  </label>
                  <span className="text-[10px] text-[#707780]">Device upload or URL (16:9 / 21:9)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label
                    htmlFor="slide-image-file-input"
                    className="cursor-pointer px-3 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </label>
                  <input
                    type="file"
                    id="slide-image-file-input"
                    accept="image/*"
                    onChange={handleSlideImageUpload}
                    className="hidden"
                  />

                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={slideForm.imageUrl || ''}
                      onChange={(e) =>
                        setSlideForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                      }
                      placeholder="/assets/aistudio/... or https://..."
                      className="w-full px-3 py-2 bg-white border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                    />
                  </div>
                </div>

                {/* Image Live Preview */}
                {slideForm.imageUrl && (
                  <div className="relative aspect-[21/9] w-full rounded-lg bg-black border border-[#D5CDC0] overflow-hidden mt-2">
                    <img
                      src={slideForm.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSlideForm((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={slideForm.badge || ''}
                    onChange={(e) =>
                      setSlideForm((prev) => ({ ...prev, badge: e.target.value }))
                    }
                    placeholder="e.g. TOP FEATURED, 2025 NEW"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2024] mb-1">
                    Target Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={slideForm.linkUrl || ''}
                    onChange={(e) =>
                      setSlideForm((prev) => ({ ...prev, linkUrl: e.target.value }))
                    }
                    placeholder="/products/... or /#catalog"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">
                  Main Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  value={slideForm.title || ''}
                  onChange={(e) =>
                    setSlideForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. 928 Type Tactical Defense Torch"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C2024] mb-1">
                  Supporting Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={slideForm.subtitle || ''}
                  onChange={(e) =>
                    setSlideForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="e.g. High-Power Flashlight with High Lumen Beam"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5CDC0] rounded-md text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                />
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slideForm.isActive !== false}
                    onChange={(e) =>
                      setSlideForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                  />
                  <span className="font-semibold text-[#1C2024]">
                    Visible on Homepage Slider
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 border border-[#D5CDC0] rounded-md text-xs font-semibold text-[#5D646D] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <span>Save Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          IN-APP DELETE CONFIRMATION MODAL (Reliable in all iframes)
      ======================================================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 max-w-sm w-full p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#1C2024] mb-1">
              Delete {deleteConfirmation.type === 'product' ? 'Product' : deleteConfirmation.type === 'order' ? 'Order' : deleteConfirmation.type === 'slide' ? 'Hero Banner Slide' : 'Coupon'}?
            </h3>

            <p className="text-xs text-[#5D646D] mb-4">
              Are you sure you want to permanently delete this {deleteConfirmation.type}? This action cannot be reversed.
            </p>

            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg p-3 text-left mb-5">
              <div className="text-xs font-bold text-[#1C2024] truncate">
                {deleteConfirmation.title}
              </div>
              {deleteConfirmation.subtitle && (
                <div className="text-[11px] text-[#707780] mt-0.5 truncate">
                  {deleteConfirmation.subtitle}
                </div>
              )}
              <div className="text-[10px] font-mono text-[#9CA3AF] mt-1 truncate">
                ID: {deleteConfirmation.id}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 py-2.5 px-3 border border-[#D5CDC0] text-[#5D646D] hover:bg-[#FAF8F5] text-xs font-semibold rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={executeConfirmedDelete}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {isDeletingItem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
