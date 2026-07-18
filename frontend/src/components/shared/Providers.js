'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { SocketProvider } from '@/context/SocketContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrandProvider } from '@/context/BrandContext';
import { ModalProvider } from '@/context/ModalContext';
import ModalRoot from './ModalRoot';

export function Providers({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <BrandProvider>
                <ModalProvider>
                  {children}
                  <ModalRoot />
                </ModalProvider>
              </BrandProvider>
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
