import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../data/products';

export type DeliveryArea = 'inside_dhaka' | 'outside_dhaka';

export interface CartItem {
  id: string; // unique item key: productId-size-color
  product: Product;
  quantity: number;
  selectedSize?: 'L' | 'XL';
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isCheckoutOpen: boolean;
  deliveryArea: DeliveryArea;
  setDeliveryArea: (area: DeliveryArea) => void;
  deliveryFee: number;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (product: Product, quantity?: number, size?: 'L' | 'XL', color?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalAmount: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'corelux_cart_v1';
const DELIVERY_KEY = 'corelux_delivery_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryArea, setDeliveryAreaState] = useState<DeliveryArea>(() => {
    try {
      const saved = localStorage.getItem(DELIVERY_KEY);
      return saved === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka';
    } catch {
      return 'inside_dhaka';
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  const setDeliveryArea = (area: DeliveryArea) => {
    setDeliveryAreaState(area);
    try {
      localStorage.setItem(DELIVERY_KEY, area);
    } catch {
      // ignore
    }
  };

  const openCart = () => {
    setIsCheckoutOpen(false);
    setIsOpen(true);
  };
  const closeCart = () => setIsOpen(false);

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const addItem = (
    product: Product,
    quantity = 1,
    size?: 'L' | 'XL',
    color?: string
  ) => {
    const key = `${product.id}-${size || 'default'}-${color || 'default'}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing) {
        return prev.map((i) =>
          i.id === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: key,
          product,
          quantity,
          selectedSize: size,
          selectedColor: color,
        },
      ];
    });

    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = items.length > 0 ? (deliveryArea === 'inside_dhaka' ? 70 : 130) : 0;
  const finalTotal = totalAmount + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isCheckoutOpen,
        deliveryArea,
        setDeliveryArea,
        deliveryFee,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalQuantity,
        totalAmount,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
