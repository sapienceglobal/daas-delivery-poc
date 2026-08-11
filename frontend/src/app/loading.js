'use client';

export default function Loading() {
  return (
    <div
      className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center bg-transparent"
      style={{ colorScheme: 'light', color: '#1a1a1a' }}
    >
      {/* Animated Rings */}
      <div className="relative flex items-center justify-center w-20 h-20 mb-6">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#e8a020]/20 animate-ping" />

        {/* Inner spinning ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#7a0b10] border-r-[#7a0b10] animate-spin" />

        {/* Center Logo */}
        <img
          src="/assets/images/branded/lassi-lounge/icon-small.png"
          alt=""
          className="w-9 h-9 object-contain animate-pulse"
        />
      </div>

      {/* Premium Text Loading State */}
      <div className="space-y-3 text-center">
        <h3
          className="text-[20px] font-serif font-bold tracking-wide animate-pulse"
          style={{ color: '#1a1a1a' }}
        >
          Curating Your Experience
        </h3>
        <div className="flex items-center justify-center gap-1.5 opacity-70">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}