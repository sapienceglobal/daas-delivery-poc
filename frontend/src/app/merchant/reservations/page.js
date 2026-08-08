'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { reservationAPI } from '@/lib/api';
import ReservationsView from '@/components/merchant/ReservationsView';
import ReservationModal from '@/components/merchant/ReservationModal';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantReservationsPage() {
  const { roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const loadData = async () => {
    try {

      if (!reservationAPI.getRestaurantReservations) {
        setLoading(false);
        return;
      }
      const res = await reservationAPI.getRestaurantReservations(roomId).catch(() => ({ data: [] }));
      setReservations(res.data || []);
    } catch (err) {
      console.error('Reservations Load Error:', err);
      showToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await reservationAPI.update(id, { status });
      showToast(`Reservation status updated to ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleBulkUpdateStatus = async (reservationIds, status) => {
    try {
      await reservationAPI.bulkUpdateStatus({ reservationIds, status });
      showToast(`Updated ${reservationIds.length} reservations to ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Bulk update failed', 'error');
    }
  };

  const handleSaveReservation = async (reservationData) => {
    try {
      if (reservationData._id) {
        await reservationAPI.update(reservationData._id, reservationData);
        showToast('Reservation updated successfully', 'success');
      } else {
        await reservationAPI.create(reservationData);
        showToast('Reservation created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      throw err;
    }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Reservations..." />;

  return (
    <>
      <ReservationsView
        reservations={reservations}
        onUpdateReservationStatus={handleUpdateStatus}
        onBulkUpdateReservationStatus={handleBulkUpdateStatus}
        onEdit={(res) => {
          setSelectedReservation(res);
          setIsModalOpen(true);
        }}
      />
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReservation}
        reservation={selectedReservation}
        restaurantId={roomId}
      />
    </>
  );
}
