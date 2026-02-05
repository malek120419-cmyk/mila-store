"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// استيراد المكونات (تأكد من مطابقة أسماء الملفات تماماً وبدون مسافات)
import { ModernIcon, ProductDetails, MilaAlert } from './MilaEngine';
import { SearchBar, CategoryBar } from './MilaLogic';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (activeCategory === 'الكل' || p.category === activeCategory) && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, activeCategory, searchQuery]);

  const handleSellClick = () => {
    if (!user) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } else {
      alert("استمارة البيع قيد التجهيز لهذه النسخة");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-amber-500 font-black italic text-5xl tracking-[0.2em]">MILA</motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-amber-500 selection:text-black" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* المكونات العلوية المستدعاة */}
      <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} lang={lang} />
      <MilaAlert msg={lang === 'ar' ? "يرجى تسجيل الدخول أولاً" : "Please login first"} isVisible={showAlert} />

      {/* Navbar الاحترافي */}
      <nav className="p-6 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto bg-black/70">
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="flex flex-col">
          <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></h1>
          <span className="text-[7px] font-black opacity-30 tracking-[0.5em] uppercase">Mila City Market</span>
        </motion.div>
        
        <div className="flex gap-5 md:gap-8 items-center">
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'English' : 'العربية'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label={lang === 'ar' ? 'بيع +' : 'SELL +'} onClick={handleSellClick} />
          <ModernIcon active={user} icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : (lang === 'ar' ? 'دخول' : 'LOGIN')} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* المكونات المنطقية */}
        <SearchBar placeholder={lang === 'ar' ? 'ماذا تريد أن تشتري اليوم؟' : 'What are you looking for?'} onChange={setSearchQuery} />
        <CategoryBar active={activeCategory} onChange={setActiveCategory} lang={lang} />

        {/* شبكة المنتجات بتصميم Pinterest الاحترافي */}
        <main className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 mt-8">
          <AnimatePresence>
            {filteredProducts.map((p, idx) => (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: idx * 0.05 }}
                key={p.id} onClick={() => setSelectedProduct(p)}
                className="group bg-white/[0.02] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer hover:border-amber-500/30 transition-all duration-500"
              >
                <div className="aspect-[4/5] bg-black overflow-hidden relative">
                  <motion.img 
                    whileHover={{ scale: 1.1 }} transition={{ duration: 0.8 }}
                    src={p.image_url} className="w-full h-full object-cover" alt={p.name} 
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-2xl text-amber-500 text-[9px] font-black uppercase tracking-widest shadow-2xl">
                    ⭐ 5.0
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-[10px] font-black opacity-30 uppercase truncate mb-2 tracking-widest group-hover:opacity-100 transition-opacity">{p.name}</h3>
                  <p className="text-amber-500 font-black text-xl">{p.price} <span className="text-[10px] opacity-50 italic">DZD</span></p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      <footer className="mt-20 p-12 border-t border-white/5 text-center">
        <p className="text-[9px] font-black opacity-20 uppercase tracking-[1em]">Created for Mila Community 2026</p>
      </footer>
    </div>
  );
}