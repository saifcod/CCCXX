export interface Product {
  id: string;
  slug: string;
  aliases?: string[];
  name: string;
  price: number;
  priceDisplay: string;
  originalPrice?: number;
  originalPriceDisplay?: string;
  discountAmount?: number;
  discountPercentage?: number;
  discountDisplay?: string;
  image: string;
  images?: string[];
  category: string;
  isWinter: boolean;
  isMasterCopy?: boolean;
  isDeleted?: boolean;
  tagline: string;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  requiresSize?: boolean;
  availableSizes?: ('L' | 'XL')[];
  requiresColor?: boolean;
  availableColors?: {
    name: string;
    hex: string;
    bgClass: string;
  }[];
  stockStatus: string;
  inStock?: boolean;
  deliveryInfo: string;
}

/**
 * Generates clean, human-readable, URL-safe slug from product name
 */
export function generateProductSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-')     // replace spaces with hyphens
    .replace(/-+/g, '-')      // eliminate redundant hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

export const PRODUCTS: Product[] = [
  {
    id: 'f11-2-mic',
    slug: 'f11-2-dual-wireless-microphone',
    aliases: ['f11-2-dual-wireless-microphone-set', 'f11-2-mic'],
    name: 'F11-2 Dual Wireless Microphone Set',
    price: 890,
    priceDisplay: '৳890',
    originalPrice: 1090,
    originalPriceDisplay: '৳1,090',
    discountAmount: 200,
    discountDisplay: '৳200 OFF',
    image: '/assets/aistudio/mic_92c80436.webp',
    category: 'Electronics & Audio',
    isWinter: false,
    tagline: 'Dual Wireless Lavalier Microphones with Multi-Device Receiver',
    description:
      'The F11-2 Dual Wireless Microphone Set is designed for high-clarity audio recording on mobile phones, cameras, and computers. Equipped with two lapel transmitters and a dual-connector receiver (Lightning, Type-C, and 3.5mm jack), this system delivers instant plug-and-play operation for content creation, interviews, Facebook live sessions, and outdoor vlogging with intelligent noise suppression.',
    features: [
      'Dual transmitter lapel microphones for 2-person simultaneous recording',
      'Multi-port receiver compatible with iOS, Android Type-C, and 3.5mm AUX',
      'Intelligent active noise reduction with fuzzy windproof muff caps',
      'Stable 2.4GHz wireless signal transmission up to 20 meters',
      'Rechargeable battery providing 5–7 hours continuous runtime',
      'No complex apps or Bluetooth configuration required — instant plug & play'
    ],
    specs: [
      { label: 'Model', value: 'F11-2' },
      { label: 'Transmission', value: '2.4GHz Digital Wireless' },
      { label: 'Connectors', value: 'Lightning (iPhone), Type-C, 3.5mm AUX' },
      { label: 'Battery Capacity', value: 'Transmitters 70mAh each, Receiver 80mAh' },
      { label: 'Operating Distance', value: 'Up to 20 meters obstacle-free' },
      { label: 'Box Includes', value: '2x Microphones, 1x Receiver, 2x Wind muffs, Charging Cable' }
    ],
    stockStatus: 'In Stock (Ready to Dispatch)',
    deliveryInfo: 'Cash on delivery available nationwide in Bangladesh. Delivery within 2–3 business days.'
  },
  {
    id: 'sl-720-massage-gun',
    slug: 'mini-body-massage-gun-sl-720',
    aliases: ['sl-720-massage-gun', 'mini-massage-gun-sl-720', 'sl-720'],
    name: 'Mini Body Massage Gun SL-720 (Original Version)',
    price: 1150,
    priceDisplay: '৳1,150',
    originalPrice: 1300,
    originalPriceDisplay: '৳1,300',
    discountAmount: 150,
    discountDisplay: '৳150 OFF',
    image: '/assets/aistudio/gun_0ce4295c.webp',
    category: 'Health & Wellness',
    isWinter: false,
    tagline: 'Deep Tissue Therapy Mini Massager with 6 Speeds & 4 Massage Heads',
    description:
      'Compact yet powerful, the SL-720 Original Mini Massage Gun offers targeted deep tissue therapy to alleviate muscle stiffness, soreness, and post-workout tension. Featuring 6 precision speed settings, gold-trim industrial aesthetics, and 4 specialized interchangeable massage heads, it targets shoulders, back, legs, and arms with quiet percussive therapy.',
    features: [
      '6 adjustable speed vibration levels from gentle relaxation to deep percussion',
      'Includes 4 interchangeable heads: Spherical Ball, U-Shape Fork, Bullet, and Flat',
      'High-torque whisper-quiet brushless motor operation',
      'High-capacity rechargeable lithium battery with Type-C charging',
      'Compact, lightweight ergonomic grip engineered for single-handed use',
      'Targeted relief for neck stiffness, shoulder knots, lumbar fatigue, and calf aches'
    ],
    specs: [
      { label: 'Model', value: 'SL-720 (Original Edition)' },
      { label: 'Speed Levels', value: '6 Adjustable Percussion Speeds' },
      { label: 'Massage Heads', value: '4 Quick-Swap Attachments Included' },
      { label: 'Charging Type', value: 'USB Type-C Fast Charge' },
      { label: 'Motor Tech', value: 'Whisper-Quiet Low Noise Brushless Motor' },
      { label: 'Package Includes', value: 'Massage Gun, 4 Heads, Type-C Cable, Manual' }
    ],
    stockStatus: 'In Stock (Ready to Dispatch)',
    deliveryInfo: 'Cash on delivery available across all 64 districts in Bangladesh.'
  },
  {
    id: 'airpods-black-master-copy',
    slug: 'apple-airpods-black-special-edition-master-copy',
    aliases: [
      'apple-airpods-black-colour-special-edition-master-copy',
      'airpods-black-master-copy',
      'airpods-black',
      'apple-airpods-black-special-edition'
    ],
    name: 'Apple AirPods Black Colour Special Edition (Master Copy)',
    price: 1050,
    priceDisplay: '৳1,050',
    image: '/assets/aistudio/airbud_67ca99cb.webp',
    category: 'Audio & Wearables',
    isWinter: false,
    isMasterCopy: true,
    tagline: 'Matte Black Special Edition 1:1 Master Copy Earbuds',
    description:
      'Experience the sought-after stealth black aesthetic with this Master Copy Special Edition. Designed to replicate the iconic form factor with a velvet matte-black charging case and earbuds, it delivers rich stereo audio, punchy bass response, responsive touch sensor controls, and seamless Bluetooth connectivity at a fraction of the cost.',
    features: [
      'Master Copy Edition — Transparent 1:1 replica of the iconic design in stealth black',
      'Silky matte black anti-fingerprint coating on case and earbuds',
      'Touch-sensitive stem controls for play/pause, track skip, and call answering',
      'Bilateral call audio with integrated microphone',
      'Compatible with all iOS devices, Android smartphones, tablets, and laptops',
      'Compact charging case with front LED status light'
    ],
    specs: [
      { label: 'Edition', value: 'Master Copy Special Edition (Not Original Apple)' },
      { label: 'Color', value: 'Stealth Matte Black' },
      { label: 'Connectivity', value: 'Bluetooth 5.0 Wireless' },
      { label: 'Battery Life', value: 'Approx. 3–4 hours playback per charge' },
      { label: 'Charging Case', value: 'Recharges earbuds 3–4 times on full charge' },
      { label: 'In The Box', value: 'Pair of Earbuds, Charging Case, Lightning Cable, Manual' }
    ],
    stockStatus: 'In Stock (Ready to Dispatch)',
    deliveryInfo: 'Cash on delivery available across Bangladesh. Inspection upon doorstep handover.'
  },
  {
    id: 'paisley-hoodie-combo',
    slug: 'black-paisley-hoodie-combo',
    aliases: [
      'black-paisley-hoodie-dropshoulder-combo',
      'paisley-hoodie-combo',
      'black-paisley-hoodie'
    ],
    name: 'Black Paisley Hoodie & Dropshoulder Combo',
    price: 1400,
    priceDisplay: '৳1,400',
    originalPrice: 1600,
    originalPriceDisplay: '৳1,600',
    discountAmount: 200,
    discountDisplay: '৳200 OFF',
    image: '/assets/aistudio/hodie_and_dropshoulder_combo_48679659.jpg',
    category: 'Winter Collection',
    isWinter: true,
    tagline: 'Heavyweight Fleece Hoodie + Matching Drop-Shoulder Tee Set',
    description:
      'Make an unmistakable winter statement with this exclusive 2-in-1 combo from CORELUX. Includes a heavyweight black cotton-blend fleece hoodie and a relaxed-fit drop-shoulder graphic t-shirt. Both pieces feature intricate bandana-style paisley artwork across the back with crisp "Winter Top Fashion" typography.',
    features: [
      'Complete 2-piece set: 1x Heavyweight Fleece Hoodie + 1x Drop-shoulder T-Shirt',
      'High-density screen print bandana paisley back piece that won’t fade or peel',
      'Soft brushed thermal interior fleece for maximum warmth and comfort',
      'Relaxed drop-shoulder contemporary silhouette with double-stitched seams',
      'Roomy kangaroo front pocket and lined hood with durable drawstrings'
    ],
    specs: [
      { label: 'Item Set', value: '2 Pieces (1 Hoodie + 1 Dropshoulder Tee)' },
      { label: 'Fabric (Hoodie)', value: '300+ GSM Brushed Combed Cotton Fleece' },
      { label: 'Fabric (Tee)', value: '180 GSM Pure Combed Cotton' },
      { label: 'Available Sizes', value: 'L and XL' },
      { label: 'Print Detail', value: 'High-Density Bandana Paisley Screen Print' },
      { label: 'Care Instructions', value: 'Machine wash cold inside out, do not iron on print' }
    ],
    requiresSize: true,
    availableSizes: ['L', 'XL'],
    stockStatus: 'In Stock (Winter Edition)',
    deliveryInfo: 'Fast delivery across Bangladesh. Cash on delivery with check-before-pay.'
  },
  {
    id: 'solid-pullover-hoodie',
    slug: 'premium-solid-color-pullover-hoodie',
    aliases: [
      'solid-pullover-hoodie',
      'premium-solid-color-pullover-hoodie-for-men',
      'solid-color-pullover-hoodie'
    ],
    name: 'Premium Solid Color Pullover Hoodie for Men Without Print Solid Colour',
    price: 900,
    priceDisplay: '৳900',
    originalPrice: 1100,
    originalPriceDisplay: '৳1,100',
    discountAmount: 200,
    discountDisplay: '৳200 OFF',
    image: '/assets/aistudio/cloth_4_color_a5e579c8.png',
    category: 'Winter Collection',
    isWinter: true,
    tagline: 'Minimalist Heavyweight Thermal Pullover in 4 Essential Colorways',
    description:
      'The quintessential cold-weather essential. Built without loud graphics or branding, this solid-color pullover hoodie highlights clean lines, luxurious heavyweight thermal fleece, and tailored ribbed construction. Available in four sophisticated colorways: Off White, Navy Blue, Jet Black, and Coffee.',
    features: [
      'Pure solid minimalist aesthetic with no print or graphics',
      'Heavyweight organic cotton-poly blend fleece for substantial insulation',
      'Double-ply structured hood with metal-tipped matching drawstrings',
      'Ribbed stretch cuffs and bottom hem that maintain elasticity over time',
      'Large front kangaroo pocket for hands and daily essentials',
      'Choice of 4 timeless wardrobe essentials in sizes L and XL'
    ],
    specs: [
      { label: 'Product Type', value: 'Solid Color Men’s Pullover Hoodie' },
      { label: 'Fabric Weight', value: '320 GSM Heavyweight Brushed Thermal Fleece' },
      { label: 'Available Sizes', value: 'L, XL' },
      { label: 'Color Options', value: 'Off White, Navy Blue, Jet Black, Coffee' },
      { label: 'Hardware', value: 'Gunmetal Aglet Drawstrings' },
      { label: 'Origin', value: 'Proudly Crafted in Bangladesh' }
    ],
    requiresSize: true,
    availableSizes: ['L', 'XL'],
    requiresColor: true,
    availableColors: [
      { name: 'Off White', hex: '#EDE8DF', bgClass: 'bg-[#EDE8DF]' },
      { name: 'Navy Blue', hex: '#1C2942', bgClass: 'bg-[#1C2942]' },
      { name: 'Jet Black', hex: '#171717', bgClass: 'bg-[#171717]' },
      { name: 'Coffee', hex: '#634735', bgClass: 'bg-[#634735]' }
    ],
    stockStatus: 'In Stock (Winter Edition)',
    deliveryInfo: 'Cash on delivery across all districts. Delivered in 2–3 business days.'
  }
];

export const BRAND_CONFIG = {
  name: 'CORELUX',
  tagline: 'Premium Lifestyle, Winter Wear & Certified Tech',
  country: 'Bangladesh',
  currency: '৳',
  logo: '/assets/aistudio/WhatsApp_Image_2026-10-20_at_7.10.06_PM_bf06c2ad.jpeg',
  phone: '01967233934',
  phoneTel: 'tel:01967233934',
  whatsapp: '+8801967233934',
  whatsappLink: 'https://wa.me/8801967233934',
  facebookLink: 'https://www.facebook.com/share/1HdMsL33WF/',
  address: 'Dhaka, Bangladesh',
  supportHours: 'Everyday 9:00 AM – 11:00 PM'
};
