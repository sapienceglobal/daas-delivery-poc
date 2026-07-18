'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ShoppingBag, User, LogIn, LogOut, Store, ShieldCheck,
  ChefHat, Menu, X, Heart, History, Settings, Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useBrand } from '@/context/BrandContext';
import { Badge } from '@/components/ui';
import NotificationBell from './NotificationBell';

export function Header() {
  const pathname = usePathname();
  const { isSingleRestaurantMode, brand } = useBrand();

  // In single restaurant mode, hide global header on landing screens
  if (isSingleRestaurantMode && (pathname === '/' || pathname === '/customer')) {
    return null;
  }

  const { user, isAuthenticated, isMerchant, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { lang, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const brandName = brand ? brand.name : 'Restaurant Commerce';
  const firstWord = brandName.split(' ')[0] || '';
  const secondWord = brandName.split(' ').slice(1).join(' ') || '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {isSingleRestaurantMode ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg">
                <Award className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-primary-500 leading-none font-heading">
                  {firstWord} <span className="text-accent-400">{secondWord}</span>
                </h1>
                <p className="text-[9px] uppercase font-mono tracking-widest text-text-secondary mt-0.5 hidden sm:block">
                  {brand?.cuisine || 'Restaurant Brand'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-green to-brand-cyan text-brand-bg shadow-lg shadow-brand-cyan/20 group-hover:shadow-brand-cyan/40 transition-shadow">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-text to-brand-muted bg-clip-text text-transparent">
                  Restaurant <span className="text-brand-cyan">Commerce</span>
                </h1>
                <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted hidden sm:block">
                  Order • Track • Enjoy
                </p>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {!isMerchant && !isAdmin && (
            <>
              <Link href="/customer" className="px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5">
                {t('header.browse')}
              </Link>
              {isAuthenticated && (
                <Link href="/customer/orders" className="px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5">
                  {t('header.my_orders')}
                </Link>
              )}
            </>
          )}

          {isMerchant && (
            <>
              <Link href="/merchant" className="px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5 flex items-center gap-1.5">
                <Store className="h-4 w-4" />
                {t('header.dashboard')}
              </Link>
              <Link href="/merchant" className="px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5 flex items-center gap-1.5">
                <History className="h-4 w-4" />
                Orders
              </Link>
            </>
          )}

          {isAdmin && (
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {t('header.admin')}
            </Link>
          )}

          <div className="h-6 w-[1px] bg-brand-border mx-1" />

          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="px-2 py-1.5 text-xs font-bold text-brand-muted hover:text-brand-cyan hover:bg-white/5 rounded-lg transition-colors border border-brand-border/50 uppercase"
            title="Toggle Language"
          >
            {lang}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Cart - Only for Customers */}
          {!isMerchant && !isAdmin && (
            <Link href="/customer/checkout" className="relative p-2 text-brand-muted hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-brand-bg animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth / Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card/60 px-3 py-2 text-sm font-medium text-brand-text hover:border-brand-cyan/30 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand-green to-brand-cyan flex items-center justify-center text-[10px] font-bold text-brand-bg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden lg:inline">{user?.name?.split(' ')[0]}</span>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 glass-panel rounded-xl p-2 animate-slide-up">
                    <div className="px-3 py-2 border-b border-brand-border mb-1">
                      <p className="text-sm font-bold text-brand-text">{user?.name}</p>
                      <p className="text-xs text-brand-muted">{user?.email}</p>
                      <Badge color="cyan" className="mt-1">{user?.role}</Badge>
                    </div>
                    <Link href="/customer/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-white/5 rounded-lg transition-colors">
                      <Settings className="h-4 w-4" /> {t('header.profile_settings')}
                    </Link>
                    {!isMerchant && !isAdmin && (
                      <Link href="/customer/orders" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-white/5 rounded-lg transition-colors">
                        <History className="h-4 w-4" /> {t('header.order_history')}
                      </Link>
                    )}
                    <button onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-red hover:bg-brand-red/5 rounded-lg transition-colors">
                      <LogOut className="h-4 w-4" /> {t('header.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-green to-brand-cyan px-4 py-2 text-sm font-bold text-brand-bg hover:brightness-110 transition-all shadow-lg shadow-brand-green/20">
              <LogIn className="h-4 w-4" /> {t('header.sign_in')}
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!isMerchant && !isAdmin && (
            <Link href="/customer/checkout" className="relative p-2 text-brand-muted">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[9px] font-bold text-brand-bg">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-brand-muted hover:text-brand-text">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-bg/95 backdrop-blur-md animate-slide-up">
          <nav className="flex flex-col p-4 gap-1">
            {!isMerchant && !isAdmin && (
              <>
                <Link href="/customer" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-brand-text hover:bg-white/5 rounded-xl">{t('header.browse_restaurants')}</Link>
                {isAuthenticated && (
                  <Link href="/customer/orders" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-brand-muted hover:bg-white/5 rounded-xl">{t('header.my_orders')}</Link>
                )}
              </>
            )}
            
            {isMerchant && (
              <>
                <Link href="/merchant" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-brand-muted hover:bg-white/5 rounded-xl flex items-center gap-2">
                  <Store className="h-4 w-4" /> {t('header.dashboard')}
                </Link>
                <Link href="/merchant" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-brand-muted hover:bg-white/5 rounded-xl flex items-center gap-2">
                  <History className="h-4 w-4" /> Orders
                </Link>
              </>
            )}
            
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-brand-muted hover:bg-white/5 rounded-xl flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> {t('header.admin')}
              </Link>
            )}
            
            <div className="border-t border-brand-border my-2" />
            
            <div className="px-4 py-2">
              <button onClick={toggleLanguage} className="text-sm font-bold text-brand-cyan uppercase">Language: {lang}</button>
            </div>

            <div className="border-t border-brand-border my-2" />

            {isAuthenticated ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="px-4 py-3 text-sm font-medium text-brand-red hover:bg-brand-red/5 rounded-xl flex items-center gap-2 text-left">
                <LogOut className="h-4 w-4" /> {t('header.logout')} ({user?.name})
              </button>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-brand-cyan hover:bg-white/5 rounded-xl flex items-center gap-2">
                <LogIn className="h-4 w-4" /> {t('header.sign_in')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
