import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Lock
} from 'lucide-react';
import { FestivalFooterDecoration } from './festival/FestivalFooterDecoration';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-[#072C20] text-[#FAF7F2] border-t border-[#144234] pb-28 md:pb-12"
      aria-label="Official Footer"
    >
      <FestivalFooterDecoration />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block group" aria-label="ZaDa Foods Home">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/brand-emblem.png"
                  alt="ZaDa Foods Official Logo"
                  className="w-11 h-11 object-contain drop-shadow group-hover:scale-105 transition-transform"
                />
                <div>
                  <span className="font-serif font-bold text-2xl text-[#FAF7F2] tracking-tight block leading-none">
                    ZaDa
                  </span>
                  <span className="text-[10px] font-sans font-bold text-[#A67732] tracking-[0.25em] block uppercase mt-0.5">
                    FOODS
                  </span>
                </div>
              </div>
            </Link>

            <p className="text-xs font-serif font-semibold text-[#A67732] italic tracking-wide">
              "Authentic Kerala Flavours, Rooted in Tradition"
            </p>
            <p className="text-xs leading-relaxed text-[#D1C7B7]">
              Bringing authentic Kerala flavours and quality ingredients to your kitchen.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://wa.me/917593959235"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#052219] border border-[#144234] text-[#FAF7F2] text-xs font-semibold hover:border-[#A67732] hover:text-[#A67732] transition-colors"
                aria-label="ZaDa Foods WhatsApp Customer Care"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Care</span>
              </a>
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#FAF7F2] tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A67732]" />
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs text-[#D1C7B7]">
              <li>
                <Link to="/" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Shop Catalogue</span>
                </Link>
              </li>
              <li>
                <Link to="/our-story" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Our Story</span>
                </Link>
              </li>
              <li>
                <Link to="/bulk-enquiries" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Bulk Orders & Gifting</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" className="hover:text-[#A67732] transition-colors flex items-center gap-1.5 py-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A67732]/70" />
                  <span>Track Your Order</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Customer Support */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#FAF7F2] tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A67732]" />
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-xs text-[#D1C7B7]">
              <li>
                <div className="text-[11px] font-semibold text-[#A67732] uppercase tracking-wider mb-1">
                  Phone Numbers
                </div>
                <div className="space-y-1.5 pl-0.5">
                  <a
                    href="tel:+918891537982"
                    aria-label="Call +91 8891537982"
                    className="flex items-center gap-2 hover:text-[#A67732] transition-colors font-medium text-[#FAF7F2]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#A67732] shrink-0" />
                    <span>+91 8891537982</span>
                  </a>
                  <a
                    href="tel:+917593959235"
                    aria-label="Call +91 75939 59235"
                    className="flex items-center gap-2 hover:text-[#A67732] transition-colors font-medium text-[#FAF7F2]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#A67732] shrink-0" />
                    <span>+91 75939 59235</span>
                  </a>
                </div>
              </li>

              <li className="pt-1">
                <div className="text-[11px] font-semibold text-[#A67732] uppercase tracking-wider mb-1">
                  WhatsApp Support
                </div>
                <a
                  href="https://wa.me/917593959235"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp +91 75939 59235"
                  className="flex items-center gap-2 hover:text-[#A67732] transition-colors font-medium text-[#FAF7F2]"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>+91 75939 59235</span>
                </a>
              </li>

              <li className="pt-1">
                <div className="text-[11px] font-semibold text-[#A67732] uppercase tracking-wider mb-1">
                  Email Address
                </div>
                <a
                  href="mailto:Zadafoods4@gmail.com"
                  aria-label="Email Zadafoods4@gmail.com"
                  className="flex items-center gap-2 hover:text-[#A67732] transition-colors font-medium text-[#FAF7F2] break-all"
                >
                  <Mail className="w-3.5 h-3.5 text-[#A67732] shrink-0" />
                  <span>Zadafoods4@gmail.com</span>
                </a>
              </li>

              <li className="pt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#A67732]">
                <Link to="/shipping-policy" className="hover:underline">Shipping Policy</Link>
                <span>•</span>
                <Link to="/cancellation-refund-policy" className="hover:underline">Refund Policy</Link>
                <span>•</span>
                <Link to="/faq" className="hover:underline">FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — Manufacturer & Contact Information */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#FAF7F2] tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A67732]" />
              Manufacturer & Contact Information
            </h3>

            <div className="space-y-1 text-xs">
              <p className="text-[11px] font-semibold text-[#A67732] uppercase tracking-wider">
                Manufactured By
              </p>
              <p className="font-serif font-bold text-sm text-[#FAF7F2] tracking-wide">
                ZADA FOODS
              </p>
              <div className="pt-0.5">
                <p className="text-[10px] text-[#A67732] font-semibold uppercase tracking-wider">Registered Business Address</p>
                <div className="flex items-start gap-2 text-xs text-[#D1C7B7] pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#A67732] shrink-0 mt-0.5" />
                  <span>Punalur, Kollam (Dist), Kerala – 691305</span>
                </div>
              </div>
            </div>

            {/* FSSAI Badge & License Information */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#052219] border border-[#144234] shadow-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#A67732] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#A67732] font-bold tracking-wider uppercase block">
                    Food Safety & Standards Authority of India
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[10px] text-[#D1C7B7] uppercase font-semibold">FSSAI Lic. No:</span>
                    <span className="font-mono font-bold text-xs text-[#FAF7F2] tracking-wider">
                      21326145000345
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A67732]/90 block mt-0.5 font-medium">
                    100% Verified Quality & Hygiene Standard
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-footer Separator & Copyright */}
        <div className="mt-10 pt-6 border-t border-[#144234] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D1C7B7]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-[#FAF7F2] font-semibold">ZADA FOODS</strong>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-[#A67732] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#A67732] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#FAF7F2]">
              <Lock className="w-3 h-3 text-[#A67732]" />
              <span>256-bit SSL Secure Checkout</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
