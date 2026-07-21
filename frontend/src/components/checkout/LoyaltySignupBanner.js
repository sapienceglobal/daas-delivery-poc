'use client';
import { useRouter } from 'next/navigation';

export default function LoyaltySignupBanner() {
    const router = useRouter();

    return (
        <div
            className="rounded-2xl border border-[#e5e7eb] p-6 shadow-sm text-[#ffffff] bg-cover bg-right flex flex-col relative overflow-hidden"
            style={{
                backgroundImage:
                    "linear-gradient(to right, rgba(10, 10, 10, 0.95) 45%, rgba(10, 10, 10, 0.2) 100%), url('https://images.unsplash.com/photo-1571006682869-15eebe40beff?auto=format&fit=crop&w=400&q=80')",
            }}
        >
            <h4 className="font-bold text-[18px] text-[#e8a020] mb-1">
                Join Lassi Lounge Rewards!
            </h4>
            <p className="text-[13px] text-[#ffffff] leading-relaxed mb-4 max-w-[210px]">
                Earn points on every order<br />and enjoy exclusive benefits.
            </p>
            <button
                onClick={() => router.push('/customer/profile')}
                className="bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a] font-bold text-[12px] uppercase tracking-wider rounded-lg py-2 px-5 w-fit transition-colors"
            >
                JOIN NOW
            </button>
        </div>
    );
}