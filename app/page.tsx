"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- استيراد المحرك الجديد ---
import { ModernIcon, MilaAlert, UserProfile } from './MilaEngine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"]
};

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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

  const protectedAction = (action: () => void) => {
    if (!user) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl">MILA...</div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* التنبيه الذكي المستدعى من المحرك */}
      <MilaAlert msg="سجل دخولك أولاً للبيع والتقييم" isVisible={showAlert} onClose={() => setShowAlert(false)} />

      {/* Navbar المطور */}
      <nav className="p-6 sticky top-0 z-[200] backdrop-blur-3xl bg-inherit/50 border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <motion.h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></motion.h1>
        
        <div className="flex gap-6 items-center">
          <ModernIcon icon={isDarkMode ? '🌞' : '🌚'} label="الثيم" onClick={() => setIsDarkMode(!isDarkMode)} />
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'English' : 'العربية'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label="بيع +" onClick={() => protectedAction(() => setShowAddForm(true))} />
          <UserProfile user={user} onLogin={() => setShowAuthModal(true)} onLogout={() => supabase.auth.signOut()} />
        </div>
      </nav>

      {/* محتوى الصفحة الرئيسي */}
      <div className="max-w-7xl mx-auto p-6 space-y-10">
        <input 
          type="text" placeholder="ماذا تبحث في ولاية ميلة؟" 
          className="w-full p-8 rounded-[2.5rem] bg-white/5 border-none outline-none text-center font-bold shadow-2xl"
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <button 
              key={i} onClick={() => setActiveCategory(CATEGORIES.ar[i])}
              className={`px-8 py-3 rounded-full text-[11px] font-black border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black' : 'bg-white/5 border-white/5 opacity-40'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* المنتجات مع "object-cover" لملء الإطار */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <motion.div 
              key={product.id} onClick={() => setSelectedProduct(product)}
              className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
            >
              <div className="aspect-square overflow-hidden relative">
                <img src={product.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black">⭐ 5.0</div>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-black text-[11px] truncate opacity-50 uppercase mb-2">{product.name}</h3>
                <p className="text-amber-500 font-black text-sm">{product.price} دج</p>
              </div>
            </motion.div>
          ))}
        </main>
      </div>

      {/* باقي الـ Modals (إضافة منتج، تسجيل دخول...) كما كانت في الكود السابق */}
      {/* ... يمكنك إكمالها هنا أو سأضيفها لك في الخطوة التالية لكي لا يكون الكود طويلاً جداً الآن ... */}

    </div>
  );
}