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

export default function MilaStore() {
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
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', seller_name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات', description: '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel('realtime_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') setProducts((prev) => prev.filter(p => p.id !== payload.old.id));
        else if (payload.eventType === 'INSERT') setProducts((prev) => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setProducts((prev) => prev.map(p => p.id === payload.new.id ? payload.new : p));
      })
      .subscribe();

    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => { supabase.removeChannel(channel); subscription.unsubscribe(); };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 900;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
        };
      };
    });
  };

  const handleAuth = async () => {
    setAuthError('');
    if (!email.includes('@')) return setAuthError('بريد إلكتروني غير صحيح');
    setIsActionLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setAuthError(error.message);
    else { setShowAuthModal(false); setEmail(''); setPassword(''); }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.price || !imageFile) return alert("يرجى إكمال البيانات والصورة");
    setIsActionLoading(true);
    try {
      const compressedBlob = await compressImage(imageFile);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      await supabase.storage.from('mila-market-assests').upload(fileName, compressedBlob);
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;
      await supabase.from('products').insert([{
        ...formData, price: parseFloat(formData.price), image_url: publicUrl,
        user_id: user?.id, user_email: user?.email, rating_sum: 0, rating_count: 0
      }]);
      setShowAddForm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) { alert("خطأ في النشر"); } finally { setIsActionLoading(false); }
  };

  const confirmDelete = async () => {
    if (!productToDelete || !user) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', productToDelete).eq('user_id', user.id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMyAds = showOnlyMyAds ? p.user_id === user?.id : true;
    return matchesCategory && matchesSearch && matchesMyAds;
  });

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse tracking-tighter uppercase">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'} transition-colors duration-500 selection:bg-amber-500/30`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <motion.h1 whileHover={{ scale: 1.05 }} className="text-2xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500 font-normal">STORE</span></motion.h1>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)" }} whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xs shadow-lg"
              >
                {user.email[0].toUpperCase()}
              </motion.button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute left-0 mt-4 w-48 bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl p-2 z-[200]">
                    <button onClick={() => { setShowOnlyMyAds(!showOnlyMyAds); setShowSettings(false); }} className={`w-full text-right p-4 rounded-xl text-[11px] font-black transition-all ${showOnlyMyAds ? 'bg-amber-500 text-black' : 'hover:bg-white/5'}`}>
                      {showOnlyMyAds ? '📦 عرض الكل' : '📦 منتجاتي'}
                    </button>
                    <button onClick={() => supabase.auth.signOut()} className="w-full text-right p-4 hover:bg-red-500/10 text-red-500 rounded-xl text-[11px] font-black mt-1 transition-all">🚪 خروج</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">دخول</motion.button>
          )}
          <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-xl shadow-amber-500/10">بيع +</motion.button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl mx-auto">
          <input 
            type="text" placeholder="ابحث في ميلة..." 
            className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-bold text-center shadow-2xl" 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </motion.div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar w-full justify-start md:justify-center">
          {CATEGORIES.map(cat => (
            <motion.button 
              whileHover={{ y: -3 }} key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-6 py-2 rounded-full text-[10px] font-black flex-shrink-0 transition-all ${activeCategory === cat ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border border-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <main className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                key={product.id} onClick={() => setSelectedProduct(product)} 
                className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-xl relative hover:border-amber-500/30 transition-all duration-500"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                  {user?.id === product.user_id && (
                    <motion.button whileHover={{ scale: 1.2, backgroundColor: "#ef4444" }} onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-4 left-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white shadow-xl z-20">🗑️</motion.button>
                  )}
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-black text-sm truncate opacity-80">{product.name}</h3>
                  <p className="text-amber-500 font-black mt-1 text-xs">{product.price} دج</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Auth Modal: حل مشكلة اتجاه الإيميل هنا --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] p-12 rounded-[4rem] w-full max-w-sm border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
              <h2 className="text-2xl font-black mb-10 italic text-amber-500 tracking-tighter uppercase">Mila Store</h2>
              {authError && <p className="bg-red-500/10 text-red-500 text-[10px] p-3 rounded-xl mb-6 font-bold">{authError}</p>}
              
              <div className="space-y-4">
                {/* الإيميل: إجباري يكون LTR (من اليسار لليمين) */}
                <input 
                  dir="ltr" 
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/30 transition-all placeholder:text-center placeholder:font-black" 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                
                {/* الباسوورد: إجباري يكون LTR */}
                <input 
                  dir="ltr" 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center border border-white/5 focus:border-amber-500/30 transition-all placeholder:text-center placeholder:font-black" 
                  onChange={(e) => setPassword(e.target.value)} 
                />

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAuth} className="w-full bg-white text-black py-6 rounded-2xl font-black shadow-xl uppercase tracking-widest text-[10px]">
                  {isSignUp ? 'أنشاء حساب' : 'دخول'}
                </motion.button>
              </div>

              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-amber-500/60 mt-8 block mx-auto underline italic">
                {isSignUp ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ اشترك'}
              </button>
              <button onClick={() => setShowAuthModal(false)} className="text-white/10 text-[9px] mt-6 font-black uppercase">إغلاق</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Details & Other Modals... (Keep same logic) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black overflow-y-auto">
            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => setSelectedProduct(null)} className="fixed top-8 right-8 z-[310] bg-white/10 backdrop-blur-2xl text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </motion.button>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 40 }} className={`min-h-screen w-full ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-6 md:p-20`}>
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
                <div className="w-full lg:w-1/2 shadow-2xl rounded-[3.5rem] overflow-hidden bg-neutral-900">
                   <img src={selectedProduct.image_url} className="w-full aspect-square object-cover" />
                </div>
                <div className="space-y-8 flex-1">
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight">{selectedProduct.name}</h2>
                  <p className="text-amber-500 text-4xl font-black">{selectedProduct.price} دج</p>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 italic opacity-80 leading-relaxed text-lg">{selectedProduct.description}</div>
                  <div className="flex justify-between font-black text-[10px] opacity-40 uppercase tracking-widest px-2"><span>البائع: {selectedProduct.seller_name}</span><span>📍 {selectedProduct.location}</span></div>
                  <motion.a whileHover={{ scale: 1.02 }} href={`https://wa.me/${selectedProduct.whatsapp}`} className="block bg-[#25D366] text-black text-center py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/10">واتساب ✨</motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success View */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-center">
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
               <div className="text-9xl mb-6">✨</div>
               <h2 className="text-4xl font-black italic uppercase text-amber-500">Done</h2>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-12 rounded-[4rem] max-w-md w-full text-center shadow-2xl">
              <div className="text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-black italic mb-4">حذف المنتج؟</h2>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="bg-red-500 text-white py-5 rounded-3xl font-black text-lg">حذف نهائي</button>
                <button onClick={() => setProductToDelete(null)} className="text-white/20 py-4 font-black text-[10px] uppercase">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[4rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black italic text-amber-500 tracking-tighter uppercase">منتج جديد</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/20 text-3xl">✕</button>
              </div>
              <div className="space-y-5">
                <label className="h-48 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center relative bg-white/[0.02] cursor-pointer hover:border-amber-500/50 transition-all overflow-hidden">
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                   {imageFile ? <p className="text-amber-500 font-black text-xs uppercase">الصورة جاهزة ✅</p> : <p className="opacity-20 font-black text-[9px] uppercase tracking-widest">اضغط لرفع الصورة</p>}
                </label>
                <input type="text" placeholder="اسم البائع" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30 transition-all" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder="عنوان الإعلان" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30 transition-all" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="الوصف..." rows={3} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold focus:border-amber-500/30 transition-all" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-6 rounded-2xl bg-[#111] border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="p-6 rounded-2xl bg-[#111] border border-white/5 font-bold text-xs" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePublish} className="w-full py-7 bg-amber-500 text-black font-black rounded-[2.5rem] text-xl shadow-2xl">نشر الآن</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}