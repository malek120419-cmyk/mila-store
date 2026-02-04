"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = {
  ar: ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "التلاغمة", "وادي العثمانية", "زغاية", "القرارم قوقة", "سيدي مروان", "مشديرة"],
  en: ["Mila Center", "Chelghoum Laid", "Ferdjioua", "Tadjenanet", "Teleghma", "Oued Athmania", "Zeghaia", "Grarem Gouga", "Sidi Merouane", "Mechira"]
};

const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"]
};

const UI = {
  ar: {
    search: "بحث في ميلة...", sell: "بيع +", login: "دخول", logout: "خروج", price: "دج", 
    wa: "واتساب", addTitle: "إضافة منتج", publish: "نشر الآن", rate: "تقييم"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", price: "DZD", 
    wa: "WhatsApp", addTitle: "Add Product", publish: "Publish", rate: "Rate"
  }
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', seller_name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات', description: '' 
  });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const t = UI[lang];

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

  const handlePublish = async () => {
    if (!imageFiles || !formData.name) return alert("البيانات ناقصة!");
    setIsActionLoading(true);
    try {
      const file = imageFiles[0];
      const fileName = `${Date.now()}-${file.name}`;
      await supabase.storage.from('mila-market-assests').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);

      await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        user_id: user?.id
      }]);
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) { alert(e.message); }
    setIsActionLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (activeCategory === 'الكل' || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar - Icons & Buttons Fixed */}
      <nav className={`p-4 md:p-6 sticky top-0 z-[200] backdrop-blur-2xl border-b ${isDarkMode ? 'border-white/5 bg-black/60' : 'border-black/5 bg-white/60'} flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          <motion.h1 whileHover={{ scale: 1.1 }} className="text-xl md:text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></motion.h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black border border-amber-500/20 uppercase">
            {lang === 'ar' ? 'EN' : 'AR'}
          </motion.button>
        </div>

        <div className="flex gap-4 items-center">
          <motion.button whileHover={{ rotate: 180 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-2 bg-white/5 rounded-full">
            {isDarkMode ? '🌞' : '🌚'}
          </motion.button>
          
          {user ? (
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black">✕</motion.button>
          ) : (
            <motion.button whileHover={{ opacity: 1 }} onClick={() => setShowAuthModal(true)} className="text-[10px] font-black opacity-50">{t.login}</motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-5 py-2 rounded-full font-black text-xs shadow-lg z-[210]"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Search */}
        <div className="relative group">
          <input 
            type="text" placeholder={t.search} 
            className={`w-full p-6 rounded-[2rem] border-none outline-none text-center font-bold shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 focus:bg-white/10' : 'bg-white focus:shadow-amber-500/10'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-8 top-1/2 -translate-y-1/2 opacity-30 text-xl group-hover:scale-125 transition-transform">🔍</span>
        </div>

        {/* Categories - Interactive Icons */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <motion.button 
              key={i} whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }}
              onClick={() => setActiveCategory(CATEGORIES.ar[i])}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black whitespace-nowrap border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product Grid - Fixed "Cover" and "Speed" */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <motion.div 
                layout key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="group relative bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col"
              >
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-black flex items-center justify-center relative">
                  <motion.img 
                    whileHover={{ scale: 1.1 }}
                    src={product.image_url} 
                    className="w-full h-full object-cover" // يملأ الإطار بالكامل
                    loading="eager" // تحميل سريع جداً
                  />
                  {/* Rating Icon - تقييم المنتج */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-amber-500 text-[10px] font-black">⭐ 4.5</span>
                  </div>
                </div>
                <div className="p-4 md:p-6 text-center">
                  <h3 className="font-black text-[10px] md:text-xs truncate opacity-70 uppercase mb-2">{product.name}</h3>
                  <p className="text-amber-500 font-black text-xs">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals --- */}
      
      {/* Add Product Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] p-8 rounded-[3rem] w-full max-w-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl">✕</button>
              <h2 className="text-2xl font-black text-amber-500 mb-8 text-center uppercase tracking-widest italic">{t.addTitle}</h2>
              <div className="space-y-4">
                <input type="file" onChange={(e) => setImageFiles(e.target.files)} className="w-full text-xs text-white/40 file:bg-white/5 file:text-white file:border-none file:px-4 file:py-2 file:rounded-full" />
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="وصف المنتج..." rows={3} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                  {isActionLoading ? "جاري الرفع..." : t.publish}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details & Rating Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-3xl p-4 overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-6 right-6 z-[610] bg-white/10 w-12 h-12 rounded-full text-white text-xl">✕</button>
            <div className="max-w-5xl mx-auto mt-20 flex flex-col items-center">
              <img src={selectedProduct.image_url} className="w-full max-w-xl aspect-square object-cover rounded-[3rem] shadow-2xl" />
              <div className="mt-8 text-center space-y-6 w-full max-w-2xl">
                <h2 className="text-4xl font-black italic">{selectedProduct.name}</h2>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(star => (
                    <motion.button key={star} whileHover={{ scale: 1.3, rotate: 15 }} className="text-2xl text-amber-500">⭐</motion.button>
                  ))}
                  <span className="opacity-50 text-xs self-center ml-2">(12 {t.rate})</span>
                </div>
                <p className="text-amber-500 text-3xl font-black">{selectedProduct.price} {t.price}</p>
                <div className="bg-white/5 p-8 rounded-[2.5rem] text-lg opacity-60 leading-relaxed">
                  {selectedProduct.description || "هذا المنتج متوفر في ولاية ميلة، تواصل مع البائع للمزيد من المعلومات."}
                </div>
                <motion.a 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${selectedProduct.whatsapp}`} 
                  className="block bg-[#25D366] text-black py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-green-500/20"
                >
                  {t.wa}
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}