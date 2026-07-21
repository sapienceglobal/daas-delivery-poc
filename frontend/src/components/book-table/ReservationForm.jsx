'use client';

import { useState, useRef } from 'react';
import { Calendar, Clock, Users, MapPin, Check, ChevronDown } from 'lucide-react';
import { showToast } from '@/components/ui';

const STEPS = [
  { id: 1, label: 'Date & Time' },
  { id: 2, label: 'Your Details' },
  { id: 3, label: 'Special Requests' },
  { id: 4, label: 'Confirmation' },
];

const LOCATIONS = [
  { id: 'Main Dining Area', label: 'Main Dining Area', desc: 'Vibrant & Spacious', icon: MapPin },
  { id: 'Private Room', label: 'Private Room', desc: 'Perfect for small groups', icon: Users },
  { id: 'Outdoor Seating', label: 'Outdoor Seating', desc: 'Open & Airy Ambiance', icon: Calendar }, // Generic icon representation
];

const OCCASIONS = ['Birthday', 'Anniversary', 'Date Night', 'Business Dinner', 'Other'];

export default function ReservationForm({ onSubmit }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('19:00');
  const [partySize, setPartySize] = useState('4');
  const [location, setLocation] = useState('Main Dining Area');
  const [occasion, setOccasion] = useState('');
  const [note, setNote] = useState('');

  // Step 2 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (currentStep === 1) {
      if (!date) return showToast('Please select a date', 'error');
      const todayStr = new Date().toISOString().split('T')[0];
      if (date < todayStr) return showToast('Please select a future date', 'error');
      if (!time) return showToast('Please select a time', 'error');
      if (!partySize || partySize < 1) return showToast('Please select a valid party size', 'error');
      
      setCurrentStep(2);
      // Scroll the form card to top
      if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (currentStep === 2) {
      if (!name || name.trim().length < 3) {
        return showToast('Please enter a valid full name (min 3 characters)', 'error');
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return showToast('Please enter a valid 10-digit phone number', 'error');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showToast('Please enter a valid email address', 'error');
      }
      // Assuming step 3 is skipped for now since requests are in step 1 based on UI
      setCurrentStep(4);
      if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Submit to backend
      if (onSubmit) {
        onSubmit({
          date, time, partySize: Number(partySize), location, occasion, specialRequests: note,
          customerName: name.trim(), customerEmail: email.trim(), customerPhone: phone.trim()
        });
      }
    }
  };

  const formRef = useRef(null);

  return (
    <div ref={formRef} className="bg-white rounded-2xl border border-[#eadfdb] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 md:p-10">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-14 w-14 rounded-full bg-[#7a0b10] flex items-center justify-center shrink-0 shadow-sm">
          <Calendar className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-[26px] font-serif font-black text-[#7a0b10] tracking-tight">Make a Reservation</h2>
          <div className="flex-1 flex items-center hidden md:flex">
             <div className="h-[1px] bg-[#eadfdb] flex-1"></div>
             <div className="w-2 h-2 rounded-full border border-[#b47b80] mx-1"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-[#b47b80] mx-1"></div>
             <div className="w-2 h-2 rounded-full border border-[#b47b80] mx-1"></div>
             <div className="h-[1px] bg-[#eadfdb] flex-1"></div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative mb-12 max-w-2xl mx-auto">
        {STEPS.map((s, idx) => {
          const isActive = currentStep === s.id;
          const isPast = currentStep > s.id;
          return (
            <div key={s.id} className="flex-1 flex flex-col items-center relative z-10">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-black transition-colors ${
                isActive ? 'bg-[#7a0b10] text-white shadow-md' 
                : isPast ? 'bg-[#fcf3e3] text-[#7a0b10] border border-[#f5a623]'
                : 'bg-white text-[#6b7280] border-2 border-[#eadfdb]'
              }`}>
                {isPast ? <Check className="h-5 w-5" strokeWidth={3} /> : s.id}
              </div>
              <span className={`text-[12px] font-bold mt-2.5 ${isActive ? 'text-[#1a1a1a]' : 'text-[#6b7280]'}`}>
                {s.label}
              </span>
              
              {idx < STEPS.length - 1 && (
                <div className={`absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] border-t-[2px] border-dotted -z-10 ${
                  isPast ? 'border-[#f5a623]' : 'border-[#eadfdb]'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 Content */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Row: Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#1a1a1a]">Select Date<span className="text-[#7a0b10]">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280]" strokeWidth={1.5} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-[#eadfdb] bg-white text-[15px] font-medium text-[#1a1a1a] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-shadow"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#1a1a1a]">Select Time<span className="text-[#7a0b10]">*</span></label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280]" strokeWidth={1.5} />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-[#eadfdb] bg-white text-[15px] font-medium text-[#1a1a1a] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-shadow appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Party Size */}
          <div className="space-y-2 max-w-[50%] md:pr-3">
            <label className="text-[13px] font-bold text-[#1a1a1a]">Party Size<span className="text-[#7a0b10]">*</span></label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280]" strokeWidth={1.5} />
              <select 
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="w-full h-[52px] pl-12 pr-10 rounded-xl border border-[#eadfdb] bg-white text-[15px] font-medium text-[#1a1a1a] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] appearance-none"
              >
                {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b7280] pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          {/* Location Cards */}
          <div className="space-y-3">
            <label className="text-[13px] font-bold text-[#1a1a1a]">Location</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOCATIONS.map(loc => {
                const isSelected = location === loc.id;
                const Icon = loc.icon;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setLocation(loc.id)}
                    className={`relative p-5 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${
                      isSelected 
                        ? 'border-[#7a0b10] bg-[#fffbf7] shadow-sm' 
                        : 'border-[#eadfdb] bg-white hover:border-[#b47b80]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#7a0b10] flex items-center justify-center text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <Icon className={`h-8 w-8 ${isSelected ? 'text-[#7a0b10]' : 'text-[#b47b80]'}`} strokeWidth={1.5} />
                    <div>
                      <h4 className={`text-[14px] font-black ${isSelected ? 'text-[#1a1a1a]' : 'text-[#333333]'}`}>{loc.label}</h4>
                      <p className="text-[11px] font-medium text-[#6b7280] mt-0.5">{loc.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-3">
            <label className="text-[13px] font-bold text-[#1a1a1a]">Occasion (Optional)</label>
            <div className="flex flex-wrap gap-2.5">
              {OCCASIONS.map(occ => (
                <button
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`px-5 py-2.5 rounded-lg border transition-all text-[13px] font-bold ${
                    occasion === occ
                      ? 'border-[#7a0b10] bg-white text-[#7a0b10] shadow-sm'
                      : 'border-[#eadfdb] bg-white text-[#4b5563] hover:border-[#b47b80]'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#1a1a1a]">Add a Note (Optional)</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests or preferences?"
              className="w-full min-h-[100px] p-4 rounded-xl border border-[#eadfdb] bg-white text-[14px] text-[#1a1a1a] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] resize-y placeholder:text-[#9ca3af]"
            />
          </div>

          {/* Submit */}
          <button 
            onClick={handleContinue}
            className="w-full h-[56px] rounded-xl bg-[#7a0b10] text-white text-[15px] font-black uppercase tracking-widest hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Continue &rarr;
          </button>
        </div>
      )}

      {/* Mock Step 2 Content for completeness */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
           <h3 className="text-[20px] font-black text-[#1a1a1a] border-b border-[#eadfdb] pb-4">Your Contact Details</h3>
           <div className="space-y-4">
              <div>
                <label className="text-[13px] font-bold text-[#1a1a1a] block mb-2">Full Name<span className="text-[#7a0b10]">*</span></label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-[52px] px-4 rounded-xl border border-[#eadfdb] bg-white text-[#1a1a1a] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-bold text-[#1a1a1a] block mb-2">Phone Number<span className="text-[#7a0b10]">*</span></label>
                  <input 
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full h-[52px] px-4 rounded-xl border border-[#eadfdb] bg-white text-[#1a1a1a] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] outline-none"
                  />
                </div>
                <div>
                   <label className="text-[13px] font-bold text-[#1a1a1a] block mb-2">Email Address <span className="text-[#9ca3af] font-medium">(optional)</span></label>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full h-[52px] px-4 rounded-xl border border-[#eadfdb] bg-white text-[#1a1a1a] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] outline-none"
                  />
                </div>
              </div>
           </div>
           
           <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setCurrentStep(1)}
                className="w-1/3 h-[56px] rounded-xl border-2 border-[#eadfdb] text-[#1a1a1a] text-[15px] font-black hover:border-[#b47b80] transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleContinue}
                className="flex-1 h-[56px] rounded-xl bg-[#7a0b10] text-white text-[15px] font-black uppercase tracking-widest hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Confirm Booking
              </button>
           </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="py-12 text-center animate-fadeIn">
          <div className="h-20 w-20 rounded-full bg-[#fdf6ec] border-2 border-[#f5a623] flex items-center justify-center mx-auto mb-6">
             <Check className="h-10 w-10 text-[#f5a623]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[28px] font-serif font-black text-[#7a0b10] mb-3">Table Reserved!</h2>
          <p className="text-[#4b5563] text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
            We've sent a confirmation to your email. We look forward to hosting you at Lassi Lounge.
          </p>
          <button onClick={() => window.location.reload()} className="px-8 h-[50px] rounded-xl border border-[#eadfdb] text-[#1a1a1a] font-bold shadow-sm hover:bg-[#fbfaf7]">
            Make another booking
          </button>
        </div>
      )}

    </div>
  );
}
