"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// استدعاء المكونات من الملفات التكميلية
import { ModernIcon, ProductDetails } from './MilaEngine';
import { CATEGORIES, MUNICIPALITIES, UI_TEXT, SearchBar } from './MilaLogic';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userRating, setUserRating] = useState(0);

  const t = UI_TEXT[lang];

  useEffect(() => {
    fetchProducts();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-2xl animate-pulse italic">MILA STORE...</div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* استدعاء نافذة التفاصيل من MilaEngine */}
      <ProductDetails 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        lang={lang} 
        userRating={userRating} 
        setUserRating={setUserRating} 
        t={t} 
      />

      <nav className="p-5 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <h1 className="text-xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-black">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <ModernIcon icon={isDarkMode ? '🌞' : '🌚'} label="THEME" onClick={() => setIsDarkMode(!isDarkMode)} />
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'EN' : 'AR'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : t.login} />
          <motion.button whileTap={{ scale: 0.9 }} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-xl">{t.sell}</motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10">
        <SearchBar lang={lang} onChange={setSearchQuery} isDarkMode={isDarkMode} />

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <button 
              key={i} onClick={() => setActiveCategory(CATEGORIES.ar[i])}
              className={`px-7 py-2.5 rounded-full text-[10px] font-black border transition-all whitespace-nowrap ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black' : 'bg-white/5 border-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <main className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <motion.div 
              key={product.id} onClick={() => setSelectedProduct(product)}
              className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
            >
              <div className="aspect-square overflow-hidden bg-black">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-black text-[10px] truncate opacity-40 uppercase mb-1">{product.name}</h3>
                <p className="text-amber-500 font-black text-sm">{product.price} {t.price}</p>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  );
}