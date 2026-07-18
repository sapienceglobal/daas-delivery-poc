'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Plus, ArrowLeft, Users, Save, Trash2, Edit3, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { inventoryAPI, supplierAPI } from '@/lib/api';
import { GlassCard, Button, Input, showToast, Tabs, EmptyState } from '@/components/ui';

export default function InventoryDashboard() {
  const { user, isMerchant, isAuthenticated } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Suppliers form
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ id: null, name: '', contactName: '', phone: '', email: '', address: '', itemsProvided: '' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', unit: 'kg', lowStockThreshold: 5, costPerUnit: 0 });

  const [showReceiveModal, setShowReceiveModal] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ quantity: '', costPerUnit: '' });

  const [showWastageModal, setShowWastageModal] = useState(null);
  const [wastageForm, setWastageForm] = useState({ quantity: '', reason: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant) { router.push('/customer'); return; }
    loadInventory();
  }, [isAuthenticated, isMerchant]);

  const loadInventory = async () => {
    try {
      const [invRes, supRes] = await Promise.all([
        inventoryAPI.getInventory(user.restaurantId),
        supplierAPI.getAll(user.restaurantId)
      ]);
      setItems(invRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name) return showToast('Name is required', 'error');
    try {
      const payload = {
        ...supplierForm,
        itemsProvided: supplierForm.itemsProvided.split(',').map(i => i.trim()).filter(Boolean)
      };
      if (supplierForm.id) {
        await supplierAPI.update(supplierForm.id, payload);
        showToast('Supplier updated', 'success');
      } else {
        await supplierAPI.create(user.restaurantId, payload);
        showToast('Supplier added', 'success');
      }
      setShowSupplierModal(false);
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed to save supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await supplierAPI.delete(id);
      showToast('Supplier removed', 'success');
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name) return showToast('Name is required', 'error');
    try {
      await inventoryAPI.createItem(user.restaurantId, addForm);
      showToast('Item added successfully', 'success');
      setShowAddModal(false);
      setAddForm({ name: '', unit: 'kg', lowStockThreshold: 5, costPerUnit: 0 });
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  };

  const handleReceive = async () => {
    if (!receiveForm.quantity) return showToast('Quantity is required', 'error');
    try {
      await inventoryAPI.receiveShipment(showReceiveModal, {
        quantity: Number(receiveForm.quantity),
        costPerUnit: Number(receiveForm.costPerUnit) || 0
      });
      showToast('Shipment received', 'success');
      setShowReceiveModal(null);
      setReceiveForm({ quantity: '', costPerUnit: '' });
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  const handleWastage = async () => {
    if (!wastageForm.quantity) return showToast('Quantity is required', 'error');
    try {
      await inventoryAPI.logWastage(showWastageModal, {
        quantity: Number(wastageForm.quantity),
        reason: wastageForm.reason
      });
      showToast('Wastage logged', 'success');
      setShowWastageModal(null);
      setWastageForm({ quantity: '', reason: '' });
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center text-brand-muted">Loading inventory...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/merchant')} className="p-2 rounded-xl bg-brand-card border border-brand-border hover:text-brand-cyan transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
              <Package className="h-6 w-6 text-brand-cyan" />
              Inventory & Suppliers
            </h1>
          </div>
        </div>
        {activeTab === 'inventory' && (
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>Add Item</Button>
        )}
        {activeTab === 'suppliers' && (
          <Button onClick={() => {
            setSupplierForm({ id: null, name: '', contactName: '', phone: '', email: '', address: '', itemsProvided: '' });
            setShowSupplierModal(true);
          }} icon={Plus}>Add Supplier</Button>
        )}
      </div>

      <Tabs 
        tabs={[
          { value: 'inventory', label: 'Inventory', icon: Package },
          { value: 'suppliers', label: 'Suppliers', icon: Users }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === 'inventory' && (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/50 text-sm text-brand-muted">
                  <th className="pb-3 px-2">Item Name</th>
                  <th className="pb-3 px-2">Stock Level</th>
                  <th className="pb-3 px-2">Unit</th>
                  <th className="pb-3 px-2">Total Value</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-brand-muted text-sm">No inventory items found. Add one to get started.</td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item._id} className="border-b border-brand-border/30 hover:bg-brand-bg/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-bold text-brand-text">{item.name}</div>
                        {item.isLowStock && (
                          <div className="flex items-center gap-1 text-[10px] text-brand-red font-bold mt-1">
                            <AlertTriangle className="h-3 w-3" /> LOW STOCK (Min: {item.lowStockThreshold})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 font-black text-lg">
                        <span className={item.isLowStock ? 'text-brand-red' : 'text-brand-text'}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-brand-muted">{item.unit}</td>
                      <td className="py-3 px-2 text-brand-text font-medium">${(item.totalValue || 0).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <button onClick={() => setShowReceiveModal(item._id)} className="px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green text-xs font-bold hover:bg-brand-green/20 transition-colors">
                          Receive
                        </button>
                        <button onClick={() => setShowWastageModal(item._id)} className="px-3 py-1.5 rounded-lg bg-brand-yellow/10 text-brand-yellow text-xs font-bold hover:bg-brand-yellow/20 transition-colors">
                          Wastage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Users} title="No Suppliers" description="Add your first supplier to track orders." />
            </div>
          ) : (
            suppliers.map(sup => (
              <GlassCard key={sup._id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-brand-text">{sup.name}</h3>
                    <p className="text-sm text-brand-muted">{sup.contactName || 'No contact specified'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setSupplierForm({
                        id: sup._id,
                        name: sup.name,
                        contactName: sup.contactName || '',
                        phone: sup.phone || '',
                        email: sup.email || '',
                        address: sup.address || '',
                        itemsProvided: sup.itemsProvided?.join(', ') || ''
                      });
                      setShowSupplierModal(true);
                    }} className="text-brand-cyan hover:text-brand-cyan/80"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteSupplier(sup._id)} className="text-brand-red hover:text-brand-red/80"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-brand-muted mb-4">
                  {sup.phone && <p>📞 {sup.phone}</p>}
                  {sup.email && <p>✉️ {sup.email}</p>}
                  {sup.address && <p>📍 {sup.address}</p>}
                </div>
                <div className="pt-4 border-t border-brand-border">
                  <p className="text-xs font-bold text-brand-text mb-2 uppercase tracking-wider">Provides:</p>
                  <div className="flex flex-wrap gap-2">
                    {sup.itemsProvided?.length > 0 ? sup.itemsProvided.map(item => (
                      <span key={item} className="px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded text-xs">{item}</span>
                    )) : <span className="text-xs text-brand-muted">Not specified</span>}
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-brand-text">{supplierForm.id ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-brand-border rounded-xl text-brand-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <Input label="Company Name" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Contact Name" value={supplierForm.contactName} onChange={e => setSupplierForm({ ...supplierForm, contactName: e.target.value })} />
                <Input label="Phone" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
              </div>
              <Input label="Email" type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
              <Input label="Address" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} />
              <Input label="Items Provided (comma separated)" placeholder="e.g. Tomatoes, Lettuce, Beef" value={supplierForm.itemsProvided} onChange={e => setSupplierForm({ ...supplierForm, itemsProvided: e.target.value })} />
              <Button className="w-full" onClick={handleSaveSupplier} icon={Save}>Save Supplier</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md space-y-4 relative">
            <h2 className="text-xl font-bold text-brand-text">Add Inventory Item</h2>
            <Input label="Item Name" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Unit (e.g. kg, pieces)" value={addForm.unit} onChange={e => setAddForm({...addForm, unit: e.target.value})} />
              <Input label="Low Stock Alert At" type="number" value={addForm.lowStockThreshold} onChange={e => setAddForm({...addForm, lowStockThreshold: Number(e.target.value)})} />
            </div>
            <Input label="Default Cost Per Unit ($)" type="number" value={addForm.costPerUnit} onChange={e => setAddForm({...addForm, costPerUnit: Number(e.target.value)})} />
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddItem}>Save Item</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm space-y-4 relative">
            <h2 className="text-xl font-bold text-brand-text">Receive Shipment</h2>
            <Input label="Quantity Received" type="number" value={receiveForm.quantity} onChange={e => setReceiveForm({...receiveForm, quantity: e.target.value})} />
            <Input label="Actual Cost Per Unit ($)" type="number" value={receiveForm.costPerUnit} onChange={e => setReceiveForm({...receiveForm, costPerUnit: e.target.value})} />
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowReceiveModal(null)}>Cancel</Button>
              <Button onClick={handleReceive}>Add to Stock</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {showWastageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm space-y-4 relative">
            <h2 className="text-xl font-bold text-brand-text">Log Wastage</h2>
            <Input label="Quantity Wasted" type="number" value={wastageForm.quantity} onChange={e => setWastageForm({...wastageForm, quantity: e.target.value})} />
            <Input label="Reason (Optional)" value={wastageForm.reason} onChange={e => setWastageForm({...wastageForm, reason: e.target.value})} />
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowWastageModal(null)}>Cancel</Button>
              <Button onClick={handleWastage} variant="secondary">Deduct Stock</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
