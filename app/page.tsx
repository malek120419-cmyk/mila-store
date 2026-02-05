"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

import { ModernIcon, ProductDetails, MilaAlert, AddProductModal } from './MilaEngine';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

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

  const handleSaveProduct = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('image') as File;
    const fileName = `${Date.now()}-${file.name}`;

    try {
      // الرفع لمجلد product-images الذي ضبطت الـ Policies الخاصة به
      const { data: imgData } = await supabase.storage.from('product-images').upload(fileName, file);
      if (!imgData) throw new Error("Upload Failed");

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);

      const { error } = await supabase.from('products').insert([{
        name: formData.get('name'),
        price: formData.get('price'),
        whatsapp: formData.get('whatsapp'),
        category: formData.get('category'),
        image_url: urlData.publicUrl
      }]);

      if (!error) {
        setIsAddModalOpen(false);
        fetchProducts();
        setAlertMsg(lang === 'ar' ? "تم النشر!" : "Published!");
        setTimeout(() => setAlertMsg(''), 3000);
      }
    } catch (err) { alert("Error saving product. Check your Policies."); }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} lang={lang} />
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveProduct} lang={lang} />
      <MilaAlert msg={alertMsg} isVisible={!!alertMsg} />

      <nav className="p-6 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto bg-black/50">
        <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-5 items-center">
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'EN' : 'AR'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label={lang === 'ar' ? 'بيع +' : 'SELL +'} onClick={() => setIsAddModalOpen(true)} />
          <ModernIcon active={user} icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : 'LOGIN'} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
        <SearchBar placeholder={lang === 'ar' ? 'ابحث في ميلة...' : 'Search Mila...'} onChange={setSearchQuery} />
        <CategoryBar active={activeCategory} onChange={setActiveCategory} lang={lang} />

        <motion.main layout className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 mt-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p, i) => (
              <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.05 }} key={p.id} onClick={() => setSelectedProduct(p)} className="group bg-white/[0.02] rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-2xl hover:border-amber-500/30 transition-all duration-500">
                <div className="aspect-[4/5] overflow-hidden bg-neutral-900 relative">
                   <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-amber-500 text-[9px] font-black uppercase">NEW</div>
                </div>
                <div className="p-8 text-center"><h3 className="text-[11px] font-black opacity-30 uppercase truncate mb-2 group-hover:opacity-100 transition-opacity">{p.name}</h3><p className="text-2xl font-black">{p.price} <span className="text-xs opacity-40">DZD</span></p></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
}