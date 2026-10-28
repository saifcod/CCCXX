import React from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../router';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, Truck } from 'lucide-react';
import { BRAND_CONFIG } from '../data/products';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    openCheckout,
    updateQuantity,
    removeItem,
    totalAmount,
    totalQuantity,
    deliveryArea,
    setDeliveryArea,
    deliveryFee,
    finalTotal,
  } = useCart();
  const { navigate } = useRouter();

  if (!isOpen) return null;

  // Prepare comprehensive WhatsApp order breakdown
  const orderListText = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product.name}${
          item.selectedSize ? ` (Size: ${item.selectedSize})` : ''
        }${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}\n   Unit: ৳${item.product.price} | Qty: ${item.quantity} | Total: ৳${
          item.product.price * item.quantity
        }`
    )
    .join('\n');

  const areaText =
    deliveryArea === 'inside_dhaka' ? 'Inside Dhaka (৳70)' : 'Outside Dhaka (৳130)';

  const fullWhatsappMessage = encodeURIComponent(
    `*NEW ORDER INQUIRY — CORELUX*\n\n*Items:*\n${orderListText}\n\n• Items Subtotal: ৳${totalAmount}\n• Delivery: ${areaText}\n• *Final Total Due: ৳${finalTotal}*\n• Payment: Cash on Delivery\n\nPlease confirm availability and dispatch schedule.`
  );

  const whatsappCheckoutUrl = `https://wa.me/8801967233934?text=${fullWhatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#E5DFD4] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#143D2B]" />
              <h2 className="text-base font-semibold text-[#1C2024] font-display">
                Shopping Bag ({totalQuantity})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-md text-[#7A828B] hover:text-[#1C2024] hover:bg-[#FAF8F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center text-[#8C6D2D]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-[#1C2024]">
                  Your shopping bag is empty
                </h3>
                <p className="text-xs text-[#6B7280] max-w-xs">
                  Discover our exclusive winter apparel and high-performance certified electronics.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/#featured-products');
                  }}
                  className="mt-2 min-h-[44px] px-5 py-2.5 bg-[#143D2B] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#0E2E20] transition-colors"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-lg border border-[#E8E2D5] flex gap-3 shadow-2xs"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-contain rounded bg-[#FAF8F5] border border-[#F0EBE1] p-1 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          onClick={() => {
                            closeCart();
                            navigate(`/products/${item.product.slug}`);
                          }}
                          className="text-xs sm:text-sm font-semibold text-[#1C2024] hover:text-[#143D2B] cursor-pointer font-sans leading-snug line-clamp-2"
                        >
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#9CA3AF] hover:text-red-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Preserved Hoodie Options (Size & Color) */}
                      <div className="flex items-center gap-2 text-[11px] text-[#7A828B] mt-0.5">
                        {item.selectedSize && (
                          <span className="font-medium text-[#143D2B]">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedSize && item.selectedColor && <span>·</span>}
                        {item.selectedColor && (
                          <span className="font-medium text-[#8C6D2D]">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>

                      {/* Unit Price Display */}
                      <div className="text-[11px] text-[#8F969E] mt-0.5">
                        Unit Price: ৳{item.product.price.toLocaleString()}
                      </div>
                    </div>

                    {/* Quantity Selector & Line Total */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F5EFE6]">
                      <div className="flex items-center border border-[#D5CDC0] rounded bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[#1C2024] hover:bg-[#FAF8F5] transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#1C2024]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[#1C2024] hover:bg-[#FAF8F5] transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#8F969E]">Line Total</div>
                        <div className="text-xs font-bold text-[#143D2B]">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Delivery Selection & Immediate Totals */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E8E2D5] bg-white space-y-3">
              {/* Delivery Option Selector */}
              <div className="space-y-1.5 pb-2 border-b border-[#F0EBE1]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C2024]">
                  <span>Delivery Destination</span>
                  <span className="text-[11px] font-normal text-[#8C6D2D]">
                    {deliveryArea === 'inside_dhaka' ? 'Inside Dhaka ৳70' : 'Outside Dhaka ৳130'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('inside_dhaka')}
                    className={`py-1.5 px-2 rounded-md border text-center transition-all ${
                      deliveryArea === 'inside_dhaka'
                        ? 'border-[#143D2B] bg-[#EAF5EF] text-[#143D2B] font-semibold'
                        : 'border-[#D5CDC0] bg-[#FAF8F5] text-[#525A62] hover:border-[#143D2B]'
                    }`}
                  >
                    <div>Inside Dhaka</div>
                    <div className="text-[11px] font-bold">৳70</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea('outside_dhaka')}
                    className={`py-1.5 px-2 rounded-md border text-center transition-all ${
                      deliveryArea === 'outside_dhaka'
                        ? 'border-[#143D2B] bg-[#EAF5EF] text-[#143D2B] font-semibold'
                        : 'border-[#D5CDC0] bg-[#FAF8F5] text-[#525A62] hover:border-[#143D2B]'
                    }`}
                  >
                    <div>Outside Dhaka</div>
                    <div className="text-[11px] font-bold">৳130</div>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#525A62]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1C2024]">
                    ৳{totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#143D2B]" />
                    <span>Delivery Charge</span>
                  </span>
                  <span className="font-bold text-[#143D2B]">৳{deliveryFee}</span>
                </div>

                <div className="flex justify-between font-bold text-sm text-[#1C2024] pt-2 border-t border-[#F0EBE1]">
                  <span>Final Total</span>
                  <span className="text-[#143D2B] text-base">
                    ৳{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <div className="space-y-2 pt-1">
                {/* Proceed to Checkout Button */}
                <button
                  type="button"
                  onClick={openCheckout}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                </button>

                {/* Direct WhatsApp Order */}
                <a
                  href={whatsappCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[42px] px-4 py-2 bg-[#1F2C24] hover:bg-[#142019] text-[#FAF8F5] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Order via WhatsApp (Summary Included)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
