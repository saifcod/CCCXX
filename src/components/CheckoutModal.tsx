import React, { useState, useEffect } from 'react';
import { useCart, DeliveryArea } from '../context/CartContext';
import { useRouter } from '../router';
import { BRAND_CONFIG } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { saveOrderToFirestore } from '../lib/firebase';
import {
  X,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Phone,
  MessageCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  ArrowRight,
  ShoppingBag,
  UserCheck
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    items,
    isCheckoutOpen,
    closeCheckout,
    deliveryArea,
    setDeliveryArea,
    deliveryFee,
    totalAmount,
    finalTotal,
    clearCart,
  } = useCart();
  const { navigate } = useRouter();
  const { user, customerProfile } = useAuth();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [zipCode, setZipCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [trxIdOrSender, setTrxIdOrSender] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Target Google Apps Script Web App Webhook URL
  const GOOGLE_APPS_SCRIPT_WEBHOOK_URL =
    'https://script.google.com/macros/s/AKfycbyMG0LYS9dP7AJLjTFqFRp5cvJWPpnbvcZIFM-RIEZ6af4iClkbO9bz2KVKkLaCfCwv0w/exec';

  // Prefill name & email if customer is signed in
  useEffect(() => {
    if (user) {
      if (!email && user.email) {
        setEmail(user.email);
      }
      const rawName = customerProfile?.displayName || user.displayName || '';
      if (rawName && !firstName && !lastName) {
        const parts = rawName.trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
    }
  }, [user, customerProfile]);

  // Validation & Submission State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<null | {
    orderId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    deliveryArea: DeliveryArea;
    deliveryFee: number;
    paymentMethod: 'cod' | 'bkash' | 'nagad';
    trxIdOrSender?: string;
    subtotal: number;
    finalTotal: number;
    selectedProductSummary: string;
    itemsSummary: {
      productId?: string;
      productName?: string;
      name: string;
      size?: string;
      color?: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
  }>(null);

  if (!isCheckoutOpen) return null;

  // Validate Bangladeshi phone number: 013-019 followed by 8 digits, or with +88 prefix
  const validatePhone = (val: string) => {
    const cleaned = val.replace(/[\s-]/g, '');
    const regex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
    return regex.test(cleaned);
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleValidateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent repeated submissions

    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'Please enter your first name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter a valid Bangladesh mobile number.';
    } else if (!validatePhone(phone.trim())) {
      newErrors.phone =
        'Invalid Bangladesh number. Format: 01XXXXXXXXX (11 digits, e.g. 01967233934).';
    }

    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = 'Please provide your full delivery address (Road/House/Area).';
    }

    if (!city.trim() || city.trim().length < 2) {
      newErrors.city = 'Please enter your city / district.';
    }

    // Hoodie validation check in cart items
    for (const item of items) {
      if (item.product.requiresSize && !item.selectedSize) {
        newErrors.cart = `Size is required for ${item.product.name}.`;
      }
      if (item.product.requiresColor && !item.selectedColor) {
        newErrors.cart = `Colour is required for ${item.product.name}.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const orderNumber = `CLX-${Math.floor(100000 + Math.random() * 900000)}`;

    const itemsSummary = items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      name: item.product.name,
      size: item.selectedSize,
      color: item.selectedColor,
      quantity: item.quantity,
      unitPrice: item.product.price,
      lineTotal: item.product.price * item.quantity,
    }));

    // Generate readable string of selected products for Google Sheet column
    const selectedProductSummary = items
      .map((item) => {
        const details = [
          item.selectedSize ? `Size: ${item.selectedSize}` : '',
          item.selectedColor ? `Color: ${item.selectedColor}` : '',
        ]
          .filter(Boolean)
          .join(', ');
        return `${item.product.name}${details ? ` [${details}]` : ''} (Qty: ${item.quantity}, Price: ৳${item.product.price})`;
      })
      .join(' | ');

    const combinedFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const fullDeliveryAddress = `${address.trim()}${city.trim() ? `, ${city.trim()}` : ''}${zipCode.trim() ? ` - ${zipCode.trim()}` : ''}`;

    // Construct JSON payload with all required fields in multiple conventions
    const webhookPayload = {
      // Required fields as specified by user
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      "first name": firstName.trim(),
      "last name": lastName.trim(),
      fullName: combinedFullName,
      name: combinedFullName,
      email: email.trim(),
      Email: email.trim(),
      phone_number: phone.trim(),
      phoneNumber: phone.trim(),
      phone: phone.trim(),
      "phone number": phone.trim(),
      address: address.trim(),
      Address: address.trim(),
      city: city.trim(),
      City: city.trim(),
      zip_code: zipCode.trim(),
      zipCode: zipCode.trim(),
      "zip code": zipCode.trim(),
      selected_product: selectedProductSummary,
      selectedProduct: selectedProductSummary,
      "selected product": selectedProductSummary,
      total_amount: finalTotal,
      totalAmount: finalTotal,
      "total amount": finalTotal,
      // Comprehensive order metadata
      subtotal: totalAmount,
      delivery_fee: deliveryFee,
      deliveryFee: deliveryFee,
      delivery_zone: deliveryArea,
      deliveryZone: deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
      full_delivery_address: fullDeliveryAddress,
      payment_method: paymentMethod,
      paymentMethod: paymentMethod,
      trx_id: trxIdOrSender.trim(),
      order_id: orderNumber,
      orderId: orderNumber,
      order_number: orderNumber,
      items: itemsSummary,
      products: itemsSummary,
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Dispatch JSON to Google Apps Script Web App Endpoint
      try {
        await fetch(GOOGLE_APPS_SCRIPT_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(webhookPayload),
        });
        console.log('Order successfully posted to Google Apps Script Web App:', webhookPayload);
      } catch (gasErr) {
        console.warn('Google Apps Script webhook delivery error (continuing checkout):', gasErr);
      }

      // 2. Persist order to Firestore database
      await saveOrderToFirestore({
        orderNumber,
        customerId: user ? user.uid : '',
        customerEmail: email.trim() || (user ? user.email || '' : ''),
        customerName: combinedFullName,
        customerPhone: phone.trim(),
        deliveryAddress: fullDeliveryAddress,
        deliveryZone: deliveryArea,
        deliveryFee,
        subtotal: totalAmount,
        total: finalTotal,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'bkash',
        status: 'Pending Confirmation',
        items: itemsSummary.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          size: it.size || '',
          color: it.color || '',
          lineTotal: it.lineTotal,
        })),
        createdAt: new Date().toISOString(),
      });

      // 3. Set confirmation view
      setOrderConfirmed({
        orderId: orderNumber,
        fullName: combinedFullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: fullDeliveryAddress,
        city: city.trim(),
        zipCode: zipCode.trim(),
        deliveryArea,
        deliveryFee,
        paymentMethod,
        trxIdOrSender: trxIdOrSender.trim(),
        subtotal: totalAmount,
        finalTotal,
        selectedProductSummary,
        itemsSummary,
      });

      clearCart();
    } catch (err) {
      console.error('Order saving error: ', err);
      setErrors({
        submit:
          'Failed to record your order to our secure database. Please check your connection and tap Confirm Order again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (orderConfirmed) {
      setOrderConfirmed(null);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('Dhaka');
      setZipCode('');
      setTrxIdOrSender('');
      setCustomerNotes('');
    }
    closeCheckout();
  };

  // Generate WhatsApp Order Breakdown text
  const getConfirmationWhatsappUrl = () => {
    if (!orderConfirmed) return BRAND_CONFIG.whatsappLink;

    const itemsText = orderConfirmed.itemsSummary
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name}${it.size ? ` [Size: ${it.size}]` : ''}${
            it.color ? ` [Color: ${it.color}]` : ''
          } x${it.quantity} = ৳${it.lineTotal}`
      )
      .join('\n');

    const paymentLabel =
      orderConfirmed.paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : orderConfirmed.paymentMethod === 'bkash'
        ? `bKash Manual (Ref: ${orderConfirmed.trxIdOrSender || 'Pending'})`
        : `Nagad Manual (Ref: ${orderConfirmed.trxIdOrSender || 'Pending'})`;

    const areaLabel =
      orderConfirmed.deliveryArea === 'inside_dhaka'
        ? 'Inside Dhaka (৳70)'
        : 'Outside Dhaka (৳130)';

    const msg = encodeURIComponent(
      `*NEW ORDER CONFIRMATION — CORELUX*\nOrder Ref: #${orderConfirmed.orderId}\n\n*Customer Details:*\n• Name: ${orderConfirmed.fullName}\n• Phone: ${orderConfirmed.phone}\n• Address: ${orderConfirmed.address}\n\n*Order Items:*\n${itemsText}\n\n• Subtotal: ৳${orderConfirmed.subtotal}\n• Delivery: ${areaLabel}\n• *Total Due: ৳${orderConfirmed.finalTotal}*\n• Payment: ${paymentLabel}\n\nPlease confirm shipment schedule.`
    );

    return `https://wa.me/8801967233934?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 md:p-6 relative">
        <div className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-xl border border-[#E5DFD4] shadow-2xl overflow-hidden my-6">
          {/* Top Modal Header */}
          <div className="px-5 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-[#FAF8F5] border border-[#EBE5DB] p-0.5 flex items-center justify-center">
                <img
                  src={BRAND_CONFIG.logo}
                  alt="CORELUX"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1C2024] font-display">
                  {orderConfirmed ? 'Order Received' : 'CORELUX Secure Checkout'}
                </h2>
                <p className="text-[11px] text-[#8C6D2D] font-medium">
                  Direct Delivery across Bangladesh · Official Store
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-[#7A828B] hover:text-[#1C2024] hover:bg-[#FAF8F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONFIRMATION SCREEN */}
          {orderConfirmed ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#EAF5EF] text-[#143D2B] mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1C2024] font-display">
                  Thank You, {orderConfirmed.fullName}!
                </h3>
                <p className="text-xs text-[#525A62]">
                  Your order reference is{' '}
                  <span className="font-bold text-[#143D2B]">#{orderConfirmed.orderId}</span>. Our
                  team will call you at <strong className="text-[#1C2024]">{orderConfirmed.phone}</strong> to confirm delivery.
                </p>
              </div>

              {/* Status Notice */}
              <div className="p-3.5 bg-[#EAF5EF] border border-[#BDE8C9] rounded-lg text-xs text-[#143D2B] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Order Stored in Secure Database</span>
                </div>
                <p>
                  Your order has been recorded persistently and queued for immediate delivery dispatch. Our customer team will call your phone to verify before courier handover.
                </p>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="bg-white rounded-lg border border-[#E8E2D5] p-4 sm:p-5 text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-2 font-semibold text-[#1C2024]">
                  <span>Ordered Items</span>
                  <span>Amount</span>
                </div>

                <div className="space-y-2">
                  {orderConfirmed.itemsSummary.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-semibold text-[#1C2024] font-sans leading-snug">{item.name}</div>
                        <div className="text-[11px] text-[#7A828B]">
                          {item.size && <span>Size: {item.size} · </span>}
                          {item.color && <span>Color: {item.color} · </span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="font-semibold text-[#143D2B]">
                        ৳{item.lineTotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#F0EBE1] pt-3 space-y-1.5 text-[#525A62]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#1C2024]">
                      ৳{orderConfirmed.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Delivery (
                      {orderConfirmed.deliveryArea === 'inside_dhaka'
                        ? 'Inside Dhaka'
                        : 'Outside Dhaka'}
                      ):
                    </span>
                    <span className="font-semibold text-[#143D2B]">
                      ৳{orderConfirmed.deliveryFee}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#1C2024] pt-1.5 border-t border-[#F0EBE1]">
                    <span>Total Due:</span>
                    <span className="text-[#143D2B]">
                      ৳{orderConfirmed.finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#F0EBE1] pt-2.5 text-[11px] text-[#7A828B] space-y-1">
                  <div>
                    <strong className="text-[#1C2024]">Customer:</strong>{' '}
                    {orderConfirmed.fullName} ({orderConfirmed.phone})
                    {orderConfirmed.email && <span> · {orderConfirmed.email}</span>}
                  </div>
                  <div>
                    <strong className="text-[#1C2024]">Delivery Address:</strong>{' '}
                    {orderConfirmed.address}
                  </div>
                  <div>
                    <strong className="text-[#1C2024]">Payment:</strong>{' '}
                    {orderConfirmed.paymentMethod === 'cod'
                      ? 'Cash on Delivery (Pay upon arrival)'
                      : orderConfirmed.paymentMethod === 'bkash'
                      ? `bKash Manual (${orderConfirmed.trxIdOrSender || 'Manual verification'})`
                      : `Nagad Manual (${orderConfirmed.trxIdOrSender || 'Manual verification'})`}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {user && (
                  <button
                    onClick={() => {
                      handleClose();
                      navigate('/account');
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#143D2B] border border-[#BDE8C9] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <UserCheck className="w-4 h-4 text-[#16A34A]" />
                    <span>View in My Orders (Customer Account)</span>
                  </button>
                )}

                <a
                  href={getConfirmationWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] px-5 py-3 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Send Order to WhatsApp (+8801967233934)</span>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={BRAND_CONFIG.phoneTel}
                    className="min-h-[42px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Call Helpline ({BRAND_CONFIG.phone})</span>
                  </a>

                  <button
                    onClick={handleClose}
                    className="min-h-[42px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md flex items-center justify-center transition-colors"
                  >
                    <span>Back to Store</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <form onSubmit={handleValidateAndSubmit} className="p-4 sm:p-6 lg:p-8">
              {items.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-[#9CA3AF] mx-auto" />
                  <p className="text-sm font-medium text-[#1C2024]">Your cart is currently empty.</p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-[#143D2B] text-white text-xs font-semibold rounded-md"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  {/* Left Form: Customer Details, Delivery & Payment */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Signed-in / Guest Mode Indicator */}
                    {user ? (
                      <div className="p-3 bg-[#EAF5EF] border border-[#BDE8C9] rounded-lg text-xs text-[#143D2B] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                          <span>
                            Ordering as <strong>{user.email}</strong> · Order will be securely linked to your account.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-[#E8E2D5] rounded-lg text-xs text-[#6A717B] flex items-center justify-between gap-2">
                        <span>
                          <strong>Guest Checkout:</strong> You can place this order freely without creating an account.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            closeCheckout();
                            navigate('/signin');
                          }}
                          className="shrink-0 text-xs font-semibold text-[#143D2B] hover:underline"
                        >
                          Sign In
                        </button>
                      </div>
                    )}

                    {/* General Cart Error */}
                    {errors.cart && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errors.cart}</span>
                      </div>
                    )}

                    {/* Section 1: Customer Info */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D2D] pb-1 border-b border-[#E8E2D5]">
                        1. Customer Information
                      </h3>

                      {/* First Name & Last Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tanvir"
                            autoComplete="given-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:ring-1 ${
                              errors.firstName
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-[#D5CDC0] focus:border-[#C5A059] focus:ring-[#C5A059]'
                            }`}
                          />
                          {errors.firstName && (
                            <p className="text-[11px] text-red-600 mt-1">{errors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ahmed"
                            autoComplete="family-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-white border border-[#D5CDC0] rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                          />
                        </div>
                      </div>

                      {/* Email Address & Phone Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="customer@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:ring-1 ${
                              errors.email
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-[#D5CDC0] focus:border-[#C5A059] focus:ring-[#C5A059]'
                            }`}
                          />
                          {errors.email && (
                            <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            Phone Number (Bangladesh) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="019XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:ring-1 ${
                              errors.phone
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-[#D5CDC0] focus:border-[#C5A059] focus:ring-[#C5A059]'
                            }`}
                          />
                          {errors.phone ? (
                            <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
                          ) : (
                            <p className="text-[10px] text-[#7A828B] mt-0.5">
                              11-digit mobile number for order confirmation call.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                          Delivery Address (House/Road/Area) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="House/Holding no, Road no/name, Area, Thana"
                          autoComplete="street-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:ring-1 ${
                            errors.address
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-[#D5CDC0] focus:border-[#C5A059] focus:ring-[#C5A059]'
                          }`}
                        />
                        {errors.address && (
                          <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>
                        )}
                      </div>

                      {/* City & Zip Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            City / District <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dhaka, Chattogram, Sylhet"
                            autoComplete="address-level2"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full bg-white border rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:ring-1 ${
                              errors.city
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-[#D5CDC0] focus:border-[#C5A059] focus:ring-[#C5A059]'
                            }`}
                          />
                          {errors.city && (
                            <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                            Zip / Postal Code
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            placeholder="e.g. 1205"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-white border border-[#D5CDC0] rounded-md px-3 py-2 text-xs text-[#1C2024] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Delivery Area Selection (Inside Dhaka ৳70 vs Outside Dhaka ৳130) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D5]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D2D]">
                          2. Delivery Option
                        </h3>
                        <span className="text-[11px] text-[#7A828B]">Immediate Fee Update</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Inside Dhaka */}
                        <label
                          className={`relative flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            deliveryArea === 'inside_dhaka'
                              ? 'border-[#143D2B] bg-[#EAF5EF]/40 ring-1 ring-[#143D2B]'
                              : 'border-[#D5CDC0] bg-white hover:border-[#8C6D2D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryArea"
                            value="inside_dhaka"
                            checked={deliveryArea === 'inside_dhaka'}
                            onChange={() => setDeliveryArea('inside_dhaka')}
                            className="mt-1 text-[#143D2B] focus:ring-[#143D2B]"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between font-semibold text-[#1C2024]">
                              <span>Inside Dhaka</span>
                              <span className="text-[#143D2B] font-bold">৳70</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              Express 24–48 hours home delivery
                            </p>
                          </div>
                        </label>

                        {/* Outside Dhaka */}
                        <label
                          className={`relative flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            deliveryArea === 'outside_dhaka'
                              ? 'border-[#143D2B] bg-[#EAF5EF]/40 ring-1 ring-[#143D2B]'
                              : 'border-[#D5CDC0] bg-white hover:border-[#8C6D2D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryArea"
                            value="outside_dhaka"
                            checked={deliveryArea === 'outside_dhaka'}
                            onChange={() => setDeliveryArea('outside_dhaka')}
                            className="mt-1 text-[#143D2B] focus:ring-[#143D2B]"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between font-semibold text-[#1C2024]">
                              <span>Outside Dhaka</span>
                              <span className="text-[#143D2B] font-bold">৳130</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              All 64 districts (2–3 business days)
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section 3: Payment Method Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D5]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D2D]">
                          3. Payment Method
                        </h3>
                        <span className="text-[11px] text-[#143D2B] font-medium">
                          Cash on Delivery Available
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Cash on Delivery (Main) */}
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            paymentMethod === 'cod'
                              ? 'border-[#143D2B] bg-[#EAF5EF]/40 ring-1 ring-[#143D2B]'
                              : 'border-[#D5CDC0] bg-white hover:border-[#8C6D2D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="mt-1 text-[#143D2B] focus:ring-[#143D2B]"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-[#1C2024]">
                              <Banknote className="w-4 h-4 text-[#143D2B]" />
                              <span>Cash on Delivery (Main Payment Option)</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              Pay in cash to the delivery courier after parcel inspection at your doorstep.
                            </p>
                          </div>
                        </label>

                        {/* bKash Manual Payment */}
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            paymentMethod === 'bkash'
                              ? 'border-[#143D2B] bg-[#EAF5EF]/40 ring-1 ring-[#143D2B]'
                              : 'border-[#D5CDC0] bg-white hover:border-[#8C6D2D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bkash"
                            checked={paymentMethod === 'bkash'}
                            onChange={() => setPaymentMethod('bkash')}
                            className="mt-1 text-[#143D2B] focus:ring-[#143D2B]"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-[#E2136E]">
                              <CreditCard className="w-4 h-4" />
                              <span>bKash (Manual Payment)</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              Send Money / Payment to <strong>01967233934</strong>. Verified manually before dispatch.
                            </p>
                          </div>
                        </label>

                        {/* Nagad Manual Payment */}
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            paymentMethod === 'nagad'
                              ? 'border-[#143D2B] bg-[#EAF5EF]/40 ring-1 ring-[#143D2B]'
                              : 'border-[#D5CDC0] bg-white hover:border-[#8C6D2D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="nagad"
                            checked={paymentMethod === 'nagad'}
                            onChange={() => setPaymentMethod('nagad')}
                            className="mt-1 text-[#143D2B] focus:ring-[#143D2B]"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-[#F7941D]">
                              <CreditCard className="w-4 h-4" />
                              <span>Nagad (Manual Payment)</span>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              Send Money / Payment to <strong>01967233934</strong>. Verified manually before dispatch.
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Manual Payment Details Input for bKash or Nagad */}
                      {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                        <div className="p-3.5 bg-white rounded-lg border border-[#E0D9CC] space-y-2 mt-2">
                          <div className="text-[11px] text-[#525A62] space-y-1">
                            <p className="font-semibold text-[#1C2024]">
                              Manual {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Instructions:
                            </p>
                            <p>
                              1. Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} App or dial USSD.
                            </p>
                            <p>
                              2. Send Total Amount: <strong className="text-[#143D2B]">৳{finalTotal}</strong> to{' '}
                              <strong className="text-[#1C2024]">01967233934</strong>.
                            </p>
                            <p className="text-[10px] text-[#8C6D2D]">
                              * No automatic payment verification is claimed. Our team manually checks the transaction upon receiving your order.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#1C2024] mb-1">
                              Sender Number or Transaction ID (TrxID)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 01XXXXXXXXX or TrxID"
                              value={trxIdOrSender}
                              onChange={(e) => setTrxIdOrSender(e.target.value)}
                              className="w-full bg-[#FAF8F5] border border-[#D5CDC0] rounded px-2.5 py-1.5 text-xs text-[#1C2024] focus:outline-none focus:border-[#143D2B]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar: Order Summary & Instant Fee Calculation */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="bg-white rounded-lg border border-[#E8E2D5] p-4 sm:p-5 shadow-xs space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D2D] pb-2 border-b border-[#F0EBE1]">
                        Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                      </h3>

                      {/* Items list */}
                      <div className="divide-y divide-[#F0EBE1] max-h-56 overflow-y-auto pr-1 space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="pt-2 first:pt-0 flex gap-2.5 items-start">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 object-contain rounded bg-[#FAF8F5] border border-[#F0EBE1] shrink-0 p-0.5"
                            />
                            <div className="flex-1 min-w-0 text-xs">
                              <h4 className="font-semibold text-[#1C2024] font-sans leading-snug line-clamp-2">
                                {item.product.name}
                              </h4>
                              <div className="text-[11px] text-[#7A828B]">
                                {item.selectedSize && <span>Size: {item.selectedSize} · </span>}
                                {item.selectedColor && <span>Color: {item.selectedColor} · </span>}
                                <span>Unit: ৳{item.product.price}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[11px] text-[#525A62]">
                                  Qty: {item.quantity}
                                </span>
                                <span className="font-bold text-[#143D2B]">
                                  ৳{(item.product.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Calculation Breakdown */}
                      <div className="border-t border-[#F0EBE1] pt-3 space-y-2 text-xs text-[#525A62]">
                        <div className="flex justify-between">
                          <span>Items Subtotal</span>
                          <span className="font-semibold text-[#1C2024]">
                            ৳{totalAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#143D2B]" />
                            <span>
                              Delivery (
                              {deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                              )
                            </span>
                          </span>
                          <span className="font-bold text-[#143D2B]">৳{deliveryFee}</span>
                        </div>

                        <div className="border-t border-[#F0EBE1] pt-2 flex justify-between items-baseline text-sm font-bold text-[#1C2024]">
                          <span>Final Total</span>
                          <span className="text-base text-[#143D2B]">
                            ৳{finalTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-[#8C6D2D] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-[#C5A059]" />
                        <span>Cash on Delivery with physical parcel check.</span>
                      </div>
                    </div>

                    {/* Submit Button & Direct Call Notice */}
                    <div className="space-y-2">
                      {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
                          <span className="font-bold shrink-0">!</span>
                          <span>{errors.submit}</span>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full min-h-[48px] px-6 py-3 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? (
                          <span>Processing Order...</span>
                        ) : (
                          <>
                            <span>Confirm Order — ৳{finalTotal.toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                          </>
                        )}
                      </button>

                      <div className="text-center text-[11px] text-[#7A828B]">
                        Prefer ordering by phone? Call{' '}
                        <a
                          href={BRAND_CONFIG.phoneTel}
                          className="font-semibold text-[#143D2B] hover:underline"
                        >
                          {BRAND_CONFIG.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
