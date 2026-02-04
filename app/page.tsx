"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. إعداد الاتصال بسوبابيس ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "تلاغمة", "القرارم", "وادي العثمانية", "سيدي مروان", "زغاية"];
const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "ملابس", "أخرى"];

export default function MilaStore() {
  // --- 2. حالات الموقع (States) ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    whatsapp: '',
    location: 'ميلة المركز',
    category: 'إلكترونيات'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- 3. جلب البيانات عند البداية ---
  useEffect(() => {
    fetchProducts();
    const saved = localStorage.getItem('mila_final_stable');
    if (saved) setLikedProducts(JSON.parse(saved));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  // --- 4. دالة النشر المصلحة (بدون تعليق) ---
  const handlePublish = async () => {
    const { name, price, whatsapp, location, category } = formData;
    if (!name || !price || !whatsapp || !imageFile) return alert("يرجى ملء جميع الخانات ✍️");

    setIsActionLoading(true);
    try {
      // رفع الصورة باسم عشوائي لتجنب الأخطاء
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile, { contentType: imageFile.type });

      if (uploadError) throw new Error("خطأ في البكت: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        name, price: parseFloat(price), location, category, 
        image_url: publicUrl, whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      alert("تم النشر بنجاح! 🔥🚀");
      setShowAddForm(false);
      setFormData({ name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات' });
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      alert("❌ خطأ: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- 5. دالة الإعجاب المصلحة (تم إصلاح خطأ id) ---
  const handleLike = async (productId: string, currentLikes: number) => {
    const isLiked = likedProducts.includes(productId);
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newCount } : p));
    const newList = isLiked ? likedProducts.filter(id => id !== productId) : [...likedProducts, productId];
    setLikedProducts(newList);
    localStorage.setItem('mila_final_stable', JSON.stringify(newList));

    await supabase.from('products').update({ likes_count: newCount }).eq('id', productId);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl mb-4">💎</motion.div>
      <h2 className="text-amber-500 font-black tracking-widest animate-pulse">MILA STORE...</h2>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f5f5f5] text-black'} transition-colors duration-500 font-sans pb-10`} dir="rtl">
      
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl">{isDarkMode ? '💡' : '🌑'}</button>
            <button onClick={() => setShowAddForm(true)} className="bg-amber-500 text-black px-6 py-2 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 active:scale-90 transition-all">نشر +</button>
          </div>
        </div>
      </nav>

      {/* البحث والتصنيفات */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <input 
          type="text" placeholder="ماذا تبحث في ميلة اليوم؟ 🔍" 
          className={`w-full p-5 rounded-[2rem] outline-none border-none shadow-2xl ${isDarkMode ? 'bg-white/5 focus:bg-white/10' : 'bg-white'}`}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black transition-all ${selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/10 opacity-50 hover:opacity-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* عرض المنتجات بأنميشن iOS */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        <AnimatePresence>
          {products
            .filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((product) => (
            <motion.div 
              layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              key={product.id}
              className={`rounded-[3rem] overflow-hidden flex flex-col group ${isDarkMode ? 'bg-neutral-900/50 border border-white/5' : 'bg-white shadow-xl'}`}
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 duration-700" alt="" />
                
                {/* زر الإعجاب المنفجر */}
                <motion.button 
                  whileTap={{ scale: 2.5 }}
                  onClick={() => handleLike(product.id, product.likes_count)}
                  className={`absolute top-6 left-6 p-4 rounded-[1.8rem] backdrop-blur-xl transition-all ${likedProducts.includes(product.id) ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-black/40'}`}
                >
                  <span className="text-2xl leading-none">{likedProducts.includes(product.id) ? '💖' : '🤍'}</span>
                </motion.button>

                <div className="absolute bottom-6 right-6 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  📍 {product.location}
                </div>
              </div>

              <div className="p-8 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 mb-1">{product.category}</p>
                    <h3 className="text-2xl font-black leading-tight truncate max-w-[150px]">{product.name}</h3>
                  </div>
                  <div className="text-left font-black">
                    <span className="text-2xl text-amber-500">{product.price}</span>
                    <span className="text-[10px] block opacity-40">دينار</span>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${product.whatsapp_number}`} target="_blank"
                  className="w-full py-5 bg-[#25D366] text-white text-center rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  اطلب الآن 💬
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة الإضافة (Mobile Bottom Sheet) */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`relative w-full max-w-xl p-8 rounded-t-[4rem] md:rounded-[3rem] ${isDarkMode ? 'bg-[#0d0d0d] border-t border-white/5' : 'bg-white'}`}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic underline decoration-amber-500">إعلان جديد ✨</h2>
                <button onClick={() => setShowAddForm(false)} className="text-4xl opacity-20 hover:opacity-100 transition-all">✕</button>
              </div>

              <div className="space-y-6">
                <div className="relative border-4 border-dashed border-white/5 rounded-[2.5rem] p-12 text-center group hover:border-amber-500/30 transition-all">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-6xl block mb-2 group-hover:scale-110 transition-transform">📸</span>
                  <p className="text-xs font-black opacity-30 tracking-widest uppercase">
                    {imageFile ? `✅ تم اختيار: ${imageFile.name.slice(0,10)}...` : "ارفع صورة السلعة"}
                  </p>
                </div>
                
                <input type="text" placeholder="اسم السلعة" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-black text-lg focus:ring-2 ring-amber-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-black" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الواتساب" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-black" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-5 rounded-2xl bg-white/5 outline-none font-black text-amber-500 appearance-none text-center" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.filter(c => c !== 'الكل').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="w-full p-5 rounded-2xl bg-white/5 outline-none font-black text-amber-500 appearance-none text-center" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-7 bg-amber-500 text-black font-black rounded-[2rem] text-2xl shadow-2xl active:scale-95 transition-all"
                >
                  {isActionLoading ? "جاري الإطلاق الصاروخي... 🚀" : "انشر الآن 🔥"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}