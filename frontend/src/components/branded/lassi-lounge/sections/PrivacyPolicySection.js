import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicySection() {
  const policies = [
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: "Data Protection",
      content: "We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. Your data is encrypted and stored on secure servers.",
    },
    {
      icon: <Eye className="w-8 h-8 text-primary-600" />,
      title: "Information Collection",
      content: "We collect information from you when you register on our site, place an order, subscribe to our newsletter or fill out a form. This includes your name, email address, mailing address, phone number, and credit card information for processing orders.",
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: "How We Use Information",
      content: "Any of the information we collect from you may be used to personalize your experience, improve our website, improve customer service, and process transactions. Your public or private information will not be sold or transferred to any other company without your consent.",
    },
    {
      icon: <Lock className="w-8 h-8 text-primary-600" />,
      title: "Cookie Usage",
      content: "We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits, and compile aggregate data about site traffic and site interaction so that we can offer better experiences.",
    }
  ];

  return (
    <section className="relative py-24 bg-[#faf9f8] overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-secondary-100/50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-6 text-primary-600">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-[#1a1a1a] mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-[#4b5563] leading-relaxed">
            Your privacy is critically important to us. This policy outlines how we collect, use, and protect your personal information at Lassi Lounge.
          </p>
          <p className="text-sm text-[#9ca3af] mt-4">Last Updated: July 2026</p>
        </div>

        <div className="space-y-8">
          {policies.map((policy, idx) => (
            <div key={idx} className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#e5e7eb] ll-pop group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                  {policy.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-4">{policy.title}</h3>
                  <p className="text-[#4b5563] leading-relaxed text-lg">
                    {policy.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-primary-900 rounded-3xl p-8 sm:p-12 text-center text-white ll-pop">
          <h3 className="text-2xl font-bold font-serif mb-4">Have Questions About Your Data?</h3>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto text-lg">
            If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us.
          </p>
          <a href="/customer/contact-us" className="inline-block bg-white text-primary-900 font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary-50 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
