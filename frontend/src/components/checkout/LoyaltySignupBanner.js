'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Award } from 'lucide-react';
import { loyaltyAPI } from '@/lib/api';

export default function LoyaltySignupBanner({ user, restaurant, total }) {
    const router = useRouter();

    const [loyaltyStatus, setLoyaltyStatus] = useState(null);

    useEffect(() => {
        if (user) {
            loyaltyAPI.getStatus().then((res) => {
                if (res?.data) {
                    setLoyaltyStatus(res.data);
                }
            }).catch(() => {});
        }
    }, [user]);

    const isMember = Boolean(user?.isLoyaltyMember || loyaltyStatus?.isLoyaltyMember);
    const currentBalance = user?.loyaltyPoints ?? loyaltyStatus?.currentBalance;
    const loyaltySettings = restaurant?.loyaltySettings;
    const loyaltyEnabled = loyaltySettings?.enabled !== false;
    const pointsPerDollar = loyaltySettings?.pointsPerDollar || 1;
    const pointsToEarn = (loyaltyEnabled && total > 0) ? Math.floor(total * pointsPerDollar) : 0;

    if (isMember) {
        return (
            <div
                className="rounded-2xl border border-[#e5e7eb] p-6 shadow-sm text-[#ffffff] bg-cover bg-right flex flex-col relative overflow-hidden"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(10, 10, 10, 0.95) 45%, rgba(10, 10, 10, 0.2) 100%), url('https://images.unsplash.com/photo-1571006682869-15eebe40beff?auto=format&fit=crop&w=400&q=80')",
                }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#dcfce7] text-[#15803d]">
                        <Award className="w-3 h-3" /> ACTIVE MEMBER
                    </span>
                    {currentBalance !== undefined && (
                        <span className="text-[11px] text-[#e8a020] font-bold">
                            Balance: {currentBalance} pts
                        </span>
                    )}
                </div>
                <h4 className="font-bold text-[18px] text-[#e8a020] mb-1">
                    Lassi Lounge Rewards
                </h4>
                <p className="text-[13px] text-[#ffffff] leading-relaxed mb-4 max-w-[220px]">
                    {pointsToEarn > 0 ? (
                        <>
                            You will earn <strong className="text-[#e8a020]">{pointsToEarn} points</strong> on this order upon delivery!
                        </>
                    ) : (
                        'Collect points on every order to unlock free drinks and discounts.'
                    )}
                </p>
                <button
                    onClick={() => router.push('/profile?tab=loyalty')}
                    className="bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a] font-bold text-[12px] uppercase tracking-wider rounded-lg py-2 px-5 w-fit transition-colors flex items-center gap-1.5"
                >
                    <Sparkles className="w-3.5 h-3.5" /> VIEW REWARDS
                </button>
            </div>
        );
    }

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
                {pointsToEarn > 0 ? (
                    <>
                        Earn <strong className="text-[#e8a020]">{pointsToEarn} points</strong> on this order and enjoy exclusive perks.
                    </>
                ) : (
                    <>
                        Earn points on every order<br />and enjoy exclusive benefits.
                    </>
                )}
            </p>
            <button
                onClick={() => router.push('/profile')}
                className="bg-[#e8a020] hover:bg-[#d68f13] text-[#1a1a1a] font-bold text-[12px] uppercase tracking-wider rounded-lg py-2 px-5 w-fit transition-colors"
            >
                JOIN NOW
            </button>
        </div>
    );
}