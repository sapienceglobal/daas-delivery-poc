import { PackageCheck, XCircle, Truck, UtensilsCrossed } from 'lucide-react';

export const getDishImage = (itemName = '') => {
  const name = String(itemName).toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('naan') || name.includes('bread')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=300&q=80';
  if (name.includes('chole') || name.includes('bhature')) return 'https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&w=300&q=80';
  if (name.includes('kebab') || name.includes('hara')) return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80';
  if (name.includes('raita')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
};

export const isOngoingStatus = (status) => 
  ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(status);

export const getStatusMeta = (status) => {
  if (status === 'delivered') return { label: 'Delivered', icon: PackageCheck, className: 'bg-[#dff4df] text-[#2f8a42]' };
  if (status === 'cancelled') return { label: 'Cancelled', icon: XCircle, className: 'bg-[#ffe4ea] text-[#b4233a]' };
  if (status === 'picked_up' || status === 'out_for_delivery') return { label: 'Out for Delivery', icon: Truck, className: 'bg-[#fff2d8] text-[#c27611]' };
  return { label: 'Preparing', icon: UtensilsCrossed, className: 'bg-[#fff2d8] text-[#c27611]' };
};

export const formatOrderId = (order) => {
  if (order?.orderNumber) return order.orderNumber.replace(/^ORD-?/i, 'LL');
  return `LL${String(order?._id || '').slice(-5).toUpperCase()}`;
};

export const formatDate = (value) => {
  if (!value) return { date: 'Today', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};