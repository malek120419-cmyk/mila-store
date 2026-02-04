"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// اتصال سوبابيس
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "ملابس", "أخرى"];

export default function MilaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات' });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  // --- نظام الدخول المطور ---
  const handleLogin = async () => {
    if (!email || !password) return alert("الرجاء إدخال بيانات الحساب 🔑");
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setTimeout(() => setShowAddForm(true), 300);
    } catch (e: any) {
      alert("عذراً، البيانات غير صحيحة ❌");
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- نظام الرفع المضمون (الحل الجذري) ---
  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل البيانات واختر صورة أولاً 📸");

    setIsActionLoading(true);
    try {
      // 1. تحضير الملف والاسم
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_mila.${fileExt}`;

      // 2. الرفع المباشر مع تحديد النوع لمنع التعليق
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile, { 
            contentType: imageFile.type,
            upsert: false 
        });

      if (uploadError) throw new Error("سوبابيس رفض الصورة. تأكد من إعدادات الـ Storage");

      // 3. الحصول على الرابط العام
      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      // 4. تسجيل الإعلان في القاعدة
      const { error: dbError } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        user_id: user.id,
        likes_count: 0
      }]);

      if (dbError) throw dbError;

      alert("تم النشر بنجاح في ميلة ستور! 🎉");
      setShowAddForm(false);
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      alert("فشل النشر: " + e.message);
    } finally {
      setIsActionLoading(false); // فك التعليق مهما حدث
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505] text-amber-500 font-black">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f4f4f4] text-black'} transition-colors duration-500`} dir="rtl">
      
      {/* Header */}
      <nav className="p-4 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-50 backdrop-blur-xl">
        <h1 className="text-2xl font-black italic">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-5 py-2 rounded-2xl font-black text-xs shadow-lg shadow-amber-500/10"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <input 
          type="text" placeholder="ابحث عن أي شيء في ميلة..." 
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-amber-500 transition-all"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/10 opacity-50'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* المنتجات */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
        <AnimatePresence>
          {products.filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
            <motion.div layout key={product.id} className="bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
              <img src={product.image_url} className="w-full aspect-square object-cover" alt={product.name} />
              <div className="p-6">
                <h3 className="text-xl font-black truncate">{product.name}</h3>
                <p className="text-amber-500 font-black mb-4">{product.price} دج</p>
                <a href={`https://wa.me/${product.whatsapp_number}`} className="block bg-[#25D366] text-center py-4 rounded-2xl font-black shadow-lg shadow-green-500/10">واتساب 💬</a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة تسجيل الدخول (دخول وإغلاق فقط) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-md border border-white/10 text-center">
              <h2 className="text-2xl font-black mb-6 italic text-amber-500">تسجيل الدخول</h2>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 rounded-xl bg-white/5 outline-none text-center font-bold" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-4 rounded-xl bg-white/5 outline-none text-center font-bold" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} disabled={isActionLoading} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black text-lg shadow-xl shadow-amber-500/20">
                  {isActionLoading ? "جاري التحقق..." : "دخول"}
                </button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-white/30 py-2 font-bold text-sm">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/90">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0d0d0d] p-8 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl border-t border-white/5">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-black text-amber-500 italic">نشر جديد 📸</h2>
                <button onClick={() => setShowAddForm(false)} className="text-2xl opacity-50">✕</button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center relative hover:border-amber-500/30 transition-all">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="opacity-50">{imageFile ? `✅ جاهز: ${imageFile.name.slice(0,10)}` : "اضغط لاختيار صورة السلعة"}</p>
                </div>
                <input type="text" placeholder="اسم السلعة" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم واتساب" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-xl transition-all active:scale-95">
                  {isActionLoading ? "جاري الإطلاق... 🚀" : "انشر الإعلان 🔥"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}