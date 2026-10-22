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
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { showToast } from '@/components/ui/showToast';
import PageHeaderGradient from '@/components/merchant/common/PageHeaderGradient';

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      icon: <Package className="w-5 h-5 text-blue-500" />,
      question: "How do I manage my active orders?",
      answer: "You can manage all your active orders from the Live Orders tab. You can accept, prepare, and mark orders as ready for pickup or delivery from there."
    },
    {
      id: 2,
      icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
      question: "When do I receive my payouts?",
      answer: "Payouts are processed automatically every week on Monday for the previous week's earnings. It may take 2-3 business days to reflect in your bank account."
    },
    {
      id: 3,
      icon: <Truck className="w-5 h-5 text-purple-500" />,
      question: "How do I request a delivery partner?",
      answer: "When an order is marked as 'Ready', the system automatically assigns the nearest available delivery partner. You can track their arrival on the Live Orders screen."
    },
    {
      id: 4,
      icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
      question: "How do I update my menu items?",
      answer: "Go to the Menu section in the sidebar. You can add new items, edit existing ones, update prices, and mark items out of stock instantly."
    }
  ];

  const contactMethods = [
    {
      title: "Live Chat",
      subtitle: "Chat with our support executive",
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      action: "Start Chat",
      onClick: () => showToast("Live Chat is an upcoming feature!", "info"),
      isOnline: true
    },
    {
      title: "Phone Support",
      subtitle: "Talk to our merchant support team",
      icon: <Phone className="w-5 h-5 text-emerald-500" />,
      action: "Call +1 347-233-3733",
      onClick: () => window.location.href = "tel:+13472333733"
    },
    {
      title: "Email Support",
      subtitle: "Send us an email anytime",
      icon: <Mail className="w-5 h-5 text-rose-500" />,
      action: "Email Us",
      onClick: () => window.location.href = "mailto:lassiloungeny@gmail.com"
    },
    {
      title: "WhatsApp Merchant Care",
      subtitle: "Instant messaging on WhatsApp",
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      action: "Message Us",
      onClick: () => window.open("https://wa.me/13472333733", "_blank")
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeaderGradient
        badgeIcon={Headphones}
        badgeText="24/7 Merchant Care"
        title="Help & Support Desk"
        subtitle="Quick answers to common operations, payout timelines, and dedicated merchant helpline access."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - FAQs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-admin-text mb-2 font-outfit">Frequently Asked Questions</h2>
          
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden transition-all duration-200 shadow-sm hover:border-admin-border-hover"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-admin-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-admin-surface-2 rounded-xl border border-admin-border/60">
                      {faq.icon}
                    </div>
                    <span className="font-bold text-sm text-admin-text font-outfit">{faq.question}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-admin-muted transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
                      <p className="text-admin-muted text-xs leading-relaxed font-medium">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-blue-500 font-bold text-sm font-outfit">Need more help with orders or POS?</h3>
              <p className="text-admin-muted text-xs mt-1">Our technical and support team is on standby to assist your kitchen staff.</p>
            </div>
            <HelpCircle className="w-10 h-10 text-blue-500/40 shrink-0" />
          </div>
        </div>

        {/* Right Column - Contact Methods */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-admin-text mb-2 font-outfit">Contact Support</h2>
          
          <div className="grid grid-cols-1 gap-3.5">
            {contactMethods.map((method, index) => (
              <div 
                key={index}
                className="bg-admin-surface border border-admin-border rounded-2xl p-5 hover:border-admin-border-hover transition-all group cursor-pointer shadow-sm hover:shadow-md"
                onClick={method.onClick}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-admin-surface-2 rounded-xl border border-admin-border/60 group-hover:scale-105 transition-transform">
                    {method.icon}
                  </div>
                  {method.isOnline && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-md flex items-center gap-1 font-outfit">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      ONLINE
                    </span>
                  )}
                </div>
                
                <h3 className="text-admin-text font-bold text-sm font-outfit">{method.title}</h3>
                <p className="text-admin-muted text-xs mt-1 mb-3">{method.subtitle}</p>
                
                <div className="flex items-center text-xs font-bold text-primary group-hover:underline font-outfit">
                  {method.action}
                  <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
