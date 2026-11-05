'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  ScrollText, 
  UserCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Truck, 
  Sparkles,
  HelpCircle,
  Mail,
  ArrowRight
} from 'lucide-react';

export default function TermsConditionsSection() {
  const termsHighlights = [
    { icon: ScrollText, label: 'Fair Service Terms' },
    { icon: UserCheck, label: 'Self-Serve Account Rights' },
    { icon: CreditCard, label: 'Secure Stripe Payments' },
    { icon: Truck, label: 'Reliable Order Fulfillment' },
    { icon: Sparkles, label: 'Rewarding Loyalty Program' },
  ];

  const terms = [
    {
      number: "01",
      badge: "Agreement",
      icon: <ScrollText className="w-6 h-6 text-[#7a0b10]" />,
      title: "1. Acceptance of Terms & Conditions",
      summary: "Binding terms governing access, online ordering, and interactions across our digital platforms.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            By downloading, browsing, creating an account, or placing food orders via the <strong>Lassi Lounge</strong> website (<code>lassiloungeny.com</code>) or official mobile application (iOS & Android), you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions along with our Privacy Policy.
          </p>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            If you do not agree with any portion of these terms, please discontinue use of our platform immediately.
          </p>
        </div>
      ),
    },
    {
      number: "02",
      badge: "Account Security & Deletion",
      icon: <UserCheck className="w-6 h-6 text-[#7a0b10]" />,
      title: "2. Account Registration, Passwords & Deletion",
      summary: "Account responsibility and in-app self-service deletion secured by password or email OTP verification.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            You agree to provide true, accurate, and up-to-date information when registering your account. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <span className="font-bold text-[#7a0b10] text-sm block">Account Deletion Rights:</span>
            <p className="text-xs sm:text-sm text-[#4b5563]">
              You may terminate and permanently delete your account at any time directly through the Mobile App under <strong>Profile → Delete Account</strong>. To prevent accidental or unauthorized deletion, users with a password must enter their password, and pure social accounts (Google/Apple) verify ownership via a 6-digit email OTP.
            </p>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      badge: "Orders & Payments",
      icon: <CreditCard className="w-6 h-6 text-[#7a0b10]" />,
      title: "3. Online Orders, Pricing & Payment Processing",
      summary: "Kitchen item availability, tax breakdowns, and secure encrypted checkout through Stripe.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            All orders placed through our website or mobile app are subject to kitchen acceptance and ingredient availability. Prices, applicable sales taxes, and delivery fees are transparently itemized prior to final checkout submission.
          </p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Secure Checkout:</strong> Digital payments are processed securely by Stripe, Inc. We do not store full payment card numbers or security CVV codes on our servers.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7a0b10] shrink-0 mt-1" />
              <span><strong>Order Confirmation:</strong> An order is confirmed once payment authorization is received and your order receipt appears on-screen.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: "04",
      badge: "Kitchen Policy",
      icon: <Clock className="w-6 h-6 text-[#7a0b10]" />,
      title: "4. Cancellation & Refund Policy",
      summary: "Full refunds during pending state; orders in active cooking cannot be cancelled.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Because food items are freshly prepared to order upon receipt:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="font-bold text-emerald-800 block mb-1 text-sm">Cancellations Allowed</span>
              <span className="text-xs sm:text-sm text-[#4b5563]">You may cancel your order for a 100% full refund only while its status is <strong>Pending</strong> or <strong>Accepted</strong> before kitchen prep starts.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
              <span className="font-bold text-red-800 block mb-1 text-sm">Non-Refundable Phase</span>
              <span className="text-xs sm:text-sm text-[#4b5563]">Once food preparation has commenced or the courier has been dispatched, orders cannot be cancelled or refunded.</span>
            </div>
          </div>
          <p className="text-xs text-[#6b7280]">
            * If delivery fails due to an invalid customer address or failure to respond to courier calls upon arrival, the order remains non-refundable. Single-use promotional discount coupons applied to cancelled orders are forfeited.
          </p>
        </div>
      ),
    },
    {
      number: "05",
      badge: "Rewards Program",
      icon: <Sparkles className="w-6 h-6 text-[#7a0b10]" />,
      title: "5. Loyalty Points & Promotional Rewards",
      summary: "Non-transferable points and rewards earned on authentic dining and specialty beverages.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Lassi Lounge offers loyalty rewards and promotional coupon codes at our sole discretion. Loyalty points carry no cash surrender value, cannot be transferred between accounts, and may only be redeemed toward eligible menu purchases.
          </p>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            In cases of suspected fraudulent behavior, chargebacks, or voluntary account deletion, accumulated rewards and tier benefits are permanently forfeited.
          </p>
        </div>
      ),
    },
    {
      number: "06",
      badge: "Dispatch & Logistics",
      icon: <Truck className="w-6 h-6 text-[#7a0b10]" />,
      title: "6. Delivery Radius, Pickup & Dispatch Partners",
      summary: "Estimated prep times, dispatch logistics (Shipday), and customer arrival obligations.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Delivery times and pickup estimates shown in the app are calculated in real time based on kitchen volume and traffic. While our team makes every effort to deliver your order hot and fresh on schedule, delivery times are estimates and may vary due to severe weather, road closures, or external courier availability.
          </p>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            Pickup orders must be retrieved within 30 minutes of the ready notification to guarantee peak culinary quality.
          </p>
        </div>
      ),
    },
    {
      number: "07",
      badge: "Legal & Liability",
      icon: <AlertCircle className="w-6 h-6 text-[#7a0b10]" />,
      title: "7. Modifications, Disclaimers & Limitation of Liability",
      summary: "Operating disclosures, allergen notifications, and platform availability.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            Lassi Lounge reserves the right to adjust menu offerings, pricing, operating hours, and promotional discounts without prior notification.
          </p>
          <div className="p-3.5 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb] text-xs sm:text-sm text-[#4b5563]">
            <strong>Food Allergies & Dietary Notes:</strong> Our kitchen prepares dishes containing dairy (paneer, yogurt, milk), nuts, gluten, and various spices. While we accommodate dietary requests when specified in your order, we cannot guarantee an allergen-free environment. Customers with severe medical allergies order at their own discretion.
          </div>
        </div>
      ),
    },
    {
      number: "08",
      badge: "Jurisdiction",
      icon: <ShieldCheck className="w-6 h-6 text-[#7a0b10]" />,
      title: "8. Governing Law & Dispute Resolution",
      summary: "Governing jurisdiction in New York State and amicable dispute resolution.",
      content: (
        <div className="space-y-3 text-[#4b5563] text-sm sm:text-base leading-relaxed">
          <p>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of New York, United States, without regard to conflict of law principles. Any legal action or proceeding arising under these terms shall be instituted in the state or federal courts situated in New York.
          </p>
        </div>
      ),
    }
  ];

  return (
    <div className="w-full flex flex-col bg-[#faf9f8]">
      {/* 1. Luxury Dark Hero Section */}
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
            <span className="text-[#ffffff]">Terms & Conditions</span>
          </nav>

          {/* Heading Block */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-[34px] sm:text-[44px] md:text-[54px] lg:text-[56px] font-serif font-black tracking-tight leading-[1.1]">
              <span className="text-[#ffffff] block">Terms &</span>
              <span className="text-[#e8a020] block">Conditions</span>
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
                Clear, Transparent & Fair
              </span>
              <svg width="32" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M0 7H36M36 7L30 1M36 7L30 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
              </svg>
            </div>

            <p className="text-[#e5e7eb] text-[14px] md:text-[15px] leading-relaxed max-w-[620px] font-medium pt-1">
              Please review the terms of service governing your orders, reservations, rewards, and online dining experience with Lassi Lounge.
            </p>
          </div>

          {/* Highlights Strip */}
          <div className="pt-4 flex flex-wrap gap-2.5 sm:gap-3">
            {termsHighlights.map((badge, idx) => {
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
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#7a0b10]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#e8a020]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Info Note */}
          <div className="mb-10 p-5 rounded-3xl bg-white border border-[#e5e7eb] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7a0b10]/10 flex items-center justify-center shrink-0">
                <ScrollText className="w-5 h-5 text-[#7a0b10]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-[#7a0b10]">Legal Document</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">Customer Terms of Service & Online Ordering Agreement</p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#faf9f8] border border-[#e5e7eb] text-[#6b7280]">
              Effective: November 2026
            </div>
          </div>

          {/* Structured Terms Cards */}
          <div className="space-y-6">
            {terms.map((term, idx) => (
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
                      {term.icon}
                    </div>
                    <span className="text-xs font-black tracking-widest text-[#9ca3af] font-mono">
                      {term.number}
                    </span>
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7a0b10]/10 text-[#7a0b10]">
                        {term.badge}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1a1a1a] tracking-tight">
                      {term.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#7a0b10] font-medium pb-2">
                      {term.summary}
                    </p>

                    <div className="pt-1">
                      {term.content}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Bottom Clarification Banner */}
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
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif">
                Need Clarification on Our Terms?
              </h3>
              <p className="text-sm sm:text-base text-[#d1d5db] leading-relaxed">
                If you have questions regarding an order, cancellation inquiry, or our loyalty policies, reach out to our customer care team anytime.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/contact-us" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e8a020] text-[#0e0d0c] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#ffb020] transition-colors shadow-md"
                >
                  <span>Contact Customer Support</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/privacy-policy" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/20 transition-colors"
                >
                  <span>View Privacy Policy</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
