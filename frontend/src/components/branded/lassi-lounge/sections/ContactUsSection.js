'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  UtensilsCrossed,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { showToast } from '@/components/ui';
import { useBrand } from '@/context/BrandContext';

export default function ContactUsSection() {
  const { brand } = useBrand();
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    inquiryType: 'general',
    subject: '', 
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        setFormData({ name: '', email: '', phone: '', inquiryType: 'general', subject: '', message: '' });
        showToast('Your message has been sent successfully! Our team will get back to you shortly.', 'success');
      } else {
        showToast(data.message || 'Failed to send message. Please try again or call us directly.', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please call or email us directly.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const address = brand?.address || 'Lassi Lounge, 450 Powell Street, San Francisco, CA 94102';
  const phone = brand?.phone || '+1 (415) 555-1234';
  const email = brand?.email || 'hello@lassilounge.com';

  const contactCards = [
    {
      icon: MapPin,
      badge: 'Location',
      title: 'Visit Our Restaurant',
      desc: address,
      actionText: 'Get Directions',
      actionUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      isExternal: true
    },
    {
      icon: Phone,
      badge: 'Direct Phone',
      title: 'Call Us Anytime',
      desc: phone,
      actionText: 'Call Now',
      actionUrl: `tel:${phone.replace(/[^0-9+]/g, '')}`,
      isExternal: false
    },
    {
      icon: Mail,
      badge: 'Email Support',
      title: 'Drop Us a Line',
      desc: email,
      actionText: 'Send Email',
      actionUrl: `mailto:${email}`,
      isExternal: false
    },
    {
      icon: Clock,
      badge: 'Kitchen Hours',
      title: 'Open 7 Days a Week',
      desc: 'Mon - Sun: 11:00 AM - 10:00 PM (Kitchen closes 9:45 PM)',
      actionText: 'Order Online',
      actionUrl: '/order-online',
      isExternal: false
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
            <span className="text-[#ffffff]">Contact Us</span>
          </nav>

          {/* Heading Block */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-[34px] sm:text-[44px] md:text-[54px] lg:text-[56px] font-serif font-black tracking-tight leading-[1.1]">
              <span className="text-[#ffffff] block">Contact</span>
              <span className="text-[#e8a020] block">Lassi Lounge</span>
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
                We'd Love To Hear From You
              </span>
              <svg width="32" height="12" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M0 7H36M36 7L30 1M36 7L30 13" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="7" r="3" fill="#0e0d0c" stroke="#e8a020" strokeWidth="1.5"/>
              </svg>
            </div>

            <p className="text-[#e5e7eb] text-[14px] md:text-[15px] leading-relaxed max-w-[620px] font-medium pt-1">
              Have a question about our authentic flavors, planning a catering event, or need assistance with your online order? Our team is at your service.
            </p>
          </div>

          {/* Quick Pill Badges */}
          <div className="pt-4 flex flex-wrap gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#e8a020]" />
              <span>Authentic Indian Dining</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium">
              <Phone className="w-3.5 h-3.5 text-[#e8a020]" />
              <span>Fast Response Support</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#e8a020]" />
              <span>Custom Event Catering</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#e8a020]" />
              <span>Open 7 Days a Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Section */}
      <section className="relative py-16 sm:py-24 bg-[#faf9f8]">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#7a0b10]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e8a020]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top 4 Contact Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e5e7eb] hover:shadow-[0_8px_24px_rgba(122,11,16,0.06)] hover:border-[#7a0b10]/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#7a0b10]/5 group-hover:bg-[#7a0b10]/10 border border-[#7a0b10]/15 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                        <Icon className="w-6 h-6 text-[#7a0b10]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7a0b10]/10 text-[#7a0b10]">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-serif text-[#1a1a1a] mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed mb-4">
                      {card.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#f3f4f6]">
                    {card.isExternal ? (
                      <a 
                        href={card.actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7a0b10] hover:text-[#e8a020] transition-colors"
                      >
                        <span>{card.actionText}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link 
                        href={card.actionUrl} 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7a0b10] hover:text-[#e8a020] transition-colors"
                      >
                        <span>{card.actionText}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Map & Contact Form Layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Interactive Map & Catering Banner (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Map Container */}
              <div className="bg-white p-5 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e5e7eb] flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#7a0b10]" />
                    <h3 className="font-serif font-bold text-lg text-[#1a1a1a]">Restaurant Map</h3>
                  </div>
                  <span className="text-xs font-medium text-[#7a0b10] bg-[#7a0b10]/10 px-2.5 py-1 rounded-full">
                    Dine-In & Pickup
                  </span>
                </div>

                <div className="w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-[#e5e7eb] relative">
                  <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </div>
                
                <p className="text-xs text-[#6b7280] mt-3 italic">
                  Convenient street parking and accessible transit nearby.
                </p>
              </div>

              {/* Catering Highlight Box */}
              <div className="rounded-3xl bg-[#0e0d0c] text-white p-6 sm:p-7 border border-white/10 relative overflow-hidden shadow-lg">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8a020]/20 text-[#e8a020] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Special Occasions & Catering</span>
                  </div>
                  <h4 className="text-xl font-bold font-serif">
                    Planning a Wedding, Birthday or Corporate Gala?
                  </h4>
                  <p className="text-xs sm:text-sm text-[#d1d5db] leading-relaxed">
                    Elevate your next gathering with bespoke live Chaat counters, fresh Mango Lassi stations, and rich royal curries.
                  </p>
                  <div className="pt-2">
                    <Link 
                      href="/catering" 
                      className="inline-flex items-center gap-2 bg-[#e8a020] text-[#0e0d0c] text-xs font-black px-5 py-2.5 rounded-xl hover:bg-[#ffb020] transition-colors"
                    >
                      <span>Explore Catering Packages</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Send Us A Message Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e5e7eb] relative overflow-hidden flex flex-col justify-between">
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#7a0b10] via-[#e8a020] to-[#7a0b10]" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-[#7a0b10]" />
                  <span className="text-xs uppercase font-bold tracking-wider text-[#7a0b10]">Send a Message</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#1a1a1a] mb-2">
                  How Can We Help You Today?
                </h3>
                <p className="text-xs sm:text-sm text-[#4b5563] mb-8">
                  Fill in your details below and our team will respond within 24 hours. For immediate order support, please call our direct restaurant line.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-11 bg-[#faf9f8] border border-[#e5e7eb] rounded-xl px-4 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-11 bg-[#faf9f8] border border-[#e5e7eb] rounded-xl px-4 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-11 bg-[#faf9f8] border border-[#e5e7eb] rounded-xl px-4 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Inquiry Type</label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full h-11 bg-[#faf9f8] border border-[#e5e7eb] rounded-xl px-3.5 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none"
                      >
                        <option value="general">General Inquiries</option>
                        <option value="order">Online Order or Delivery Question</option>
                        <option value="catering">Catering & Private Events</option>
                        <option value="feedback">Feedback & Dining Experience</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Subject *</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full h-11 bg-[#faf9f8] border border-[#e5e7eb] rounded-xl px-4 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none"
                      placeholder="e.g. Table reservation question or catering quote"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#faf9f8] border border-[#e5e7eb] rounded-xl p-4 text-sm text-[#1a1a1a] focus:bg-white focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/15 transition-all outline-none resize-none"
                      placeholder="Please describe how we can assist you..."
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#6b7280]">
                      We treat your privacy with utmost respect. No spam ever.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#7a0b10] text-white text-xs font-black uppercase tracking-wider hover:bg-[#680307] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-98"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
