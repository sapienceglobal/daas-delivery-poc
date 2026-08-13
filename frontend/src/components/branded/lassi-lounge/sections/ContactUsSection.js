'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { showToast } from '@/components/ui';
import { useBrand } from '@/context/BrandContext';

export default function ContactUsSection() {
  const { brand } = useBrand();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
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
      
      if (data.success) {
        setFormData({ name: '', email: '', subject: '', message: '' });
        showToast('Your message has been sent successfully! We will get back to you soon.', 'success');
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6 text-primary-600" />,
      title: 'Our Location',
      details: brand?.address || 'Lassi Lounge, 450 Powell Street, San Francisco, CA 94102',
    },
    {
      icon: <Phone className="w-6 h-6 text-primary-600" />,
      title: 'Phone Number',
      details: brand?.phone || '+1 (415) 555-1234',
    },
    {
      icon: <Mail className="w-6 h-6 text-primary-600" />,
      title: 'Email Address',
      details: brand?.email || 'hello@lassilounge.com',
    },
  ];

  return (
    <section className="relative py-24 bg-[#faf9f8] overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] bg-secondary-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary-700 font-serif italic text-xl mb-4">We'd love to hear from you</p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-[#1a1a1a] mb-6 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-lg text-[#4b5563] leading-relaxed">
            Whether you have a question about our menu, want to book a catering event, or just want to say hello, we are here for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#e5e7eb] ll-pop group hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-8">Contact Information</h3>
              <div className="space-y-8">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1a1a1a] mb-1">{info.title}</h4>
                      <p className="text-[#6b7280] leading-relaxed">{info.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form (Right Col) */}
          <div className="lg:col-span-3 bg-white p-8 sm:p-10 rounded-3xl shadow-lg border border-[#e5e7eb] ll-pop relative overflow-hidden">
            {/* Glassmorphism gradient accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600" />
            
            <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-8">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4b5563]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 text-[#1a1a1a] focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4b5563]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 text-[#1a1a1a] focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4b5563]">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-12 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 text-[#1a1a1a] focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4b5563]">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 text-[#1a1a1a] focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none resize-none"
                  placeholder="Tell us more about your query..."
                />
              </div>
              <div className="flex justify-start sm:justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-[200px] h-12 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md group"
                >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
