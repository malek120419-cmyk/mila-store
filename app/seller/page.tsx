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
    search: "بحث...", sell: "بيع +", login: "دخول", logout: "خروج", myAds: "إعلاناتي",
    price: "دج", seller: "البائع", location: "📍", wa: "واتساب", delTitle: "حذف نهائي؟",
    confirm: "نعم", cancel: "لا", addTitle: "إضافة منتج", publish: "نشر الآن", uploadImg: "اختر الصور"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", myAds: "My Ads",
    price: "DZD", seller: "Seller", location: "📍", wa: "WhatsApp", delTitle: "Delete?",
    confirm: "Yes", cancel: "No", addTitle: "Add Product", publish: "Publish", uploadImg: "Upload"
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
    setProducts(prev => prev.filter(p => p.id !== productToDelete));
    await supabase.from('products').delete().match({ id: productToDelete, user_id: user.id });
    setProductToDelete(null);
    setSelectedProduct(null);
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFiles || imageFiles.length === 0) return alert("الرجاء ملئ البيانات واختيار صورة");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}_${i}.jpg`;
        const { error: upErr } = await supabase.storage.from('mila-market-assests').upload(fileName, file);
        if (upErr) throw upErr;
        const publicUrl = supabase.storage.from('mila-market-assests').getPublicUrl(fileName).data.publicUrl;
        uploadedUrls.push(publicUrl);
      }

      // محاولة النشر بدون عمود الوصف أولاً لتجنب الخطأ الذي ظهر في الصورة
      const productData: any = {
        name: formData.name,
        seller_name: formData.seller_name,
        price: parseFloat(formData.price) || 0,
        whatsapp: formData.whatsapp,
        location: formData.location,
        category: formData.category,
        image_url: uploadedUrls[0],
        images: uploadedUrls,
        user_id: user?.id
      };

      const { error: insErr } = await supabase.from('products').insert([productData]);

      if (insErr) {
        // إذا فشل بسبب "description" سنحاول إرسال البيانات بدونه تماماً
        console.log("Retrying without description column...");
        delete productData.description;
        const { error: retryErr } = await supabase.from('products').insert([productData]);
        if (retryErr) throw retryErr;
      }

      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح! ✅");
    } catch (e: any) {
      alert("عذراً، حدث خطأ: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAuth = async () => {
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else setShowAuthModal(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar - Simplified and Spaced for Mobile */}
      <nav className="p-4 sticky top-0 z-[100] backdrop-blur-xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-3 items-center">
          {user && <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black">✕</button>}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-90 transition-transform">{t.sell}</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Categories - Extra Spacing for Mobile Fingers */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {CATEGORIES[lang].map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(CATEGORIES.ar[i])} className={`px-6 py-2 rounded-full text-[10px] font-black whitespace-nowrap border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/5'}`}>{cat}</button>
          ))}
        </div>

        {/* Product Grid - FIXED IMAGE (CONTAIN) */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory)).map(product => (
              <motion.div layout key={product.id} className="bg-neutral-900/40 rounded-[2rem] overflow-hidden border border-white/5 relative shadow-xl flex flex-col h-full">
                <div onClick={() => setSelectedProduct(product)} className="aspect-square bg-black flex items-center justify-center cursor-pointer overflow-hidden">
                  <img src={product.image_url} className="max-w-full max-h-full object-contain hover:scale-105 transition-transform" />
                </div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-2 left-2 bg-red-600 w-7 h-7 rounded-full text-white text-[10px] flex items-center justify-center">✕</button>
                )}
                <div className="p-4 text-center">
                  <h3 className="font-black text-[10px] truncate opacity-60 uppercase">{product.name}</h3>
                  <p className="text-amber-500 font-black text-xs mt-1">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals (All with X Close) --- */}

      {/* Product Details */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-2xl overflow-y-auto flex flex-col items-center">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 text-white text-3xl p-4">✕</button>
            <div className="w-full max-w-4xl p-6 mt-20 space-y-6">
              <div className="aspect-square bg-neutral-900 rounded-[2rem] overflow-hidden flex items-center justify-center">
                <img src={selectedProduct.image_url} className="max-w-full max-h-full object-contain" />
              </div>
              <h2 className="text-3xl font-black text-center">{selectedProduct.name}</h2>
              <div className="bg-white/5 p-6 rounded-3xl text-center">
                <p className="text-amber-500 text-2xl font-black mb-2">{selectedProduct.price} {t.price}</p>
                <p className="opacity-50 text-sm">{selectedProduct.description || "لا يوجد وصف"}</p>
              </div>
              <a href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" className="block bg-[#25D366] text-black text-center py-5 rounded-[2rem] font-black text-xl shadow-2xl">{t.wa}</a>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Form - FIXED TO PREVENT DESCRIPTION ERROR */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-6 rounded-[3rem] w-full max-w-lg border border-white/10 relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-white/30 text-2xl p-2">✕</button>
              <h2 className="text-center font-black text-amber-500 mb-6 uppercase tracking-tighter italic">إضافة منتج جديد</h2>
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl text-center relative bg-white/[0.02]">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFiles(e.target.files)} />
                    <p className="text-[10px] font-black uppercase opacity-40">{imageFiles ? "✅ الصورة جاهزة" : "اضغط هنا لرفع الصورة"}</p>
                </div>
                <input type="text" placeholder="اسمك" className="w-full p-4 rounded-2xl bg-white/5 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-2xl bg-white/5 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="number" placeholder="السعر" className="w-full p-4 rounded-2xl bg-white/5 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                <input type="tel" placeholder="رقم الواتساب" className="w-full p-4 rounded-2xl bg-white/5 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                    <select className="p-4 rounded-2xl bg-neutral-900 border border-white/5 text-[10px] font-black" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.ar.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <select className="p-4 rounded-2xl bg-neutral-900 border border-white/5 text-[10px] font-black" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                        {MUNICIPALITIES.ar.map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                </div>

                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase text-xs active:scale-95 transition-transform">
                  {isActionLoading ? "... جاري النشر" : t.publish}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Auth Modals with X close */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 relative text-center">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/20 text-xl p-2">✕</button>
            <h2 className="text-xl font-black mb-8 text-amber-500 italic">MILA STORE</h2>
            <div className="space-y-4">
              <input dir="ltr" type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-white/5 outline-none text-center border border-white/5" onChange={(e) => setEmail(e.target.value)} />
              <input dir="ltr" type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-white/5 outline-none text-center border border-white/5" onChange={(e) => setPassword(e.target.value)} />
              <button onClick={handleAuth} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px]">دخول / تسجيل</button>
            </div>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98">
          <div className="bg-[#0f0f0f] border border-red-500/20 p-10 rounded-[3rem] text-center shadow-2xl max-w-xs w-full relative">
            <button onClick={() => setProductToDelete(null)} className="absolute top-4 right-4 text-white/20 text-xl p-2">✕</button>
            <h2 className="text-sm font-black mb-6 uppercase">هل أنت متأكد من الحذف؟</h2>
            <button onClick={forceDelete} className="bg-red-600 text-white w-full py-4 rounded-2xl font-black mb-3 text-[10px] uppercase">نعم، احذف</button>
          </div>
        </div>
      )}

    </div>
  );
}