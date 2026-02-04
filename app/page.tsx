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
    wa: "تواصل واتساب", addTitle: "إضافة منتج جديد", publish: "نشر الآن", rate: "تقييم",
    mustLogin: "يرجى تسجيل الدخول أولاً!", authTitle: "مرحباً بك في ميلة ستور", signUp: "إنشاء حساب", signIn: "تسجيل الدخول"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", price: "DZD", 
    wa: "WhatsApp", addTitle: "Add Product", publish: "Publish", rate: "Rate",
    mustLogin: "Login required!", authTitle: "Welcome to Mila Store", signUp: "Sign Up", signIn: "Sign In"
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleAuth = async () => {
    setIsActionLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else setShowAuthModal(false);
    setIsActionLoading(false);
  };

  const protectedAction = (action: () => void) => {
    if (!user) setShowAuthModal(true);
    else action();
  };

  const handlePublish = async () => {
    if (!imageFiles || !formData.name) return alert("البيانات ناقصة!");
    setIsActionLoading(true);
    try {
      const file = imageFiles[0];
      const fileName = `${Date.now()}-${file.name}`;
      await supabase.storage.from('mila-market-assests').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);

      await supabase.from('products').insert([{ ...formData, price: parseFloat(formData.price), image_url: publicUrl, user_id: user?.id }]);
      setShowAddForm(false);
      fetchProducts();
    } catch (e: any) { alert(e.message); }
    setIsActionLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-4 md:p-6 sticky top-0 z-[200] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <div className="flex items-center gap-4">
          <motion.h1 whileHover={{ scale: 1.05 }} className="text-xl md:text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></motion.h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-amber-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-transform shadow-lg">{lang === 'ar' ? 'EN' : 'AR'}</motion.button>
        </div>

        <div className="flex gap-4 items-center">
          <motion.button whileHover={{ rotate: 180, scale: 1.2 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl p-2 bg-white/5 rounded-full">{isDarkMode ? '🌞' : '🌚'}</motion.button>
          
          {user ? (
            <motion.button whileHover={{ color: '#ef4444' }} onClick={() => supabase.auth.signOut()} className="text-[10px] font-black uppercase">✕ خروج</motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40">{t.login}</motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245,158,11,0.5)" }} whileTap={{ scale: 0.95 }}
            onClick={() => protectedAction(() => setShowAddForm(true))}
            className="bg-amber-500 text-black px-6 py-2.5 rounded-full font-black text-xs uppercase shadow-xl z-[210]"
          >
            {t.sell}
          </motion.button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <input 
            type="text" placeholder={t.search} 
            className={`w-full p-6 md:p-8 rounded-[2.5rem] border-none outline-none text-center font-bold shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 focus:bg-white/10' : 'bg-white focus:shadow-amber-500/10'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          {CATEGORIES[lang].map((cat, i) => (
            <motion.button 
              key={i} whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }}
              onClick={() => setActiveCategory(CATEGORIES.ar[i])}
              className={`px-8 py-3 rounded-full text-[11px] font-black border transition-all ${activeCategory === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500 shadow-xl' : 'bg-white/5 border-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <motion.div 
                layout key={product.id} className="group relative bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col hover:border-amber-500/30 transition-all"
              >
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-black relative">
                  <motion.img whileHover={{ scale: 1.1 }} src={product.image_url} className="w-full h-full object-cover" loading="eager" />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black">⭐ 4.9</div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-black text-[11px] truncate opacity-50 uppercase mb-2 tracking-tighter">{product.name}</h3>
                  <p className="text-amber-500 font-black text-sm">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals --- */}
      
      {/* 🔐 Beautiful Auth Modal (Back & Better) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0a] p-10 md:p-14 rounded-[3.5rem] w-full max-w-md border border-white/10 relative text-center shadow-2xl">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-8 right-8 text-white/20 text-2xl hover:text-white">✕</button>
              <h2 className="text-3xl font-black mb-4 italic text-amber-500 tracking-tighter uppercase">{t.authTitle}</h2>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-10">{isSignUp ? 'أنشئ حسابك الآن' : 'سجل دخولك للمواصلة'}</p>
              
              <div className="space-y-4">
                <input type="email" placeholder="Email" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/50 transition-all" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/50 transition-all" onChange={(e) => setPassword(e.target.value)} />
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAuth} disabled={isActionLoading}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mt-4"
                >
                  {isActionLoading ? "جاري العملية..." : (isSignUp ? t.signUp : t.signIn)}
                </motion.button>
              </div>
              
              <button onClick={() => setIsSignUp(!isSignUp)} className="mt-8 text-[10px] font-black text-amber-500/60 uppercase tracking-widest underline italic">
                {isSignUp ? 'لديك حساب؟ دخول' : 'ليس لديك حساب؟ سجل هنا'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📝 Full Add Product Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] p-8 md:p-12 rounded-[3rem] w-full max-w-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto shadow-2xl shadow-amber-500/5">
              <button onClick={() => setShowAddForm(false)} className="absolute top-8 right-8 text-white/30 text-2xl">✕</button>
              <h2 className="text-2xl font-black text-amber-500 mb-10 text-center uppercase italic tracking-tighter">{t.addTitle}</h2>
              <div className="space-y-4">
                <div className="p-10 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] text-center relative hover:border-amber-500/40 transition-all">
                   <input type="file" onChange={(e) => setImageFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="text-[10px] font-black uppercase opacity-40">{imageFiles ? `✅ تم اختيار ${imageFiles.length}` : 'إضغط لرفع صور المنتج'}</p>
                </div>
                <input type="text" placeholder="ماذا تبيع؟" className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 font-bold outline-none focus:border-amber-500/30" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/5 font-black text-xs" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.ar.slice(1).map((c, i) => <option key={i} value={c}>{CATEGORIES[lang][i+1]}</option>)}
                  </select>
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/5 font-black text-xs" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.ar.map((m, i) => <option key={i} value={m}>{MUNICIPALITIES[lang][i]}</option>)}
                  </select>
                </div>
                <textarea placeholder="أضف وصفاً جذاباً لمنتجك..." rows={4} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر (دج)" className="p-5 rounded-2xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الواتساب" className="p-5 rounded-2xl bg-white/5 border border-white/5 font-bold outline-none" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs mt-6">
                  {isActionLoading ? "جاري النشر..." : t.publish}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⭐ Interactive Product Details & Rating */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-3xl p-4 overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-8 right-8 z-[610] bg-white/10 w-12 h-12 rounded-full text-white text-xl flex items-center justify-center transition-transform hover:rotate-90">✕</button>
            <div className="max-w-5xl mx-auto mt-20 flex flex-col items-center pb-20">
              <div className="w-full max-w-xl aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 relative">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-12 text-center space-y-8 w-full max-w-2xl px-6">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">{selectedProduct.name}</h2>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-3">
                    {[1,2,3,4,5].map(star => (
                      <motion.button 
                        key={star} whileHover={{ scale: 1.4, rotate: 10 }} whileTap={{ scale: 0.8 }}
                        onClick={() => protectedAction(() => setUserRating(star))}
                        className={`text-4xl transition-all ${userRating >= star ? 'drop-shadow-[0_0_10px_#f59e0b]' : 'grayscale opacity-20'}`}
                      >
                        ⭐
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em]">إضغط للتقييم</p>
                </div>

                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                  <div className="flex justify-between mb-8 text-[10px] font-black text-amber-500/40 uppercase italic tracking-widest">
                    <span>📍 {selectedProduct.location}</span>
                    <span>📁 {selectedProduct.category}</span>
                  </div>
                  <p className="text-amber-500 text-4xl font-black mb-6">{selectedProduct.price} {t.price}</p>
                  <p className="opacity-60 text-lg leading-relaxed">{selectedProduct.description || "تواصل مع البائع للحصول على المزيد من التفاصيل حول هذا المنتج الرائع في ولاية ميلة."}</p>
                </div>
                
                <motion.a 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(37,211,102,0.3)" }} whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank"
                  className="block bg-[#25D366] text-black py-7 rounded-[2.5rem] font-black text-2xl shadow-2xl"
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