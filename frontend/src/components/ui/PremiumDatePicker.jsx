'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export default function PremiumDatePicker({ 
  selected, 
  onChange, 
  placeholderText = "Select a date", 
  className = "", 
  showTimeSelect = false,
  showIcon = false,
  icon: IconComponent = Calendar,
  dateFormat,
  ...props 
}) {
  let finalDateFormat = dateFormat;
  if (!finalDateFormat) {
    if (props.showTimeSelectOnly) {
      finalDateFormat = "h:mm aa";
    } else if (showTimeSelect) {
      finalDateFormat = "MMM d, yyyy h:mm aa";
    } else {
      finalDateFormat = "MMM d, yyyy";
    }
  }

  // Calculate explicit display value for range selections so selecting a single date
  // immediately renders formatted date (e.g. "Oct 21, 2026") instead of empty / incomplete text
  let computedDisplayValue = undefined;
  if (props.selectsRange) {
    const s = props.startDate || (selected instanceof Date && !isNaN(selected.getTime()) ? selected : null);
    const e = props.endDate;
    if (s && e) {
      try {
        if (s.getTime() === e.getTime()) {
          computedDisplayValue = format(s, finalDateFormat);
        } else if (s.getFullYear() === e.getFullYear() && !props.showTimeSelect && !props.showTimeSelectOnly) {
          computedDisplayValue = `${format(s, 'MMM d')} - ${format(e, 'MMM d, yyyy')}`;
        } else {
          const sStr = format(s, finalDateFormat);
          const eStr = format(e, finalDateFormat);
          computedDisplayValue = `${sStr} - ${eStr}`;
        }
      } catch (err) {
        // fallback
      }
    } else if (s) {
      try {
        computedDisplayValue = format(s, finalDateFormat);
      } catch (err) {
        // fallback
      }
    }
  }

  const baseClasses = "w-full bg-admin-surface border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-admin-text-muted";
  const hasPadding = /\bp[xytrbl]?-\d/.test(className);
  const defaultPadding = hasPadding ? "" : "px-3.5 py-2 sm:py-2.5";
  const iconPadding = showIcon ? "pl-10" : "";
  const clearablePadding = props.isClearable ? "!pr-9 sm:!pr-10" : "";
  const finalInputClass = `${baseClasses} ${defaultPadding} ${className} ${iconPadding} ${clearablePadding}`.replace(/\s+/g, ' ').trim();

  return (
    <div className="relative w-full">
      {showIcon && (
        <IconComponent className="w-4 h-4 text-admin-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
      )}
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        dateFormat={finalDateFormat}
        placeholderText={placeholderText}
        className={finalInputClass}
        value={computedDisplayValue !== undefined ? computedDisplayValue : props.value}
        {...props}
      />
      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker__close-icon {
          display: flex;
          align-items: center;
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0.6rem;
          padding: 0;
          height: 100%;
        }
        .react-datepicker__close-icon::after {
          background-color: var(--color-admin-text-muted, #9ca3af) !important;
          color: #ffffff !important;
          font-size: 11px;
          font-weight: 700;
          width: 17px;
          height: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          transition: background-color 0.15s ease;
        }
        .react-datepicker__close-icon:hover::after {
          background-color: var(--color-brand, #cd131b) !important;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          background-color: var(--color-admin-surface, #ffffff);
          border: 1px solid var(--color-admin-border, #e5e7eb);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: var(--color-admin-card, #f8fafc);
          border-bottom: 1px solid var(--color-admin-border, #e5e7eb);
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          padding-top: 0.75rem;
          padding-bottom: 0.5rem;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: var(--color-admin-text, #111827);
          font-weight: 800;
          font-size: 0.95rem;
        }
        .react-datepicker__day-name {
          color: var(--color-admin-text-muted, #6b7280);
          font-weight: 700;
        }
        .react-datepicker__day {
          color: var(--color-admin-text, #374151);
          font-weight: 600;
          border-radius: 0.5rem;
          transition: background-color 0.15s ease;
        }
        .react-datepicker__day:hover {
          background-color: var(--color-admin-surface-light, #f1f5f9);
          color: var(--color-admin-text, #111827);
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background-color: var(--color-brand, #cd131b) !important;
          color: #ffffff !important;
          font-weight: 800;
          border-radius: 0.5rem;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: var(--color-brand, #cd131b);
          color: #ffffff;
          border-radius: 0.5rem;
        }
        .react-datepicker__time-container {
          border-left: 1px solid var(--color-admin-border, #e5e7eb);
          background-color: var(--color-admin-surface, #ffffff);
        }
        .react-datepicker__time-container .react-datepicker__time {
          background-color: var(--color-admin-surface, #ffffff);
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
          color: var(--color-admin-text, #374151);
          font-weight: 600;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
          background-color: var(--color-admin-surface-light, #f1f5f9);
          color: var(--color-admin-text, #111827);
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: var(--color-brand, #cd131b) !important;
          color: #ffffff !important;
          font-weight: 800;
        }

        /* Dark mode overrides */
        .dark .react-datepicker,
        [data-theme-mode="dark"] .react-datepicker,
        [data-theme="dark"] .react-datepicker {
          background-color: var(--color-admin-surface, #1a1a2e);
          border-color: var(--color-admin-border, rgba(255, 255, 255, 0.08));
          color: var(--color-admin-text, #f1f5f9);
        }
        .dark .react-datepicker__header,
        [data-theme-mode="dark"] .react-datepicker__header,
        [data-theme="dark"] .react-datepicker__header {
          background-color: var(--color-admin-card, #1e1e35);
          border-color: var(--color-admin-border, rgba(255, 255, 255, 0.08));
        }
        .dark .react-datepicker__current-month,
        .dark .react-datepicker-time__header,
        .dark .react-datepicker-year-header,
        [data-theme-mode="dark"] .react-datepicker__current-month,
        [data-theme-mode="dark"] .react-datepicker-time__header,
        [data-theme-mode="dark"] .react-datepicker-year-header {
          color: var(--color-admin-text, #f1f5f9) !important;
        }
        .dark .react-datepicker__day-name,
        [data-theme-mode="dark"] .react-datepicker__day-name {
          color: var(--color-admin-text-muted, #94a3b8) !important;
        }
        .dark .react-datepicker__day,
        [data-theme-mode="dark"] .react-datepicker__day {
          color: var(--color-admin-text, #f1f5f9) !important;
        }
        .dark .react-datepicker__day:hover,
        [data-theme-mode="dark"] .react-datepicker__day:hover {
          background-color: var(--color-admin-surface-light, #232340) !important;
          color: #ffffff !important;
        }
        .dark .react-datepicker__time-container,
        .dark .react-datepicker__time-container .react-datepicker__time,
        [data-theme-mode="dark"] .react-datepicker__time-container,
        [data-theme-mode="dark"] .react-datepicker__time-container .react-datepicker__time {
          background-color: var(--color-admin-surface, #1a1a2e) !important;
          border-color: var(--color-admin-border, rgba(255, 255, 255, 0.08)) !important;
        }
        .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item,
        [data-theme-mode="dark"] .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
          color: var(--color-admin-text, #f1f5f9) !important;
        }
        .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover,
        [data-theme-mode="dark"] .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
          background-color: var(--color-admin-surface-light, #232340) !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
