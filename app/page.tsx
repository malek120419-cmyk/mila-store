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
    wa: "واتساب", addTitle: "إضافة منتج جديد", publish: "نشر الآن", rate: "تقييم",
    mustLogin: "يرجى تسجيل الدخول أولاً للقيام بهذا الإجراء"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", price: "DZD", 
    wa: "WhatsApp", addTitle: "Add Product", publish: "Publish", rate: "Rate",
    mustLogin: "Please login first to perform this action"
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
  const [userRating, setUserRating] = useState(0);

  const [formData, setFormData] = useState({ 
    name: '', seller_name: '', price: '', whatsapp: '', 
    location: 'ميلة المركز', category: 'إلكترونيات', description: '' 
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

  // دالة الحماية: تفتح نافذة الدخول إذا كان المستخدم غير مسجل
  const protectedAction = (action: () => void) => {
    if (!user) {
      alert(t.mustLogin);
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const handlePublish = async () => {
    if (!imageFiles || !formData.name || !formData.price) return alert("البيانات ناقصة!");
    setIsActionLoading(true);
    try {
      const file = imageFiles[0];
      const fileName = `${Date.now()}-${file.name}`;
      await supabase.storage.from('mila-market-assests').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);

      const { error } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        user_id: user?.id
      }]);

      if (error) throw error;
      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح!");
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
      
      {/* Navbar */}
      <nav className={`p-4 md:p-6 sticky top-0 z-[200] backdrop-blur-2xl border-b ${isDarkMode ? 'border-white/5 bg-black/60' : 'border-black/5 bg-white/60'} flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          <motion.h1 whileHover={{ scale: 1.1 }} className="text-xl md:text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></motion.h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black border border-amber-500/30">
            {lang === 'ar' ? 'EN' : 'AR'}
          </motion.button>
        </div>

        <div className="flex gap-4 items-center">
          <motion.button whileHover={{ rotate: 180, scale: 1.2 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-2 rounded-full bg-white/5">
            {isDarkMode ? '🌞' : '🌚'}
          </motion.button>
          
          {user ? (
            <motion.button whileHover={{ color: '#ef4444' }} onClick={() => supabase.auth.signOut()} className="text-[10px] font-black uppercase">✕</motion.button>
          ) : (
            <motion.button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black opacity-50 uppercase tracking-widest">{t.login}</motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px #f59e0b" }} whileTap={{ scale: 0.95 }}
            onClick={() => protectedAction(() => setShowAddForm(true))}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-lg"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <input 
          type="text" placeholder={t.search} 
          className={`w-full p-6 rounded-[2rem] border-none outline-none text-center font-bold shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 focus:bg-white/10' : 'bg-white focus:shadow-amber-500/10'}`}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <motion.button 
              key={i} whileHover={{ y: -5, scale: 1.05 }} whileTap={{ scale: 0.9 }}
              onClick={() => setActiveCategory(CATEGORIES.ar[i])}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <motion.div 
                layout key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="group relative bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col hover:border-amber-500/20 transition-all"
              >
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-black relative">
                  <motion.img 
                    whileHover={{ scale: 1.1 }} transition={{ duration: 0.5 }}
                    src={product.image_url} className="w-full h-full object-cover" loading="eager"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black">⭐ 4.8</div>
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-black text-[10px] truncate opacity-60 uppercase mb-1">{product.name}</h3>
                  <p className="text-amber-500 font-black text-sm">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals --- */}
      
      {/* Add Product Form - Added Location & Category */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] p-8 rounded-[3rem] w-full max-w-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto shadow-2xl">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl hover:text-white transition-colors">✕</button>
              <h2 className="text-2xl font-black text-amber-500 mb-8 text-center uppercase italic tracking-tighter">{t.addTitle}</h2>
              <div className="space-y-4">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02] text-center">
                   <input type="file" onChange={(e) => setImageFiles(e.target.files)} className="w-full text-[10px] text-white/40" />
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 font-bold outline-none focus:border-amber-500/50" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs outline-none" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.ar.slice(1).map((c, i) => <option key={i} value={c}>{CATEGORIES[lang][i+1]}</option>)}
                  </select>
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs outline-none" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.ar.map((m, i) => <option key={i} value={m}>{MUNICIPALITIES[lang][i]}</option>)}
                  </select>
                </div>

                <textarea placeholder="وصف وتفاصيل المنتج..." rows={3} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="p-4 rounded-xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الواتساب" className="p-4 rounded-xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs mt-4">
                  {isActionLoading ? "جاري الرفع..." : t.publish}
                </motion.button>
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
              <div className="w-full max-w-xl aspect-square rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-8 text-center space-y-6 w-full max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">{selectedProduct.name}</h2>
                
                {/* نظام التقييم المحمي */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <motion.button 
                        key={star} 
                        whileHover={{ scale: 1.4, rotate: 15 }} 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => protectedAction(() => setUserRating(star))}
                        className={`text-3xl transition-colors ${userRating >= star ? 'grayscale-0' : 'grayscale'}`}
                      >
                        ⭐
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">إضغط على النجوم للتقييم</p>
                </div>

                <p className="text-amber-500 text-3xl font-black">{selectedProduct.price} {t.price}</p>
                <div className="bg-white/5 p-8 rounded-[2.5rem] text-lg opacity-60 leading-relaxed border border-white/5">
                  <div className="flex justify-between mb-4 text-xs font-black text-amber-500/50 uppercase italic">
                    <span>📍 {selectedProduct.location}</span>
                    <span>📁 {selectedProduct.category}</span>
                  </div>
                  {selectedProduct.description || "لا يوجد وصف إضافي."}
                </div>
                <motion.a 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank"
                  className="block bg-[#25D366] text-black py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20"
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