'use client';
import React, { useState, useEffect } from 'react';
import { 
  Save, Image as ImageIcon, Loader2, Plus, Trash2, 
  LayoutTemplate, Info, Utensils, CalendarDays, Camera, GripVertical, Ticket, Globe
} from 'lucide-react';
import StaticPagesSeoModal from '@/components/merchant/StaticPagesSeoModal';
import { api, authAPI, couponAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CmsManagementView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [uploadingImage, setUploadingImage] = useState(null);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);

  const [cmsData, setCmsData] = useState({
    heroBanners: { home: '', menu: '', orderOnline: '', checkout: '', catering: '', bookTable: '' },
    aboutUs: { ownerImage: '', restaurantImage: '', galleryImages: [] },
    cateringOccasions: [],
    cateringPackages: [],
    bookingSettings: [],
    promotions: { menuPage: '', mobileHome: '' }
  });

  const TABS = [
    { id: 'hero', label: 'Hero Banners', icon: LayoutTemplate, desc: 'Manage top banners across pages' },
    { id: 'about', label: 'About Us', icon: Info, desc: 'Update restaurant info and gallery' },
    { id: 'catering', label: 'Catering', icon: Utensils, desc: 'Manage catering occasions & packages' },
    { id: 'booking', label: 'Booking', icon: CalendarDays, desc: 'Manage table booking settings' },
    { id: 'promotions', label: 'Promotions', icon: Ticket, desc: 'Manage coupon placements' }
  ];

  useEffect(() => {
    fetchCms();
  }, []);

  const fetchCms = async () => {
    try {
      const userRes = await authAPI.getMe();
      const restaurantIdRaw = userRes.data?.restaurantId;
      const restaurantId = typeof restaurantIdRaw === 'object' ? restaurantIdRaw._id : restaurantIdRaw;
      if (!restaurantId) return;

      const res = await api.get(`/api/cms?restaurantId=${restaurantId}`);
      if (res.data) {
        setCmsData({
          heroBanners: res.data.heroBanners || { home: '', menu: '', orderOnline: '', checkout: '', catering: '', bookTable: '' },
          aboutUs: res.data.aboutUs || { ownerImage: '', restaurantImage: '', galleryImages: [] },
          cateringOccasions: res.data.cateringOccasions || [],
          cateringPackages: res.data.cateringPackages || [],
          bookingSettings: res.data.bookingSettings || [],
          promotions: res.data.promotions || { menuPage: '', mobileHome: '' }
        });
      }

      // Fetch active coupons for dropdowns
      try {
        const couponsRes = await couponAPI.getActive();
        if (couponsRes.success) setActiveCoupons(couponsRes.data);
      } catch (err) {
        console.error('Failed to load active coupons for CMS', err);
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
        <label className="text-sm font-bold text-admin-text font-outfit">{label}</label>
        <div className={`relative w-full ${aspect === 'video' ? 'aspect-video' : 'aspect-square'} bg-admin-card rounded-2xl overflow-hidden border-2 border-dashed ${currentUrl ? 'border-transparent' : 'border-admin-border hover:border-brand'} transition-all flex items-center justify-center group shadow-sm`}>
          
          {currentUrl ? (
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-admin-text-secondary group-hover:text-brand transition-colors">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">Click to upload</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity flex items-center justify-center ${currentUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            <label className="cursor-pointer bg-admin-surface text-admin-text px-4 py-2 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform border border-admin-border font-outfit">
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
            <div className="absolute inset-0 bg-admin-surface/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-brand mb-2" />
              <span className="text-xs font-bold text-brand font-outfit">Uploading...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-admin-bg"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;

  return (
    <div className="flex flex-col h-full bg-admin-bg overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 border-b border-admin-border bg-admin-surface px-8 py-5 flex justify-between items-center shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-admin-text font-outfit">Website Content</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage dynamic content, banners, and settings for your customer website.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSeoModalOpen(true)}
            className="flex items-center gap-2 bg-admin-card border border-admin-border px-4 py-2.5 rounded-xl text-sm font-bold text-blue-400 hover:bg-admin-surface-hover hover:text-blue-300 transition-all shadow-sm font-outfit"
          >
            <Globe className="w-4 h-4" /> Static Pages SEO
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-md shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg font-outfit"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-72 bg-admin-surface border-r border-admin-border py-6 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar z-0">
          <p className="text-xs font-black text-admin-text-secondary uppercase tracking-wider mb-2 px-3 font-outfit">Sections</p>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3 w-full text-left px-3 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-brand/10 border border-brand/30 shadow-sm' : 'border border-transparent hover:bg-admin-card text-admin-text-secondary hover:text-admin-text'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand text-white' : 'bg-admin-card text-admin-text-secondary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold font-outfit ${isActive ? 'text-brand' : 'text-admin-text'}`}>{tab.label}</p>
                  <p className="text-[11px] text-admin-text-secondary mt-0.5 leading-snug">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
          <div className="max-w-5xl mx-auto bg-admin-surface rounded-2xl shadow-sm border border-admin-border p-8 min-h-[600px]">
            
            {/* HERO BANNERS */}
            {activeTab === 'hero' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-admin-border pb-4 mb-6">
                  <h2 className="text-xl font-bold text-admin-text font-outfit">Hero Banners</h2>
                  <p className="text-sm text-admin-text-secondary mt-1">Upload high-quality banners for the top of each page.</p>
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
                <div className="border-b border-admin-border pb-4 mb-6">
                  <h2 className="text-xl font-bold text-admin-text font-outfit">About Us Page</h2>
                  <p className="text-sm text-admin-text-secondary mt-1">Customize the story and gallery images shown on your About page.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderImageUpload('Owner / Chef Image', cmsData.aboutUs?.ownerImage, (f) => updateAbout('ownerImage', f), 'about-ownerImage', 'square')}
                  {renderImageUpload('Restaurant Spread Image', cmsData.aboutUs?.restaurantImage, (f) => updateAbout('restaurantImage', f), 'about-restaurantImage')}
                </div>
                
                <div className="pt-8 mt-8 border-t border-admin-border">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-admin-text font-outfit">Gallery Section Images</h3>
                      <p className="text-xs text-admin-text-secondary">Add photos to your restaurant's visual gallery.</p>
                    </div>
                    <label className="cursor-pointer flex items-center gap-2 text-sm font-bold text-white bg-brand px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm font-outfit">
                      <Plus className="w-4 h-4" /> Add Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => addGalleryImage(e.target.files[0])} disabled={uploadingImage === 'gallery-new'} />
                    </label>
                  </div>
                  
                  {uploadingImage === 'gallery-new' && (
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-admin-border flex flex-col items-center justify-center bg-admin-card mb-4">
                      <Loader2 className="w-6 h-6 animate-spin text-brand mb-2" />
                      <span className="text-xs font-bold text-admin-text-secondary font-outfit">Uploading to gallery...</span>
                    </div>
                  )}

                  {(!cmsData.aboutUs?.galleryImages || cmsData.aboutUs.galleryImages.length === 0) && uploadingImage !== 'gallery-new' ? (
                    <div className="text-center py-12 border-2 border-dashed border-admin-border rounded-2xl bg-admin-card">
                      <ImageIcon className="w-10 h-10 text-admin-text-secondary/40 mx-auto mb-3" />
                      <p className="text-sm font-bold text-admin-text-secondary font-outfit">No gallery images yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {cmsData.aboutUs?.galleryImages?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-admin-border">
                          <img src={img.src} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => removeGalleryImage(idx)}
                              className="bg-admin-surface text-rose-500 p-2.5 rounded-xl hover:bg-rose-500/10 transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-200 border border-admin-border"
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
                  <div className="space-y-6 pb-8 border-b border-admin-border">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-admin-text font-outfit">Catering Packages</h2>
                        <p className="text-sm text-admin-text-secondary">Manage the packages displayed on the catering page.</p>
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
                        className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm font-outfit"
                      >
                        <Plus className="w-4 h-4" /> Add Package
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(!cmsData.cateringPackages || cmsData.cateringPackages.length === 0) ? (
                        <div className="text-center py-16 border-2 border-dashed border-admin-border rounded-2xl bg-admin-card">
                          <LayoutTemplate className="w-12 h-12 text-admin-text-secondary/40 mx-auto mb-3" />
                          <p className="text-sm font-bold text-admin-text-secondary font-outfit">No packages added yet</p>
                          <p className="text-xs text-admin-text-secondary/60 mt-1 mb-4">Click the button above to add a new package.</p>
                        </div>
                      ) : (
                        cmsData.cateringPackages.map((pkg, idx) => (
                          <div key={idx} className="p-6 border border-admin-border rounded-2xl bg-admin-card shadow-sm relative group hover:border-brand/40 transition-colors">
                            <button 
                              onClick={() => setCmsData(prev => {
                                const arr = [...prev.cateringPackages];
                                arr.splice(idx, 1);
                                return { ...prev, cateringPackages: arr };
                              })}
                              className="absolute top-4 right-4 text-rose-500 hover:bg-rose-500/10 p-2 rounded-xl transition-colors"
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
                                  <label className="text-xs font-semibold text-admin-text-secondary mb-1 block font-outfit">Package Name</label>
                                  <input 
                                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-all"
                                    value={pkg.name}
                                    onChange={(e) => setCmsData(prev => {
                                      const arr = [...prev.cateringPackages];
                                      arr[idx].name = e.target.value;
                                      return { ...prev, cateringPackages: arr };
                                    })}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-admin-text-secondary mb-1 block font-outfit">Price (Starting From)</label>
                                  <input 
                                    type="number"
                                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-all"
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
                                    className="w-4 h-4 rounded border-admin-border text-brand focus:ring-brand/20 bg-admin-surface cursor-pointer"
                                  />
                                  <label htmlFor={`popular-${idx}`} className="text-sm font-medium text-admin-text cursor-pointer">
                                    Mark as "Popular" Package
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-6 border-t border-admin-border">
                              <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-admin-text font-outfit">Package Features</label>
                                <button 
                                  onClick={() => setCmsData(prev => {
                                    const arr = [...prev.cateringPackages];
                                    arr[idx].features.push(''); // Add feature to bottom of list
                                    return { ...prev, cateringPackages: arr };
                                  })}
                                  className="text-xs font-medium text-brand hover:underline flex items-center gap-1 font-outfit"
                                >
                                  <Plus className="w-3 h-3" /> Add Feature
                                </button>
                              </div>
                              <div className="space-y-2">
                                {pkg.features?.map((feat, fIdx) => (
                                  <div key={fIdx} className="flex gap-2">
                                    <input 
                                      className="flex-1 border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-all"
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
                                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
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
                      <h2 className="text-xl font-bold text-admin-text font-outfit">
                        {activeTab === 'catering' ? 'Catering Occasions' : 'Booking Settings'}
                      </h2>
                      <p className="text-sm text-admin-text-secondary mt-1">Manage the dynamic cards displayed in this section.</p>
                    </div>
                    <button 
                      onClick={() => handleAddDynamicItem(activeTab)}
                      className="flex items-center gap-2 bg-admin-card text-admin-text border border-admin-border px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-admin-surface-hover transition-all font-outfit"
                    >
                      <Plus className="w-4 h-4" /> Add New Box
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {((activeTab === 'catering' ? cmsData.cateringOccasions : cmsData.bookingSettings) || []).length === 0 ? (
                       <div className="text-center py-16 border-2 border-dashed border-admin-border rounded-2xl bg-admin-card">
                         <LayoutTemplate className="w-12 h-12 text-admin-text-secondary/40 mx-auto mb-3" />
                         <p className="text-sm font-bold text-admin-text-secondary font-outfit">No items added yet</p>
                         <p className="text-xs text-admin-text-secondary/60 mt-1 mb-4">Click the button above to add a new card.</p>
                       </div>
                    ) : (
                      (activeTab === 'catering' ? cmsData.cateringOccasions : cmsData.bookingSettings).map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-6 p-6 border border-admin-border rounded-2xl bg-admin-card shadow-sm relative group hover:border-brand/40 transition-colors">
                          
                          <div className="hidden md:flex items-center justify-center text-admin-text-secondary/40 cursor-grab">
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
                              <label className="text-xs font-semibold text-admin-text-secondary mb-1 block font-outfit">Title / Heading</label>
                              <input 
                                className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-all"
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
                                <label className="text-xs font-semibold text-admin-text-secondary mb-1 block font-outfit">Description</label>
                                <textarea 
                                  rows="2"
                                  className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand custom-scrollbar transition-all"
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
                                <label className="text-xs font-semibold text-admin-text-secondary mb-1 flex justify-between font-outfit">
                                  <span>Lucide Icon Name</span>
                                  <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-brand hover:underline font-normal">View Icons</a>
                                </label>
                                <input 
                                  className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-all"
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
                              className="p-2 text-admin-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
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

            {/* PROMOTIONS PLACEMENT */}
            {activeTab === 'promotions' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-admin-border pb-4 mb-6">
                  <h2 className="text-xl font-bold text-admin-text font-outfit">Coupon Placements</h2>
                  <p className="text-sm text-admin-text-secondary mt-1">Select which active coupons should be displayed in specific areas of the customer app.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm font-bold text-admin-text block mb-2 font-outfit">Menu Page (Sidebar)</label>
                    <p className="text-xs text-admin-text-secondary mb-3">This coupon appears on the left sidebar of the customer web menu.</p>
                    <select
                      value={cmsData.promotions?.menuPage?._id || cmsData.promotions?.menuPage || ''}
                      onChange={(e) => setCmsData(prev => ({ ...prev, promotions: { ...prev.promotions, menuPage: e.target.value } }))}
                      className="w-full border border-admin-border rounded-xl px-4 py-3 text-sm text-admin-text bg-admin-card outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="" className="bg-admin-surface text-admin-text">-- None (Hide Coupon) --</option>
                      {activeCoupons.map(c => (
                        <option key={c._id} value={c._id} className="bg-admin-surface text-admin-text">{c.code} - {c.name || c.description}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-admin-text block mb-2 font-outfit">Mobile App (Home Screen)</label>
                    <p className="text-xs text-admin-text-secondary mb-3">This coupon appears prominently on the Flutter mobile app home screen.</p>
                    <select
                      value={cmsData.promotions?.mobileHome?._id || cmsData.promotions?.mobileHome || ''}
                      onChange={(e) => setCmsData(prev => ({ ...prev, promotions: { ...prev.promotions, mobileHome: e.target.value } }))}
                      className="w-full border border-admin-border rounded-xl px-4 py-3 text-sm text-admin-text bg-admin-card outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="" className="bg-admin-surface text-admin-text">-- None (Hide Coupon) --</option>
                      {activeCoupons.map(c => (
                        <option key={c._id} value={c._id} className="bg-admin-surface text-admin-text">{c.code} - {c.name || c.description}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <StaticPagesSeoModal
        isOpen={isSeoModalOpen}
        onClose={() => setIsSeoModalOpen(false)}
      />
    </div>
  );
}