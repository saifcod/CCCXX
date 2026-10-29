import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Product, PRODUCTS } from '../data/products';

/**
 * Normalizes any raw product document data from Firestore into a complete, typed Product.
 */
export function normalizeProduct(raw: any, id: string): Product {
  const price = typeof raw.price === 'number' ? raw.price : Number(raw.price) || 0;
  const originalPrice = raw.originalPrice ? Number(raw.originalPrice) : undefined;
  const discountAmount = originalPrice && originalPrice > price ? originalPrice - price : raw.discountAmount;
  const discountPercentage = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : raw.discountPercentage;

  // Build clean images array (1 main image + up to 3 additional images)
  const rawPrimary = (typeof raw.image === 'string' && raw.image.trim()) ? raw.image.trim() : '';
  const rawList: string[] = Array.isArray(raw.images)
    ? raw.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0).map((img: string) => img.trim())
    : [];

  const combinedList = rawPrimary
    ? [rawPrimary, ...rawList.filter((img) => img !== rawPrimary)]
    : (rawList.length > 0 ? rawList : ['/assets/aistudio/hodie_and_dropshoulder_combo_48679659.jpg']);

  const primaryImage = combinedList[0];
  const images = combinedList.slice(0, 4);

  return {
    id: id || raw.id || `prod-${Date.now()}`,
    slug: (raw.slug || '').trim().toLowerCase() || generateSlugBase(raw.name || id),
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
    name: raw.name || 'CORELUX Premium Product',
    price,
    priceDisplay: raw.priceDisplay || `৳${price.toLocaleString()}`,
    originalPrice,
    originalPriceDisplay: originalPrice ? `৳${originalPrice.toLocaleString()}` : raw.originalPriceDisplay,
    discountAmount,
    discountPercentage,
    discountDisplay: discountAmount ? `৳${discountAmount} OFF` : raw.discountDisplay,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    category: raw.category || 'Lifestyle & Gadgets',
    isWinter: Boolean(raw.isWinter),
    isMasterCopy: Boolean(raw.isMasterCopy),
    isDeleted: Boolean(raw.isDeleted),
    tagline: raw.tagline || 'Premium Quality in Bangladesh',
    description: raw.description || '',
    features: Array.isArray(raw.features) ? raw.features : [],
    specs: Array.isArray(raw.specs) ? raw.specs : [],
    requiresSize: Boolean(raw.requiresSize),
    availableSizes: Array.isArray(raw.availableSizes) ? raw.availableSizes : ['L', 'XL'],
    requiresColor: Boolean(raw.requiresColor),
    availableColors: Array.isArray(raw.availableColors) ? raw.availableColors : [],
    stockStatus: raw.stockStatus || (raw.inStock !== false ? 'In Stock' : 'Out of Stock'),
    inStock: raw.inStock !== false,
    deliveryInfo: raw.deliveryInfo || 'Cash on Delivery Nationwide (2-3 Business Days)',
  };
}

/**
 * Generates a clean URL-safe base slug supporting English, Bengali (\u0980-\u09FF), and international characters.
 */
export function generateSlugBase(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .toLowerCase()
    // Replace spaces, underscores, and slashes with hyphens
    .replace(/[\s_/\\]+/g, '-')
    // Allow alphanumeric ASCII, Bengali unicode characters, and hyphens; remove punctuation
    .replace(/[^\w\u0980-\u09FF-]/g, '')
    // Collapse consecutive hyphens
    .replace(/-+/g, '-')
    // Trim hyphens from ends
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a collision-free unique slug among existing store products.
 */
export function generateUniqueProductSlug(
  name: string,
  existingProducts: Product[],
  currentProductId?: string
): string {
  let baseSlug = generateSlugBase(name);

  if (!baseSlug) {
    baseSlug = `product-${Date.now().toString(36)}`;
  }

  // Check if this slug already belongs to another product
  const otherProducts = existingProducts.filter((p) => p.id !== currentProductId);
  let candidateSlug = baseSlug;
  let counter = 2;

  while (otherProducts.some((p) => p.slug?.toLowerCase() === candidateSlug.toLowerCase())) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidateSlug;
}

/**
 * Centralized, authoritative product lookup service.
 * Performs fast-path in-memory check, followed by direct asynchronous Firestore query fallback.
 * Guarantees direct URL navigation, browser refreshes, and newly created Firestore products load reliably.
 */
export async function lookupProduct(
  slugOrId: string,
  cachedProducts: Product[] = []
): Promise<Product | null> {
  if (!slugOrId) return null;

  const rawInput = slugOrId.trim();
  const cleanInput = decodeURIComponent(rawInput).trim().toLowerCase();

  // 1. Search cached/in-memory products first (instant synchronous resolution)
  if (cachedProducts && cachedProducts.length > 0) {
    // 1a. Exact slug match
    const exactSlug = cachedProducts.find(
      (p) => !p.isDeleted && p.slug?.toLowerCase() === cleanInput
    );
    if (exactSlug) return exactSlug;

    // 1b. Exact document ID match
    const exactId = cachedProducts.find(
      (p) => !p.isDeleted && p.id?.toLowerCase() === cleanInput
    );
    if (exactId) return exactId;

    // 1c. Aliases match
    const aliasMatch = cachedProducts.find(
      (p) =>
        !p.isDeleted &&
        p.aliases?.some((a) => a.toLowerCase() === cleanInput)
    );
    if (aliasMatch) return aliasMatch;

    // 1d. Transliterated / slug base match
    const generatedMatch = cachedProducts.find(
      (p) => !p.isDeleted && generateSlugBase(p.name) === cleanInput
    );
    if (generatedMatch) return generatedMatch;
  }

  // 2. Direct Firestore fallback query (covers cold loads, fresh tabs, and new products)
  try {
    // 2a. Query by doc id directly
    const directDocRef = doc(db, 'products', rawInput);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      const data = directSnap.data();
      if (!data.isDeleted) {
        return normalizeProduct(data, directSnap.id);
      }
    }

    // 2b. Query by slug equality in products collection
    const slugQuery = query(
      collection(db, 'products'),
      where('slug', '==', cleanInput),
      limit(1)
    );
    const slugSnapshot = await getDocs(slugQuery);
    if (!slugSnapshot.empty) {
      const docSnap = slugSnapshot.docs[0];
      const data = docSnap.data();
      if (!data.isDeleted) {
        return normalizeProduct(data, docSnap.id);
      }
    }

    // 2c. Query by lowercase or original casing slug if different
    if (rawInput !== cleanInput) {
      const rawSlugQuery = query(
        collection(db, 'products'),
        where('slug', '==', rawInput),
        limit(1)
      );
      const rawSnapshot = await getDocs(rawSlugQuery);
      if (!rawSnapshot.empty) {
        const docSnap = rawSnapshot.docs[0];
        const data = docSnap.data();
        if (!data.isDeleted) {
          return normalizeProduct(data, docSnap.id);
        }
      }
    }

    // 2d. Fallback check: scan all active Firestore products in case of alias or prefix match
    const allProductsSnap = await getDocs(collection(db, 'products'));
    for (const d of allProductsSnap.docs) {
      const dData = d.data();
      if (dData.isDeleted) continue;
      const dSlug = (dData.slug || '').toLowerCase();
      const dId = d.id.toLowerCase();
      const dAliases: string[] = Array.isArray(dData.aliases) ? dData.aliases.map((a: string) => a.toLowerCase()) : [];

      if (
        dSlug === cleanInput ||
        dId === cleanInput ||
        dAliases.includes(cleanInput) ||
        generateSlugBase(dData.name || '') === cleanInput
      ) {
        return normalizeProduct(dData, d.id);
      }
    }
  } catch (error) {
    console.warn('Firestore direct product lookup warning:', error);
  }

  // 3. Fallback to hardcoded PRODUCTS as last resort
  const staticMatch = PRODUCTS.find(
    (p) =>
      p.slug.toLowerCase() === cleanInput ||
      p.id.toLowerCase() === cleanInput ||
      p.aliases?.some((a) => a.toLowerCase() === cleanInput)
  );
  if (staticMatch) return staticMatch;

  return null;
}
