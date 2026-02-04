"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. إعدادات الاتصال ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "تلاغمة", "القرارم", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function MilaStore() {
  // --- 2. الحالات (State Management) ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  
  // حالات النموذج (Form States)
  const [showAddForm, setShowAddForm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    whatsapp: '',
    location: 'ميلة المركز'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- 3. الدوال البرمجية (Functions) ---
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    await fetchProducts();
    const saved = localStorage.getItem('mila_v6_likes');
    if (saved) setLikedProducts(JSON.parse(saved));
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const toggleLike = async (productId: string, currentLikes: number) => {
    const isLiked = likedProducts.includes(productId);
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    
    // تحديث فوري للواجهة
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newCount } : p));
    const newList = isLiked ? likedProducts.filter(id => id !== productId) : [...likedProducts, productId];
    setLikedProducts(newList);
    localStorage.setItem('mila_v6_likes', JSON.stringify(newList));

    await supabase.from('products').update({ likes_count: newCount }).eq('id', productId);
  };

  const handlePublish = async () => {
    const { name, price, whatsapp, location } = formData;
    if (!name || !price || !whatsapp || !imageFile) return alert("يرجى إكمال جميع الحقول ✍️");

    setIsActionLoading(true);
    try {
      // 1. معالجة الصورة
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile);

      if (uploadError) throw new Error("مشكلة في الرفع: تأكد من تفعيل SQL Policies");

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      // 2. إدخال البيانات
      const { error: dbError } = await supabase.from('products').insert([{
        name, price: parseFloat(price), location, image_url: publicUrl, 
        whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      // 3. إعادة ضبط الحالة
      alert("تم النشر بنجاح! 🚀");
      setShowAddForm(false);
      setFormData({ name: '', price: '', whatsapp: '', location: 'ميلة المركز' });
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) return (
    <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-amber-500' : 'bg-white text-amber-600'}`}>
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="text-2xl font-black italic">MILA STORE</motion.div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9fa] text-gray-900'} transition-colors duration-500`} dir="rtl">
      
      {/* Navbar المنظم */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter">MILA<span className="text-amber-500 font-normal">STORE</span></h1>
            <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest leading-none">Mila Province</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-2">{isDarkMode ? '🌞' : '🌚'}</button>
            <button onClick={() => setShowAddForm(true)} className="bg-amber-500 text-black px-5 py-2 rounded-xl font-black text-xs shadow-lg shadow-amber-500/20 active:scale-90 transition-all">بيع سلعة</button>
          </div>
        </div>
      </nav>

      {/* البحث الذكي */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="relative group">
          <input 
            type="text" placeholder="ابحث عن أجهزة، سيارات، ملابس..." 
            className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-amber-500' : 'bg-white border-gray-200 focus:border-amber-500 shadow-sm'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30">🔍</span>
        </div>
      </div>

      {/* عرض المنتجات */}
      <main className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
            <motion.div 
              layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className={`rounded-[2.5rem] overflow-hidden flex flex-col group ${isDarkMode ? 'bg-[#111] border border-white/5' : 'bg-white shadow-sm border border-gray-100'}`}
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="" />
                
                {/* زر الإعجاب المنظم */}
                <button 
                  onClick={() => toggleLike(product.id, product.likes_count)}
                  className={`absolute top-4 left-4 p-3 rounded-2xl backdrop-blur-md transition-all active:scale-150 ${likedProducts.includes(product.id) ? 'bg-red-500 text-white' : 'bg-black/40 text-white'}`}
                >
                  <span className="text-xl leading-none">{likedProducts.includes(product.id) ? '❤️' : '🤍'}</span>
                </button>

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold">
                  📍 {product.location}
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-black truncate max-w-[65%]">{product.name}</h3>
                  <div className="text-left">
                    <span className="text-xl font-black text-amber-500 leading-none">{product.price}</span>
                    <span className="text-[10px] block opacity-40 font-bold uppercase">دج</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`https://wa.me/${product.whatsapp_number}`} target="_blank"
                    className="flex-1 py-4 bg-[#25D366] text-white text-center rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-lg shadow-green-500/10"
                  >
                    واتساب 💬
                  </a>
                </div>
                <p className="text-[10px] text-center opacity-20 font-bold uppercase tracking-widest">المعجبون: {product.likes_count || 0}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة الإضافة (Mobile-Optimized System) */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className={`relative w-full max-w-xl p-8 rounded-t-[3rem] md:rounded-[3rem] overflow-y-auto max-h-[90vh] ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}
            >
              <div className="w-12 h-1 bg-gray-500/20 rounded-full mx-auto mb-6 md:hidden" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic">نشر إعلان جديد ✨</h2>
                <button onClick={() => setShowAddForm(false)} className="text-3xl opacity-20">✕</button>
              </div>

              <div className="space-y-5">
                {/* منطقة الرفع الذكية */}
                <div className="relative border-2 border-dashed border-amber-500/20 rounded-3xl p-10 text-center hover:bg-amber-500/5 transition-all cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-5xl block mb-2">📸</span>
                  <p className="text-xs font-bold opacity-50">{imageFile ? `✅ تم الاختيار: ${imageFile.name.slice(0, 15)}...` : "ارفع صورة واضحة للسلعة"}</p>
                </div>
                
                <div className="space-y-4">
                  <input 
                    type="text" placeholder="ما اسم السلعة؟" 
                    className="w-full p-4 rounded-xl bg-gray-500/10 outline-none font-bold"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="number" placeholder="السعر" 
                      className="w-full p-4 rounded-xl bg-gray-500/10 outline-none font-bold"
                      value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                    <input 
                      type="tel" placeholder="رقم واتساب" 
                      className="w-full p-4 rounded-xl bg-gray-500/10 outline-none font-bold"
                      value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                  <select 
                    className="w-full p-4 rounded-xl bg-gray-500/10 outline-none font-bold text-amber-500"
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                  >
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isActionLoading ? "جاري النشر... 🚀" : "نشر الإعلان الآن 🔥"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}