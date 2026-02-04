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
    confirm: "حذف", cancel: "إلغاء", addTitle: "إضافة منتج", publish: "نشر الآن", uploadImg: "اضغط لرفع الصور (يمكنك اختيار أكثر من واحدة)"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", myAds: "My Ads",
    price: "DZD", seller: "Seller", location: "📍", wa: "WhatsApp", delTitle: "Delete?",
    confirm: "Delete", cancel: "Cancel", addTitle: "Add Product", publish: "Publish Now", uploadImg: "Click to upload (Multiple allowed)"
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
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const forceDelete = async () => {
    if (!productToDelete || !user) return;
    setIsActionLoading(true);
    // مسح محلي فوري أولاً
    setProducts(prev => prev.filter(p => p.id !== productToDelete));
    const { error } = await supabase.from('products').delete().match({ id: productToDelete, user_id: user.id });
    if (error) {
      alert("Error deleting from server");
      fetchProducts(); // إعادة التحميل إذا فشل الحذف
    } else {
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFiles || imageFiles.length === 0) return alert("الرجاء اختيار الصور وملئ البيانات");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.jpg`;
        const { data, error } = await supabase.storage.from('mila-market-assests').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) throw error;
        const publicUrl = supabase.storage.from('mila-market-assests').getPublicUrl(fileName).data.publicUrl;
        uploadedUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.price),
        image_url: uploadedUrls[0],
        images: uploadedUrls,
        user_id: user?.id,
        user_email: user?.email
      }]);

      if (insertError) throw insertError;

      setShowAddForm(false);
      setImageFiles(null);
      fetchProducts();
      alert("تم النشر بنجاح!");
    } catch (e: any) {
      alert("فشل الرفع: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAuth = async () => {
    setIsActionLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setShowAuthModal(false);
    setIsActionLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-4 md:p-6 sticky top-0 z-[100] backdrop-blur-2xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-xl">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-white/5 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/10 uppercase">{lang === 'ar' ? 'EN' : 'AR'}</button>
        </div>
        <div className="flex gap-3 items-center">
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black uppercase border border-red-500/20 px-2 py-1 rounded-lg">✕ {t.logout}</button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40">{t.login}</button>
          )}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-1">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-4 md:px-6 py-2 rounded-full font-black text-xs shadow-lg active:scale-95 transition-transform">{t.sell}</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
        {/* Search */}
        <input 
          type="text" placeholder={t.search} 
          className="w-full p-5 md:p-7 rounded-[2rem] bg-white/5 border border-white/5 outline-none text-center font-bold shadow-2xl focus:border-amber-500/30 transition-all" 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(CATEGORIES.ar[i])} className={`px-5 py-2 rounded-full text-[10px] font-black whitespace-nowrap border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/5'}`}>{cat}</button>
          ))}
        </div>

        {/* Product Grid - FIXED IMAGE DISPLAY */}
        <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (!showOnlyMyAds || p.user_id === user?.id)).map(product => (
              <motion.div layout key={product.id} className="group bg-neutral-900/40 rounded-[2rem] overflow-hidden border border-white/5 relative shadow-2xl hover:border-amber-500/30 transition-all h-full flex flex-col">
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-neutral-800">
                  <img src={product.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-3 left-3 bg-red-600/90 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-2xl z-30">✕</button>
                )}
                <div className="p-4 md:p-6 text-center flex-grow flex flex-col justify-center">
                  <h3 className="font-black text-[11px] md:text-sm truncate opacity-70 uppercase mb-2">{product.name}</h3>
                  <p className="text-amber-500 font-black text-xs md:text-base">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* Product Details (Mazaia) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-6 right-6 z-[310] bg-white/10 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl">✕</button>
            <div className="max-w-6xl mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-8 mt-16 md:mt-24">
              <div className="lg:w-1/2 space-y-4">
                <div className="aspect-square bg-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
                  <img src={selectedProduct.image_url} className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                  {selectedProduct.images?.map((img: string, i: number) => (
                    <img key={i} src={img} className="w-20 h-20 rounded-2xl object-cover cursor-pointer border-2 border-white/5 hover:border-amber-500" onClick={() => setSelectedProduct({...selectedProduct, image_url: img})} />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h2 className="text-4xl md:text-6xl font-black italic">{selectedProduct.name}</h2>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                  <p className="text-amber-500 text-3xl font-black mb-4">{selectedProduct.price} {t.price}</p>
                  <p className="opacity-60 leading-relaxed text-sm md:text-lg">{selectedProduct.description}</p>
                </div>
                <div className="flex justify-between gap-4">
                    <div className="bg-white/5 p-4 rounded-xl flex-1 text-center font-black text-[10px] uppercase opacity-40">{t.seller}: {selectedProduct.seller_name}</div>
                    <div className="bg-white/5 p-4 rounded-xl flex-1 text-center font-black text-[10px] uppercase opacity-40">{t.location} {selectedProduct.location}</div>
                </div>
                <a href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" className="block bg-[#25D366] text-black text-center py-5 rounded-[2rem] font-black text-xl shadow-2xl">{t.wa}</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Form - FIXED IMAGE PICKER */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-6 md:p-10 rounded-[3rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto relative">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl">✕</button>
              <h2 className="text-xl font-black italic text-amber-500 mb-8 uppercase text-center">{t.addTitle}</h2>
              <div className="space-y-4">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] text-center relative">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFiles(e.target.files)} />
                    <p className="text-xs font-black uppercase tracking-widest opacity-40">
                        {imageFiles ? `✅ ${imageFiles.length} Photos Selected` : t.uploadImg}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t.seller} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                    <input type="text" placeholder="Product Name" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <textarea placeholder="Description..." rows={3} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Price" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES[lang].slice(1).map((c, i) => <option key={i} value={CATEGORIES.ar[i+1]}>{c}</option>)}
                  </select>
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES[lang].map((m, i) => <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                  {isActionLoading ? "Uploading & Publishing..." : t.publish}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 relative text-center">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/20 text-xl">✕</button>
              <h2 className="text-2xl font-black mb-8 italic text-amber-500 tracking-tighter uppercase text-center">Mila Store</h2>
              <div className="space-y-4">
                <input dir="ltr" type="email" placeholder="Email" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setEmail(e.target.value)} />
                <input dir="ltr" type="password" placeholder="Password" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleAuth} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                  {isSignUp ? 'Sign Up' : 'Login'}
                </button>
              </div>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[9px] font-black text-amber-500/60 mt-6 underline uppercase tracking-widest block mx-auto">{isSignUp ? 'Login' : 'Create account'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-10 rounded-[3rem] text-center shadow-2xl max-w-xs w-full">
              <div className="text-5xl mb-6">⚠️</div>
              <h2 className="text-lg font-black italic mb-8 uppercase tracking-tighter">{t.delTitle}</h2>
              <button onClick={forceDelete} className="bg-red-600 text-white w-full py-4 rounded-2xl font-black mb-3 uppercase tracking-widest text-[10px]">
                {isActionLoading ? "..." : t.confirm}
              </button>
              <button onClick={() => setProductToDelete(null)} className="text-white/20 font-black text-[9px] uppercase tracking-widest">✕ {t.cancel}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}