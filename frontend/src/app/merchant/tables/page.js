'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronLeft, Plus, Edit2, Trash2, LayoutGrid, ArrowRightLeft, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { tableAPI } from '@/lib/api';
import { showToast, PageLoader, ConfirmDialog } from '@/components/ui';
import PageHeaderGradient from '@/components/merchant/common/PageHeaderGradient';

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
    if (!isMerchant && !isAdmin) { router.push('/'); return; }
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
        showToast('Table updated successfully', 'success');
      } else {
        await tableAPI.create({ ...formData, restaurantId: user.restaurantId });
        showToast('Table created successfully', 'success');
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
      message: 'Are you sure you want to remove this table from the floor plan?',
      confirmText: 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await tableAPI.delete(id);
          showToast('Table removed successfully', 'success');
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
        message: `Table ${table.tableNumber} is currently occupied. Clear it to make it available, or jump to POS terminal to add more items?`,
        confirmText: 'Clear Table',
        cancelText: 'Open POS Cart',
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
    }
  };

  if (loading && tables.length === 0) return <PageLoader text="Loading Dining Floor Plan..." />;

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const availableCount = tables.filter(t => t.status === 'available').length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header section */}
      <PageHeaderGradient
        badgeIcon={LayoutGrid}
        badgeText="Dine-In Floor Plan"
        title="Table Management"
        subtitle="Manage live table status, dine-in occupancy, bill splitting, and table merge/move operations."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button 
              onClick={() => { setActionType('move'); setActionModalOpen(true); }}
              className="flex items-center gap-2 bg-admin-surface border border-admin-border text-admin-text px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-admin-surface-2 transition-colors shadow-sm font-outfit"
            >
              <ArrowRightLeft className="w-4 h-4 text-primary" /> Move / Merge
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
            >
              <Plus className="w-4 h-4" /> Add Table
            </button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider font-outfit">Total Tables</div>
            <div className="text-xl font-black text-admin-text font-outfit mt-0.5">{tables.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider font-outfit">Occupied</div>
            <div className="text-xl font-black text-rose-500 font-outfit mt-0.5">{occupiedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider font-outfit">Available</div>
            <div className="text-xl font-black text-emerald-500 font-outfit mt-0.5">{availableCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-admin-muted uppercase tracking-wider font-outfit">Total Capacity</div>
            <div className="text-xl font-black text-admin-text font-outfit mt-0.5">
              {tables.reduce((acc, t) => acc + (t.capacity || 0), 0)} Seats
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 mt-4">
        {tables.map(table => {
          const isOccupied = table.status === 'occupied';
          return (
            <div 
              key={table._id} 
              className={`relative flex flex-col items-center justify-center p-5 text-center cursor-pointer rounded-2xl border transition-all hover:scale-[1.03] shadow-sm ${
                isOccupied 
                  ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10 hover:border-rose-500' 
                  : 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 hover:border-emerald-500'
              }`}
              onClick={() => handleTableClick(table)}
            >
              <div className="absolute top-2.5 right-2.5 flex gap-1 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal(table); }} 
                  className="p-1 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(table._id); }} 
                  className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              
              <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center mb-3 font-outfit ${
                isOccupied 
                  ? 'border-rose-500/50 bg-rose-500/20 text-rose-500 shadow-md shadow-rose-500/10' 
                  : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-500 shadow-md shadow-emerald-500/10'
              }`}>
                <span className="text-xl font-black">{table.tableNumber}</span>
              </div>
              
              <p className="text-xs text-admin-muted font-bold font-outfit">{table.capacity} Seats ({table.shape || 'square'})</p>
              
              <span className={`mt-2.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border font-outfit ${
                isOccupied 
                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' 
                  : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              }`}>
                {table.status.toUpperCase()}
              </span>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="col-span-full py-16 text-center bg-admin-surface border border-dashed border-admin-border rounded-2xl">
            <LayoutGrid className="w-12 h-12 text-admin-muted mx-auto mb-3" />
            <h3 className="text-sm font-bold text-admin-text font-outfit">No Tables Created</h3>
            <p className="text-xs text-admin-muted mt-1">Click "Add Table" to build your restaurant's seating layout.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Table Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">{editingTable ? "Edit Table" : "Add Table"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Table Number / Label *</label>
                <input 
                  type="text" 
                  value={formData.tableNumber} 
                  onChange={(e) => setFormData({...formData, tableNumber: e.target.value})} 
                  placeholder="e.g. T-1, Patio-4"
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Seating Capacity *</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.capacity} 
                  onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  required 
                />
              </div>
              
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Table Geometry</label>
                <select 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text outline-none focus:border-primary cursor-pointer font-medium" 
                  value={formData.shape} 
                  onChange={(e) => setFormData({...formData, shape: e.target.value})}
                >
                  <option value="square">Square</option>
                  <option value="round">Round</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
                >
                  {editingTable ? 'Update Table' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move / Merge Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">Move or Merge Tables</h2>
              <button onClick={() => setActionModalOpen(false)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setActionType('move')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
                  actionType === 'move'
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md'
                    : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
                }`}
              >
                Move Table
              </button>
              <button 
                type="button" 
                onClick={() => setActionType('merge')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
                  actionType === 'merge'
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md'
                    : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
                }`}
              >
                Merge Tables
              </button>
            </div>
            
            <form onSubmit={handleActionSubmit} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">
                  {actionType === 'move' ? 'Move FROM Table (Must be occupied)' : 'Merge Table (This will be marked occupied)'}
                </label>
                <select 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text outline-none focus:border-primary cursor-pointer font-medium" 
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

              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">
                  {actionType === 'move' ? 'Move TO Table (Must be available)' : 'Into MAIN Table (Must be occupied)'}
                </label>
                <select 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text outline-none focus:border-primary cursor-pointer font-medium" 
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

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setActionModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
                >
                  Confirm {actionType === 'move' ? 'Move' : 'Merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
