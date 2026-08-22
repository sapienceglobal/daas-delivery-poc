'use client';
import React, { useState, useEffect } from 'react';
import { 
  Save, Image as ImageIcon, Loader2, Plus, Trash2, 
  LayoutTemplate, Info, Utensils, CalendarDays, Camera, GripVertical 
} from 'lucide-react';
import { api, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CmsManagementView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [uploadingImage, setUploadingImage] = useState(null);

  const [cmsData, setCmsData] = useState({
    heroBanners: { home: '', menu: '', orderOnline: '', checkout: '', catering: '', bookTable: '' },
    aboutUs: { ownerImage: '', restaurantImage: '', galleryImages: [] },
    cateringOccasions: [],
    cateringPackages: [],
    bookingSettings: []
  });

  const TABS = [
    { id: 'hero', label: 'Hero Banners', icon: LayoutTemplate, desc: 'Manage top banners across pages' },
    { id: 'about', label: 'About Us', icon: Info, desc: 'Update restaurant info and gallery' },
    { id: 'catering', label: 'Catering', icon: Utensils, desc: 'Manage catering occasions & packages' },
    { id: 'booking', label: 'Booking', icon: CalendarDays, desc: 'Manage table booking settings' }
  ];

  useEffect(() => {
    fetchCms();
  }, []);

  const fetchCms = async () => {
    try {
      const userRes = await authAPI.getMe();
      const restaurantId = userRes.data?.restaurantId;
      if (!restaurantId) return;

      const res = await api.get(`/api/cms?restaurantId=${restaurantId}`);
      if (res.data) {
        setCmsData({
          heroBanners: res.data.heroBanners || { home: '', menu: '', orderOnline: '', checkout: '', catering: '', bookTable: '' },
          aboutUs: res.data.aboutUs || { ownerImage: '', restaurantImage: '', galleryImages: [] },
          cateringOccasions: res.data.cateringOccasions || [],
          cateringPackages: res.data.cateringPackages || [],
          bookingSettings: res.data.bookingSettings || []
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/cms', cmsData);
      toast.success('CMS Settings updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update CMS');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, labelKey) => {
    if (!file) return null;
    setUploadingImage(labelKey);
    const formData = new FormData();
    formData.append('images', file);
    formData.append('folder', 'restaurant-platform/cms');
    try {
      const res = await api.upload('/api/upload/multiple', formData);
      if (res.data && res.data.length > 0) {
        return res.data[0].url;
      }
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(null);
    }
    return null;
  };

  // --- Handlers for Hero ---
  const updateHero = async (key, file) => {
    const url = await handleImageUpload(file, `hero-${key}`);
    if (url) {
      setCmsData(prev => ({ ...prev, heroBanners: { ...prev.heroBanners, [key]: url } }));
    }
  };

  // --- Handlers for About Us ---
  const updateAbout = async (key, file) => {
    const url = await handleImageUpload(file, `about-${key}`);
    if (url) {
      setCmsData(prev => ({ ...prev, aboutUs: { ...prev.aboutUs, [key]: url } }));
    }
  };

  const addGalleryImage = async (file) => {
    const url = await handleImageUpload(file, 'gallery-new');
    if (url) {
      setCmsData(prev => ({ ...prev, aboutUs: { ...prev.aboutUs, galleryImages: [{ src: url, alt: 'Gallery Image' }, ...(prev.aboutUs.galleryImages || [])] } }));
    }
  };

  const removeGalleryImage = (index) => {
    setCmsData(prev => {
      const newImages = [...prev.aboutUs.galleryImages];
      newImages.splice(index, 1);
      return { ...prev, aboutUs: { ...prev.aboutUs, galleryImages: newImages } };
    });
  };

  // --- Handlers for Dynamic Arrays (Catering / Booking) ---
  const handleAddDynamicItem = (tab) => {
    const key = tab === 'catering' ? 'cateringOccasions' : 'bookingSettings';
    setCmsData(prev => ({
      ...prev,
      // add to TOP of array instead of bottom
      [key]: [{ title: '', desc: '', image: '', icon: '' }, ...(prev[key] || [])]
    }));
  };

  const handleRemoveDynamicItem = (tab, index) => {
    const key = tab === 'catering' ? 'cateringOccasions' : 'bookingSettings';
    setCmsData(prev => {
      const arr = [...prev[key]];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  // --- Render Helpers ---
  const renderImageUpload = (label, currentUrl, onUpload, uploadKey, aspect = 'video') => {
    const isUploading = uploadingImage === uploadKey;

    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#374151]">{label}</label>
        <div className={`relative w-full ${aspect === 'video' ? 'aspect-video' : 'aspect-square'} bg-[#f8fafc] rounded-xl overflow-hidden border-2 border-dashed ${currentUrl ? 'border-transparent' : 'border-[#cbd5e1] hover:border-[#8B0000]'} transition-colors flex items-center justify-center group`}>
          
          {currentUrl ? (
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-[#9ca3af] group-hover:text-[#8B0000] transition-colors">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">Click to upload</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${currentUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            <label className="cursor-pointer bg-white text-[#111827] px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:scale-105 transition-transform">
              Change Image
              <input type="file" className="hidden" accept="image/*" onChange={(e) => onUpload(e.target.files[0])} disabled={isUploading} />
            </label>
          </div>

          {/* Full hidden input for empty state */}
          {!currentUrl && (
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => onUpload(e.target.files[0])} disabled={isUploading} />
          )}

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B0000] mb-2" />
              <span className="text-xs font-bold text-[#8B0000]">Uploading...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-[#8B0000]" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-8 py-5 flex justify-between items-center shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Website Content</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage dynamic content, banners, and settings for your customer website.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#8B0000] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#660000] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-72 bg-white border-r border-[#e5e7eb] py-6 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-0">
          <p className="text-xs font-black text-[#9ca3af] uppercase tracking-wider mb-2 px-3">Sections</p>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3 w-full text-left px-3 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-red-50/50 border border-[#fca5a5] shadow-sm' : 'border border-transparent hover:bg-[#f9fafb]'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#8B0000] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isActive ? 'text-[#8B0000]' : 'text-[#374151]'}`}>{tab.label}</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-8 min-h-[600px]">
            
            {/* HERO BANNERS */}
            {activeTab === 'hero' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-[#f3f4f6] pb-4 mb-6">
                  <h2 className="text-xl font-bold text-[#111827]">Hero Banners</h2>
                  <p className="text-sm text-[#6b7280] mt-1">Upload high-quality banners for the top of each page.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderImageUpload('Home Page Hero', cmsData.heroBanners?.home, (f) => updateHero('home', f), 'hero-home')}
                  {renderImageUpload('Order Online Hero', cmsData.heroBanners?.orderOnline, (f) => updateHero('orderOnline', f), 'hero-orderOnline')}
                  {renderImageUpload('Menu Page Hero', cmsData.heroBanners?.menu, (f) => updateHero('menu', f), 'hero-menu')}
                  {renderImageUpload('Checkout Page Hero', cmsData.heroBanners?.checkout, (f) => updateHero('checkout', f), 'hero-checkout')}
                  {renderImageUpload('Catering Page Hero', cmsData.heroBanners?.catering, (f) => updateHero('catering', f), 'hero-catering')}
                  {renderImageUpload('Book a Table Hero', cmsData.heroBanners?.bookTable, (f) => updateHero('bookTable', f), 'hero-bookTable')}
                </div>
              </div>
            )}

            {/* ABOUT US */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-[#f3f4f6] pb-4 mb-6">
                  <h2 className="text-xl font-bold text-[#111827]">About Us Page</h2>
                  <p className="text-sm text-[#6b7280] mt-1">Customize the story and gallery images shown on your About page.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderImageUpload('Owner / Chef Image', cmsData.aboutUs?.ownerImage, (f) => updateAbout('ownerImage', f), 'about-ownerImage', 'square')}
                  {renderImageUpload('Restaurant Spread Image', cmsData.aboutUs?.restaurantImage, (f) => updateAbout('restaurantImage', f), 'about-restaurantImage')}
                </div>
                
                <div className="pt-8 mt-8 border-t border-[#f3f4f6]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#111827]">Gallery Section Images</h3>
                      <p className="text-xs text-[#6b7280]">Add photos to your restaurant's visual gallery.</p>
                    </div>
                    <label className="cursor-pointer flex items-center gap-2 text-sm font-bold text-white bg-[#8B0000] px-4 py-2 rounded-xl hover:bg-[#660000] transition-colors shadow-sm">
                      <Plus className="w-4 h-4" /> Add Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => addGalleryImage(e.target.files[0])} disabled={uploadingImage === 'gallery-new'} />
                    </label>
                  </div>
                  
                  {uploadingImage === 'gallery-new' && (
                    <div className="w-full h-32 rounded-xl border-2 border-dashed border-[#e5e7eb] flex flex-col items-center justify-center bg-[#f9fafb] mb-4">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8B0000] mb-2" />
                      <span className="text-xs font-bold text-[#6b7280]">Uploading to gallery...</span>
                    </div>
                  )}

                  {(!cmsData.aboutUs?.galleryImages || cmsData.aboutUs.galleryImages.length === 0) && uploadingImage !== 'gallery-new' ? (
                    <div className="text-center py-12 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                      <ImageIcon className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
                      <p className="text-sm font-bold text-[#9ca3af]">No gallery images yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {cmsData.aboutUs?.galleryImages?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-[#e5e7eb]">
                          <img src={img.src} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => removeGalleryImage(idx)}
                              className="bg-white text-[#dc2626] p-2 rounded-full hover:bg-[#fef2f2] transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200"
                              title="Delete Image"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC ARRAYS (Catering / Booking) */}
            {(activeTab === 'catering' || activeTab === 'booking') && (
              <div className="space-y-12 animate-in fade-in duration-300">
                
                {/* 1. Catering Packages (Moved to TOP if activeTab is catering) */}
                {activeTab === 'catering' && (
                  <div className="space-y-6 pb-8 border-b border-[#e5e7eb]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-[#1f2937]">Catering Packages</h2>
                        <p className="text-sm text-[#6b7280]">Manage the packages displayed on the catering page.</p>
                      </div>
                      <button 
                        onClick={() => setCmsData(prev => ({
                          ...prev,
                          // add new package to the top
                          cateringPackages: [
                            { id: `pkg-${Date.now()}`, name: 'New Package', price: 0, popular: false, image: '', features: ['Feature 1'] },
                            ...(prev.cateringPackages || [])
                          ]
                        }))}
                        className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#660000] transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Package
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(!cmsData.cateringPackages || cmsData.cateringPackages.length === 0) ? (
                        <div className="text-center py-16 border-2 border-dashed border-[#e5e7eb] rounded-2xl bg-[#f9fafb]">
                          <LayoutTemplate className="w-12 h-12 text-[#d1d5db] mx-auto mb-3" />
                          <p className="text-sm font-bold text-[#9ca3af]">No packages added yet</p>
                          <p className="text-xs text-[#9ca3af] mt-1 mb-4">Click the button above to add a new package.</p>
                        </div>
                      ) : (
                        cmsData.cateringPackages.map((pkg, idx) => (
                          <div key={idx} className="p-6 border border-[#e5e7eb] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative group hover:border-[#cbd5e1] transition-colors">
                            <button 
                              onClick={() => setCmsData(prev => {
                                const arr = [...prev.cateringPackages];
                                arr.splice(idx, 1);
                                return { ...prev, cateringPackages: arr };
                              })}
                              className="absolute top-4 right-4 text-[#ef4444] hover:bg-[#fef2f2] p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="w-full md:w-48 shrink-0">
                                {renderImageUpload('Package Image', pkg.image, async (f) => {
                                  const url = await handleImageUpload(f, `pkg-img-${idx}`);
                                  if(url) {
                                    setCmsData(prev => {
                                      const arr = [...prev.cateringPackages];
                                      arr[idx].image = url;
                                      return { ...prev, cateringPackages: arr };
                                    });
                                  }
                                }, `pkg-img-${idx}`, 'video')}
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-semibold text-[#1f2937] mb-1 block">Package Name</label>
                                  <input 
                                    className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000]"
                                    value={pkg.name}
                                    onChange={(e) => setCmsData(prev => {
                                      const arr = [...prev.cateringPackages];
                                      arr[idx].name = e.target.value;
                                      return { ...prev, cateringPackages: arr };
                                    })}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-[#1f2937] mb-1 block">Price (Starting From)</label>
                                  <input 
                                    type="number"
                                    className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000]"
                                    value={pkg.price}
                                    onChange={(e) => setCmsData(prev => {
                                      const arr = [...prev.cateringPackages];
                                      arr[idx].price = Number(e.target.value);
                                      return { ...prev, cateringPackages: arr };
                                    })}
                                  />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
                                  <input 
                                    type="checkbox"
                                    id={`popular-${idx}`}
                                    checked={pkg.popular}
                                    onChange={(e) => setCmsData(prev => {
                                      const arr = [...prev.cateringPackages];
                                      arr[idx].popular = e.target.checked;
                                      return { ...prev, cateringPackages: arr };
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-[#2563eb]"
                                  />
                                  <label htmlFor={`popular-${idx}`} className="text-sm font-medium text-[#1f2937]">
                                    Mark as "Popular" Package
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-6 border-t border-[#f3f4f6]">
                              <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-[#1f2937]">Package Features</label>
                                <button 
                                  onClick={() => setCmsData(prev => {
                                    const arr = [...prev.cateringPackages];
                                    arr[idx].features.push(''); // Add feature to bottom of list
                                    return { ...prev, cateringPackages: arr };
                                  })}
                                  className="text-xs font-medium text-[#2563eb] hover:underline flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Feature
                                </button>
                              </div>
                              <div className="space-y-2">
                                {pkg.features?.map((feat, fIdx) => (
                                  <div key={fIdx} className="flex gap-2">
                                    <input 
                                      className="flex-1 border border-[#d1d5db] rounded-lg px-3 py-1.5 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000]"
                                      value={feat}
                                      placeholder="e.g. 2 Appetizers"
                                      onChange={(e) => setCmsData(prev => {
                                        const arr = [...prev.cateringPackages];
                                        arr[idx].features[fIdx] = e.target.value;
                                        return { ...prev, cateringPackages: arr };
                                      })}
                                    />
                                    <button 
                                      onClick={() => setCmsData(prev => {
                                        const arr = [...prev.cateringPackages];
                                        arr[idx].features.splice(fIdx, 1);
                                        return { ...prev, cateringPackages: arr };
                                      })}
                                      className="p-1.5 text-[#ef4444] hover:bg-[#fef2f2] rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Catering Occasions / Booking Settings */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#111827]">
                        {activeTab === 'catering' ? 'Catering Occasions' : 'Booking Settings'}
                      </h2>
                      <p className="text-sm text-[#6b7280] mt-1">Manage the dynamic cards displayed in this section.</p>
                    </div>
                    <button 
                      onClick={() => handleAddDynamicItem(activeTab)}
                      className="flex items-center gap-2 bg-[#f3f4f6] text-[#111827] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#e5e7eb] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add New Box
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {((activeTab === 'catering' ? cmsData.cateringOccasions : cmsData.bookingSettings) || []).length === 0 ? (
                       <div className="text-center py-16 border-2 border-dashed border-[#e5e7eb] rounded-2xl bg-[#f9fafb]">
                         <LayoutTemplate className="w-12 h-12 text-[#d1d5db] mx-auto mb-3" />
                         <p className="text-sm font-bold text-[#9ca3af]">No items added yet</p>
                         <p className="text-xs text-[#9ca3af] mt-1 mb-4">Click the button above to add a new card.</p>
                       </div>
                    ) : (
                      (activeTab === 'catering' ? cmsData.cateringOccasions : cmsData.bookingSettings).map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-6 p-5 border border-[#e5e7eb] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative group hover:border-[#cbd5e1] transition-colors">
                          
                          <div className="hidden md:flex items-center justify-center text-[#d1d5db] cursor-grab">
                            <GripVertical className="w-5 h-5" />
                          </div>

                          <div className="w-full md:w-40 shrink-0">
                            {renderImageUpload('Card Image', item.image, async (f) => {
                              const url = await handleImageUpload(f, `${activeTab}-img-${idx}`);
                              if(url) {
                                setCmsData(prev => {
                                  const arr = [...(activeTab === 'catering' ? prev.cateringOccasions : prev.bookingSettings)];
                                  arr[idx].image = url;
                                  return { ...prev, [activeTab === 'catering' ? 'cateringOccasions' : 'bookingSettings']: arr };
                                });
                              }
                            }, `${activeTab}-img-${idx}`, 'video')}
                          </div>

                          <div className="flex-1 space-y-3 pt-6">
                            <div>
                              <label className="text-xs font-semibold text-[#6b7280] mb-1 block">Title / Heading</label>
                              <input 
                                className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000]"
                                value={item.title}
                                placeholder="e.g. Corporate Events"
                                onChange={(e) => setCmsData(prev => {
                                  const arr = [...(activeTab === 'catering' ? prev.cateringOccasions : prev.bookingSettings)];
                                  arr[idx].title = e.target.value;
                                  return { ...prev, [activeTab === 'catering' ? 'cateringOccasions' : 'bookingSettings']: arr };
                                })}
                              />
                            </div>
                            {activeTab === 'booking' && (
                              <div>
                                <label className="text-xs font-semibold text-[#6b7280] mb-1 block">Description</label>
                                <textarea 
                                  rows="2"
                                  className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000] custom-scrollbar"
                                  value={item.desc}
                                  placeholder="Short description about this setting..."
                                  onChange={(e) => setCmsData(prev => {
                                    const arr = [...prev.bookingSettings];
                                    arr[idx].desc = e.target.value;
                                    return { ...prev, bookingSettings: arr };
                                  })}
                                />
                              </div>
                            )}
                            {activeTab === 'catering' && (
                              <div>
                                <label className="text-xs font-semibold text-[#6b7280] mb-1 flex justify-between">
                                  <span>Lucide Icon Name</span>
                                  <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline font-normal">View Icons</a>
                                </label>
                                <input 
                                  className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white outline-none focus:border-[#8B0000]"
                                  value={item.icon}
                                  placeholder="e.g. Heart, Briefcase, Cake"
                                  onChange={(e) => setCmsData(prev => {
                                    const arr = [...prev.cateringOccasions];
                                    arr[idx].icon = e.target.value;
                                    return { ...prev, cateringOccasions: arr };
                                  })}
                                />
                              </div>
                            )}
                          </div>

                          <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0 md:pt-6">
                            <button 
                              onClick={() => handleRemoveDynamicItem(activeTab, idx)}
                              className="p-2 text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}