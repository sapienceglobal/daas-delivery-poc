'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  Printer, 
  Bell, 
  Database, 
  FileText, 
  UserX, 
  HelpCircle, 
  Store, 
  CheckCircle2, 
  ChevronRight,
  Server,
  Layers
} from 'lucide-react';

export default function MerchantPrivacyPolicySection() {
  const sections = [
    {
      id: 'scope',
      icon: <Store className="w-6 h-6 text-[#7a0b10]" />,
      title: '1. Scope & Application',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            This <strong>Merchant &amp; Partner Privacy Policy</strong> applies specifically to the operations, services, mobile applications (including the <strong>Lassi Lounge Merchant / Partner App</strong> on Android/Google Play), and web management dashboards operated by <strong>Lassi Lounge NY</strong>.
          </p>
          <p>
            This document outlines how restaurant owners, store managers, kitchen supervisors, and authorized staff members' data is collected, stored, processed, and safeguarded when using our merchant technology ecosystem.
          </p>
        </div>
      ),
    },
    {
      id: 'data-collected',
      icon: <Database className="w-6 h-6 text-[#7a0b10]" />,
      title: '2. Information We Collect from Merchants & Staff',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>To provide restaurant management, POS, and order dispatch services, we collect:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Merchant Account Details:</strong> Manager/owner name, official business email, phone number, physical restaurant address, and encrypted credentials.</li>
            <li><strong>Store Operational Data:</strong> Menu items, pricing, inventory stock availability, kitchen prep times, table layouts, and restaurant operating hours.</li>
            <li><strong>Staff Profiles:</strong> Names, contact numbers, and role-based access levels (e.g., Cashier, Kitchen Master, Store Admin) configured to prevent unauthorized operations.</li>
            <li><strong>Financial &amp; Settlement Data:</strong> Payout banking details and payment gateway tokens managed through PCI-DSS Level 1 compliant processors (Stripe). We never store raw credit card numbers.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'customer-data-handling',
      icon: <Layers className="w-6 h-6 text-[#7a0b10]" />,
      title: '3. Handling of Customer Order Data by Merchants',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            When customers place orders with Lassi Lounge, our Merchant App displays essential fulfillment information (customer name, delivery address, phone number for driver coordination, and itemized menu orders).
          </p>
          <div className="bg-[#faf9f8] p-4 rounded-xl border border-[#e5e7eb] text-sm">
            <p className="font-semibold text-[#1a1a1a] mb-1">Strict Confidentiality Requirement:</p>
            <p>
              Customer information displayed on the Merchant App is strictly for order preparation and dispatch fulfillment. Merchants and staff are contractually prohibited from using customer data for personal marketing, unsolicited contact, or third-party sharing.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'device-permissions',
      icon: <Printer className="w-6 h-6 text-[#7a0b10]" />,
      title: '4. Device Permissions & Hardware Integrations',
      content: (
        <div className="space-y-4 text-[#4b5563] leading-relaxed">
          <p>
            To provide automated kitchen operations and order alerts, the <strong>Lassi Lounge Merchant App</strong> requests specific device permissions. We adhere strictly to the principle of least privilege:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a] mb-1">
                <Printer className="w-5 h-5 text-[#cd131b]" />
                <span>Bluetooth &amp; Nearby Devices</span>
              </div>
              <p className="text-sm text-[#6b7280]">
                Used solely to scan, pair, and send ESC/POS print jobs to wireless 58mm/80mm thermal receipt and kitchen ticket printers. No tracking, audio, or beacon data is collected.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a] mb-1">
                <Bell className="w-5 h-5 text-[#cd131b]" />
                <span>Push Notifications (FCM)</span>
              </div>
              <p className="text-sm text-[#6b7280]">
                Used to trigger instant, high-priority audio chime and visual alerts for new incoming customer orders, order cancellations, and driver dispatch updates.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a] mb-1">
                <Server className="w-5 h-5 text-[#cd131b]" />
                <span>Local Network &amp; Wi-Fi State</span>
              </div>
              <p className="text-sm text-[#6b7280]">
                Enables direct communication with Ethernet/Wi-Fi connected receipt printers and detects network drops to prevent missed orders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#1a1a1a] mb-1">
                <Shield className="w-5 h-5 text-[#cd131b]" />
                <span>Crash Diagnostics</span>
              </div>
              <p className="text-sm text-[#6b7280]">
                Collects non-identifiable technical logs (device model, OS version, stack traces) to debug crashes and guarantee 99.9% uptime during peak dinner rush.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'third-party-processors',
      icon: <Server className="w-6 h-6 text-[#7a0b10]" />,
      title: '5. Third-Party Service Providers',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>We work with industry-certified third-party services that maintain rigorous security certifications:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>MongoDB Atlas:</strong> Encrypted cloud database infrastructure hosting operational restaurant data with automatic backups and firewall isolation.</li>
            <li><strong>Google Firebase Cloud Messaging:</strong> Real-time delivery infrastructure for instant kitchen alerts and push notifications.</li>
            <li><strong>Stripe:</strong> PCI-DSS Level 1 compliant financial infrastructure for payment settlements and merchant disbursements.</li>
            <li><strong>Cloudflare:</strong> DDoS mitigation, SSL/TLS certificate management, and API gateway protection.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'data-retention',
      icon: <FileText className="w-6 h-6 text-[#7a0b10]" />,
      title: '6. Data Retention & Legal Storage',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            Merchant profile data, store configurations, and active employee credentials are retained for the duration of the restaurant's operational partnership with Lassi Lounge.
          </p>
          <p>
            Completed transaction records, sales summaries, and tax invoices are retained for up to <strong>7 years</strong> in compliance with United States Internal Revenue Service (IRS) regulations and New York State commercial auditing requirements.
          </p>
        </div>
      ),
    },
    {
      id: 'account-deletion',
      icon: <UserX className="w-6 h-6 text-[#7a0b10]" />,
      title: '7. Account Deletion & Right to Erasure',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>
            In strict compliance with <strong>Google Play User Data &amp; Account Deletion Policies</strong>, GDPR, and CCPA, merchants and staff members have full rights to permanently delete their account and associated personal data:
          </p>
          <div className="bg-[#fef2f2] p-5 rounded-2xl border border-[#fecaca] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#991b1b]">
              <CheckCircle2 className="w-5 h-5 text-[#cd131b]" />
              <span>Two Convenient Deletion Options:</span>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#7f1d1d]">
              <li>
                <strong>In-App Deletion:</strong> Open the Merchant App &rarr; Navigate to <em>Drawer / Settings</em> &rarr; Tap <em>Delete Account</em> &rarr; Enter your password to permanently delete your profile.
              </li>
              <li>
                <strong>Web Deletion Request:</strong> Visit our dedicated web portal at{' '}
                <Link href="/delete-account" className="underline font-bold text-[#b91c1c] hover:text-[#7f1d1d]">
                  lassiloungeny.com/delete-account
                </Link>{' '}
                to request account and data removal from any web browser without logging into the app.
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'security-standards',
      icon: <Lock className="w-6 h-6 text-[#7a0b10]" />,
      title: '8. Security Measures & Encryption',
      content: (
        <div className="space-y-3 text-[#4b5563] leading-relaxed">
          <p>We implement enterprise-grade security protocols to protect merchant data:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Transport Security:</strong> All API communications between merchant devices and servers are strictly enforced using TLS 1.3 with HSTS.</li>
            <li><strong>Credential Protection:</strong> Passwords and API tokens are cryptographically hashed using salted, compute-intensive scrypt algorithms.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions prevent unauthorized staff from altering financial accounts or downloading customer lists.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-20 bg-[#faf9f8] overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-10 left-0 w-96 h-96 bg-[#cd131b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#e8a020]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdecec] text-[#a30f16] text-xs font-bold uppercase tracking-wider mb-6 border border-[#fad0d0]">
            <Shield className="w-4 h-4" />
            <span>Google Play Compliant &bull; Partner &amp; Merchant Policy</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold font-serif text-[#1a1a1a] mb-6 tracking-tight">
            Merchant &amp; Partner Privacy Policy
          </h1>

          <p className="text-lg text-[#4b5563] leading-relaxed">
            Transparent data management guidelines for restaurant owners, kitchen managers, and team members using the Lassi Lounge Merchant platform and mobile applications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#6b7280] mt-6">
            <span className="bg-white px-3 py-1 rounded-full border border-[#e5e7eb]">Last Updated: September 2026</span>
            <span className="bg-white px-3 py-1 rounded-full border border-[#e5e7eb]">Version 2.4</span>
            <Link href="/privacy-policy" className="text-[#a30f16] hover:underline flex items-center gap-1 font-semibold">
              View Customer Privacy Policy <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {sections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="bg-white p-7 sm:p-9 rounded-3xl shadow-sm border border-[#e5e7eb] hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-[#fdecec] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {sec.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1a1a1a] mb-3">
                    {sec.title}
                  </h2>
                  {sec.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support & Contact Card */}
        <div className="mt-14 bg-[#4a090b] text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e8a020]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#e8b93d]">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif mb-4">
              Questions Regarding Merchant Data?
            </h3>
            <p className="text-white/80 max-w-xl mx-auto mb-8 text-base leading-relaxed">
              Our data privacy and restaurant operations team is available to assist you with compliance inquiries, data export, or deletion requests.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:info@lassilounge.com"
                className="bg-[#e8b93d] hover:bg-[#d68f13] text-[#0e0d0c] font-bold py-3 px-7 rounded-xl shadow-md transition-colors"
              >
                Email Privacy Team (info@lassilounge.com)
              </a>
              <Link
                href="/delete-account"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-7 rounded-xl border border-white/20 transition-colors"
              >
                Request Account Deletion
              </Link>
            </div>
            <p className="text-xs text-white/60 mt-6">
              Lassi Lounge NY &bull; 9408 118th St, South Richmond Hill, NY 11419 &bull; Tel: +1 347-233-3733
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
