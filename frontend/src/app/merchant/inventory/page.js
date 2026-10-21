'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Plus, ArrowLeft, Users, Save, Trash2, Edit3, X, Boxes, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { inventoryAPI, supplierAPI } from '@/lib/api';
import { showToast, PageLoader } from '@/components/ui';
import PageHeaderGradient from '@/components/merchant/common/PageHeaderGradient';
import TableScrollContainer from '@/components/merchant/common/TableScrollContainer';

export default function InventoryDashboard() {
  const { user, isMerchant, isAuthenticated } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  
  // suppliers form
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
    if (!isMerchant) { router.push('/'); return; }
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
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
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
      showToast('Shipment received into stock', 'success');
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
      showToast('Wastage logged and deducted', 'success');
      setShowWastageModal(null);
      setWastageForm({ quantity: '', reason: '' });
      loadInventory();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  if (loading) return <PageLoader text="Loading Inventory & Suppliers..." />;

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header section */}
      <PageHeaderGradient
        badgeIcon={Boxes}
        badgeText="Supply Chain & Ingredients"
        title="Inventory & Suppliers"
        subtitle="Manage ingredient stocks, automated low-stock warnings, deliveries and supplier contacts."
        actions={
          <div className="flex items-center gap-3">
            {activeTab === 'inventory' ? (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
              >
                <Plus className="w-4 h-4" /> Add Inventory Item
              </button>
            ) : (
              <button 
                onClick={() => {
                  setSupplierForm({ id: null, name: '', contactName: '', phone: '', email: '', address: '', itemsProvided: '' });
                  setShowSupplierModal(true);
                }} 
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
              >
                <Plus className="w-4 h-4" /> Add Supplier
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-admin-border pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
            activeTab === 'inventory'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
          }`}
        >
          <Package className="w-4 h-4" /> Inventory Stock ({items.length})
          {lowStockCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {lowStockCount} low
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
            activeTab === 'suppliers'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
          }`}
        >
          <Users className="w-4 h-4" /> Suppliers ({suppliers.length})
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-sm overflow-hidden">
          <TableScrollContainer>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-2/60 text-admin-muted font-bold text-[11px] uppercase tracking-wider font-outfit">
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">Unit Cost</th>
                  <th className="py-3.5 px-4">Total Value</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/50 text-admin-text">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-admin-muted font-medium">
                      No inventory items found. Click "Add Inventory Item" above to get started.
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item._id} className="hover:bg-admin-surface-2/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-admin-text font-outfit text-sm">{item.name}</div>
                        {item.isLowStock && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-bold mt-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-outfit">
                            <AlertTriangle className="h-3 w-3" /> LOW STOCK (Alert below: {item.lowStockThreshold} {item.unit})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-base font-outfit">
                        <span className={item.isLowStock ? 'text-rose-500' : 'text-admin-text'}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-admin-muted font-medium">{item.unit}</td>
                      <td className="py-3.5 px-4 text-admin-muted font-medium">${(item.costPerUnit || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-admin-text font-bold font-outfit">${(item.totalValue || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => setShowReceiveModal(item._id)} 
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors font-outfit inline-flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Receive
                        </button>
                        <button 
                          onClick={() => setShowWastageModal(item._id)} 
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors font-outfit inline-flex items-center gap-1"
                        >
                          <ArrowDownRight className="w-3 h-3" /> Wastage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScrollContainer>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-admin-surface border border-dashed border-admin-border rounded-2xl">
              <Users className="w-12 h-12 text-admin-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-admin-text font-outfit">No Suppliers Added</h3>
              <p className="text-xs text-admin-muted mt-1">Add your vendors and suppliers to keep track of ingredient sources.</p>
            </div>
          ) : (
            suppliers.map(sup => (
              <div key={sup._id} className="bg-admin-surface border border-admin-border rounded-2xl p-5 shadow-sm hover:border-admin-border-hover transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-base text-admin-text font-outfit">{sup.name}</h3>
                    <p className="text-xs text-admin-muted mt-0.5">{sup.contactName || 'No contact person specified'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => {
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
                      }} 
                      className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(sup._id)} 
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-admin-muted mb-4">
                  {sup.phone && <p className="flex items-center gap-2"><span>📞</span> {sup.phone}</p>}
                  {sup.email && <p className="flex items-center gap-2"><span>✉️</span> {sup.email}</p>}
                  {sup.address && <p className="flex items-center gap-2"><span>📍</span> {sup.address}</p>}
                </div>
                <div className="pt-3 border-t border-admin-border">
                  <p className="text-[10px] font-bold text-admin-muted mb-2 uppercase tracking-wider font-outfit">Supplies:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sup.itemsProvided?.length > 0 ? sup.itemsProvided.map(item => (
                      <span key={item} className="px-2 py-0.5 bg-admin-surface-2 border border-admin-border text-admin-text rounded-md text-[11px] font-medium font-outfit">{item}</span>
                    )) : <span className="text-[11px] text-admin-muted">Not specified</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h3 className="text-base font-bold text-admin-text font-outfit">{supplierForm.id ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Company / Supplier Name *</label>
                <input 
                  type="text"
                  value={supplierForm.name} 
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  placeholder="e.g. Fresh Farms Wholesale"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">Contact Person</label>
                  <input 
                    type="text"
                    value={supplierForm.contactName} 
                    onChange={e => setSupplierForm({ ...supplierForm, contactName: e.target.value })} 
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">Phone</label>
                  <input 
                    type="text"
                    value={supplierForm.phone} 
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} 
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Email</label>
                <input 
                  type="email"
                  value={supplierForm.email} 
                  onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Physical Address</label>
                <input 
                  type="text"
                  value={supplierForm.address} 
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  placeholder="Street, City, Zip"
                />
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Items Provided (comma separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. Milk, Mangoes, Sugar, Yogurt" 
                  value={supplierForm.itemsProvided} 
                  onChange={e => setSupplierForm({ ...supplierForm, itemsProvided: e.target.value })} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveSupplier}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">Add Inventory Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Item Name *</label>
                <input 
                  type="text" 
                  value={addForm.name} 
                  onChange={e => setAddForm({...addForm, name: e.target.value})} 
                  placeholder="e.g. Fresh Milk, Mango Pulp"
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">Measurement Unit</label>
                  <input 
                    type="text" 
                    value={addForm.unit} 
                    onChange={e => setAddForm({...addForm, unit: e.target.value})} 
                    placeholder="e.g. kg, liters, pcs"
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">Low Stock Alert At</label>
                  <input 
                    type="number" 
                    value={addForm.lowStockThreshold} 
                    onChange={e => setAddForm({...addForm, lowStockThreshold: Number(e.target.value)})} 
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Default Cost Per Unit ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={addForm.costPerUnit} 
                  onChange={e => setAddForm({...addForm, costPerUnit: Number(e.target.value)})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Shipment Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">Receive Shipment</h2>
              <button onClick={() => setShowReceiveModal(null)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Quantity Received *</label>
                <input 
                  type="number" 
                  value={receiveForm.quantity} 
                  onChange={e => setReceiveForm({...receiveForm, quantity: e.target.value})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Actual Cost Per Unit ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={receiveForm.costPerUnit} 
                  onChange={e => setReceiveForm({...receiveForm, costPerUnit: e.target.value})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowReceiveModal(null)}
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleReceive}
                  className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all font-outfit flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Add to Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Wastage Modal */}
      {showWastageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">Log Wastage / Spoilage</h2>
              <button onClick={() => setShowWastageModal(null)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Quantity Wasted *</label>
                <input 
                  type="number" 
                  value={wastageForm.quantity} 
                  onChange={e => setWastageForm({...wastageForm, quantity: e.target.value})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Reason (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Expired, spilled, damaged in transit"
                  value={wastageForm.reason} 
                  onChange={e => setWastageForm({...wastageForm, reason: e.target.value})} 
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowWastageModal(null)}
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleWastage}
                  className="px-5 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 hover:shadow-lg transition-all font-outfit flex items-center gap-1.5"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> Deduct Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
