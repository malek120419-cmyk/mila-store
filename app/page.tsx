"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse text-center">MILA STORE...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar - أيقونات تفاعلية */}
      <nav className="p-5 md:p-8 sticky top-0 z-[100] backdrop-blur-3xl bg-black/50 border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <motion.h1 
          whileHover={{ scale: 1.1, color: "#f59e0b" }}
          className="text-2xl font-black italic tracking-tighter cursor-pointer"
        >
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>
        
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.8 }}
            className="text-2xl" onClick={() => {}}
          >
            ⚙️
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px #f59e0b" }}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase"
          >
            بيع +
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Product Grid */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
          <AnimatePresence>
            {products.map(product => (
              <motion.div 
                key={product.id} layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl transition-all hover:border-amber-500/30"
              >
                {/* الإطار - الصورة الآن تملأه بالكامل بدون فراغات */}
                <div 
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square cursor-pointer overflow-hidden relative"
                >
                  <motion.img 
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.6 }}
                    src={product.image_url} 
                    className="w-full h-full object-cover" // تم التغيير لـ Cover
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-5 text-center">
                  <h3 className="font-black text-[11px] md:text-sm truncate opacity-70 uppercase mb-2">{product.name}</h3>
                  <p className="text-amber-500 font-black text-sm md:text-base">{product.price} دج</p>
                </div>

                {/* زر حذف تفاعلي */}
                {user?.id === product.user_id && (
                  <motion.button 
                    whileHover={{ scale: 1.2, backgroundColor: "#ef4444" }}
                    className="absolute top-4 left-4 bg-black/40 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl p-4 md:p-10 flex flex-col items-center justify-center"
          >
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.2 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute top-10 right-10 bg-white/10 w-14 h-14 rounded-full text-2xl"
            >
              ✕
            </motion.button>
            
            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-10">
              {/* صورة كبيرة تملأ الإطار في التفاصيل أيضاً */}
              <div className="flex-1 aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover shadow-2xl" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-6 text-center md:text-right">
                <h2 className="text-4xl md:text-6xl font-black italic">{selectedProduct.name}</h2>
                <p className="text-amber-500 text-3xl font-black">{selectedProduct.price} دج</p>
                <div className="bg-white/5 p-6 rounded-[2rem] text-lg opacity-60">
                  {selectedProduct.description || "لا يوجد وصف حالياً."}
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="bg-[#25D366] text-black py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-green-500/20"
                >
                  تواصل عبر واتساب
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}