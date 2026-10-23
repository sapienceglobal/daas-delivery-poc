'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, ExternalLink, Navigation, Copy, Check, 
  Phone, Clock, X, Store, ArrowUpRight, ShieldCheck, 
  ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { restaurantAPI } from '@/lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};
const DAY_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const formatTime12 = (time24) => {
  if (!time24 || typeof time24 !== 'string') return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m || '00'} ${ampm}`;
};

export default function BranchLocationModal({ 
  isOpen, 
  onClose, 
  restaurant: initialRestaurant = null,
  restaurantName = 'Lassi Lounge',
  address = '94-08 118th St, South Richmond Hill, NY 11419, United States',
  phone = '+1 347-233-3733'
}) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [restaurantData, setRestaurantData] = useState(initialRestaurant);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialRestaurant) {
      setRestaurantData(initialRestaurant);
    } else if (isOpen) {
      restaurantAPI.getMyRestaurant()
        .then((res) => {
          if (res?.data) setRestaurantData(res.data);
        })
        .catch(() => {});
    }
  }, [initialRestaurant, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic Operating Hours computation from restaurant settings
  const { 
    operatingHoursMap, 
    hoursGroups = [],
    hoursSummary, 
    todayDayKey, 
    todayHoursText, 
    isOpenNow 
  } = useMemo(() => {
    const hours = restaurantData?.operatingHours || {};
    const fallbackOpen = restaurantData?.openTime || '10:00';
    const fallbackClose = restaurantData?.closeTime || '22:00';

    const normalizedMap = {};
    DAYS.forEach((day) => {
      const dayData = hours[day];
      if (dayData && dayData.open && dayData.close) {
        normalizedMap[day] = {
          open: dayData.open,
          close: dayData.close,
          isClosed: !!dayData.isClosed
        };
      } else {
        normalizedMap[day] = {
          open: fallbackOpen,
          close: fallbackClose,
          isClosed: false
        };
      }
    });

    // Grouping consecutive days with identical hours for a concise summary
    const groups = [];
    let current = null;

    DAYS.forEach((day) => {
      const item = normalizedMap[day];
      const text = item.isClosed 
        ? 'Closed' 
        : `${formatTime12(item.open)} – ${formatTime12(item.close)}`;

      if (!current) {
        current = { start: day, end: day, text };
      } else if (current.text === text) {
        current.end = day;
      } else {
        groups.push(current);
        current = { start: day, end: day, text };
      }
    });
    if (current) groups.push(current);

    const summaryList = groups.map((g) => {
      const range = g.start === g.end 
        ? DAY_SHORT[g.start] 
        : `${DAY_SHORT[g.start]} – ${DAY_SHORT[g.end]}`;
      return `${range}: ${g.text}`;
    });

    // Determine current day of week and current open status
    const now = new Date();
    const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ...
    const dayKeysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayKey = dayKeysMap[dayIndex];
    const todayConfig = normalizedMap[currentDayKey];

    let todayText = 'Closed Today';
    let currentlyOpen = false;

    if (todayConfig && !todayConfig.isClosed) {
      todayText = `${formatTime12(todayConfig.open)} – ${formatTime12(todayConfig.close)}`;
      
      const [oh, om] = (todayConfig.open || '00:00').split(':').map(Number);
      const [ch, cm] = (todayConfig.close || '23:59').split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = oh * 60 + om;
      let closeMinutes = ch * 60 + cm;
      if (closeMinutes < openMinutes) closeMinutes += 24 * 60; // overnight support

      currentlyOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }

    return {
      operatingHoursMap: normalizedMap,
      hoursGroups: groups,
      hoursSummary: summaryList.join(' | '),
      todayDayKey: currentDayKey,
      todayHoursText: todayText,
      isOpenNow: currentlyOpen
    };
  }, [restaurantData]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const activeName = restaurantData?.name || restaurantName;
  const activeAddress = restaurantData?.address || address;
  const activePhone = restaurantData?.phone || phone;

  const encodedAddress = encodeURIComponent(activeAddress);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-admin-surface border border-admin-border rounded-3xl w-full max-w-[640px] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-admin-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-admin-border flex justify-between items-center bg-admin-surface sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand to-rose-500 text-white flex items-center justify-center shadow-md shadow-brand/20 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-heading text-admin-text">
                  {activeName}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Flagship
                </span>
              </div>
              <p className="text-xs text-admin-text-secondary mt-0.5">
                Official Restaurant Branch & Kitchen Location
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-admin-surface-light rounded-xl text-admin-text-secondary hover:text-admin-text transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-admin-bg">
          {/* Embedded Google Map Preview */}
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-admin-border shadow-sm group">
            <iframe
              title="Google Map Preview"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-md pointer-events-none">
              <MapPin className="w-3 h-3 text-brand" />
              <span>South Richmond Hill, NY</span>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 bg-admin-surface/90 hover:bg-admin-surface backdrop-blur-md text-admin-text hover:text-brand text-xs font-bold px-3 py-1.5 rounded-xl border border-admin-border shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Fullscreen</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Address Display Card */}
          <div className="bg-admin-card border border-admin-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-admin-text-secondary uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand" /> Physical Address
              </span>
              <span className="text-emerald-500 font-semibold normal-case flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified on Maps
              </span>
            </div>
            
            <p className="text-sm sm:text-base font-bold text-admin-text leading-snug">
              {activeAddress}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-admin-border/60">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied 
                    ? 'bg-emerald-500 text-white shadow-xs' 
                    : 'bg-admin-surface-light hover:bg-admin-surface border border-admin-border text-admin-text hover:text-brand'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Address'}</span>
              </button>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-admin-surface-light hover:bg-admin-surface border border-admin-border text-admin-text hover:text-brand flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-brand" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Phone Card */}
            <div className="bg-admin-card border border-admin-border rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-admin-text-secondary tracking-wider">Direct Phone</p>
                <a 
                  href={`tel:${activePhone}`} 
                  className="font-bold text-admin-text hover:text-brand transition-colors block text-xs sm:text-sm mt-0.5 truncate"
                >
                  {activePhone}
                </a>
                <span className="text-[11px] text-admin-text-secondary block mt-0.5">
                  Orders & branch support
                </span>
              </div>
            </div>

            {/* Operating Hours Card (Dynamic from Restaurant Settings) */}
            <div className="bg-admin-card border border-admin-border rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <p className="text-[10px] uppercase font-bold text-admin-text-secondary tracking-wider">Operating Hours</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                    isOpenNow 
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25' 
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isOpenNow ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                {hoursGroups.length === 1 ? (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-admin-text-secondary leading-tight">
                      {hoursGroups[0].start === hoursGroups[0].end 
                        ? DAY_LABELS[hoursGroups[0].start] 
                        : `${DAY_SHORT[hoursGroups[0].start]} – ${DAY_SHORT[hoursGroups[0].end]}`}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-admin-text leading-tight tracking-tight">
                      {hoursGroups[0].text}
                    </p>
                  </div>
                ) : hoursGroups.length > 1 ? (
                  <div className="space-y-1">
                    {hoursGroups.map((g, idx) => {
                      const range = g.start === g.end 
                        ? DAY_SHORT[g.start] 
                        : `${DAY_SHORT[g.start]} – ${DAY_SHORT[g.end]}`;
                      return (
                        <div key={idx} className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="font-semibold text-admin-text-secondary text-[11px] shrink-0">{range}:</span>
                          <span className="font-bold text-admin-text text-right">{g.text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-bold text-admin-text text-xs leading-snug">
                    {todayHoursText}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Schedule Dropdown Card */}
          <div className="bg-admin-card border border-admin-border rounded-2xl p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowFullSchedule((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-admin-text hover:text-brand transition-colors cursor-pointer select-none"
            >
              <span className="flex items-center gap-2 pr-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="font-bold text-admin-text whitespace-nowrap">Weekly Schedule</span>
                <span className="font-normal text-admin-text-secondary text-[11px] hidden sm:inline truncate">
                  ({DAY_LABELS[todayDayKey]}: {todayHoursText})
                </span>
              </span>
              <div className="flex items-center gap-1 text-admin-text-secondary text-[11px] shrink-0">
                <span>{showFullSchedule ? 'Hide' : 'View All 7 Days'}</span>
                {showFullSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showFullSchedule && (
              <div className="mt-3 pt-3 border-t border-admin-border space-y-1.5 text-xs animate-in fade-in duration-150">
                {DAYS.map((day) => {
                  const dayConfig = operatingHoursMap[day];
                  const isToday = day === todayDayKey;
                  const timeDisplay = dayConfig.isClosed 
                    ? 'Closed' 
                    : `${formatTime12(dayConfig.open)} – ${formatTime12(dayConfig.close)}`;

                  return (
                    <div 
                      key={day} 
                      className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg transition-colors ${
                        isToday 
                          ? 'bg-brand/10 border border-brand/20 font-bold text-brand' 
                          : 'text-admin-text-secondary hover:bg-admin-surface-light'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={isToday ? 'text-brand font-bold' : 'text-admin-text font-medium'}>
                          {DAY_LABELS[day]}
                        </span>
                        {isToday && (
                          <span className="text-[9px] bg-brand text-white px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                            Today
                          </span>
                        )}
                      </span>
                      <span className={dayConfig.isClosed ? 'text-rose-500 font-bold' : isToday ? 'text-brand font-bold' : 'text-admin-text font-semibold'}>
                        {timeDisplay}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-surface flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/merchant/settings"
            onClick={onClose}
            className="text-xs font-semibold text-admin-text-secondary hover:text-brand transition-colors flex items-center gap-1"
          >
            Manage Hours & Settings →
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-admin-border text-xs font-bold text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light transition-all cursor-pointer"
            >
              Close
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand hover:brightness-110 text-white text-xs font-bold shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
