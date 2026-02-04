"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- القواميس الكاملة للترجمة ---
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
    search: "ابحث عن منتج في ميلة...",
    sell: "بيع منتج +",
    login: "دخول",
    logout: "خروج",
    myAds: "إعلاناتي",
    allAds: "كل الإعلانات",
    price: "دج",
    seller: "البائع",
    location: "📍 الموقع",
    desc: "وصف المنتج",
    wa: "تواصل عبر واتساب",
    delTitle: "حذف المنتج نهائياً؟",
    delDesc: "لن تتمكن من استرجاع هذا المنتج بعد الحذف.",
    confirm: "نعم، احذف",
    cancel: "إلغاء",
    addTitle: "نشر منتج جديد",
    pName: "اسم المنتج",
    pPrice: "السعر (دج)",
    pWa: "رقم الواتساب",
    pDesc: "وصف مفصل...",
    pCat: "الفئة",
    pLoc: "البلدية",
    pSeller: "اسمك كبائع",
    publish: "نشر الآن",
    uploadImg: "اضغط لرفع صورة"
  },
  en: {
    search: "Search for products in Mila...",
    sell: "Sell Now +",
    login: "Login",
    logout: "Logout",
    myAds: "My Ads",
    allAds: "All Ads",
    price: "DZD",
    seller: "Seller",
    location: "📍 Location",
    desc: "Description",
    wa: "Contact via WhatsApp",
    delTitle: "Delete Permanently?",
    delDesc: "You won't be able to recover this product.",
    confirm: "Yes, Delete",
    cancel: "Cancel",
    addTitle: "Post New Product",
    pName: "Product Name",
    pPrice: "Price (DZD)",
    pWa: "WhatsApp Number",
    pDesc: "Full Description...",
    pCat: "Category",
    pLoc: "Municipality",
    pSeller: "Seller Name",
    publish: "Publish Now",
    uploadImg: "Click to upload image"
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
  const [showSettings, setShowSettings] = useState(false);
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
  const [imageFile, setImageFile] = useState<File | null>(null);

  const t = UI[lang];

  useEffect(() => {
    fetchProducts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
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
    
    // حذف من السيرفر
    const { error } = await supabase.from('products').delete().eq('id', productToDelete).eq('user_id', user.id);
    
    if (!error) {
      // تحديث الحالة فوراً لضمان الاختفاء
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setSelectedProduct(null);
      // إعادة جلب للتأكيد 100%
      fetchProducts();
    } else {
      alert("Error deleting: " + error.message);
    }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFile) return alert("Fill all fields");
    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}.jpg`;
      await supabase.storage.from('mila-market-assests').upload(fileName, imageFile);
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;
      
      await supabase.from('products').insert([{
        ...formData, price: parseFloat(formData.price), image_url: publicUrl,
        user_id: user?.id, user_email: user?.email
      }]);
      setShowAddForm(false);
      fetchProducts();
    } catch (e) { alert("Upload failed"); } finally { setIsActionLoading(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'} transition-all`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-2xl shadow-black/50">
        <div className="flex items-center gap-5">
          <motion.h1 whileHover={{ scale: 1.05 }} className="text-2xl font-black italic tracking-tighter">
            {lang === 'ar' ? 'ميلة' : 'MILA'} <span className="text-amber-500 font-normal">{lang === 'ar' ? 'ستور' : 'STORE'}</span>
          </motion.h1>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black border border-white/10 hover:bg-amber-500 hover:text-black transition-all"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </motion.button>
        </div>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="relative">
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xs shadow-lg">
                {user.email[0].toUpperCase()}
              </motion.button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 mt-4 w-48 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl p-2 z-[200]">
                    <button onClick={() => { setShowOnlyMyAds(!showOnlyMyAds); setShowSettings(false); }} className="w-full text-right p-4 hover:bg-white/5 rounded-2xl text-[11px] font-black">
                      {showOnlyMyAds ? t.allAds : t.myAds}
                    </button>
                    <button onClick={() => supabase.auth.signOut()} className="w-full text-right p-4 text-red-500 hover:bg-red-500/10 rounded-2xl text-[11px] font-black">{t.logout}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40 hover:opacity-100">{t.login}</button>
          )}
          <motion.button whileHover={{ rotate: 180 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} 
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-xl shadow-amber-500/20"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      {/* Hero & Search */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <input 
          type="text" placeholder={t.search} 
          className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-bold text-center shadow-2xl" 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar w-full justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, index) => (
            <button 
              key={index} 
              onClick={() => setActiveCategory(CATEGORIES.ar[index])} // نستخدم المفتاح العربي للفلترة دائماً لثبات البيانات
              className={`px-6 py-2 rounded-full text-[10px] font-black flex-shrink-0 transition-all ${activeCategory === CATEGORIES.ar[index] ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid: المنتجات */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {products
              .filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (!showOnlyMyAds || p.user_id === user?.id))
              .map(product => (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                  key={product.id} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-xl hover:border-amber-500/40 transition-all duration-500"
                >
                  <div onClick={() => setSelectedProduct(product)} className="aspect-square relative cursor-pointer overflow-hidden">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase">View Details</div>
                  </div>
                  {user?.id === product.user_id && (
                    <button onClick={() => setProductToDelete(product.id)} className="absolute top-4 left-4 bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-125 transition-transform z-30">🗑️</button>
                  )}
                  <div className="p-5 text-center">
                    <h3 className="font-black text-sm truncate opacity-80">{product.name}</h3>
                    <p className="text-amber-500 font-black mt-1 text-xs">{product.price} {t.price}</p>
                  </div>
                </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* صفحة تفاصيل المنتج (المزايا) - FIXED */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl overflow-y-auto">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => setSelectedProduct(null)} 
              className="fixed top-8 right-8 z-[310] bg-white/10 text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shadow-2xl"
            >
              ✕
            </motion.button>
            <div className="min-h-screen w-full p-6 md:p-20">
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                <motion.img 
                  initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  src={selectedProduct.image_url} className="w-full lg:w-1/2 aspect-square object-cover rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5" 
                />
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8 flex-1 w-full text-right lg:text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight">{selectedProduct.name}</h2>
                  <p className="text-amber-500 text-4xl font-black">{selectedProduct.price} {t.price}</p>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 italic opacity-80 leading-relaxed text-lg shadow-inner">
                    <p className="text-xs uppercase font-black mb-2 opacity-30 text-amber-500">{t.desc}</p>
                    {selectedProduct.description}
                  </div>
                  <div className="flex justify-between font-black text-[10px] opacity-40 uppercase tracking-widest bg-white/5 p-5 rounded-2xl">
                    <span>{t.seller}: {selectedProduct.seller_name}</span>
                    <span>{t.location}: {selectedProduct.location}</span>
                  </div>
                  <motion.a 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    href={`https://wa.me/${selectedProduct.whatsapp}`} 
                    className="block bg-[#25D366] text-black text-center py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20"
                  >
                    {t.wa} ✨
                  </motion.a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* استمارة إضافة منتج - FULL LIST RECOVERY */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[4rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black italic text-amber-500 uppercase">{t.addTitle}</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/20 text-2xl">✕</button>
              </div>
              <div className="space-y-5">
                <label className="h-44 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center relative bg-white/[0.02] cursor-pointer hover:border-amber-500/50 transition-all overflow-hidden">
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                   {imageFile ? <p className="text-amber-500 font-black text-xs uppercase animate-bounce">Ready ✅</p> : <p className="opacity-20 font-black text-[9px] uppercase tracking-widest">{t.uploadImg}</p>}
                </label>
                <input type="text" placeholder={t.pSeller} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder={t.pName} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder={t.pDesc} rows={3} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder={t.pPrice} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder={t.pWa} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES[lang].slice(1).map((c, i) => <option key={i} value={CATEGORIES.ar[i+1]}>{c}</option>)}
                  </select>
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES[lang].map((m, i) => <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>)}
                  </select>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handlePublish} disabled={isActionLoading} 
                  className="w-full py-7 bg-amber-500 text-black font-black rounded-[2.5rem] text-xl shadow-2xl shadow-amber-500/20"
                >
                  {isActionLoading ? "..." : t.publish}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال تسجيل الدخول - FIXED DIRECTION */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] p-12 rounded-[4rem] w-full max-w-sm border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center">
              <h2 className="text-2xl font-black mb-10 italic text-amber-500 uppercase tracking-tighter">Mila Store</h2>
              {authError && <p className="bg-red-500/10 text-red-500 text-[10px] p-3 rounded-xl mb-6 font-bold">{authError}</p>}
              <div className="space-y-4">
                <input 
                  dir="ltr" type="email" placeholder="Email Address" 
                  className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/30 transition-all" 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                  dir="ltr" type="password" placeholder="Password" 
                  className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/30 transition-all" 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button onClick={handleAuth} className="w-full bg-white text-black py-6 rounded-2xl font-black active:scale-95 shadow-xl uppercase tracking-widest text-[10px]">
                  {isSignUp ? 'Sign Up' : 'Login'}
                </button>
              </div>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-amber-500/60 mt-8 block mx-auto underline italic">
                {isSignUp ? 'Have account? Login' : 'No account? Create'}
              </button>
              <button onClick={() => setShowAuthModal(false)} className="text-white/10 text-[9px] mt-6 font-black uppercase tracking-widest">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال تأكيد الحذف - REINFORCED */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-12 rounded-[4rem] max-w-md w-full text-center shadow-2xl">
              <div className="text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-black italic mb-4">{t.delTitle}</h2>
              <p className="text-white/30 font-bold mb-10 text-sm italic">{t.delDesc}</p>
              <div className="flex flex-col gap-3">
                <button onClick={forceDelete} className="bg-red-500 text-white py-5 rounded-3xl font-black text-lg active:scale-95 shadow-lg shadow-red-500/10">
                  {isActionLoading ? "..." : t.confirm}
                </button>
                <button onClick={() => setProductToDelete(null)} className="text-white/20 py-4 font-black text-[10px] uppercase tracking-widest">{t.cancel}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}