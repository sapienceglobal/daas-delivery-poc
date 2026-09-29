'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Shield, FileText, UserX, Phone, Mail, MapPin, Lock } from 'lucide-react';

export default function MerchantPublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0e0d0c] text-white border-t border-white/10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#cd131b] to-[#7a0b10] flex items-center justify-center text-white shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#E63946]" style={{ fontFamily: 'Dancing Script, cursive' }}>
                    Lassi
                  </span>
                  <span className="text-xs font-bold text-[#E8B93D] tracking-widest mt-1">
                    LOUNGE
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-[#a8a49f]">
                  Restaurant Operations &amp; Partner Platform
                </p>
              </div>
            </div>

            <p className="text-sm text-[#d8d4cf] max-w-md leading-relaxed">
              Official merchant portal and mobile operating systems powering orders, dispatch, and kitchen display infrastructure for Lassi Lounge NY.
            </p>

            <div className="pt-2">
              <Link
                href="/restaurant-panel"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#e8b93d] hover:text-white uppercase tracking-wider transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Authorized Staff Portal Sign In &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Legal / Policy Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#e8b93d]">
              Partner Policies
            </h4>
            <ul className="space-y-2 text-sm text-[#d8d4cf]">
              <li>
                <Link href="/merchant-privacy-policy" className="hover:text-white transition-colors">
                  Merchant Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/merchant-terms" className="hover:text-white transition-colors">
                  Merchant Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/merchant-account-deletion" className="hover:text-white transition-colors">
                  Account Deletion Request
                </Link>
              </li>
              <li>
                <Link href="/merchant-portal" className="hover:text-white transition-colors">
                  Merchant App Showcase
                </Link>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#e8b93d]">
              Partner Desk
            </h4>
            <ul className="space-y-2 text-sm text-[#d8d4cf]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#e8b93d]" />
                <a href="tel:+13472333733" className="hover:text-white transition-colors">+1 347-233-3733</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#e8b93d]" />
                <a href="mailto:info@lassilounge.com" className="hover:text-white transition-colors">info@lassilounge.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#e8b93d] shrink-0 mt-0.5" />
                <span>9408 118th St, South Richmond Hill, NY 11419</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#a8a49f] gap-4">
          <p>© {currentYear} Lassi Lounge NY. All rights reserved. Partner &amp; Merchant Operations.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Customer Website &rarr;
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
