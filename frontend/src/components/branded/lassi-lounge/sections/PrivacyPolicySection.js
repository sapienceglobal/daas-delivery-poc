'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Smartphone, 
  MapPin, 
  UserX, 
  Server, 
  CheckCircle2, 
  Bell, 
  CreditCard,
  Mail,
  ArrowRight
} from 'lucide-react';

export default function PrivacyPolicySection() {
  const trustHighlights = [
    { icon: Lock, label: 'TLS 1.3 Encryption' },
    { icon: CreditCard, label: 'PCI-DSS Stripe Gateways' },
    { icon: Bell, label: 'FCM Push Notification IDs' },
    { icon: UserX, label: 'In-App Account Deletion' },
    { icon: Shield, label: 'Zero Data Broker Sharing' },
  ];

  const policies = [
    {
      number: "01",
      badge: "Security & Encryption",
      icon: <Shield className="w-6 h-6 text-[#7a0b10]" />,
      title: "Data Protection & Security Standards",
      summary: "Industry-standard cryptographic protocols ensuring confidential data transit and PCI-DSS financial security.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            We implement comprehensive administrative, technical, and physical safeguards designed to protect personal and transactional data against unauthorized access, destruction, loss, or alteration.
          </p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Transport Encryption:</strong> All communications between your client device and our servers are encrypted in-flight using Transport Layer Security (TLS 1.3 / HTTPS).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>PCI-DSS Certified Payments:</strong> Payment card information (credit/debit card numbers, CVVs) is transmitted directly to our PCI-DSS Level 1 certified gateway partner (Stripe) through tokenized elements. Lassi Lounge servers never receive, store, or view your raw payment card credentials.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "02",
      badge: "Account & Profile",
      icon: <Eye className="w-6 h-6 text-[#7a0b10]" />,
      title: "Personal Information We Collect",
      summary: "Directly provided customer credentials required to fulfill food preparation, delivery, and loyalty accounts.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            When you register, place an order, or participate in the Lassi Lounge loyalty rewards program, we collect the necessary customer details to fulfill your requests:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block mb-1 text-sm">Customer Identity</span>
              <span className="text-xs sm:text-sm text-[#6b7280]">Full name, email address, contact phone number, and account password hash.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block mb-1 text-sm">Fulfillment Details</span>
              <span className="text-xs sm:text-sm text-[#6b7280]">Delivery street addresses, special culinary instructions, order receipt history, and loyalty reward tiers.</span>
            </div>
          </div>
          <p className="text-xs text-[#6b7280] italic">
            * For users signing in with third-party identity providers (Google Sign-In or Apple Sign-In), we receive your verified profile name and email address to authenticate your identity without creating a duplicate password.
          </p>
        </div>
      ),
    },
    {
      number: "03",
      badge: "Google Play & App Store Compliance",
      icon: <Smartphone className="w-6 h-6 text-[#7a0b10]" />,
      title: "Device or Other Identifiers (Device & App Information)",
      summary: "Strictly collected for real-time order tracking push notifications, session routing, and security diagnostics.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            In accordance with Google Play Data Safety and Apple App Store Review Guidelines, we disclose that our mobile application collects <strong>Device or Other Identifiers</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="font-semibold text-[#7a0b10] text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#e8a020]" />
              Types of Device Identifiers Collected:
            </div>
            <p className="text-xs sm:text-sm text-[#4b5563]">
              Firebase Cloud Messaging (FCM) registration tokens, mobile operating system version (iOS / Android), device manufacturer model, unique app instance installation IDs, and temporary IP addresses.
            </p>
          </div>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Purpose of Collection:</strong> Real-time push notifications regarding food prep stage, delivery dispatch arrival, account session security, preventing fraudulent multi-account coupon abuse, and diagnostics.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Data Handling & Advertising Policy:</strong> Device identifiers are transmitted securely off-device solely for functional app features and account management. <strong>We do not sell, license, or provide device identifiers to third-party ad networks or data brokers for behavioral targeting.</strong></span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "04",
      badge: "Delivery Radius",
      icon: <MapPin className="w-6 h-6 text-[#7a0b10]" />,
      title: "Location Data Usage",
      summary: "Geographical coordinates used exclusively with your permission to calculate delivery distance and dispatch couriers.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            When using our mobile app or web ordering system, you may grant permission to detect your coarse or precise device location (GPS).
          </p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Operational Purpose:</strong> We evaluate delivery proximity, confirm our restaurant serves your address, estimate delivery travel times, and provide real-time courier tracking through our dispatch logistics system.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>User Choice:</strong> Location permissions are completely optional. You may decline device GPS permissions and manually enter your street address and apartment number at checkout at any time.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "05",
      badge: "Transparency",
      icon: <FileText className="w-6 h-6 text-[#7a0b10]" />,
      title: "How We Use & Share Information",
      summary: "Customer information is processed solely for order fulfillment, dispatch logistics, and transactional updates.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Lassi Lounge maintains an unwavering commitment to customer privacy. We do not sell, trade, or monetize customer data. We share relevant details solely with trusted operational partners required to deliver our service:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb] text-center">
              <span className="font-bold text-[#1a1a1a] block text-sm mb-0.5">Kitchen & Staff</span>
              <span className="text-xs text-[#6b7280]">Item preparations, dietary instructions & pickup orders.</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb] text-center">
              <span className="font-bold text-[#1a1a1a] block text-sm mb-0.5">Delivery Couriers</span>
              <span className="text-xs text-[#6b7280]">Delivery address, customer name & contact for drop-off.</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb] text-center">
              <span className="font-bold text-[#1a1a1a] block text-sm mb-0.5">Payment Processors</span>
              <span className="text-xs text-[#6b7280]">Direct encrypted card authorization via Stripe.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "06",
      badge: "User Rights & Data Freedom",
      icon: <UserX className="w-6 h-6 text-[#7a0b10]" />,
      title: "Account Deletion & Data Retention Rights",
      summary: "Full self-service account deletion directly inside the app with two-layer password or email OTP verification.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            In compliance with Apple App Store Guideline 5.1.1(v) and Google Play user data policies, every user has the absolute right to permanently delete their account and associated personal data.
          </p>
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80 space-y-2">
            <span className="font-bold text-[#7a0b10] text-sm block">How to Delete Your Account:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-[#4b5563]">
              <li>Open the <strong>Lassi Lounge Mobile App</strong> and tap on <strong>Profile</strong>.</li>
              <li>Scroll down to the Danger Zone and tap <strong>Delete Account</strong>.</li>
              <li>Confirm your identity: enter your <strong>Account Password</strong>, or request a <strong>6-digit Email Verification OTP</strong> if logged in via Google/Apple.</li>
              <li>Type <code className="bg-red-100 text-[#7a0b10] px-1.5 py-0.5 rounded font-mono text-xs font-bold">DELETE</code> and tap Confirm.</li>
            </ol>
          </div>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Upon deletion, your profile, contact credentials, saved delivery addresses, active session tokens, and loyalty rewards points are permanently purged from our primary operational databases. You may also request deletion via email at <a href="mailto:projects.sapience@gmail.com" className="text-[#7a0b10] font-semibold underline">projects.sapience@gmail.com</a>.
          </p>
        </div>
      ),
    },
    {
      number: "07",
      badge: "Web Sessions",
      icon: <Lock className="w-6 h-6 text-[#7a0b10]" />,
      title: "Cookies & Session Storage",
      summary: "Essential first-party storage to maintain cart items, theme preferences, and active authenticated sessions.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Our web platform uses essential first-party cookies and modern local browser storage solely to remember the items currently in your shopping cart, preserve your active login session, and respect your ordering preferences across page refreshes.
          </p>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            We do not use third-party tracking cookies across unassociated websites. You may disable cookies via your browser settings, though doing so may prevent checkout completion.
          </p>
        </div>
      ),
    },
    {
      number: "08",
      badge: "Partners & Infrastructure",
      icon: <Server className="w-6 h-6 text-[#7a0b10]" />,
      title: "Third-Party Service Providers",
      summary: "Trusted global infrastructure partners adhering to international privacy and security standards.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            We partner with premier infrastructure services to deliver seamless, secure ordering:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block text-sm">Stripe, Inc.</span>
              <span className="text-xs text-[#6b7280]">PCI-DSS Level 1 payment gateway handling tokenized credit card transactions.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block text-sm">Google Firebase</span>
              <span className="text-xs text-[#6b7280]">Encrypted push notification delivery (FCM) and authentication infrastructure.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block text-sm">Google Maps & OpenStreetMap</span>
              <span className="text-xs text-[#6b7280]">Geocoding, address autocomplete, and delivery distance calculations.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb]">
              <span className="font-bold text-[#1a1a1a] block text-sm">Shipday Logistics</span>
              <span className="text-xs text-[#6b7280]">Automated courier routing and live delivery tracking dispatch.</span>
            </div>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="w-full flex flex-col bg-[#faf9f8]">
      {/* 1. Luxury Dark Hero Section (Aligned with Lassi Lounge Brand Aesthetic) */}
      <section className="relative w-full bg-[#0e0d0c] overflow-hidden py-16 lg:py-24 select-none border-b border-[#ffffff]/10">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/branded/lassi-lounge/about/hero-bg.jpg"
            alt="Lassi Lounge luxury ambient dining background"
            className="w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-transparent to-[#0e0d0c]/40" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1300px] px-6 lg:px-8 flex flex-col items-start space-y-5">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-[#d1d5db] mb-1">
            <Link href="/" className="hover:text-[#ffffff] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span className="text-[#ffffff]">Privacy Policy</span>
          </nav>

          {/* Heading Block */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-[34px] sm:text-[44px] md:text-[54px] lg:text-[56px] font-serif font-black tracking-tight leading-[1.1]">
              <span className="text-[#ffffff] block">Privacy Policy &</span>
              <span className="text-[#e8a020] block">Data Safety</span>
            </h1>

            {/* Script Subtitle with Decorative Arrows */}
            <div className="flex items-center gap-3 py-2 flex-wrap">
              <svg width="32" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M40 7H4M4 7L10 1M4 7L10 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
              </svg>
              <span 
                className="text-[#ffffff] text-[20px] md:text-[26px] font-medium px-1" 
                style={{ fontFamily: 'var(--font-script, cursive)', fontStyle: 'italic' }}
              >
                Trust, Transparency & Safety
              </span>
              <svg width="32" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M0 7H36M36 7L30 1M36 7L30 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
              </svg>
            </div>

            <p className="text-[#e5e7eb] text-[14px] md:text-[15px] leading-relaxed max-w-[620px] font-medium pt-1">
              How Lassi Lounge protects your personal information, device identifiers, and data rights across our mobile application and web ordering platform.
            </p>
          </div>

          {/* Trust Highlights Strip */}
          <div className="pt-4 flex flex-wrap gap-2.5 sm:gap-3">
            {trustHighlights.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium shadow-sm hover:bg-white/15 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-[#e8a020]" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Main Content Cards Section */}
      <section className="relative py-16 sm:py-24 bg-[#faf9f8]">
        {/* Soft Ambient Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#7a0b10]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e8a020]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Info Note */}
          <div className="mb-10 p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7a0b10]/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#7a0b10]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-[#7a0b10]">Compliance Standard</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">Google Play Data Safety & Apple App Review Certified</p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#faf9f8] border border-[#e5e7eb] text-[#6b7280]">
              Effective & Updated: November 2026
            </div>
          </div>

          {/* Structured Policy Cards */}
          <div className="space-y-6">
            {policies.map((policy, idx) => (
              <div 
                key={idx} 
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e5e7eb] hover:shadow-[0_8px_24px_rgba(122,11,16,0.06)] hover:border-[#7a0b10]/30 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Accent top gradient line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#7a0b10]/30 to-transparent group-hover:via-[#7a0b10] transition-colors" />

                <div className="flex flex-col md:flex-row gap-5 items-start">
                  
                  {/* Left Icon & Number Pod */}
                  <div className="flex md:flex-col items-center gap-3 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#7a0b10]/5 group-hover:bg-[#7a0b10]/10 border border-[#7a0b10]/15 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                      {policy.icon}
                    </div>
                    <span className="text-xs font-black tracking-widest text-[#9ca3af] font-mono">
                      {policy.number}
                    </span>
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7a0b10]/10 text-[#7a0b10]">
                        {policy.badge}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1a1a1a] tracking-tight">
                      {policy.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#7a0b10] font-medium pb-2">
                      {policy.summary}
                    </p>

                    <div className="pt-1">
                      {policy.content}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Bottom Assistance & Contact Banner */}
          <div className="mt-14 relative overflow-hidden rounded-3xl bg-[#0e0d0c] border border-white/10 p-8 sm:p-12 text-center text-white shadow-xl">
            <div className="absolute inset-0 z-0">
              <img
                src="/images/branded/lassi-lounge/about/hero-bg.jpg"
                alt="Background"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-[#e8a020] mb-1">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif">
                Questions Regarding Privacy or Data Deletion?
              </h3>
              <p className="text-sm sm:text-base text-[#d1d5db] leading-relaxed">
                If you have questions regarding our data practices, or wish to request assistance with personal data deletion or access rights, our privacy support team is ready to assist.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="mailto:projects.sapience@gmail.com" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e8a020] text-[#0e0d0c] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#ffb020] transition-colors shadow-md"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Privacy Support</span>
                </a>
                <Link 
                  href="/contact-us" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/20 transition-colors"
                >
                  <span>Visit Contact Us</span>
                  <ArrowRight className="w-4 h-4 text-[#e8a020]" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
