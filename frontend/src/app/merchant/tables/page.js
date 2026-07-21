'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tableAPI } from '@/lib/api';
import { Button, showToast, Skeleton, Modal, Input, GlassCard, Badge, ConfirmDialog } from '@/components/ui';

export default function TablesPage() {
  const router = useRouter();
  const { user, isMerchant, isAdmin, isAuthenticated } = useAuth();
  const { joinRoom, on, off } = useSocket();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('move'); // 'move' or 'merge'
  const [sourceTableId, setSourceTableId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');
  
  const [confirmData, setConfirmData] = useState({ isOpen: false });

  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 2,
    shape: 'square'
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant && !isAdmin) { router.push('/customer'); return; }
    loadTables();
    
    if (user?.restaurantId) {
      joinRoom(user.restaurantId);
      on('table_update', handleTableUpdate);
    }

    return () => {
      off('table_update', handleTableUpdate);
    };
  }, [isAuthenticated, isMerchant]);

  const handleTableUpdate = () => {
    loadTables();
  };

  const loadTables = async () => {
    try {
      const restaurantId = user?.restaurantId;
      if (!restaurantId) return;

      const res = await tableAPI.getAll(restaurantId);
      setTables(res.data || []);
    } catch (err) {
      showToast('Failed to load tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tableAPI.update(editingTable._id, formData);
        showToast('Table updated', 'success');
      } else {
        await tableAPI.create({ ...formData, restaurantId: user.restaurantId });
        showToast('Table created', 'success');
      }
      setModalOpen(false);
      loadTables();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = (id) => {
    setConfirmData({
      isOpen: true,
      title: 'Remove Table',
      message: 'Are you sure you want to remove this table?',
      confirmText: 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await tableAPI.delete(id);
          showToast('Table removed', 'success');
          loadTables();
        } catch (err) {
          showToast('Failed to remove table', 'error');
        }
      }
    });
  };

  const openModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({ tableNumber: table.tableNumber, capacity: table.capacity, shape: table.shape });
    } else {
      setEditingTable(null);
      setFormData({ tableNumber: '', capacity: 2, shape: 'square' });
    }
    setModalOpen(true);
  };

  const handleTableClick = (table) => {
    if (table.status === 'occupied') {
      setConfirmData({
        isOpen: true,
        title: 'Table Occupied',
        message: `Table ${table.tableNumber} is occupied. Clear it to make it available, or add more items?`,
        confirmText: 'Clear Table',
        cancelText: 'Add Items (POS)',
        variant: 'primary',
        onConfirm: () => handleClearTable(table._id),
        onCancel: () => router.push(`/merchant/pos?tableId=${table._id}&tableNumber=${table.tableNumber}`)
      });
    } else {
      router.push(`/merchant/pos?tableId=${table._id}&tableNumber=${table.tableNumber}`);
    }
  };

  const handleClearTable = async (id) => {
    try {
      await tableAPI.updateStatus(id, 'available');
      showToast('Table cleared successfully', 'success');
      loadTables();
    } catch (err) {
      showToast('Failed to clear table', 'error');
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!sourceTableId || !targetTableId) {
      return showToast('Please select both tables', 'error');
    }
    if (sourceTableId === targetTableId) {
      return showToast('Cannot select the same table', 'error');
    }
    setLoading(true);
    try {
      if (actionType === 'move') {
        await tableAPI.move({ sourceTableId, targetTableId });
        showToast('Table moved successfully', 'success');
      } else {
        await tableAPI.merge({ mainTableId: targetTableId, mergeTableId: sourceTableId });
        showToast('Tables merged successfully', 'success');
      }
      setActionModalOpen(false);
      setSourceTableId('');
      setTargetTableId('');
      loadTables();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && tables.length === 0) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/merchant')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
            <Users className="h-6 w-6 text-brand-blue" /> Table Management
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setActionType('move'); setActionModalOpen(true); }}>
            Move / Merge
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" /> Add Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-8">
        {tables.map(table => (
          <GlassCard 
            key={table._id} 
            className={`relative flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:scale-105 ${table.status === 'occupied' ? 'border-brand-red/50 bg-brand-red/5' : 'border-brand-green/50 hover:border-brand-green'}`}
            onClick={() => handleTableClick(table)}
          >
            <div className="absolute top-2 right-2 flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); openModal(table); }} className="p-1 text-brand-muted hover:text-brand-text"><Edit2 className="h-3 w-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(table._id); }} className="p-1 text-brand-red/60 hover:text-brand-red"><Trash2 className="h-3 w-3" /></button>
            </div>
            
            <div className={`w-16 h-16 rounded-xl border-4 flex items-center justify-center mb-3 ${table.status === 'occupied' ? 'border-brand-red/50 text-brand-red' : 'border-brand-green/50 text-brand-green'}`}>
              <span className="text-xl font-black">{table.tableNumber}</span>
            </div>
            <p className="text-xs text-brand-muted font-bold">{table.capacity} Seats</p>
            <Badge color={table.status === 'occupied' ? 'red' : 'green'} className="mt-2 text-[10px]">
              {table.status.toUpperCase()}
            </Badge>
          </GlassCard>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full py-12 text-center text-brand-muted">
            No tables added yet. Click "Add Table" to build your floor plan.
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTable ? "Edit Table" : "Add Table"}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Table Number/Name" name="tableNumber" value={formData.tableNumber} onChange={(e) => setFormData({...formData, tableNumber: e.target.value})} required />
          <Input label="Capacity" name="capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} required min="1" />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-muted">Shape</label>
            <select className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-brand-text outline-none focus:border-brand-cyan transition-colors" value={formData.shape} onChange={(e) => setFormData({...formData, shape: e.target.value})}>
              <option value="square">Square</option>
              <option value="round">Round</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingTable ? 'Update Table' : 'Add Table'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} title="Move or Merge Tables">
        <div className="flex gap-2 mb-6">
          <Button type="button" variant={actionType === 'move' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setActionType('move')}>Move Table</Button>
          <Button type="button" variant={actionType === 'merge' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setActionType('merge')}>Merge Tables</Button>
        </div>
        
        <form onSubmit={handleActionSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-muted">
              {actionType === 'move' ? 'Move FROM Table (Must be occupied)' : 'Merge Table (This will be marked occupied)'}
            </label>
            <select 
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-brand-text outline-none focus:border-brand-cyan transition-colors" 
              value={sourceTableId} 
              onChange={(e) => setSourceTableId(e.target.value)} 
              required
            >
              <option value="">Select Table...</option>
              {tables.filter(t => actionType === 'move' ? t.status === 'occupied' : true).map(t => (
                <option key={t._id} value={t._id}>Table {t.tableNumber} ({t.status})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-muted">
              {actionType === 'move' ? 'Move TO Table (Must be available)' : 'Into MAIN Table (Must be occupied)'}
            </label>
            <select 
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-brand-text outline-none focus:border-brand-cyan transition-colors" 
              value={targetTableId} 
              onChange={(e) => setTargetTableId(e.target.value)} 
              required
            >
              <option value="">Select Table...</option>
              {tables.filter(t => actionType === 'move' ? t.status === 'available' : t.status === 'occupied').map(t => (
                <option key={t._id} value={t._id}>Table {t.tableNumber} ({t.status})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setActionModalOpen(false)} className="flex-1" type="button">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Confirm {actionType === 'move' ? 'Move' : 'Merge'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
        onConfirm={confirmData.onConfirm}
        onCancel={confirmData.onCancel}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        cancelText={confirmData.cancelText}
        variant={confirmData.variant}
      />
    </div>
  );
}
