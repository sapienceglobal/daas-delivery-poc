'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, Calendar, Users, Tag, BarChart3, Mail, Lock, Eye, EyeOff, Headset, Globe, Shield
} from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errs = {};
        error.errors.forEach(err => {
          errs[err.path[0]] = err.message;
        });
        setErrors(errs);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const user = await login(email, password, rememberMe);
      
      // Strictly restrict this portal to admins and merchants
      if (user.role === 'admin' || user.role === 'merchant') {
        const redirectUrl = searchParams.get('redirect') || '/merchant';
        router.push(redirectUrl);
      } else {
        await logout(); // Log them out immediately
        showToast('Access Denied: This portal is for restaurant partners only.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const operationalFeatures = [
    { icon: ShoppingBag, label: 'Order\nManagement' },
    { icon: Shield, label: 'Menu\nManagement' }, // Shield used as placeholder, will be Utensils if available
    { icon: Calendar, label: 'Table\nReservations' },
    { icon: Users, label: 'Customer\nManagement' },
    { icon: Tag, label: 'Offers &\nPromotions' },
    { icon: BarChart3, label: 'Reports &\nAnalytics' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="w-full max-w-[1400px] min-h-screen lg:min-h-[90vh] lg:h-[90vh] flex flex-col lg:flex-row shadow-2xl relative overflow-hidden bg-white">
        
        {/* Left Side: Branded Hero (Admin Panel) */}
        <div className="relative w-full lg:w-[45%] h-full flex flex-col justify-center items-center text-center px-8 pt-12 pb-32 overflow-hidden bg-[#4a090b]">
          {/* Subtle dark pattern background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#c99742 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Food Image at the Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[45%] z-0">
            {/* Gradient to smoothly blend the image into the maroon background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#4a090b] via-[#4a090b]/60 to-transparent z-10"></div>
            <Image 
              src="/images/branded/lassi-lounge/hero-spread.jpg" 
              alt="Indian Cuisine Spread" 
              fill 
              className="object-cover object-bottom opacity-90"
              priority
            />
          </div>
          
          {/* Decorative Curved Edge SVG with Gold Border */}
          <div className="absolute top-0 right-0 h-full w-[40px] lg:w-[80px] hidden lg:block z-20 translate-x-[1px]">
             <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full">
                <path d="M0,0 C100,300 100,700 0,1000 L100,1000 L100,0 Z" fill="#fdfdfd" />
                <path d="M0,0 C100,300 100,700 0,1000" fill="none" stroke="#c99742" strokeWidth="6" />
             </svg>
          </div>

          <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            {/* Logo area */}
            <div className="mb-6 flex flex-col items-center">
              <svg className="w-12 h-12 text-[#c99742] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
              </svg>
              <h1 className="text-[40px] font-serif text-white tracking-widest mb-1 leading-none">LASSI</h1>
              <div className="flex items-center gap-4 text-white/80 w-full mb-2">
                <div className="h-[1px] flex-1 bg-white/40"></div>
                <span className="tracking-[0.3em] text-sm uppercase font-light">Lounge</span>
                <div className="h-[1px] flex-1 bg-white/40"></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#c99742] text-[10px] font-semibold tracking-widest mt-1">
                <span>∞</span>INDIAN RESTAURANT<span>∞</span>
              </div>
            </div>

            <h2 className="text-[32px] font-serif text-[#c99742] mb-4">Admin Panel</h2>
            <div className="flex items-center justify-center mb-6 w-full">
               <div className="w-2 h-2 rotate-45 bg-[#c99742] mr-2 opacity-50"></div>
               <div className="w-2 h-2 rotate-45 border border-[#c99742]"></div>
               <div className="w-2 h-2 rotate-45 bg-[#c99742] ml-2 opacity-50"></div>
            </div>

            <p className="text-white/90 text-[15px] leading-relaxed mb-12">
              Manage your restaurant operations<br/>efficiently and effortlessly.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-3 gap-y-10 gap-x-8 w-full max-w-[340px] mt-2">
              {operationalFeatures.map((feat, idx) => (
                <div key={idx} className="flex flex-col items-center group">
                  <feat.icon className="w-8 h-8 text-[#c99742] mb-3 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                  <span className="text-white/90 text-[10px] leading-snug text-center uppercase tracking-wider whitespace-pre-line font-medium">
                    {feat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#fcfdfc] relative items-center justify-center px-6 lg:px-16 py-12 lg:py-0 overflow-hidden">
          
          {/* Subtle watermarks / background texture */}
          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMzAgMjBDMjAgMzAgMjAgNTAgMzAgNjBMMTAwIDEwMEM5MCA4MCA3MCA4MCA2MCA3MEwxMCAyMEMyMCAxMCA0MCAxMCAzMCAyMFoiIGZpbGw9IiNmMmVhZTQiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-45" />
          <div className="absolute bottom-[5%] right-[5%] w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCIvPjxwYXRoIGQ9Ik01MCAxMEMzMCAzMCA3MCA3MCA1MCA5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz+')] bg-no-repeat bg-contain opacity-30 pointer-events-none -rotate-12" />
          <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMTUgNTBDMTUgMzAgMzAgMTUgNTAgMTVMMTAwIDBDODAgMjAgODAgNTAgMTAwIDcwQzgwIDkwIDUwIDkwIDUwIDcwQzMwIDcwIDE1IDkwIDE1IDUwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-[30deg]" />

          <div className="w-full max-w-[440px] mx-auto z-10">
            <div className="text-center mb-10">
              <h2 className="text-[38px] font-serif text-[#4a090b] mb-4">Welcome Back!</h2>
              <div className="flex items-center justify-center mb-4 w-full">
                 <div className="w-10 h-[1px] bg-[#c99742]"></div>
                 <div className="w-1.5 h-1.5 rotate-45 bg-[#c99742] mx-2"></div>
                 <div className="w-10 h-[1px] bg-[#c99742]"></div>
              </div>
              <p className="text-[#6b7280] text-[15px]">Sign in to your Lassi Lounge Admin Account</p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-[#f9fafb] relative overflow-hidden">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email Field */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-[#1f2937] block">Email Address</label>
                  <div className="relative flex items-center bg-white border border-[#e5e7eb] rounded-xl overflow-hidden focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20 transition-all">
                    <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                      <Mail size={18} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                      placeholder="Enter your email address"
                      className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-[#1f2937] block">Password</label>
                  <div className="relative flex items-center bg-white border border-[#e5e7eb] rounded-xl overflow-hidden focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20 transition-all">
                    <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                      <Lock size={18} strokeWidth={2} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                      placeholder="Enter your password"
                      className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 text-[#9ca3af] hover:text-[#4a090b] focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.password}</p>}
                </div>

                {/* Options */}
                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-[#d1d5db] group-hover:border-[#4a090b] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="opacity-0 absolute inset-0 cursor-pointer" 
                      />
                      {rememberMe && (
                        <div className="w-2.5 h-2.5 bg-[#4a090b] rounded-sm"></div>
                      )}
                    </div>
                    <span className="text-[13px] text-[#4b5563] group-hover:text-[#111827] transition-colors">Remember me</span>
                  </label>
                  
                  <Link href="/login" className="text-[13px] font-bold text-[#4a090b] hover:text-[#2a0506] transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[15px] rounded-xl text-[15px] font-semibold transition-all shadow-[0_8px_20px_rgba(85,12,14,0.25)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock size={16} strokeWidth={2.5} />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Footer Links */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-[13px]">
              <Link href="#" className="flex items-center gap-2 text-[#6b7280] hover:text-[#4a090b] transition-colors">
                <Headset size={16} />
                <span>Need Help? <span className="font-bold text-[#4a090b]">Contact Support</span></span>
              </Link>
              
              <div className="hidden sm:block w-[1px] h-[14px] bg-[#d1d5db]"></div>
              
              <Link href="/" className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] transition-colors">
                <Globe size={16} />
                <span>Back to Website</span>
              </Link>
            </div>
            
            <div className="mt-8 text-center text-[12px] text-[#9ca3af] font-medium">
              © {new Date().getFullYear()} Lassi Lounge. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
