"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات' 
  });
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
    if (!email || !password) return alert("يرجى إدخال البيانات 🔑");
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setTimeout(() => setShowAddForm(true), 400);
    } catch (e: any) {
      alert("خطأ في الدخول ❌");
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- دالة النشر السريعة جداً ---
  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل بيانات المنتج 📸");

    setIsActionLoading(true);
    
    try {
      // 1. توليد اسم ملف فريد وبسيط فوراً
      const fileName = `${Date.now()}_m.jpg`;

      // 2. الرفع المباشر للملف (أسرع طريقة في سوبابيس)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assests')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 3. استخراج الرابط وحفظ البيانات دفعة واحدة
      const publicUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}/storage/v1/object/public/mila-market-assests/${fileName}`;

      const { error: dbError } = await supabase.from('products').insert([{
        name: formData.name, 
        price: parseFloat(formData.price),
        whatsapp: formData.whatsapp, 
        category: formData.category,
        location: formData.location, 
        image_url: publicUrl,
        user_id: user.id, 
        user_email: user.email 
      }]);

      if (dbError) throw dbError;

      // نجاح لحظي
      setShowAddForm(false);
      setShowSuccess(true);
      
      // تحديث الواجهة في الخلفية دون تعطيل المستخدم
      fetchProducts();
      
      setTimeout(() => {
        setShowSuccess(false);
        setImageFile(null);
      }, 2500);

    } catch (e: any) {
      alert("خطأ سريع: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-all`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-4 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-[100] backdrop-blur-xl">
        <h1 className="text-xl font-black italic tracking-tighter">MILA <span className="text-amber-500">MARKET</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg p-2 bg-white/5 rounded-full">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-5 py-2 rounded-xl font-black text-[10px] active:scale-95 shadow-lg">إضافة +</button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-4 mt-4">
        <input 
          type="text" placeholder="بحث سريع..." 
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-amber-500 transition-all font-bold text-sm"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شبكة المنتجات (إطارات صغيرة) */}
      <main className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pb-20">
        <AnimatePresence>
          {products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((product) => (
              <motion.div 
                layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                key={product.id} onClick={() => setSelectedProduct(product)}
                className="bg-neutral-900/40 rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-amber-500/30 transition-all shadow-sm"
              >
                <div className="aspect-[4/5] relative">
                  <img src={product.image_url} className="w-full h-full object-cover" alt="" loading="lazy" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                    <span className="text-amber-500 font-black text-[9px]">{product.price} دج</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-[11px] font-black truncate">{product.name}</h3>
                  <p className="text-[9px] opacity-40 font-bold">📍 {product.location}</p>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* شاشة نجاح قوية بأنيميشن سريع */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-7xl mb-4"
              >
                🚀
              </motion.div>
              <h2 className="text-3xl font-black italic mb-2">تم <span className="text-amber-500">التحليق</span> بنجاح!</h2>
              <p className="text-white/40 font-bold">منتجك الآن مباشر في ميلة</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة تفاصيل المنتج */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0a0a0a] rounded-[2.5rem] w-full max-w-md border border-white/10 overflow-hidden">
              <img src={selectedProduct.image_url} className="w-full aspect-square object-cover" alt="" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                   <h2 className="text-xl font-black text-amber-500">{selectedProduct.name}</h2>
                   <span className="text-lg font-black">{selectedProduct.price} دج</span>
                </div>
                <div className="flex gap-2">
                  <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="flex-1 bg-[#25D366] text-white text-center py-4 rounded-xl font-black">واتساب 💬</a>
                  <button onClick={() => setSelectedProduct(null)} className="bg-white/5 px-4 rounded-xl font-black text-xs">إغلاق</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة إضافة منتج */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/90 p-0 md:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0d0d0d] p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-amber-500">إضافة منتج 🔥</h2>
                <button onClick={() => setShowAddForm(false)}>✕</button>
              </div>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center relative cursor-pointer active:bg-white/5">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-bold opacity-40 text-xs">{imageFile ? `✅ جاهز للرفع` : "اختر صورة سريعة"}</p>
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-4 bg-amber-500 text-black font-black rounded-xl text-lg shadow-xl active:scale-95 transition-all"
                >
                  {isActionLoading ? "لحظة واحدة..." : "نشر الآن 🚀"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة تسجيل الدخول */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-8 rounded-[2.5rem] w-full max-w-sm border border-white/10 text-center">
              <h2 className="text-xl font-black mb-6 text-amber-500">LOGIN</h2>
              <div className="space-y-3">
                <input type="email" placeholder="البريد" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-4 rounded-xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} disabled={isActionLoading} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black active:scale-95">دخول</button>
                <button onClick={() => setShowAuthModal(false)} className="text-white/20 text-xs py-2">رجوع</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}