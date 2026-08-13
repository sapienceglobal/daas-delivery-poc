'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram, MessageCircle, Star, ChevronRight, ArrowUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import { footerContent } from './config';
import { useBrand } from '@/context/BrandContext';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  whatsapp: MessageCircle,
  yelp: Star,
};

const SOCIAL_BG = {
  facebook: 'bg-[#1877F2]',
  instagram: 'bg-gradient-to-tr from-[#F9CE34] via-[#EE2A7B] to-[#6228D7]',
  whatsapp: 'bg-[#25D366]',
  yelp: 'bg-[#E4443C]',
};

export default function LassiLoungeFooter() {
  const { brand } = useBrand();
  const { description, hours, viewAllHoursCta, findUs, social, legalLinks } = footerContent;
  const year = new Date().getFullYear();

  const visitUs = {
    address: brand?.address || footerContent.visitUs.address,
    phone: brand?.phone || footerContent.visitUs.phone,
    email: brand?.email || footerContent.visitUs.email,
  };

  const dynamicFindUs = {
    address: brand?.address ? `${brand.name || 'Lassi Lounge'}, ${brand.address}` : footerContent.findUs.address,
    mapLink: brand?.address ? `https://maps.google.com/?q=${encodeURIComponent(brand.address)}` : footerContent.findUs.mapLink,
    mapImage: footerContent.findUs.mapImage,
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const getDynamicHours = () => {
    if (!brand?.operatingHours) return footerContent.hours;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formatted = [];
    let currentGroup = null;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const hrs = brand.operatingHours[day];

      const timeString = !hrs?.isClosed && hrs?.open && hrs?.close
        ? `${formatTime(hrs.open)} - ${formatTime(hrs.close)}`
        : 'Closed';

      if (!currentGroup) {
        currentGroup = { startDay: day, endDay: day, time: timeString };
      } else if (currentGroup.time === timeString) {
        currentGroup.endDay = day;
      } else {
        formatted.push(currentGroup);
        currentGroup = { startDay: day, endDay: day, time: timeString };
      }
    }
    if (currentGroup) formatted.push(currentGroup);

    return formatted.map(g => {
      const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const dayStr = g.startDay === g.endDay ? capitalize(g.startDay) : `${capitalize(g.startDay)} - ${capitalize(g.endDay.substring(0, 3))}`;
      return { day: dayStr, time: g.time };
    });
  };

  const displayHours = getDynamicHours();


  return (
    <footer className="bg-[#141212] border-t border-white/10 pt-4">

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">

        <div className="md:pr-8 py-8 md:py-0">
          <div className="flex items-baseline gap-1.5 mb-4">
            {brand?.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-20 w-auto object-contain" />
            ) : (
              <>
                <span className="text-4xl font-bold text-[#E63946]" style={{ fontFamily: 'var(--font-script)' }}>
                  Lassi
                </span>
                <span className="text-sm font-bold text-[#E8B93D] tracking-widest mt-1">LOUNGE</span>
              </>
            )}
          </div>
          <p className="text-[#D8D4CF] text-sm mt-3 leading-relaxed pr-4">{brand?.cuisine ? `${brand.cuisine} Restaurant. ` : ''}{description}</p>
          <div className="flex items-center gap-3 mt-6">
            {social.map((item) => {
              const Icon = SOCIAL_ICONS[item.id] ?? Star;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-85 transition-opacity duration-base ${SOCIAL_BG[item.id] ?? 'bg-[#333]'}`}
                >
                  <Icon size={16} fill={item.id === 'yelp' ? 'currentColor' : 'none'} />
                </a>
              );
            })}
          </div>
        </div>


        <div className="md:px-8 py-8 md:py-0">
          <h3 className="text-[#E8B93D] text-sm font-bold uppercase tracking-widest mb-5">Visit Us</h3>
          <ul className="flex flex-col gap-4 text-[13px] text-[#D8D4CF]">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-[#E8B93D] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{visitUs.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-[#E8B93D] shrink-0" />
              <a href={`tel:${visitUs.phone}`} className="hover:text-[#E8B93D] transition-colors">{visitUs.phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-[#E8B93D] shrink-0" />
              <a href={`mailto:${visitUs.email}`} className="hover:text-[#E8B93D] transition-colors">{visitUs.email}</a>
            </li>
          </ul>
        </div>


        <div className="md:px-8 py-8 md:py-0">
          <h3 className="text-[#E8B93D] text-sm font-bold uppercase tracking-widest mb-5">Hours of Operation</h3>
          <ul className="flex flex-col gap-2.5 text-[13px] text-[#D8D4CF]">
            {displayHours.map((row) => (
              <li key={row.day} className="flex justify-between gap-4 whitespace-nowrap">
                <span>{row.day}</span>
                <span className="text-white font-medium">{row.time}</span>
              </li>
            ))}
          </ul>

          <Button
            href={viewAllHoursCta.href}
            variant="custom"
            className="bg-transparent border border-[#E8B93D] text-[#E8B93D] hover:bg-[#E8B93D] hover:text-black mt-6 !px-5 !py-2.5 text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 rounded-md transition-colors"
          >
            {viewAllHoursCta.label}
            <ChevronRight size={14} strokeWidth={2.5} />
          </Button>
        </div>


        <div className="md:pl-8 py-8 md:py-0">

          <h3 className="text-[#E8B93D] text-sm font-bold uppercase tracking-widest mb-5">Find Us</h3>

          <Link
            href={dynamicFindUs.mapLink}
            target="_blank"
            rel="noopener noreferrer"

            className="relative block h-32 w-full rounded-lg overflow-hidden bg-[#2A2A2A] shadow-md group"
          >
            <Image src={dynamicFindUs.mapImage} alt="Map showing location" fill sizes="240px" priority className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="absolute bottom-2 left-2 right-2 bg-[#FCF9F4] rounded-md shadow border border-[#1a1a1a]/10 p-2.5 flex flex-row items-center gap-2.5 group-hover:-translate-y-0.5 transition-transform duration-300">
              <div className="bg-[#C8102E]/10 p-1.5 rounded-full shrink-0">
                <MapPin size={20} className="text-[#C8102E]" fill="#C8102E" strokeWidth={1} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-[13px] font-extrabold text-[#1a1a1a] leading-tight truncate">{brand?.name || 'Lassi Lounge'}</p>
                <p className="text-[11px] text-[#1a1a1a]/70 leading-tight mt-0.5 font-medium truncate">{dynamicFindUs.address}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>


      <div className="border-t border-white/10 mt-2">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 flex items-center justify-between gap-4 text-[11px] text-[#A8A49F]">
          <span>© {year} Lassi Lounge. All Rights Reserved.</span>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6">
              {legalLinks.map((link, i) => (
                <span key={link.href} className="flex items-center gap-6">
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                  {i < legalLinks.length - 1 && <span className="text-white/20">|</span>}
                </span>
              ))}
            </div>


            <button
              type="button"
              aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-7 h-7 rounded-full border border-[#E8B93D] text-[#E8B93D] flex items-center justify-center hover:bg-[#E8B93D] hover:text-black transition-colors duration-300 shrink-0 shadow-sm"
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}