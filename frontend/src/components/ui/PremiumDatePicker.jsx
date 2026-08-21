import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function PremiumDatePicker({ 
  selected, 
  onChange, 
  placeholderText = "Select a date", 
  className = "", 
  showTimeSelect = false,
  dateFormat,
  ...props 
}) {
  const baseClasses = "w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors placeholder:text-[#9ca3af]";
  
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
  
  return (
    <div className="relative w-full">
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        dateFormat={finalDateFormat}
        placeholderText={placeholderText}
        className={`${baseClasses} ${className}`}
        {...props}
      />
      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.5rem;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: #111827;
          font-weight: 600;
        }
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
        }
        .react-datepicker__day {
          color: #374151;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
          border-radius: 0.25rem;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background-color: #8B0000 !important;
          color: white !important;
          border-radius: 0.25rem;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #8B0000;
          color: white;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: #8B0000 !important;
          color: white !important;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
}
