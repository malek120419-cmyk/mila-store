"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernIcon, ProductDetails, AddProductModal } from './MilaEngine';
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
    if (!user) return alert("Please Login First");
    const formData = new FormData(e.target);
    const file = formData.get('image') as File;
    const fileName = `${Date.now()}-${file.name}`;
    const { data: imgData } = await supabase.storage.from('product-images').upload(fileName, file);
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    await supabase.from('products').insert([{
      name: formData.get('name'), price: formData.get('price'), whatsapp: formData.get('whatsapp'),
      category: formData.get('category'), image_url: urlData.publicUrl, user_id: user.id
    }]);
    setIsAddModalOpen(false); fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-amber-500 font-black italic text-5xl">MILA...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} lang={lang} />
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveProduct} lang={lang} />

      <nav className="p-8 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto bg-black/60">
        <h1 className="text-3xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-6 items-center">
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'EN' : 'AR'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label="SELL +" onClick={() => user ? setIsAddModalOpen(true) : window.location.href='/auth'} />
          <ModernIcon icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : 'LOGIN'} href={!user ? "/auth" : undefined} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <SearchBar placeholder={lang === 'ar' ? 'ابحث عن أي شيء في ميلة...' : 'Search Mila...'} onChange={setSearchQuery} />
        <CategoryBar active={activeCategory} onChange={setActiveCategory} lang={lang} />

        <main className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-14 mt-10">
          <AnimatePresence>
            {filteredProducts.map((p, i) => (
              <motion.div layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={p.id} onClick={() => setSelectedProduct(p)} className="group bg-white/[0.02] rounded-[3rem] overflow-hidden border border-white/5 cursor-pointer shadow-2xl hover:border-amber-500/30 transition-all duration-500">
                <div className="aspect-[4/5] overflow-hidden bg-neutral-900 relative">
                   <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                   <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-2xl text-amber-500 text-[10px] font-black uppercase">NEW</div>
                </div>
                <div className="p-10 text-center relative bg-gradient-to-b from-transparent to-black/40">
                  <h3 className="text-[12px] font-black opacity-30 uppercase truncate mb-2 group-hover:opacity-100 transition-opacity">{p.name}</h3>
                  <p className="text-3xl font-black">{p.price} <span className="text-xs opacity-40 italic">DZD</span></p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}