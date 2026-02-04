"use client";

import React, { useState, useEffect } from 'react';
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
    search: "بحث عن منتج في ميلة...", sell: "بيع +", login: "دخول", logout: "خروج", myAds: "إعلاناتي",
    price: "دج", seller: "البائع", location: "📍", wa: "تواصل واتساب", delTitle: "حذف نهائي؟",
    confirm: "حذف", cancel: "إلغاء", addTitle: "إضافة منتج جديد", publish: "نشر الآن", uploadImg: "إضغط لاختيار الصور"
  },
  en: {
    search: "Search in Mila...", sell: "Sell +", login: "Login", logout: "Logout", myAds: "My Ads",
    price: "DZD", seller: "Seller", location: "📍", wa: "WhatsApp", delTitle: "Delete?",
    confirm: "Delete", cancel: "Cancel", addTitle: "Add Product", publish: "Publish", uploadImg: "Upload Images"
  }
};

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const forceDelete = async () => {
    if (!productToDelete || !user) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('products').delete().match({ id: productToDelete, user_id: user.id });
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFiles) return alert("البيانات ناقصة");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}-${i}.jpg`;
        await supabase.storage.from('mila-market-assests').upload(fileName, file);
        const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      await supabase.from('products').insert([{ 
        ...formData, 
        price: parseFloat(formData.price), 
        image_url: uploadedUrls[0], 
        images: uploadedUrls, 
        user_id: user?.id 
      }]);
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) { alert(e.message); } finally { setIsActionLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-colors duration-500`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar - Beautiful & Interactive Icons */}
      <nav className="p-4 md:p-6 sticky top-0 z-[100] backdrop-blur-2xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <motion.h1 whileHover={{ scale: 1.05 }} className="text-xl md:text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></motion.h1>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className="bg-white/5 px-3 py-1.5 rounded-xl text-[9px] font-black border border-white/10"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </motion.button>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
             <motion.button whileHover={{ color: '#ef4444' }} onClick={() => supabase.auth.signOut()} className="text-[10px] font-black uppercase">✕ خروج</motion.button>
          ) : (
            <motion.button whileHover={{ opacity: 1 }} onClick={() => setShowAuthModal(true)} className="text-[9px] font-black uppercase opacity-40">دخول</motion.button>
          )}
          <motion.button whileHover={{ rotate: 180 }} transition={{ type: 'spring' }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} 
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10">
        {/* Search */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <input 
            type="text" placeholder={t.search} 
            className="w-full p-6 md:p-8 rounded-[2.5rem] bg-white/5 border border-white/5 outline-none text-center font-bold shadow-2xl focus:border-amber-500/40 transition-all" 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </motion.div>
        
        {/* Categories - Interactive Icons/Buttons */}
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

        {/* Product Grid - Fixed Image Display */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          <AnimatePresence>
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
              <motion.div 
                layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                key={product.id} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl flex flex-col"
              >
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-black flex items-center justify-center p-4">
                  <motion.img whileHover={{ scale: 1.1 }} src={product.image_url} className="max-w-full max-h-full object-contain" />
                </div>
                {user?.id === product.user_id && (
                  <motion.button 
                    whileTap={{ scale: 0.7 }} onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} 
                    className="absolute top-4 left-4 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center z-30"
                  >
                    ✕
                  </motion.button>
                )}
                <div className="p-6 text-center">
                  <h3 className="font-black text-[11px] truncate opacity-70 uppercase tracking-tighter mb-2">{product.name}</h3>
                  <p className="text-amber-500 font-black text-sm">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals - Beautiful & Interactive */}
      
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl overflow-y-auto">
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }} onClick={() => setSelectedProduct(null)} 
              className="fixed top-6 right-6 z-[310] bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl"
            >
              ✕
            </motion.button>
            <div className="max-w-6xl mx-auto p-6 md:p-10 flex flex-col lg:flex-row gap-12 mt-20">
              <div className="lg:w-1/2 flex items-center justify-center bg-neutral-800 rounded-[3rem] p-6 aspect-square shadow-2xl">
                <img src={selectedProduct.image_url} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">{selectedProduct.name}</h2>
                <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
                  <p className="text-amber-500 text-3xl font-black mb-6">{selectedProduct.price} {t.price}</p>
                  <p className="opacity-60 text-lg leading-relaxed">{selectedProduct.description}</p>
                </div>
                <motion.a 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" 
                  className="block bg-[#25D366] text-black text-center py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20"
                >
                  {t.wa}
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[3rem] w-full max-w-2xl border border-white/10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
              <motion.button whileHover={{ color: '#fff' }} onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl">✕</motion.button>
              <h2 className="text-2xl font-black text-amber-500 mb-10 text-center uppercase tracking-widest">{t.addTitle}</h2>
              <div className="space-y-4">
                <div className="p-10 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02] text-center relative hover:border-amber-500/30 transition-all cursor-pointer">
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFiles(e.target.files)} />
                    <p className="text-[10px] font-black uppercase opacity-40">{imageFiles ? `✅ ${imageFiles.length} Selected` : t.uploadImg}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="اسم البائع" className="p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                  <input type="text" placeholder="اسم المنتج" className="p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <textarea placeholder="وصف المنتج..." rows={3} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-[10px]" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.ar.slice(1).map((c, i) => <option key={i} value={c}>{CATEGORIES[lang][i+1]}</option>)}
                  </select>
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-[10px]" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.ar.map((m, i) => <option key={i} value={m}>{MUNICIPALITIES[lang][i]}</option>)}
                  </select>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                  {isActionLoading ? "جاري النشر..." : t.publish}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-10 rounded-[3rem] text-center shadow-2xl max-w-xs w-full">
              <h2 className="text-lg font-black mb-8 uppercase tracking-tighter">{t.delTitle}</h2>
              <button onClick={forceDelete} className="bg-red-600 text-white w-full py-4 rounded-2xl font-black mb-4 shadow-xl shadow-red-500/10">نعم، احذف</button>
              <button onClick={() => setProductToDelete(null)} className="text-white/20 font-black text-[9px] uppercase tracking-widest">إلغاء ✕</button>
            </motion.div>
          </div>
        )}

        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 relative text-center">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/20 text-xl">✕</button>
              <h2 className="text-2xl font-black mb-10 italic text-amber-500 uppercase tracking-tighter">MILA STORE</h2>
              <div className="space-y-4">
                <input type="email" placeholder="Email" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setPassword(e.target.value)} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => {}} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">دخول</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}