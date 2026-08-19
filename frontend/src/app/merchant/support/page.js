'use client';

import React, { useState } from 'react';
import { 
  Headphones, 
  MessageCircle, 
  Phone, 
  Mail, 
  HelpCircle, 
  ChevronDown, 
  Package,
  CreditCard,
  Truck,
  MessageSquare
} from 'lucide-react';
import { showToast } from '@/components/ui/showToast';

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      icon: <Package className="w-5 h-5 text-[#3B82F6]" />,
      question: "How do I manage my active orders?",
      answer: "You can manage all your active orders from the Live Orders tab. You can accept, prepare, and mark orders as ready for pickup or delivery from there."
    },
    {
      id: 2,
      icon: <CreditCard className="w-5 h-5 text-[#22C55E]" />,
      question: "When do I receive my payouts?",
      answer: "Payouts are processed automatically every week on Monday for the previous week's earnings. It may take 2-3 business days to reflect in your bank account."
    },
    {
      id: 3,
      icon: <Truck className="w-5 h-5 text-[#A855F7]" />,
      question: "How do I request a delivery partner?",
      answer: "When an order is marked as 'Ready', the system automatically assigns the nearest available delivery partner. You can track their arrival on the Live Orders screen."
    },
    {
      id: 4,
      icon: <HelpCircle className="w-5 h-5 text-[#F97316]" />,
      question: "How do I update my menu items?",
      answer: "Go to the Menu section in the sidebar. You can add new items, edit existing ones, update prices, and mark items out of stock instantly."
    }
  ];

  const contactMethods = [
    {
      title: "Live Chat",
      subtitle: "Chat with our support executive",
      icon: <MessageCircle className="w-6 h-6 text-[#3B82F6]" />,
      action: "Start Chat",
      onClick: () => showToast("Live Chat is an upcoming feature!", "info"),
      isOnline: true
    },
    {
      title: "Phone Support",
      subtitle: "Talk to our merchant support team",
      icon: <Phone className="w-6 h-6 text-[#22C55E]" />,
      action: "Call +1 347-233-3733",
      onClick: () => window.location.href = "tel:+13472333733"
    },
    {
      title: "Email Support",
      subtitle: "Send us an email anytime",
      icon: <Mail className="w-6 h-6 text-[#EF4444]" />,
      action: "Email Us",
      onClick: () => window.location.href = "mailto:lassiloungeny@gmail.com"
    },
    {
      title: "WhatsApp",
      subtitle: "Message us on WhatsApp",
      icon: <MessageSquare className="w-6 h-6 text-[#10B981]" />,
      action: "Message Us",
      onClick: () => window.open("https://wa.me/13472333733", "_blank")
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
          <Headphones className="w-6 h-6 text-[#2563EB]" />
          Help & Support
        </h1>
        <p className="text-[#4B5563] mt-2">
          Find answers to common questions or reach out to our dedicated merchant support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#F3F4F6] rounded-lg">
                      {faq.icon}
                    </div>
                    <span className="font-medium text-[#1f2937]">{faq.question}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-2 pl-[4.5rem]">
                      <p className="text-[#4B5563] text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-[#1E40AF] font-semibold">Need more help?</h3>
              <p className="text-[#2563EB] text-sm mt-1">Our support team is available 24/7 to assist you.</p>
            </div>
            <HelpCircle className="w-10 h-10 text-[#93C5FD]" />
          </div>
        </div>

        {/* Right Column - Contact Methods */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Contact Support</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {contactMethods.map((method, index) => (
              <div 
                key={index}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#9CA3AF] transition-all group cursor-pointer shadow-sm hover:shadow-md"
                onClick={method.onClick}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#F3F4F6] rounded-xl group-hover:scale-110 transition-transform">
                    {method.icon}
                  </div>
                  {method.isOnline && (
                    <span className="px-2 py-1 bg-[#DCFCE7] text-[#166534] text-xs font-bold rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse"></span>
                      Online
                    </span>
                  )}
                </div>
                
                <h3 className="text-[#111827] font-semibold">{method.title}</h3>
                <p className="text-[#4B5563] text-sm mt-1 mb-4 h-10">{method.subtitle}</p>
                
                <div className="flex items-center text-sm font-medium text-[#6B7280] group-hover:text-[#111827]">
                  {method.action}
                  <svg className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
