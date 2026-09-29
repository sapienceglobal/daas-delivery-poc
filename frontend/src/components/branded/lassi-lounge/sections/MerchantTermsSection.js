'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileCheck2, 
  Store, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Lock, 
  ScrollText, 
  HelpCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function MerchantTermsSection() {
  const terms = [
    {
      icon: <Store className="w-6 h-6 text-[#7a0b10]" />,
      title: '1. Commercial Partnership & Scope',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            These <strong>Merchant Terms of Service</strong> constitute a legally binding commercial agreement between <strong>Lassi Lounge NY</strong> and the restaurant entity, authorized merchant, store manager, or franchisee operating our restaurant management technology.
          </p>
          <p>
            By logging into the <strong>Lassi Lounge Merchant Mobile App</strong> or accessing the partner web dashboard, you agree to abide by these operating standards and terms.
          </p>
        </div>
      ),
    },
    {
      icon: <Clock className="w-6 h-6 text-[#7a0b10]" />,
      title: '2. Menu, Pricing & Preparation Standards',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Menu Accuracy:</strong> Merchants must maintain current dish descriptions, accurate allergen notices, and identical menu pricing between in-store and online offerings.</li>
            <li><strong>Live Inventory (86ing):</strong> Out-of-stock items must be promptly marked as unavailable in the Merchant App to prevent customer order dissatisfaction.</li>
            <li><strong>Preparation Timing:</strong> Kitchen staff must adhere to estimated preparation times (ETAs). Consistently delayed preparations directly affect courier dispatch efficiency.</li>
            <li><strong>Food Safety &amp; Hygiene:</strong> All food prepared and packaged must strictly adhere to New York City Department of Health and Mental Hygiene standards.</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-[#7a0b10]" />,
      title: '3. Order Fulfillment & Dispatch',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            Orders received through the Merchant App must be acknowledged immediately. Once marked &ldquo;Accepted&rdquo;, the restaurant is committed to preparing the food within the agreed time window.
          </p>
          <p>
            Packaging must be tamper-evident, sealed with branded food-grade seals, and accompanied by the printed receipt slip detailing order items and dietary modifications.
          </p>
        </div>
      ),
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-[#7a0b10]" />,
      title: '4. Cancellations, Refunds & Quality Disputes',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            If an order is rejected or cancelled after acceptance due to restaurant kitchen inability or inventory shortage, the restaurant may be held accountable for associated processing costs.
          </p>
          <p>
            In cases of verified customer complaints regarding missing items, incorrect dishes, or undercooked food, refund deductions will be processed in accordance with our partner settlement guidelines.
          </p>
        </div>
      ),
    },
    {
      icon: <CreditCard className="w-6 h-6 text-[#7a0b10]" />,
      title: '5. Settlements, Payouts & Commission',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            Online sales transactions collected through Lassi Lounge customer portals are settled directly to the designated merchant bank account on the agreed weekly/bi-weekly schedule via Stripe Connect.
          </p>
          <p>
            All applicable sales taxes, city surcharges, and tip allocations are itemized in real-time within the Merchant App Analytics and Reporting dashboard.
          </p>
        </div>
      ),
    },
    {
      icon: <Lock className="w-6 h-6 text-[#7a0b10]" />,
      title: '6. Confidentiality & Account Security',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            Merchant login credentials and manager PINs must be safeguarded. Merchants are strictly obligated to immediately revoke access for employees or contractors who leave the organization.
          </p>
          <p>
            Customer names, contact numbers, and delivery addresses made visible for dispatch purposes must remain confidential and must never be recorded, exported, or used for non-operational purposes.
          </p>
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#7a0b10]" />,
      title: '7. Termination & Suspension',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            Lassi Lounge reserves the right to suspend or terminate merchant portal access in the event of repeated health inspection violations, high cancellation rates (&gt;5%), fraudulent transactions, or failure to maintain consistent quality.
          </p>
          <p>
            Merchants may terminate their partnership at any time by clearing pending order balances and providing 14 days written notice to <em>info@lassilounge.com</em>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-20 bg-[#faf9f8] overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdecec] text-[#a30f16] text-xs font-bold uppercase tracking-wider mb-6 border border-[#fad0d0]">
            <ScrollText className="w-4 h-4" />
            <span>Commercial Operating Agreement &bull; Partner Standards</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold font-serif text-[#1a1a1a] mb-6 tracking-tight">
            Merchant &amp; Partner Terms of Service
          </h1>

          <p className="text-lg text-[#4b5563] leading-relaxed">
            Operating guidelines, service levels, and commercial standards for restaurants and staff utilizing Lassi Lounge merchant applications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#6b7280] mt-6">
            <span className="bg-white px-3 py-1 rounded-full border border-[#e5e7eb]">Last Updated: September 2026</span>
            <Link href="/terms-conditions" className="text-[#a30f16] hover:underline flex items-center gap-1 font-semibold">
              View Customer Terms &amp; Conditions <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {terms.map((term, idx) => (
            <div
              key={idx}
              className="bg-white p-7 sm:p-9 rounded-3xl shadow-sm border border-[#e5e7eb] hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-[#fdecec] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {term.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1a1a1a] mb-3">
                    {term.title}
                  </h2>
                  {term.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Box */}
        <div className="mt-14 bg-white border border-[#e5e7eb] rounded-3xl p-8 sm:p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-[#fdecec] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#cd131b]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-3">
            Questions Regarding Partner Agreements?
          </h3>
          <p className="text-[#6b7280] max-w-xl mx-auto mb-6 text-base">
            Reach out to our Restaurant Operations desk for partnership questions, commission structures, or custom billing arrangements.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:info@lassilounge.com"
              className="bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors"
            >
              Contact Operations Desk
            </a>
            <Link
              href="/merchant-portal"
              className="bg-[#faf9f8] hover:bg-[#f3f4f6] text-[#1a1a1a] font-bold py-3 px-8 rounded-xl border border-[#e5e7eb] transition-colors"
            >
              Merchant Features Overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
