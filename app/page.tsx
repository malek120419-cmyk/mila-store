"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

// استيراد المكونات من الملفات الجديدة (تأكد من عدم وجود مسافات في أسماء الملفات)
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-2xl tracking-tighter">MILA STORE...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500 selection:text-black" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* نوافذ منبثقة تفاعلية */}
      <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} lang={lang} />
      <MilaAlert msg={lang === 'ar' ? "يرجى تسجيل الدخول" : "Please Login"} isVisible={false} />

      {/* Navbar الاحترافي */}
      <nav className="p-5 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto bg-black/60 shadow-2xl">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black italic tracking-tighter cursor-default">
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>
        
        <div className="flex gap-4 items-center">
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'English' : 'العربية'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label={lang === 'ar' ? 'بيع +' : 'SELL +'} onClick={() => alert('قريباً')} />
          <ModernIcon icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : (lang === 'ar' ? 'دخول' : 'LOGIN')} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 mt-4">
        {/* نظام البحث المطور */}
        <SearchBar placeholder={lang === 'ar' ? 'ابحث عن منتج في ميلة...' : 'Search for anything...'} onChange={setSearchQuery} />
        
        {/* نظام الفئات الذكي */}
        <CategoryBar active={activeCategory} onChange={setActiveCategory} lang={lang} />

        {/* شبكة المنتجات (محاكي الجوال 2-cols) */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-4">
          {filteredProducts.map(p => (
            <motion.div 
              whileHover={{ y: -8 }} 
              key={p.id} 
              onClick={() => setSelectedProduct(p)}
              className="bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer group transition-all"
            >
              <div className="aspect-square bg-black overflow-hidden relative">
                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-amber-500 text-[9px] font-black uppercase">Mila</div>
              </div>
              <div className="p-5 text-center bg-gradient-to-b from-transparent to-black/20">
                <h3 className="text-[10px] font-black opacity-30 uppercase truncate tracking-tighter">{p.name}</h3>
                <p className="text-amber-500 font-black text-sm mt-1">{p.price} <span className="text-[8px] opacity-60">DZD</span></p>
              </div>
            </motion.div>
          ))}
        </main>
      </div>

      {/* تذييل بسيط للجوال */}
      <footer className="p-10 text-center opacity-10 text-[9px] font-black tracking-[0.5em] uppercase">
        Designed for Mila City
      </footer>
    </div>
  );
}