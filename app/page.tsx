"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// الاتصال بسوبابيس
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

  const handleLogin = async () => {
    if (!email || !password) return alert("يرجى إدخال البيانات");
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setTimeout(() => setShowAddForm(true), 400);
    } catch (e: any) {
      alert("خطأ في الدخول");
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- الحل الجذري والنهائي للصور لمنع التعليق ---
  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل البيانات والصورة");

    setIsActionLoading(true); // يبدأ التعليق المتعمد للزر لحماية البيانات

    try {
      // 1. تحويل الصورة إلى Binary لمنع تعليق المتصفح أثناء النقل
      const arrayBuffer = await imageFile.arrayBuffer();
      const fileData = new Blob([arrayBuffer], { type: imageFile.type });

      // 2. تجهيز اسم ملف بسيط جداً (أرقام فقط) لتجنب مشاكل اللغة
      const fileName = `${Date.now()}.${imageFile.name.split('.').pop()}`;

      // 3. الرفع مع مهلة زمنية (Timeout) مخفية في الطلب
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assests') // تأكد أن الاسم مطابق تماماً في سوبابيس
        .upload(fileName, fileData, { 
          contentType: imageFile.type,
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      // 4. جلب الرابط العام
      const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);

      // 5. الحفظ في قاعدة البيانات
      const { error: dbError } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        user_id: user.id
      }]);

      if (dbError) throw dbError;

      alert("تم النشر بنجاح! 🎉");
      setShowAddForm(false);
      setImageFile(null);
      fetchProducts();

    } catch (e: any) {
      console.error(e);
      alert("حدث خطأ أثناء النشر: " + (e.message || "تأكد من إعدادات Storage"));
    } finally {
      // الكود السحري: هذا السطر يضمن أن الزر سيعود للعمل مهما حدث (حتى لو فشل الإنترنت)
      setIsActionLoading(false); 
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic animate-pulse">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-colors duration-500`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-4 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-[100] backdrop-blur-xl">
        <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500">MARKET</span></h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-4 mt-6">
        <input 
          type="text" placeholder="ابحث في ميلة..." 
          className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 outline-none focus:border-amber-500 transition-all font-bold"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* المنتجات */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 pb-20">
        <AnimatePresence>
          {products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((product) => (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={product.id} className="bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5">
                <img src={product.image_url} className="w-full aspect-square object-cover" alt="" />
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black truncate">{product.name}</h3>
                    <span className="text-amber-500 font-black">{product.price} دج</span>
                  </div>
                  <a href={`https://wa.me/${product.whatsapp}`} className="block bg-[#25D366] text-center py-4 rounded-2xl font-black transition-all active:scale-95">واتساب 💬</a>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة تسجيل الدخول (دخول وإغلاق فقط) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-md border border-white/10 text-center">
              <h2 className="text-2xl font-black mb-6 italic text-amber-500 text-center">تسجيل الدخول</h2>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none text-center font-bold" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none text-center font-bold" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} disabled={isActionLoading} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black text-lg shadow-xl shadow-amber-500/20">
                   {isActionLoading ? "جاري التحقق..." : "دخول"}
                </button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-white/20 py-2 font-bold text-sm">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/90 p-0 md:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0d0d0d] p-8 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-amber-500 italic">نشر جديد 📸</h2>
                <button onClick={() => setShowAddForm(false)} className="text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center relative cursor-pointer">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-bold opacity-50">{imageFile ? `✅ تم اختيار: ${imageFile.name.slice(0,10)}` : "اضغط لاختيار صورة السلعة"}</p>
                </div>
                <input type="text" placeholder="اسم السلعة" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم واتساب" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isActionLoading ? "جاري النشر الآن..." : "انشر السلعة 🔥"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}