import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, SavedOrder } from './firebase';
import { Product, PRODUCTS } from '../data/products';

export const DESIGNATED_ADMIN_UID = 'rNnmHoQ3c5cUB1ljnPms4o2GxUv2';

export const ADMIN_WHITELIST_EMAILS = [
  'mdrecover470@gmail.com',
  'unexpectedsaiff@gmil.com',
  'unexpectedsaiff@gmail.com',
  'admin@corelux.com',
];

export type OrderStatus =
  | 'Pending Confirmation'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUS_LIST: OrderStatus[] = [
  'Pending Confirmation',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

/**
 * Checks if a given authenticated user has administrative clearance.
 * Recognizes designated UID, owner email whitelist, or registered admin document.
 */
export async function checkIsAdmin(user: FirebaseUser | null): Promise<boolean> {
  if (!user) return false;

  const normalizedEmail = (user.email || '').toLowerCase().trim();
  const isDesignatedUid = user.uid === DESIGNATED_ADMIN_UID;
  const isWhitelistedEmail = ADMIN_WHITELIST_EMAILS.some((e) => e.toLowerCase() === normalizedEmail);

  try {
    // If user matches designated admin UID or owner email whitelist, ensure backend admin record exists
    if (isDesignatedUid || isWhitelistedEmail) {
      const snap = await getDoc(doc(db, 'admins', user.uid));
      if (!snap.exists()) {
        await setDoc(
          doc(db, 'admins', user.uid),
          {
            email: user.email || 'admin@corelux.com',
            role: 'owner',
            bootstrappedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      return true;
    }

    // Check if UID exists in /admins collection
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    console.error('Error verifying admin authorization:', error);
    return isDesignatedUid || isWhitelistedEmail;
  }
}

/**
 * Fetches all orders across all customers and guests for the admin dashboard
 */
export async function getAllOrders(): Promise<SavedOrder[]> {
  const path = 'orders';
  try {
    const ordersCol = collection(db, 'orders');
    const snapshot = await getDocs(ordersCol);
    const orders: SavedOrder[] = [];

    snapshot.forEach((docSnap) => {
      orders.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SavedOrder, 'id'>),
      });
    });

    // Sort newest first
    orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Updates order status in Firestore using exact vocabulary
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus | string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes an order from Firestore
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Reads all products from Firestore products collection
 */
export async function getFirestoreProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) {
      return [];
    }
    const products: Product[] = [];
    snapshot.forEach((d) => {
      products.push(d.data() as Product);
    });
    return products;
  } catch (error) {
    console.warn('Could not read Firestore products:', error);
    return [];
  }
}

/**
 * Recursively strips undefined keys and values from objects and arrays so Firestore setDoc never throws:
 * "Unsupported field value: undefined"
 */
export function sanitizeFirestoreData<T extends any>(input: T): any {
  if (input === undefined) {
    return null;
  }
  if (input === null) {
    return null;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item));
  }
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      if (val === undefined) {
        continue;
      }
      clean[key] = sanitizeFirestoreData(val);
    }
    return clean;
  }
  return input;
}

export const PRODUCTS_CACHE_KEY = 'corelux_products_cache_v2';
export const HERO_CONFIG_CACHE_KEY = 'corelux_hero_config_cache_v2';

export function updateCachedProduct(product: Product): void {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    let list: Product[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [...PRODUCTS];
      }
    } else {
      list = [...PRODUCTS];
    }

    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not update cached product:', e);
  }
}

export function removeCachedProduct(productId: string): void {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return;
    const list: Product[] = JSON.parse(raw);
    const filtered = list.filter((p) => p.id !== productId);
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not remove cached product:', e);
  }
}

export function updateCachedHeroConfig(config: Partial<HeroConfig>): void {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(HERO_CONFIG_CACHE_KEY);
    const current = raw ? JSON.parse(raw) : DEFAULT_HERO_CONFIG;
    const updated = { ...current, ...config };
    localStorage.setItem(HERO_CONFIG_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not update cached hero config:', e);
  }
}

/**
 * Saves or updates a product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const cleanProduct = sanitizeFirestoreData(product);
    await setDoc(doc(db, 'products', product.id), cleanProduct);
    updateCachedProduct(product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a product from Firestore with soft-delete guarantee
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    removeCachedProduct(productId);
    // Mark as isDeleted: true so listeners immediately drop it
    await setDoc(doc(db, 'products', productId), { isDeleted: true }, { merge: true });
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seeds initial 5 baseline products into Firestore if not present
 */
export async function seedInitialProductsToFirestore(): Promise<{ added: number; total: number }> {
  let addedCount = 0;
  for (const prod of PRODUCTS) {
    const docRef = doc(db, 'products', prod.id);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      const cleanProd = sanitizeFirestoreData(prod);
      await setDoc(docRef, cleanProd);
      addedCount++;
    }
  }
  return { added: addedCount, total: PRODUCTS.length };
}

// ============================================================================
// COUPON MANAGEMENT
// ============================================================================
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    const coupons: Coupon[] = [];
    snap.forEach((d) => {
      coupons.push({ id: d.id, ...(d.data() as Omit<Coupon, 'id'>) });
    });
    return coupons;
  } catch (err) {
    console.warn('Could not load coupons:', err);
    return [];
  }
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  const path = `coupons/${coupon.id}`;
  try {
    const clean = sanitizeFirestoreData(coupon);
    await setDoc(doc(db, 'coupons', coupon.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  const path = `coupons/${couponId}`;
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// STORE BANNER & ANNOUNCEMENT SETTINGS
// ============================================================================
export interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  isActive: boolean;
  updatedAt: string;
}

export async function getStoreBanner(): Promise<StoreBanner | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'banner'));
    if (snap.exists()) {
      return snap.data() as StoreBanner;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStoreBanner(banner: StoreBanner): Promise<void> {
  const path = 'settings/banner';
  try {
    const clean = sanitizeFirestoreData(banner);
    await setDoc(doc(db, 'settings', 'banner'), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// HOMEPAGE HERO CAROUSEL & 2 FEATURED PRODUCTS SETTINGS
// ============================================================================
export interface HeroSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface HeroConfig {
  slides: HeroSlide[]; // Strictly enforced max 3 slides
  featuredProductIds: string[]; // Exactly 2 product IDs
  featuredSectionTitle?: string;
  featuredSectionSubtitle?: string;
  autoSlideInterval?: number; // ms (default 4500)
  tickerText?: string; // Continuously moving TV-style announcement ticker message
  updatedAt?: string;
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  slides: [
    {
      id: 'slide-1',
      imageUrl: '/assets/aistudio/ae200b2a-8528-4ef4-ae8b-c79087dfa79f_b451b3b7.png',
      title: '928 Type Heavy-Duty Tactical Flashlight',
      subtitle: 'High-Power Multi-Functional Defense Flashlight with High Lumen Beam',
      badge: 'TOP FEATURED',
      linkUrl: '/products/sl-720-mini-body-massage-gun',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'slide-2',
      imageUrl: '/assets/aistudio/hodie_and_dropshoulder_combo_48679659.jpg',
      title: 'Winter 2025 Thermal Essentials',
      subtitle: 'Heavyweight Minimalist Hoodies & Pullovers crafted for comfort in Bangladesh',
      badge: 'WINTER COLLECTION',
      linkUrl: '/products/premium-solid-color-pullover-hoodie',
      isActive: true,
      sortOrder: 2,
    },
  ],
  featuredProductIds: ['f11-2-mic', 'sl-720-massage-gun'],
  featuredSectionTitle: 'Curated Highlights',
  featuredSectionSubtitle: 'Handpicked premium essentials tested for durability and everyday excellence',
  autoSlideInterval: 4500,
  tickerText: 'Special Flash Sale: Cash on Delivery Nationwide in Bangladesh (All 64 Districts) | Delivery in 2–3 Days | Genuine Products with Physical Inspection Allowed Before Payment | Customer Helpline: 01967-233934',
  updatedAt: new Date().toISOString(),
};

export async function getHeroConfig(): Promise<HeroConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'heroConfig'));
    if (snap.exists()) {
      const data = snap.data() as Partial<HeroConfig>;
      return {
        slides: Array.isArray(data.slides) && data.slides.length > 0 ? data.slides.slice(0, 8) : DEFAULT_HERO_CONFIG.slides,
        featuredProductIds: Array.isArray(data.featuredProductIds) && data.featuredProductIds.length >= 2
          ? data.featuredProductIds.slice(0, 2)
          : DEFAULT_HERO_CONFIG.featuredProductIds,
        featuredSectionTitle: data.featuredSectionTitle || DEFAULT_HERO_CONFIG.featuredSectionTitle,
        featuredSectionSubtitle: data.featuredSectionSubtitle || DEFAULT_HERO_CONFIG.featuredSectionSubtitle,
        autoSlideInterval: data.autoSlideInterval || DEFAULT_HERO_CONFIG.autoSlideInterval,
        tickerText: typeof data.tickerText === 'string' ? data.tickerText : DEFAULT_HERO_CONFIG.tickerText,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return DEFAULT_HERO_CONFIG;
  } catch (err) {
    console.warn('Could not read hero config from Firestore:', err);
    return DEFAULT_HERO_CONFIG;
  }
}

export async function saveHeroConfig(config: Partial<HeroConfig>): Promise<void> {
  const path = 'settings/heroConfig';
  try {
    const rawSlides = Array.isArray(config.slides) ? config.slides : [];
    const cleanSlides: HeroSlide[] = rawSlides.slice(0, 8).map((s, idx) => {
      const slide: Record<string, any> = {
        id: s.id || `slide-${Date.now()}-${idx}`,
        imageUrl: (s.imageUrl || '').trim(),
        isActive: s.isActive !== false,
        sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : idx + 1,
      };
      if (s.title && s.title.trim()) slide.title = s.title.trim();
      if (s.subtitle && s.subtitle.trim()) slide.subtitle = s.subtitle.trim();
      if (s.badge && s.badge.trim()) slide.badge = s.badge.trim();
      if (s.linkUrl && s.linkUrl.trim()) slide.linkUrl = s.linkUrl.trim();
      return slide as HeroSlide;
    });

    const cleanConfig: Partial<HeroConfig> = {
      slides: cleanSlides,
      autoSlideInterval: config.autoSlideInterval || 4500,
      updatedAt: new Date().toISOString(),
    };
    if (config.featuredProductIds) {
      cleanConfig.featuredProductIds = config.featuredProductIds.slice(0, 2);
    }
    if (config.featuredSectionTitle) {
      cleanConfig.featuredSectionTitle = config.featuredSectionTitle;
    }
    if (config.featuredSectionSubtitle) {
      cleanConfig.featuredSectionSubtitle = config.featuredSectionSubtitle;
    }
    if (typeof config.tickerText === 'string') {
      cleanConfig.tickerText = config.tickerText;
    }
    const clean = sanitizeFirestoreData(cleanConfig);
    await setDoc(doc(db, 'settings', 'heroConfig'), clean, { merge: true });
    updateCachedHeroConfig(cleanConfig);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}


// ============================================================================
// REAL CUSTOMER AGGREGATION
// ============================================================================
export interface CustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  isRegistered: boolean;
}

export async function getRealCustomers(orders: SavedOrder[]): Promise<CustomerRecord[]> {
  const customerMap = new Map<string, CustomerRecord>();

  // 1. First populate from registered users in Firestore
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((uDoc) => {
      const uData = uDoc.data();
      const id = uDoc.id;
      customerMap.set(id, {
        id,
        name: uData.displayName || 'Registered Customer',
        email: uData.email || '',
        phone: uData.phone || '',
        totalOrders: 0,
        totalSpent: 0,
        isRegistered: true,
      });
    });
  } catch (e) {
    console.warn('Could not fetch registered users:', e);
  }

  // 2. Aggregate from real orders
  for (const order of orders) {
    // Key by customerId or phone number
    const key = order.customerId || order.customerPhone.trim();
    if (!key) continue;

    const existing = customerMap.get(key) || {
      id: key,
      name: order.customerName,
      email: order.customerEmail || '',
      phone: order.customerPhone,
      address: order.deliveryAddress,
      totalOrders: 0,
      totalSpent: 0,
      isRegistered: Boolean(order.customerId),
    };

    existing.totalOrders += 1;
    if (order.status !== 'Cancelled') {
      existing.totalSpent += (order.total || 0);
    }
    if (!existing.lastOrderDate || new Date(order.createdAt).getTime() > new Date(existing.lastOrderDate).getTime()) {
      existing.lastOrderDate = order.createdAt;
      existing.address = order.deliveryAddress || existing.address;
      existing.phone = order.customerPhone || existing.phone;
      if (order.customerName) existing.name = order.customerName;
    }

    customerMap.set(key, existing);
  }

  return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}
