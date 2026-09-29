'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, Shield, FileText, UserX, Menu, X, ArrowRight, Lock } from 'lucide-react';

export default function MerchantPublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0e0d0c]/95 backdrop-blur-md border-b border-white/10 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Subtitle */}
          <Link href="/merchant-portal" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#cd131b] to-[#7a0b10] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#E63946]" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  Lassi
                </span>
                <span className="text-xs font-bold text-[#E8B93D] tracking-widest mt-1">
                  LOUNGE
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#a8a49f] -mt-1">
                Merchant &amp; Partner Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#d8d4cf]">
            <Link href="/merchant-portal" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/merchant-privacy-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#e8b93d]" />
              <span>Privacy Policy</span>
            </Link>
            <Link href="/merchant-terms" className="hover:text-white transition-colors flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#e8b93d]" />
              <span>Terms of Service</span>
            </Link>
            <Link href="/merchant-account-deletion" className="hover:text-white transition-colors flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-[#e8b93d]" />
              <span>Delete Account</span>
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/restaurant-panel"
              className="bg-[#cd131b] hover:bg-[#a30f16] text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Merchant Sign In</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#d8d4cf] hover:text-white p-2"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#171514] border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/merchant-portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-white/5"
          >
            Merchant Overview
          </Link>
          <Link
            href="/merchant-privacy-policy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-white/5"
          >
            Merchant Privacy Policy
          </Link>
          <Link
            href="/merchant-terms"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-white/5"
          >
            Partner Terms &amp; Conditions
          </Link>
          <Link
            href="/merchant-account-deletion"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-white hover:bg-white/5"
          >
            Account Deletion Portal
          </Link>
          <div className="pt-2">
            <Link
              href="/restaurant-panel"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-[#cd131b] hover:bg-[#a30f16] text-white font-bold py-3 px-4 rounded-xl text-center block text-sm uppercase tracking-wider"
            >
              Merchant Sign In &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
