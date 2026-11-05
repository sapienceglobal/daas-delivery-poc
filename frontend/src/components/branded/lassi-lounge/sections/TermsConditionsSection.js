import React from 'react';
import { CheckCircle, AlertCircle, FileText, ScrollText, UserCheck, ShieldCheck } from 'lucide-react';

export default function TermsConditionsSection() {
  const terms = [
    {
      icon: <ScrollText className="w-8 h-8 text-primary-600" />,
      title: "1. Acceptance of Terms",
      content: "By accessing, browsing, downloading, or using the Lassi Lounge website or mobile application, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, please refrain from using our services.",
    },
    {
      icon: <UserCheck className="w-8 h-8 text-primary-600" />,
      title: "2. Account Registration & Security",
      content: "When registering an account, you agree to provide truthful and accurate contact details (name, email, and phone number). You are responsible for safeguarding your login credentials. You may terminate and permanently delete your account at any time through the Mobile App under Profile -> Delete Account, verified via your account password or email verification code.",
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: "3. Orders, Pricing & Payment",
      content: "All orders placed are subject to kitchen item availability and price confirmation. Prices and taxes are clearly displayed before you submit an order. Online payments are processed through secure third-party payment gateways (Stripe). We do not store raw credit/debit card numbers on our infrastructure.",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary-600" />,
      title: "4. Cancellation & Refund Policy",
      content: "Customers may cancel an order for a full refund only while the status is 'Pending' or 'Accepted'. Once food preparation has begun, orders cannot be cancelled or refunded. If delivery fails due to incorrect customer details or unresponsiveness upon courier arrival, no refunds will be issued. Any single-use coupons applied to a cancelled order are forfeited.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary-600" />,
      title: "5. Loyalty Points & Promotional Rewards",
      content: "Loyalty points and reward discounts are provided at Lassi Lounge's discretion. Points are non-transferable, carry no cash value, and can only be redeemed on valid menu items. In the event of fraudulent activities or voluntary account deletion, accumulated points are forfeited.",
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-primary-600" />,
      title: "6. Modifications to Service & Liability",
      content: "Lassi Lounge reserves the right to modify menu selections, pricing, operating hours, and promotional offerings with or without prior notice. We make every reasonable effort to ensure timely delivery, but cannot be held liable for unavoidable delays caused by traffic, weather extremes, or third-party courier dispatch.",
    }
  ];

  return (
    <section className="relative py-24 bg-[#faf9f8] overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-secondary-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-6 text-primary-600">
            <ScrollText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-[#1a1a1a] mb-6 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-lg text-[#4b5563] leading-relaxed">
            Please read these terms and conditions carefully before using our mobile application or website. They outline your rights and responsibilities when placing orders with Lassi Lounge.
          </p>
          <p className="text-sm font-medium text-[#7a0b10] mt-4">Last Updated: November 2026</p>
        </div>

        <div className="space-y-6">
          {terms.map((term, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-[#e5e7eb] ll-pop group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                  {term.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-3">{term.title}</h3>
                  <p className="text-[#4b5563] leading-relaxed text-base sm:text-[17px]">
                    {term.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-white border border-[#e5e7eb] rounded-3xl p-8 sm:p-12 text-center ll-pop shadow-sm">
          <h3 className="text-2xl font-bold font-serif mb-4 text-[#1a1a1a]">Need Further Clarification?</h3>
          <p className="text-[#6b7280] mb-8 max-w-2xl mx-auto text-lg">
            If you have any questions about these Terms, please reach out to our customer support team. We are happy to assist you.
          </p>
          <a href="/contact-us" className="inline-block bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
