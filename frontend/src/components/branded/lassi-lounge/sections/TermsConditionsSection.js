import React from 'react';
import { CheckCircle, AlertCircle, FileText, ScrollText } from 'lucide-react';

export default function TermsConditionsSection() {
  const terms = [
    {
      icon: <ScrollText className="w-8 h-8 text-primary-600" />,
      title: "1. Acceptance of Terms",
      content: "By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary-600" />,
      title: "2. Use of Service",
      content: "You agree to use our services only for lawful purposes. You must not use our website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website.",
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: "3. Orders and Pricing",
      content: "All orders are subject to availability and confirmation of the order price. Dispatch times may vary according to availability and subject to any delays resulting from postal delays or force majeure for which we will not be responsible.",
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-primary-600" />,
      title: "4. Modifications to Service",
      content: "Lassi Lounge reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.",
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
            Please read these terms and conditions carefully before using our service. They outline your rights and responsibilities when using Lassi Lounge.
          </p>
          <p className="text-sm text-[#9ca3af] mt-4">Last Updated: July 2026</p>
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
                  <p className="text-[#4b5563] leading-relaxed text-[17px]">
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
            If you have any questions about these Terms, please reach out to our support team. We're here to help.
          </p>
          <a href="/customer/contact-us" className="inline-block bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
