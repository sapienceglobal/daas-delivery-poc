'use client';

import { useEffect } from 'react';
import ReferralPromptCard from './ReferralPromptCard';

export default function ReferralWelcomeModal({
  isOpen,
  onClose,
  programInfo,
  restaurantName = 'Lassi Lounge',
  onComplete,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-[420px] w-full animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <ReferralPromptCard
          programInfo={programInfo}
          restaurantName={restaurantName}
          onComplete={onComplete || onClose}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
