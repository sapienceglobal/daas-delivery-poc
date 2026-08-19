'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { menuAPI } from '@/lib/api';
import MenuManagementView from '@/components/merchant/MenuManagementView';
import MenuManagementModal from '@/components/merchant/MenuManagementModal';
import CategoryModal from '@/components/merchant/CategoryModal';
import { PageLoader, showToast, ConfirmModal } from '@/components/ui';

export default function MerchantMenuPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const loadData = async () => {
    try {

      const res = await menuAPI.getByRestaurant(roomId).catch(() => ({ data: [] }));
      setMenu(res.data || []);
    } catch (err) {
      console.error('Menu Load Error:', err);
      showToast('Failed to load menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  if (globalLoading || loading) return <PageLoader text="Loading Menu..." />;

  return (
    <>
      <MenuManagementView
        menu={menu}
        restaurant={restaurant}
        onRefresh={loadData}
        onAddItem={() => { setEditingItem(null); setIsModalOpen(true); }}
        onEditItem={(item) => { setEditingItem(item); setIsModalOpen(true); }}
        onDeleteItem={async (id) => {
          setConfirmConfig({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this menu item? This action cannot be undone.',
            onConfirm: async () => {
              try {
                await menuAPI.deleteItem(id);
                showToast('Item deleted', 'success');
                loadData();
              } catch (err) {
                showToast(err.message || 'Failed to delete item', 'error');
              }
            }
          });
        }}
        onToggleStatus={async (id) => {
          const item = menu.find(c => c.items?.some(i => i._id === id))?.items?.find(i => i._id === id);
          if (!item) return;
          try {
            await menuAPI.toggleItem(id);
            showToast('Status updated', 'success');
            loadData();
          } catch (err) {
            showToast(err.message || 'Failed to update status', 'error');
          }
        }}
        onBulkDelete={async (ids) => {
          try {
            await menuAPI.bulkDelete({ itemIds: ids });
            showToast(`${ids.length} items deleted`, 'success');
            loadData();
          } catch (err) {
            showToast(err.message || 'Failed to delete items', 'error');
          }
        }}
        onBulkUpdate={async (ids, updates) => {
          try {
            await menuAPI.bulkUpdate({ itemIds: ids, updates });
            showToast(`${ids.length} items updated`, 'success');
            loadData();
          } catch (err) {
            showToast(err.message || 'Failed to update items', 'error');
          }
        }}
        onAddCategory={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
        onEditCategory={(category) => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
        onDeleteCategory={async (id) => {
          setConfirmConfig({
            isOpen: true,
            title: 'Delete Category',
            message: 'WARNING: Are you sure you want to delete this category? All menu items inside it will also be PERMANENTLY DELETED!',
            onConfirm: async () => {
              try {
                await menuAPI.deleteCategory(id);
                showToast('Category deleted', 'success');
                loadData();
              } catch (err) {
                showToast(err.message || 'Failed to delete category', 'error');
              }
            }
          });
        }}
        onMoveItem={async (itemId, newCategoryId) => {
          try {
            await menuAPI.updateItem(itemId, { categoryId: newCategoryId });
            showToast('Item moved successfully', 'success');
            loadData();
          } catch (err) {
            showToast(err.message || 'Failed to move item', 'error');
          }
        }}
      />
      {isModalOpen && (
        <MenuManagementModal
          item={editingItem}
          categories={menu}
          restaurantId={roomId}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          onSave={loadData}
        />
      )}
      
      {isCategoryModalOpen && (
        <CategoryModal
          category={editingCategory}
          restaurantId={roomId}
          onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
          onSave={async (data, id) => {
            if (id) {
              await menuAPI.updateCategory(id, data);
              showToast('Category updated', 'success');
            } else {
              await menuAPI.createCategory(data);
              showToast('Category created', 'success');
            }
            loadData();
          }}
        />
      )}

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </>
  );
}
