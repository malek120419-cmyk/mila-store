"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [isDarkMode, setIsDarkMode] = useState(true); // ميزة الوضع الليلي
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  
  // بيانات المنتج الجديد
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productLocation, setProductLocation] = useState('ميلة المركز');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    fetchProducts();
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  // تحسين سرعة الرفع عبر ضغط الصور البسيط
  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى إكمال البيانات");
    setIsActionLoading(true);

    try {
      const fileName = `${Date.now()}-${Math.random()}.jpg`;
      // رفع مباشر وسريع
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('products').insert([
        { 
          name: productName, price: parseFloat(productPrice), 
          location: productLocation, image_url: publicUrl,
          user_id: user.id, user_email: user.email, whatsapp_number: whatsapp 
        }
      ]);

      if (insertError) throw insertError;

      setShowAddForm(false);
      setProductName(''); setProductPrice(''); setImageFile(null); setWhatsapp('');
      fetchProducts();
    } catch (error: any) {
      alert("خطأ: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'الكل' || p.location === selectedCity;
    return matchesSearch && matchesCity;
  });

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-amber-500 text-4xl font-black italic">MILA STORE</motion.div>
    </div>
  );

  return (
    <main className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f5f5f5] text-black'}`} dir="rtl">
      {/* شريط التقدم العلوي */}
      <motion.div className="fixed top-0 left-0 right-0 h-[4px] bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      <header className={`max-w-7xl mx-auto flex flex-wrap justify-between items-center p-6 gap-6 sticky top-0 z-[100] backdrop-blur-xl ${isDarkMode ? 'bg-black/20' : 'bg-white/20'}`}>
        <motion.h1 initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-3xl font-black italic tracking-tighter">
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>

        {/* البحث المتطور */}
        <div className={`flex items-center rounded-full px-6 py-2 w-full max-w-md border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-amber-500' : 'bg-black/5 border-black/10 focus-within:border-amber-500'}`}>
          <input 
            type="text" placeholder="ماذا تبحث في ميلة؟" 
            className="bg-transparent border-none outline-none w-full text-sm py-1"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="bg-transparent text-[10px] font-bold text-amber-500 outline-none border-r border-gray-500 pr-2 mr-2" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="الكل">كل ميلة</option>
            {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {/* زر تبديل الوضع */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full border border-gray-500/30 hover:bg-amber-500/10 transition-colors">
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold opacity-60">دخول</button>
          ) : (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black opacity-40 uppercase">خروج</button>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20"
          >
            بيع منتجك
          </motion.button>
        </div>
      </header>

      {/* Hero Section مع أنيميشن قوي */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 50 }}>
          <h2 className="text-7xl md:text-[10rem] font-black italic leading-[0.8] tracking-tighter mb-6">
            سوق <span className="text-amber-500 italic block md:inline">ميلة</span>
          </h2>
          <p className="text-xl md:text-3xl font-medium opacity-50">بيع واشتري في ميلة بكل سهولة.</p>
        </motion.div>
      </section>

      {/* شبكة المنتجات مع Stagger Animation */}
      <motion.section 
        layout
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40"
      >
        <AnimatePresence mode='popLayout'>
          {filteredProducts.map((product, idx) => (
            <motion.div 
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: idx * 0.05, type: "spring" }}
              className={`group rounded-[3rem] p-5 border transition-all hover:shadow-2xl ${isDarkMode ? 'bg-neutral-900/40 border-white/5 hover:bg-neutral-800' : 'bg-white border-black/5 hover:shadow-black/10'}`}
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 bg-black relative shadow-inner">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-amber-500 text-black px-4 py-1 rounded-full text-xs font-black shadow-xl">📍 {product.location}</div>
              </div>
              
              <div className="flex justify-between items-start px-2 mb-6">
                <div>
                  <h3 className="text-2xl font-black mb-1">{product.name}</h3>
                  <p className="opacity-40 text-xs font-bold uppercase tracking-widest">{product.user_email.split('@')[0]}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-500 block">{product.price} <small className="text-xs">دج</small></span>
                </div>
              </div>

              <motion.a 
                whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}
                href={`https://wa.me/${product.whatsapp_number}`} target="_blank"
                className="flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black shadow-lg shadow-green-500/20"
              >
                تواصل الآن 💬
              </motion.a>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.section>

      {/* النوافذ المنبثقة (بأنيميشن الربيع) */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)} className="fixed inset-0 bg-black/80 z-[299] backdrop-blur-md" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 md:top-0 md:left-auto md:w-[600px] z-[300] p-10 shadow-2xl overflow-y-auto ${isDarkMode ? 'bg-[#0c0c0c] border-l border-white/10' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-5xl font-black italic">نشر إعلان</h2>
                <button onClick={() => setShowAddForm(false)} className="text-3xl opacity-30 hover:opacity-100 transition-opacity">✕</button>
              </div>
              <div className="space-y-6">
                <label className="block group">
                  <div className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center transition-all ${imageFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-amber-500/50'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    <span className="text-4xl block mb-2">{imageFile ? '📸' : '➕'}</span>
                    <p className="font-bold opacity-50">{imageFile ? `تم اختيار: ${imageFile.name}` : "اضغط لرفع صورة المنتج"}</p>
                  </div>
                </label>
                <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="ماذا تبيع؟" className={`w-full p-6 rounded-[1.5rem] outline-none font-bold ${isDarkMode ? 'bg-white/5 border border-white/10 focus:border-amber-500' : 'bg-black/5 border border-black/10'}`} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} placeholder="السعر (دج)" className={`w-full p-6 rounded-[1.5rem] outline-none font-bold ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`} />
                  <input type="tel" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="رقم الواتساب" className={`w-full p-6 rounded-[1.5rem] outline-none font-bold text-green-500 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`} />
                </div>
                <select value={productLocation} onChange={(e)=>setProductLocation(e.target.value)} className={`w-full p-6 rounded-[1.5rem] outline-none font-bold ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-6 bg-amber-500 text-black font-black rounded-[2rem] text-2xl shadow-xl"
                >
                  {isActionLoading ? "جاري الرفع بسرعة..." : "انشر الآن مجاناً"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}