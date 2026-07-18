'use client';
import { useModal } from '@/context/ModalContext';
import ItemCustomizationModal from './ItemCustomizationModal';

/**
 * ModalRoot — renders whichever modal is currently active. Mount this once
 * near the root of layout.js (inside <ModalProvider>), never per-page.
 * Add new `case` entries here as new modal types are introduced (e.g.
 * 'address', 'orderTracking') instead of scattering modal JSX per page.
 */
export default function ModalRoot() {
  const { modal, closeModal } = useModal();

  if (!modal) return null;

  switch (modal.name) {
    case 'itemCustomization':
      return <ItemCustomizationModal {...modal.props} onClose={closeModal} />;
    default:
      return null;
  }
}