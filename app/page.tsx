"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "التلاغمة", "وادي العثمانية", "زغاية", "القرارم قوقة", "سيدي مروان", "مشديرة"];
const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"];

const TRANSLATIONS = {
  ar: {
    logo: "ميلة", logo2: "ستور", search: "ابحث عن منتج...", add: "بيع +",
    login: "دخول", logout: "خروج", myAds: "منتجاتي", all: "الكل",
    price: "دج", delete: "حذف نهائي؟", cancel: "إلغاء", confirm: "تأكيد"
  },
  en: {
    logo: "MILA", logo2: "STORE", search: "Search products...", add: "Sell +",
    login: "Login", logout: "Logout", myAds: "My Ads", all: "All",
    price: "DZD", delete: "Delete Forever?", cancel: "Cancel", confirm: "Confirm"
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

  useEffect(() => {
    fetchProducts();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
      .subscribe();

    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => { supabase.removeChannel(channel); subscription.unsubscribe(); };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const handleAuth = async () => {
    setAuthError('');
    if (!email || !password) return setAuthError('Missing fields');
    setIsActionLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) setAuthError(error.message);
    else { setShowAuthModal(false); setEmail(''); setPassword(''); }
    setIsActionLoading(false);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !user) return;
    setIsActionLoading(true);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .match({ id: productToDelete, user_id: user.id });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !imageFile) return alert("Missing data");
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
    } catch (e) { alert("Error uploading"); } finally { setIsActionLoading(false); }
  };

  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'} transition-all`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <motion.h1 whileHover={{ scale: 1.05 }} className="text-2xl font-black italic tracking-tighter">
            {t.logo} <span className="text-amber-500 font-normal">{t.logo2}</span>
          </motion.h1>
          <motion.button 
            whileHover={{ rotate: 15 }} 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="bg-white/5 p-2 rounded-lg text-lg grayscale hover:grayscale-0 transition-all"
          >
            🌐
          </motion.button>
        </div>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xs">
                {user.email[0].toUpperCase()}
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 mt-4 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-2 z-[200]">
                    <button onClick={() => { setShowOnlyMyAds(!showOnlyMyAds); setShowSettings(false); }} className="w-full text-right p-4 hover:bg-white/5 rounded-xl text-[11px] font-black">
                      {showOnlyMyAds ? t.all : t.myAds}
                    </button>
                    <button onClick={() => supabase.auth.signOut()} className="w-full text-right p-4 text-red-500 hover:bg-red-500/10 rounded-xl text-[11px] font-black">{t.logout}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40 hover:opacity-100">{t.login}</button>
          )}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-lg shadow-amber-500/20">{t.add}</button>
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
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${activeCategory === cat ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border border-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <main className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {products.filter(p => (activeCategory === 'الكل' || p.category === activeCategory) && p.name.includes(searchQuery) && (!showOnlyMyAds || p.user_id === user?.id)).map(product => (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={product.id} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-xl">
                <div onClick={() => setSelectedProduct(product)} className="aspect-square relative cursor-pointer overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                {user?.id === product.user_id && (
                  <button onClick={() => setProductToDelete(product.id)} className="absolute top-4 left-4 bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-125 transition-transform">🗑️</button>
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

      {/* Auth Modal - FIXED INPUTS */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-12 rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl text-center">
              <h2 className="text-2xl font-black mb-10 italic text-amber-500">MILA STORE</h2>
              {authError && <p className="text-red-500 text-[10px] mb-4 font-bold">{authError}</p>}
              <div className="space-y-4">
                <input 
                  type="email" 
                  autoComplete="email"
                  dir="ltr"
                  placeholder="Email Address" 
                  className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 text-center font-bold text-white focus:border-amber-500/30 outline-none" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                  type="password" 
                  dir="ltr"
                  placeholder="Password" 
                  className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 text-center font-bold text-white focus:border-amber-500/30 outline-none" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button onClick={handleAuth} disabled={isActionLoading} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  {isActionLoading ? '...' : (isSignUp ? 'Sign Up' : 'Login')}
                </button>
              </div>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] text-amber-500/60 mt-8 block mx-auto underline italic font-black">
                {isSignUp ? 'Login instead' : 'Create account'}
              </button>
              <button onClick={() => setShowAuthModal(false)} className="text-white/10 text-[9px] mt-6 font-black uppercase">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation - FIXED */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-12 rounded-[4rem] max-w-md w-full text-center shadow-2xl">
              <div className="text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-black italic mb-4">{t.delete}</h2>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} disabled={isActionLoading} className="bg-red-500 text-white py-5 rounded-3xl font-black text-lg">
                  {isActionLoading ? '...' : t.confirm}
                </button>
                <button onClick={() => setProductToDelete(null)} className="text-white/20 py-4 font-black text-[10px] uppercase">{t.cancel}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details & Form (Hidden for brevity, they use the same lang logic) */}
      <AnimatePresence>
        {showAddForm && (
           <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[4rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black italic text-amber-500 mb-8 uppercase text-center">{t.add}</h2>
              <div className="space-y-4">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-[10px] opacity-50" />
                <input type="text" placeholder="Product Name" className="w-full p-5 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="number" placeholder="Price" className="w-full p-5 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl shadow-xl">{isActionLoading ? '...' : 'Publish'}</button>
                <button onClick={() => setShowAddForm(false)} className="w-full py-2 text-white/20 font-black text-[9px] uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}