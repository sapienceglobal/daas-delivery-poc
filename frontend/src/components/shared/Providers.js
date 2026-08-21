'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { SocketProvider } from '@/context/SocketContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrandProvider } from '@/context/BrandContext';
import { ModalProvider } from '@/context/ModalContext';
import { CmsProvider } from '@/context/CmsContext';
import ModalRoot from './ModalRoot';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <BrandProvider>
                <CmsProvider>
                  <ModalProvider>
                    {children}
                    <ModalRoot />
                    <Toaster position="top-center" />
                  </ModalProvider>
                </CmsProvider>
              </BrandProvider>
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
