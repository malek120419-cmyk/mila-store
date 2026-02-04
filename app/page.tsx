"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "تلاغمة", "القرارم", "وادي العثمانية", "سيدي مروان", "زغاية"];
const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "ملابس", "أخرى"];

export default function MilaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  // حالات النوافذ
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // بيانات النموذج والتسجيل
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

  // --- حل مشكلة تعليق الصور (الرفع الصامت والمستقر) ---
  const handlePublish = async () => {
    if (!user) { setShowAuthModal(true); return; } // إجبار على التسجيل
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل البيانات والصورة!");

    setIsActionLoading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // رفع الصورة مع إعدادات منع التعليق
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile, { 
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type 
        });

      if (uploadError) throw new Error("البكت يرفض الصورة! تأكد من إعدادات SQL");

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        user_id: user.id,
        likes_count: 0
      }]);

      if (dbError) throw dbError;

      alert("تم النشر بنجاح! 🎉");
      setShowAddForm(false);
      setImageFile(null);
      fetchProducts();
    } catch (e: any) {
      alert("فشل النشر: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    setIsActionLoading(true);
    const { error } = type === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    else { setShowAuthModal(false); setShowAddForm(true); } // يفتح الفورم تلقائياً بعد التسجيل
    setIsActionLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9fa] text-gray-900'} transition-colors`} dir="rtl">
      
      {/* Navbar - الأيقونة تظهر للجميع دائماً */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-black italic">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} 
            className="bg-amber-500 text-black px-6 py-2 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* البحث والتصنيفات */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <input type="text" placeholder="ماذا تبحث في ميلة؟" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-amber-500" onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-black ${selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/10'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* عرض السلع */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
          <motion.div layout key={product.id} className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group">
            <div className="aspect-square relative overflow-hidden">
              <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold">📍 {product.location}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black truncate">{product.name}</h3>
                <span className="text-amber-500 font-black">{product.price} دج</span>
              </div>
              <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="block w-full py-4 bg-[#25D366] text-center rounded-2xl font-black">واتساب 💬</a>
            </div>
          </motion.div>
        ))}
      </main>

      {/* نافذة تسجيل الدخول (تظهر إذا حاول غير المسجل الضغط على بيع) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAuthModal(false)} className="absolute inset-0 bg-black/95" />
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`relative w-full max-w-md p-10 rounded-[3rem] ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <h2 className="text-3xl font-black mb-6 italic">سجل دخولك <span className="text-amber-500">للبيع</span></h2>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 rounded-xl bg-white/5 outline-none" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-4 rounded-xl bg-white/5 outline-none" onChange={(e) => setPassword(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleAuth('login')} disabled={isActionLoading} className="bg-amber-500 text-black p-4 rounded-xl font-black">دخول</button>
                  <button onClick={() => handleAuth('signup')} disabled={isActionLoading} className="bg-white/10 p-4 rounded-xl font-black">اشتراك</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة الإضافة (تفتح فقط للمسجلين) */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-black/95" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className={`relative w-full max-w-xl p-8 rounded-t-[3rem] md:rounded-[3rem] ${isDarkMode ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-black italic text-amber-500">نشر إعلان جديد ✨</h2>
                <button onClick={() => setShowAddForm(false)}>✕</button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center relative">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <p className="opacity-50">{imageFile ? `✅ ${imageFile.name}` : "اختر صورة السلعة 📸"}</p>
                </div>
                <input type="text" placeholder="اسم السلعة" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-xl transition-all active:scale-95">
                  {isActionLoading ? "جاري الرفع... 🚀" : "انشر الآن 🔥"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}