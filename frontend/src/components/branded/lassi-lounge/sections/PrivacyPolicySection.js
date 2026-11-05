import React from 'react';
import { Shield, Lock, Eye, FileText, Smartphone, MapPin, UserX, Server } from 'lucide-react';

export default function PrivacyPolicySection() {
  const policies = [
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: "1. Data Protection & Security",
      content: "We implement rigorous administrative, technical, and physical security measures to safeguard your personal information. All network traffic between your device and our servers is encrypted using Industry-standard Transport Layer Security (TLS 1.3 / HTTPS). Sensitive financial data (such as payment card numbers) is never stored on our servers and is processed directly by PCI-DSS Level 1 compliant gateway (Stripe).",
    },
    {
      icon: <Eye className="w-8 h-8 text-primary-600" />,
      title: "2. Personal Information We Collect",
      content: "When you create an account, place an order, or interact with Lassi Lounge, we collect personal details necessary to fulfill our restaurant services. This includes your full name, email address, contact phone number, delivery addresses, order history, and preferences. For social logins (Google or Apple Sign-In), we receive your basic verified profile name and email address to authenticate your session.",
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary-600" />,
      title: "3. Device or Other Identifiers (Device & App Information)",
      content: "To provide core app functionality and real-time push notifications for order status and delivery updates, our mobile application collects Device or Other IDs (including Firebase Cloud Messaging / FCM device registration tokens, installation identifiers, operating system version, and IP address). These identifiers are transmitted securely off-device solely for account management, push notification routing, system fraud prevention, and performance diagnostics. We do not sell or broker your device identifiers to third-party advertising networks.",
    },
    {
      icon: <MapPin className="w-8 h-8 text-primary-600" />,
      title: "4. Location Data Usage",
      content: "With your explicit permission, our mobile app and website collect coarse or precise location data to verify that your delivery address is within our service radius, estimate delivery times accurately, and support live driver dispatch. Location access is completely optional; you may manually enter your street address and delivery instructions at any time without enabling device GPS.",
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: "5. How We Use & Share Information",
      content: "We use collected information strictly to process transactions, manage loyalty rewards, provide responsive customer support, dispatch delivery couriers (via dispatch partners like Shipday), and send critical transactional updates. We do not sell, rent, or trade your personal data with third-party advertisers. We share information only with trusted service providers essential for platform operations under confidentiality obligations.",
    },
    {
      icon: <UserX className="w-8 h-8 text-primary-600" />,
      title: "6. Account Deletion & Data Retention Rights",
      content: "You have the full right to delete your account and associated personal data at any time. You can permanently delete your account directly inside the Lassi Lounge Mobile App by navigating to 'My Profile' -> 'Delete Account' and verifying your identity with your account password (or a 6-digit email verification code for social accounts). Alternatively, you may submit a deletion request by contacting us at projects.sapience@gmail.com. Upon deletion, your personal details, saved addresses, loyalty points, and active session tokens are permanently erased from our primary databases.",
    },
    {
      icon: <Lock className="w-8 h-8 text-primary-600" />,
      title: "7. Cookies & Session Storage",
      content: "Our website uses essential first-party cookies and local storage tokens to remember items in your shopping cart, preserve your active login session, and maintain user preferences across page navigation. You can manage or disable cookies via your browser settings, though doing so may prevent adding items to your cart or completing online checkout.",
    },
    {
      icon: <Server className="w-8 h-8 text-primary-600" />,
      title: "8. Third-Party Service Providers",
      content: "Our services integrate trusted infrastructure providers: Stripe (payment processing), Firebase Cloud Messaging by Google (push notifications), Google Maps & OpenStreetMap (address autocomplete and geocoding), and Shipday (courier dispatch management). Each third-party provider processes data strictly in accordance with their respective privacy and security standards.",
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
            Privacy Policy & Data Safety
          </h1>
          <p className="text-lg text-[#4b5563] leading-relaxed">
            Your privacy is critically important to us. This policy outlines how Lassi Lounge collects, uses, protects, and handles personal data and device identifiers across our website and mobile application in compliance with Google Play and Apple App Store standards.
          </p>
          <p className="text-sm font-medium text-[#7a0b10] mt-4">Effective & Last Updated: November 2026</p>
        </div>

        <div className="space-y-6">
          {policies.map((policy, idx) => (
            <div key={idx} className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#e5e7eb] ll-pop group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-600 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                  {policy.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-serif text-[#1a1a1a] mb-3">{policy.title}</h3>
                  <p className="text-[#4b5563] leading-relaxed text-base sm:text-lg">
                    {policy.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-[#7a0b10] rounded-3xl p-8 sm:p-12 text-center text-white ll-pop shadow-md">
          <h3 className="text-2xl font-bold font-serif mb-4">Have Questions About Your Data or Privacy?</h3>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto text-lg">
            If you have any questions regarding this Privacy Policy, your rights under data privacy laws, or wish to request data deletion assistance, please reach out to our privacy team.
          </p>
          <a href="/contact-us" className="inline-block bg-white text-[#7a0b10] font-bold py-3.5 px-8 rounded-xl shadow-lg hover:bg-primary-50 transition-colors">
            Contact Privacy Support
          </a>
        </div>
      </div>
    </section>
  );
}
