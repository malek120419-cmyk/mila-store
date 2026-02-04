"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. إعداد الاتصال ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "تلاغمة", "القرارم", "وادي العثمانية", "سيدي مروان", "زغاية"];
const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "ملابس", "أخرى"];

export default function MilaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();
    const saved = localStorage.getItem('mila_final_v9');
    if (saved) setLikedProducts(JSON.parse(saved));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handlePublish = async () => {
    const { name, price, whatsapp, location, category } = formData;
    if (!name || !price || !whatsapp || !imageFile) return alert("الرجاء ملء كل الخانات!");

    setIsActionLoading(true);
    try {
      // 1. معالجة اسم الصورة ليكون فريداً ومقبولاً
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 2. الرفع المباشر
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile, { contentType: imageFile.type });

      if (uploadError) throw new Error("فشل الرفع! هل قمت بتنفيذ كود SQL؟ " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      // 3. الحفظ في الجدول
      const { error: dbError } = await supabase.from('products').insert([{
        name, price: parseFloat(price), location, category, 
        image_url: publicUrl, whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      alert("تم النشر بنجاح في ميلة ستور! 🎉");
      setShowAddForm(false);
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      alert("خطأ: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLike = async (productId: string, currentLikes: number) => {
    const isLiked = likedProducts.includes(productId);
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newCount } : p));
    const newList = isLiked ? likedProducts.filter(id => id !== productId) : [...likedProducts, productId];
    setLikedProducts(newList);
    localStorage.setItem('mila_final_v9', JSON.stringify(newList));
    await supabase.from('products').update({ likes_count: newCount }).eq('id', productId);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black">جاري التحميل... 💎</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f4f4f4] text-black'} transition-all duration-500`} dir="rtl">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-[60] backdrop-blur-2xl border-b border-white/5 p-4 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-black italic">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => setShowAddForm(true)} className="bg-amber-500 text-black px-5 py-2 rounded-xl font-black shadow-lg">إضافة إعلان</button>
        </div>
      </nav>

      {/* البحث والفلاتر */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <input 
          type="text" placeholder="ماذا تبحث اليوم؟..." 
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-amber-500 transition-all"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/10'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* المنتجات */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        <AnimatePresence>
          {products.filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
            <motion.div 
              layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              key={product.id} className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group"
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                <motion.button 
                  whileTap={{ scale: 3 }}
                  onClick={() => handleLike(product.id, product.likes_count)}
                  className={`absolute top-4 left-4 p-4 rounded-2xl backdrop-blur-md ${likedProducts.includes(product.id) ? 'bg-red-500' : 'bg-black/40'}`}
                >
                  {likedProducts.includes(product.id) ? '❤️' : '🤍'}
                </motion.button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black truncate max-w-[70%]">{product.name}</h3>
                  <span className="text-amber-500 font-black">{product.price} دج</span>
                </div>
                <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="block w-full py-4 bg-[#25D366] text-center rounded-2xl font-black shadow-lg">واتساب 💬</a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-black/90" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className={`relative w-full max-w-xl p-8 rounded-t-[3rem] md:rounded-[3rem] ${isDarkMode ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
              <h2 className="text-2xl font-black mb-6 italic text-amber-500">نشر سلعة جديدة ✨</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center relative group">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <p className="opacity-50 group-hover:text-amber-500 transition-colors">{imageFile ? `✅ ${imageFile.name}` : "اضغط لرفع الصورة 📸"}</p>
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-50"
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