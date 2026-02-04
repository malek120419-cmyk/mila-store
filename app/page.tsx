"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- إعداد الاتصال بسوبابيس (استخدام مفاتيح Vercel) ---
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
  
  // حالات النوافذ المنبثقة
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // بيانات التسجيل والنموذج
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    whatsapp: '', 
    location: 'ميلة المركز', 
    category: 'إلكترونيات' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- مراقبة الجلسة وجلب البيانات ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  // --- نظام الدخول المعدل (دخول وإغلاق فقط) ---
  const handleLogin = async () => {
    if (!email || !password) return alert("يرجى إدخال البريد وكلمة السر 🔑");
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setTimeout(() => setShowAddForm(true), 400);
    } catch (e: any) {
      alert("خطأ في البيانات: تأكد من حسابك أولاً ❌");
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- نظام الرفع المطور (تم تعديل اسم البكت ليتطابق مع تسميتك) ---
  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل بيانات السلعة وارفع الصورة 📸");

    setIsActionLoading(true);
    try {
      const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;

      // ملاحظة: تم استخدام mila-market-assests كما سميتها أنت
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assests')
        .upload(fileName, imageFile, { 
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type 
        });

      if (uploadError) throw new Error(`سوبابيس رفض الرفع: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505] text-amber-500 text-2xl font-black italic">
      MILA STORE... 💎
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9fa] text-gray-900'} transition-all`} dir="rtl">
      
      {/* --- الهيدر --- */}
      <nav className="p-4 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-[100] backdrop-blur-2xl">
        <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500">MARKET</span></h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-2 bg-white/5 rounded-full">
            {isDarkMode ? '🌞' : '🌚'}
          </button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* --- شريط البحث --- */}
      <div className="max-w-4xl mx-auto p-4 mt-6 space-y-4">
        <input 
          type="text" placeholder="ماذا تبحث في ميلة اليوم؟..." 
          className="w-full p-5 rounded-[2rem] bg-white/5 border border-white/10 outline-none focus:border-amber-500 transition-all font-bold"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-amber-500 text-black shadow-lg' : 'bg-white/5 opacity-60'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- شبكة المنتجات --- */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 mb-20">
        <AnimatePresence>
          {products
            .filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((product) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                key={product.id} className="bg-neutral-900/40 rounded-[2.8rem] overflow-hidden border border-white/5 group"
              >
                <div className="aspect-square relative overflow-hidden bg-neutral-800">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                </div>
                <div className="p-7 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black truncate max-w-[70%]">{product.name}</h3>
                    <span className="text-amber-500 font-black text-lg">{product.price} دج</span>
                  </div>
                  <a 
                    href={`https://wa.me/${product.whatsapp_number}`} 
                    target="_blank" 
                    className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white rounded-[1.5rem] font-black transition-all active:scale-95"
                  >
                    واتساب 💬
                  </a>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* --- نافذة تسجيل الدخول --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3.5rem] w-full max-w-md border border-white/10 text-center shadow-2xl">
              <h2 className="text-3xl font-black mb-2 italic text-amber-500">تسجيل الدخول</h2>
              <p className="text-white/40 text-sm mb-8 font-bold">يجب أن تملك حساباً لتتمكن من إضافة سلعك</p>
              
              <div className="space-y-4">
                <input 
                  type="email" placeholder="البريد الإلكتروني" 
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 outline-none text-center font-bold"
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                  type="password" placeholder="كلمة السر" 
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 outline-none text-center font-bold"
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                  onClick={handleLogin} disabled={isActionLoading}
                  className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-xl mt-4 shadow-xl active:scale-95 transition-all"
                >
                  {isActionLoading ? "جاري التحقق..." : "دخول"}
                </button>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-white/30 py-2 font-bold text-sm"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- نافذة إضافة منتج جديد --- */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/90 p-0 md:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0d0d0d] p-8 rounded-t-[3.5rem] md:rounded-[3.5rem] w-full max-w-xl border-t md:border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-amber-500 italic">إضافة إعلان جديد 📸</h2>
                <button onClick={() => setShowAddForm(false)} className="bg-white/5 p-3 rounded-full">✕</button>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center relative group cursor-pointer">
                  <input 
                    type="file" accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <p className="font-bold text-sm text-white/50">{imageFile ? `✅ جاهز: ${imageFile.name.slice(0,15)}` : "اضغط لاختيار صورة المنتج"}</p>
                </div>

                <input 
                  type="text" placeholder="اسم السلعة" 
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold"
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" placeholder="السعر (دج)" 
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold"
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  />
                  <input 
                    type="tel" placeholder="رقم واتساب" 
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold"
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                  />
                </div>

                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-[1.8rem] text-xl shadow-xl active:scale-95 transition-all"
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