'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, 
  ChefHat, 
  Printer, 
  TrendingUp, 
  BellRing, 
  Layers, 
  ShieldCheck, 
  Smartphone, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  Headphones,
  FileText
} from 'lucide-react';

export default function MerchantPortalSection() {
  const features = [
    {
      icon: <BellRing className="w-7 h-7 text-[#cd131b]" />,
      title: 'Real-Time Order Dispatch',
      description: 'Loud, customizable audio chimes and high-priority push notifications ensure zero missed orders during peak dinner rushes.',
      tag: 'Zero Latency',
    },
    {
      icon: <ChefHat className="w-7 h-7 text-[#cd131b]" />,
      title: 'Smart Kitchen Display (KDS)',
      description: 'Stage-by-stage preparation tracking (Pending &rarr; Accepted &rarr; In Kitchen &rarr; Ready) with live elapsed timers for chefs.',
      tag: 'Kitchen Optimized',
    },
    {
      icon: <Printer className="w-7 h-7 text-[#cd131b]" />,
      title: 'Wireless Thermal Printing',
      description: 'Plug-and-play Bluetooth & Ethernet ESC/POS 58mm/80mm receipt printers with automated two-copy printing (Kitchen & Customer).',
      tag: 'Hardware Ready',
    },
    {
      icon: <Layers className="w-7 h-7 text-[#cd131b]" />,
      title: 'Live 86ing & Menu Control',
      description: 'Instantly toggle dish availability, update modifiers, and manage category ordering across mobile apps and web in one tap.',
      tag: 'Real-Time Sync',
    },
    {
      icon: <TrendingUp className="w-7 h-7 text-[#cd131b]" />,
      title: 'Sales & Settlement Analytics',
      description: 'Monitor gross daily revenue, top-selling items, tips distribution, and automated Stripe bank disbursements with exportable reports.',
      tag: 'Financial Insights',
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-[#cd131b]" />,
      title: 'Role-Based Staff Access',
      description: 'Assign distinct credentials for Cashiers, Kitchen Line Cooks, and General Managers with restricted financial permissions.',
      tag: 'Enterprise Security',
    },
  ];

  return (
    <div className="bg-[#faf9f8] text-[#1a1a1a] overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-[#0e0d0c] via-[#1a1817] to-[#0e0d0c] text-white">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#cd131b]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#e8a020]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#e8b93d] text-xs font-bold uppercase tracking-wider mb-6 border border-white/10 backdrop-blur-md">
              <Store className="w-4 h-4" />
              <span>Official Restaurant Operations Hub &bull; Lassi Lounge NY</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-serif tracking-tight leading-tight mb-6">
              Empowering High-Velocity <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e8b93d] via-[#f3d485] to-[#e8b93d]">
                Kitchen &amp; Store Operations
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#d8d4cf] leading-relaxed mb-10 max-w-2xl mx-auto">
              Purpose-built Android tablet and mobile technology for Lassi Lounge store managers, chefs, and dispatchers to fulfill orders with precision.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/login"
                className="bg-[#cd131b] hover:bg-[#a30f16] text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-[#cd131b]/30 transition-all flex items-center gap-2 text-base"
              >
                <span>Launch Merchant Web Portal</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#download"
                className="bg-white/10 hover:bg-white/15 text-white font-bold py-4 px-8 rounded-2xl border border-white/20 transition-all flex items-center gap-2 text-base backdrop-blur-md"
              >
                <Smartphone className="w-5 h-5 text-[#e8b93d]" />
                <span>Get Merchant Android App</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#1a1a1a] mb-4">
              Designed For High-Volume Restaurant Demands
            </h2>
            <p className="text-[#6b7280] text-lg">
              Engineered with zero latency to maintain kitchen momentum from initial ticket bell to customer handoff.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-[#e5e7eb] shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#fdecec] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {feat.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#faf9f8] text-[#7a0b10] border border-[#e5e7eb]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-3">
                    {feat.title}
                  </h3>

                  <p className="text-[#4b5563] text-sm leading-relaxed mb-6">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f3f4f6] flex items-center gap-1 text-xs font-bold text-[#cd131b]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Integrated in Merchant App v1.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Compatibility Section */}
      <section className="py-16 bg-white border-y border-[#e5e7eb]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fdecec] text-[#a30f16] text-xs font-bold uppercase tracking-wider mb-4">
                <Printer className="w-3.5 h-3.5" />
                <span>Printer &amp; Hardware Support</span>
              </div>
              <h2 className="text-3xl font-bold font-serif text-[#1a1a1a] mb-4">
                Tested With Industry Standard POS Hardware
              </h2>
              <p className="text-[#4b5563] leading-relaxed mb-6">
                Connect seamlessly to 58mm and 80mm wireless thermal receipt printers over Bluetooth or Local Wi-Fi network without requiring third-party print spoolers.
              </p>
              <ul className="space-y-3 text-sm text-[#1a1a1a]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                  <span>Epson &amp; Star Micronics ESC/POS protocol compatibility</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                  <span>Sunmi, Rongta, Xprinter portable Bluetooth handhelds</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                  <span>Optimized for Android 8.0 through Android 15 tablets &amp; smartphones</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#faf9f8] p-8 rounded-3xl border border-[#e5e7eb] text-center">
              <Printer className="w-16 h-16 text-[#7a0b10] mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-2">
                Automated Kitchen Ticket Print
              </h3>
              <p className="text-sm text-[#6b7280] mb-6">
                When an order arrives, accept it in one click to trigger automatic printouts with item notes, spice levels, and customer delivery instructions.
              </p>
              <div className="p-3 bg-white rounded-xl border border-[#e5e7eb] font-mono text-xs text-[#7a0b10] font-semibold">
                Auto-Print &bull; Dual Copies &bull; ESC/POS Native
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download / Store Link Section */}
      <section id="download" className="py-20 bg-[#faf9f8]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-[#4a090b] rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#e8b93d]">
                <Smartphone className="w-8 h-8" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
                Download Lassi Lounge Merchant App
              </h2>

              <p className="text-white/80 text-base leading-relaxed mb-8">
                Install the official partner application on your restaurant tablets and managerial phones to oversee live orders, kitchen prep, and inventory on the go.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.lassilounge.merchant_mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#e8b93d] hover:bg-[#d68f13] text-[#0e0d0c] font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-colors flex items-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  <span>Google Play Store (Android)</span>
                </a>

                <a
                  href="/login"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-8 rounded-2xl border border-white/20 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Web Portal Login</span>
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
                <Link href="/merchant-privacy-policy" className="hover:text-white underline">
                  Merchant Privacy Policy
                </Link>
                <span>&bull;</span>
                <Link href="/merchant-terms" className="hover:text-white underline">
                  Merchant Terms of Service
                </Link>
                <span>&bull;</span>
                <Link href="/delete-account" className="hover:text-white underline">
                  Account Deletion Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Contacts Footer */}
      <section className="py-12 bg-white border-t border-[#e5e7eb]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="w-10 h-10 bg-[#fdecec] text-[#cd131b] rounded-xl flex items-center justify-center mx-auto mb-3">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold font-serif text-[#1a1a1a] mb-1">
            Restaurant Operations &amp; Partner Support
          </h3>
          <p className="text-sm text-[#6b7280] mb-3">
            Available 7 days a week for hardware configuration, printer troubleshooting, and live menu assistance.
          </p>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            Phone: <a href="tel:+13472333733" className="text-[#cd131b] hover:underline">+1 347-233-3733</a> &bull; Email: <a href="mailto:info@lassilounge.com" className="text-[#cd131b] hover:underline">info@lassilounge.com</a>
          </p>
          <p className="text-xs text-[#9ca3af] mt-1">
            Lassi Lounge NY &bull; 9408 118th St, South Richmond Hill, NY 11419
          </p>
        </div>
      </section>
    </div>
  );
}
