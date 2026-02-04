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
    search: "ابحث عن منتج في ميلة...", sell: "بيع منتج +", login: "دخول", logout: "خروج", myAds: "إعلاناتي", allAds: "الكل",
    price: "دج", seller: "البائع", location: "📍 الموقع", desc: "الوصف", wa: "واتساب", delTitle: "حذف نهائي؟",
    confirm: "نعم، احذف", cancel: "إلغاء", addTitle: "إضافة منتج", pName: "الاسم", pPrice: "السعر", pWa: "واتساب",
    pDesc: "الوصف", pCat: "الفئة", pLoc: "البلدية", pSeller: "اسم البائع", publish: "نشر الآن", uploadImg: "اختر صور (يمكن اختيار متعدد)"
  },
  en: {
    search: "Search in Mila...", sell: "Sell +", login: "Login", logout: "Logout", myAds: "My Ads", allAds: "All",
    price: "DZD", seller: "Seller", location: "📍 Location", desc: "Description", wa: "WhatsApp", delTitle: "Delete?",
    confirm: "Yes, Delete", cancel: "Cancel", addTitle: "Add Product", pName: "Name", pPrice: "Price", pWa: "WhatsApp",
    pDesc: "Description", pCat: "Category", pLoc: "Location", pSeller: "Seller Name", publish: "Publish", uploadImg: "Upload Images (Select Multiple)"
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

  // --- دالة الحذف القوية جداً ---
  const forceDelete = async () => {
    if (!productToDelete || !user) return;
    setIsActionLoading(true);
    
    // 1. حذف محلي فوري (لراحة المستخدم)
    const backupProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== productToDelete));

    try {
      // 2. طلب حذف صريح من قاعدة البيانات
      const { error, count } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete)
        .eq('user_id', user.id); // التأكد أن الحاذف هو صاحب المنتج

      if (error) throw error;

      // 3. نجاح الحذف
      setProductToDelete(null);
      setSelectedProduct(null);
      console.log("Deleted successfully");
    } catch (e: any) {
      alert("خطأ في الحذف: " + e.message);
      setProducts(backupProducts); // استرجاع المنتجات في حال فشل السيرفر
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFiles || imageFiles.length === 0) return alert("Please select images");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}-${i}.jpg`;
        await supabase.storage.from('mila-market-assests').upload(fileName, file);
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;
        uploadedUrls.push(url);
      }

      await supabase.from('products').insert([{
        ...formData, 
        price: parseFloat(formData.price), 
        image_url: uploadedUrls[0],
        images: uploadedUrls,
        user_id: user?.id, 
        user_email: user?.email
      }]);

      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse tracking-tighter uppercase">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'} transition-all`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-white/5 px-4 py-2 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest">{lang === 'ar' ? 'English' : 'العربية'}</button>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
             <div className="flex items-center gap-4">
                <button onClick={() => { setShowOnlyMyAds(!showOnlyMyAds); }} className={`text-[10px] font-black uppercase ${showOnlyMyAds ? 'text-amber-500' : 'opacity-40'}`}>{t.myAds}</button>
                <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black uppercase">{t.logout}</button>
             </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40">{t.login}</button>
          )}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-xl">{t.sell}</button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <input type="text" placeholder={t.search} className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/5 outline-none text-center font-bold shadow-2xl" onChange={(e) => setSearchQuery(e.target.value)} />
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(CATEGORIES.ar[i])} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black shadow-lg' : 'bg-white/5'}`}>{cat}</button>
          ))}
        </div>

        <main className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatePresence>
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (!showOnlyMyAds || p.user_id === user?.id)).map(product => (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={product.id} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-xl hover:border-amber-500/40 transition-all">
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-4 left-4 bg-red-600 p-2 rounded-full text-white shadow-xl z-30 hover:scale-125 transition-transform">🗑️</button>
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

      {/* Product Details */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl overflow-y-auto p-6">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-8 right-8 z-[310] bg-white/10 text-white w-12 h-12 rounded-full text-xl font-black">✕</button>
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 mt-10">
              <div className="lg:w-1/2 space-y-4">
                <img src={selectedProduct.image_url} className="w-full aspect-square object-cover rounded-[3rem] shadow-2xl border border-white/5" />
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images?.map((img: string, i: number) => (
                    <img key={i} src={img} className="w-20 h-20 rounded-xl object-cover border border-white/10 cursor-pointer hover:border-amber-500" onClick={() => setSelectedProduct({...selectedProduct, image_url: img})} />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h2 className="text-5xl font-black italic tracking-tighter">{selectedProduct.name}</h2>
                <p className="text-amber-500 text-3xl font-black">{selectedProduct.price} {t.price}</p>
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 italic opacity-80 text-lg leading-relaxed">{selectedProduct.description}</div>
                <div className="flex justify-between font-black text-[10px] opacity-40 uppercase bg-white/5 p-5 rounded-2xl tracking-widest">
                  <span>{t.seller}: {selectedProduct.seller_name}</span>
                  <span>{t.location}: {selectedProduct.location}</span>
                </div>
                <a href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" className="block bg-[#25D366] text-black text-center py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-transform">{t.wa} ✨</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0a0a0a] p-8 rounded-[3rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black italic text-amber-500 mb-8 uppercase text-center tracking-tighter">{t.addTitle}</h2>
              <div className="space-y-4">
                <label className="h-32 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.02] cursor-pointer hover:border-amber-500/50 transition-all">
                   <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setImageFiles(e.target.files)} />
                   <p className="opacity-40 font-black text-[10px] uppercase text-center">{imageFiles ? `${imageFiles.length} Images Ready ✅` : t.uploadImg}</p>
                </label>
                <input type="text" placeholder={t.pSeller} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder={t.pName} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder={t.pDesc} rows={3} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder={t.pPrice} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder={t.pWa} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES[lang].slice(1).map((c, i) => <option key={i} value={CATEGORIES.ar[i+1]}>{c}</option>)}
                  </select>
                  <select className="p-4 rounded-xl bg-neutral-900 border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES[lang].map((m, i) => <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl hover:bg-amber-400 transition-colors uppercase tracking-widest text-sm">{isActionLoading ? "Publishing..." : t.publish}</button>
                <button onClick={() => setShowAddForm(false)} className="w-full py-2 text-white/10 font-black text-[9px] uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
            <div className="bg-[#0a0a0a] p-12 rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-black mb-10 italic text-amber-500 tracking-tighter">MILA STORE</h2>
              <div className="space-y-4">
                <input dir="ltr" type="email" placeholder="Email Address" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setEmail(e.target.value)} />
                <input dir="ltr" type="password" placeholder="Password" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleAuth} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">{isSignUp ? 'Sign Up' : 'Login'}</button>
              </div>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-amber-500/60 mt-8 underline">{isSignUp ? 'Have an account? Login' : 'New here? Create account'}</button>
              <button onClick={() => setShowAuthModal(false)} className="text-white/10 text-[9px] mt-6 block mx-auto uppercase tracking-tighter">Close</button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-12 rounded-[4rem] text-center shadow-2xl max-w-xs w-full">
              <div className="text-6xl mb-6">⚠️</div>
              <h2 className="text-xl font-black italic mb-10 uppercase tracking-tighter">{t.delTitle}</h2>
              <button onClick={forceDelete} disabled={isActionLoading} className="bg-red-600 text-white w-full py-5 rounded-3xl font-black mb-4 shadow-xl shadow-red-500/10 uppercase tracking-widest text-xs">
                {isActionLoading ? "Deleting..." : t.confirm}
              </button>
              <button onClick={() => setProductToDelete(null)} className="text-white/20 font-black text-[10px] uppercase tracking-widest">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}