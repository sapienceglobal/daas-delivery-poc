'use client';

import { useEffect, useState } from 'react';
import { reservationAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';

export default function MyReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await reservationAPI.getMyReservations();
        if (!isCancelled) setReservations(res?.data || []);
      } catch (err) {
        if (!isCancelled) showToast(err.message || 'Failed to load reservations', 'error');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchReservations();
    return () => { isCancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#7a0b10]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eadfdb] overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
      <div className="p-6 md:p-8 border-b border-[#eadfdb]">
        <h2 className="text-[20px] font-black text-[#1a1a1a] mb-1">My Reservations</h2>
        <p className="text-[14px] text-[#6b7280]">View and manage your table bookings</p>
      </div>

      <div className="p-6 md:p-8">
        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#eadfdb]">
              <Calendar className="h-8 w-8 text-[#6b7280]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-2">No Reservations Found</h3>
            <p className="text-[#6b7280] text-[14px]">You have not booked any tables yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservations.map((res) => (
              <div key={res._id} className="border border-[#eadfdb] rounded-xl p-5 hover:border-[#7a0b10] transition-colors relative">
                
                {/* Status Badge */}
                <div className="absolute top-5 right-5">
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                    res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    res.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    res.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {res.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-[#f4f7f9] rounded-lg flex items-center justify-center border border-[#eadfdb]">
                    <Calendar className="h-5 w-5 text-[#7a0b10]" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1a1a1a]">
                      {new Date(res.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h4>
                    <p className="text-[13px] text-[#6b7280] font-medium mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {res.time}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#eadfdb]/60">
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-[#9ca3af] mt-0.5" />
                    <div>
                      <p className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider mb-0.5">Guests</p>
                      <p className="text-[13px] font-medium text-[#1a1a1a]">{res.partySize} People</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#9ca3af] mt-0.5" />
                    <div>
                      <p className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider mb-0.5">Location</p>
                      <p className="text-[13px] font-medium text-[#1a1a1a] truncate pr-2">{res.location}</p>
                    </div>
                  </div>
                </div>

                {res.specialRequests && (
                  <div className="mt-4 pt-4 border-t border-[#eadfdb]/60">
                    <p className="text-[11px] text-[#6b7280] font-bold uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-[13px] text-[#4b5563] italic line-clamp-2">{res.specialRequests}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
