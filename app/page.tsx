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
    search: "بحث عن منتج...", sell: "بيع +", login: "دخول", logout: "خروج", myAds: "إعلاناتي",
    price: "دج", seller: "البائع", location: "📍", wa: "تواصل واتساب", delTitle: "حذف نهائي؟",
    confirm: "حذف", cancel: "إلغاء", addTitle: "إضافة منتج", publish: "نشر الآن", uploadImg: "رفع الصور"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", myAds: "My Ads",
    price: "DZD", seller: "Seller", location: "📍", wa: "WhatsApp", delTitle: "Delete?",
    confirm: "Delete", cancel: "Cancel", addTitle: "Add Product", publish: "Publish", uploadImg: "Upload"
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
  const [showOnlyMyAds, setShowOnlyMyAds] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

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

  const handleAuth = async () => {
    setAuthError('');
    setIsActionLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setAuthError(error.message);
    else setShowAuthModal(false);
    setIsActionLoading(false);
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
    if (!formData.name || !imageFiles) return alert("Missing data");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}-${i}.jpg`;
        await supabase.storage.from('mila-market-assests').upload(fileName, file);
        uploadedUrls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`);
      }
      await supabase.from('products').insert([{ ...formData, price: parseFloat(formData.price), image_url: uploadedUrls[0], images: uploadedUrls, user_id: user?.id, user_email: user?.email }]);
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) { alert(e.message); } finally { setIsActionLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-colors duration-500`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar - Mobile Optimized */}
      <nav className="p-4 md:p-6 sticky top-0 z-[100] backdrop-blur-2xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-xl">
        <div className="flex items-center gap-3 md:gap-6">
          <motion.h1 whileTap={{ scale: 0.9 }} className="text-xl md:text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></motion.h1>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className="bg-white/5 px-3 py-1.5 rounded-xl text-[9px] font-black border border-white/10 uppercase"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </motion.button>
        </div>

        <div className="flex gap-2 md:gap-4 items-center">
          {user ? (
             <div className="flex items-center gap-2 md:gap-4">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowOnlyMyAds(!showOnlyMyAds)} className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${showOnlyMyAds ? 'bg-amber-500 text-black' : 'opacity-40'}`}>{t.myAds}</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => supabase.auth.signOut()} className="text-red-500 text-[9px] font-black uppercase">✕</motion.button>
             </div>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAuthModal(true)} className="text-[9px] font-black uppercase opacity-40">{t.login}</motion.button>
          )}
          <motion.button whileHover={{ scale: 1.2, rotate: 20 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg md:text-xl p-2">{isDarkMode ? '🌞' : '🌚'}</motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} 
            className="bg-amber-500 text-black px-4 md:px-6 py-2 rounded-full font-black text-[10px] md:text-xs shadow-lg"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
        {/* Search - Enhanced UI */}
        <div className="relative group">
          <input 
            type="text" placeholder={t.search} 
            className="w-full p-5 md:p-7 rounded-[2rem] md:rounded-[3rem] bg-white/5 border border-white/5 outline-none text-center font-bold shadow-2xl focus:border-amber-500/40 transition-all text-sm md:text-lg" 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        
        {/* Categories - Spaced for Mobile */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center px-2">
          {CATEGORIES[lang].map((cat, i) => (
            <motion.button 
              key={i} whileTap={{ scale: 0.9 }}
              onClick={() => setActiveCategory(CATEGORIES.ar[i])} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all border ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product Grid - Mobile Spacing */}
        <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (!showOnlyMyAds || p.user_id === user?.id)).map(product => (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                key={product.id} className="group bg-neutral-900/40 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 relative shadow-2xl hover:border-amber-500/30 transition-all"
              >
                <div onClick={() => setSelectedProduct(product)} className="aspect-[4/5] cursor-pointer overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                </div>
                {user?.id === product.user_id && (
                  <motion.button 
                    whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} 
                    className="absolute top-3 left-3 md:top-5 md:left-5 bg-red-600/90 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-2xl z-30"
                  >
                    ✕
                  </motion.button>
                )}
                <div className="p-4 md:p-6 text-center">
                  <h3 className="font-black text-[11px] md:text-sm truncate opacity-70 uppercase tracking-tighter">{product.name}</h3>
                  <p className="text-amber-500 font-black mt-1 text-xs md:text-base">{product.price} <span className="text-[10px] opacity-60">{t.price}</span></p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Windows / Modals --- */}

      {/* Product Details - Redesigned ✕ */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl overflow-y-auto">
            <motion.button 
              whileHover={{ rotate: 90 }} whileTap={{ scale: 0.8 }}
              onClick={() => setSelectedProduct(null)} 
              className="fixed top-6 right-6 z-[310] bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-light border border-white/10"
            >
              ✕
            </motion.button>
            <div className="max-w-6xl mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-8 md:gap-12 mt-16 md:mt-24">
              <div className="lg:w-1/2 space-y-4">
                <img src={selectedProduct.image_url} className="w-full aspect-square object-cover rounded-[2.5rem] md:rounded-[4rem] shadow-2xl" />
                <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                  {selectedProduct.images?.map((img: string, i: number) => (
                    <motion.img key={i} whileTap={{ scale: 0.9 }} src={img} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover cursor-pointer border-2 border-transparent hover:border-amber-500" onClick={() => setSelectedProduct({...selectedProduct, image_url: img})} />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-6 md:space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h2 className="text-4xl md:text-6xl font-black italic">{selectedProduct.name}</h2>
                <div className="bg-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5">
                  <p className="text-amber-500 text-3xl md:text-4xl font-black mb-4">{selectedProduct.price} {t.price}</p>
                  <p className="opacity-60 leading-relaxed text-sm md:text-lg">{selectedProduct.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40">{t.seller}: {selectedProduct.seller_name}</div>
                  <div className="bg-white/5 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 text-center">{t.location} {selectedProduct.location}</div>
                </div>
                <motion.a 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" 
                  className="block bg-[#25D366] text-black text-center py-5 md:py-7 rounded-[2rem] md:rounded-[3rem] font-black text-xl md:text-2xl shadow-2xl shadow-green-500/20"
                >
                  {t.wa}
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Form - Redesigned for Mobile ✕ */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-6 md:p-12 rounded-[3rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl hover:text-white transition-colors">✕</button>
              <h2 className="text-xl md:text-2xl font-black italic text-amber-500 mb-8 uppercase text-center">{t.addTitle}</h2>
              <div className="space-y-4">
                <label className="h-32 md:h-40 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.02] cursor-pointer">
                   <input type="file" multiple className="hidden" onChange={(e) => setImageFiles(e.target.files)} />
                   <p className="opacity-40 font-black text-[10px] uppercase">{imageFiles ? `${imageFiles.length} Selected` : t.uploadImg}</p>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder={t.seller} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                  <input type="text" placeholder="Product Name" className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <textarea placeholder="Product Description..." rows={3} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 rounded-2xl bg-neutral-900 border border-white/5 font-bold text-[10px]" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES[lang].slice(1).map((c, i) => <option key={i} value={CATEGORIES.ar[i+1]}>{c}</option>)}
                  </select>
                  <select className="p-4 rounded-2xl bg-neutral-900 border border-white/5 font-bold text-[10px]" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES[lang].map((m, i) => <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>)}
                  </select>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs">
                  {isActionLoading ? "Publishing..." : t.publish}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal - ✕ Styled */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 relative text-center">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/20 text-xl">✕</button>
              <h2 className="text-2xl font-black mb-8 italic text-amber-500 tracking-tighter uppercase">Mila Store</h2>
              <div className="space-y-4">
                <input dir="ltr" type="email" placeholder="Email Address" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setEmail(e.target.value)} />
                <input dir="ltr" type="password" placeholder="Password" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setPassword(e.target.value)} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAuth} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                  {isSignUp ? 'Sign Up' : 'Login'}
                </motion.button>
              </div>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[9px] font-black text-amber-500/60 mt-6 underline uppercase tracking-widest">{isSignUp ? 'Login' : 'Create account'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete - ✕ Styled */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-10 rounded-[3rem] text-center shadow-2xl max-w-xs w-full">
              <div className="text-5xl mb-6">⚠️</div>
              <h2 className="text-lg font-black italic mb-8 uppercase tracking-tighter">{t.delTitle}</h2>
              <button onClick={forceDelete} className="bg-red-600 text-white w-full py-4 rounded-2xl font-black mb-3 uppercase tracking-widest text-[10px]">
                {t.confirm}
              </button>
              <button onClick={() => setProductToDelete(null)} className="text-white/20 font-black text-[9px] uppercase tracking-widest">✕ {t.cancel}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}