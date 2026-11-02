import React from 'react';
import { BRAND_CONFIG, PRODUCTS } from '../data/products';
import { useRouter } from '../router';
import { Phone, MessageCircle, ExternalLink, MapPin, Clock, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer id="contact-details" className="w-full max-w-full overflow-hidden bg-[#1C2024] text-[#E5E7EB] pt-12 pb-8 border-t border-[#33383F] scroll-mt-16 sm:scroll-mt-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#2E3339]">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-white p-1 flex items-center justify-center">
                <img
                  src={BRAND_CONFIG.logo}
                  alt="CORELUX Brand"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-[0.2em] text-[#FAF8F5] font-display">
                  CORELUX
                </h3>
                <p className="text-[10px] tracking-[0.2em] text-[#C5A059] uppercase font-semibold">
                  Bangladesh Official Store
                </p>
              </div>
            </div>

            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm">
              CORELUX delivers curated lifestyle goods, winter knitwear, and tested audio-visual equipment directly to customers across all 64 districts in Bangladesh with complete Cash on Delivery.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={BRAND_CONFIG.facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#282F36] hover:bg-[#343D46] text-[#FAF8F5] text-xs font-medium rounded-md border border-[#3E4650] transition-colors"
              >
                <span>Follow on Facebook</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
              </a>

              <a
                href={BRAND_CONFIG.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#143D2B] hover:bg-[#0E2E20] text-[#FAF8F5] text-xs font-medium rounded-md transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Catalog Quick Navigation */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
              Store Catalog
            </h4>
            <ul className="space-y-2 text-xs text-[#9CA3AF]">
              {PRODUCTS.map((prod) => (
                <li key={prod.id}>
                  <button
                    onClick={() => navigate(`/product/${prod.slug}`)}
                    className="hover:text-white transition-colors text-left flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="truncate">{prod.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Verified Contact Details Column */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
              Contact & Support
            </h4>

            <div className="space-y-2.5 text-xs text-[#9CA3AF]">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#D1D5DB]">Direct Helpline:</div>
                  <a
                    href={BRAND_CONFIG.phoneTel}
                    className="text-white hover:text-[#C5A059] font-medium transition-colors"
                  >
                    {BRAND_CONFIG.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#D1D5DB]">WhatsApp Customer Support:</div>
                  <a
                    href={BRAND_CONFIG.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#C5A059] font-medium transition-colors"
                  >
                    {BRAND_CONFIG.whatsapp}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#D1D5DB]">Dispatch Location:</div>
                  <div className="text-white">{BRAND_CONFIG.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#D1D5DB]">Helpline Schedule:</div>
                  <div className="text-white">{BRAND_CONFIG.supportHours}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Cash On Delivery Note */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B7280] gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} CORELUX. All rights reserved. Built for Bangladeshi Retail.</p>
          <div className="flex items-center gap-4 text-[#9CA3AF]">
            <span>Cash on Delivery (COD)</span>
            <span>·</span>
            <span>Doorstep Parcel Inspection</span>
            <span>·</span>
            <a
              href={BRAND_CONFIG.facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C5A059] hover:underline"
            >
              Official Facebook Page
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
