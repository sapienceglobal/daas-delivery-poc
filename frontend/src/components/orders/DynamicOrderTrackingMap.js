'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// fix for default marker icon issues in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// custom HTML Icons (Using basic colored divs for now, looking premium)
const createIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const restaurantIcon = createIcon('#1f2937', 'R'); // Dark gray
const customerIcon = createIcon('#3b82f6', 'C'); // Blue
const courierIcon = createIcon('#ef4444', '🏍️'); // Red with bike emoji// auto-centering the map based on markers and provide a recenter button
function MapBounds({ markers }) {
  const map = useMap();
  
  const fitBounds = () => {
    if (markers.length === 0) return;
    const group = new L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
    map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
  };

  useEffect(() => {
    fitBounds();
  }, [map, markers]);

  return (
    <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
      <button 
        onClick={(e) => { e.preventDefault(); fitBounds(); }}
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          fontWeight: 'bold',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 22 2"/><path d="M12 12 2 22"/></svg>
        Re-center
      </button>
    </div>
  );
}

export default function OrderTrackingMap({ order }) {
  const hasRestaurant = typeof order.restaurantLat === 'number' && typeof order.restaurantLng === 'number';
  const hasCustomer = typeof order.addressLat === 'number' && typeof order.addressLng === 'number';
  const hasCourier = typeof order.courierLat === 'number' && typeof order.courierLng === 'number';

  const markers = [];
  if (hasRestaurant) markers.push({ lat: order.restaurantLat, lng: order.restaurantLng });
  if (hasCustomer) markers.push({ lat: order.addressLat, lng: order.addressLng });
  if (hasCourier) markers.push({ lat: order.courierLat, lng: order.courierLng });

  const defaultCenter = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [37.7749, -122.4194];

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {hasRestaurant && (
          <Marker position={[order.restaurantLat, order.restaurantLng]} icon={restaurantIcon}>
            <Popup>Restaurant</Popup>
          </Marker>
        )}
        
        {hasCustomer && (
          <Marker position={[order.addressLat, order.addressLng]} icon={customerIcon}>
            <Popup>Delivery Address</Popup>
          </Marker>
        )}
        
        {hasCourier && (
          <Marker position={[order.courierLat, order.courierLng]} icon={courierIcon}>
            <Popup>Live Courier</Popup>
          </Marker>
        )}

        <MapBounds markers={markers} />
      </MapContainer>
    </div>
  );
}
