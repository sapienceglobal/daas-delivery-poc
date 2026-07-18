'use client';
import { createContext, useContext, useState, useCallback } from 'react';

/**
 * ModalContext — single generic modal manager for the whole app.
 * Any component can call `openModal('itemCustomization', { item })` and the
 * root <ModalRoot /> (rendered once in layout.js) decides which modal
 * component to render based on the `name`. This keeps individual sections
 * (DishCard, MenuItemRow, etc.) free of modal open/close state — they just
 * ask for a modal by name and pass it props.
 *
 * If your project already has an AddressModal-specific context, wire it
 * through this same manager (name: 'address') rather than keeping a
 * second, parallel modal system.
 */
const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null); // { name: string, props: object } | null

  const openModal = useCallback((name, props = {}) => {
    setModal({ name, props });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}