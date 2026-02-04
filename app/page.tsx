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

  // --- دالة ضغط الصور الأساسية ---
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleLogin = async () => {
    setIsActionLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) await supabase.auth.signUp({ email, password });
    setShowAuthModal(false);
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.price || !imageFile || !formData.seller_name) return alert("يرجى ملء كافة الخانات");
    if (!/^(05|06|07)\d{8}$/.test(formData.whatsapp)) return alert("رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05، 06، أو 07 ويتكون من 10 أرقام)");
    
    setIsActionLoading(true);
    try {
      const compressedBlob = await compressImage(imageFile);
      const fileName = `${Date.now()}.jpg`;
      await supabase.storage.from('mila-market-assests').upload(fileName, compressedBlob);
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;

      const { error } = await supabase.from('products').insert([{
        ...formData, price: parseFloat(formData.price), image_url: publicUrl,
        user_id: user?.id, user_email: user?.email, rating_sum: 0, rating_count: 0
      }]);

      if (error) throw error;
      setShowAddForm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) { alert("خطأ في النشر"); } finally { setIsActionLoading(false); }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('products').delete().match({ id: productToDelete, user_id: user.id });
    if (!error) { setProductToDelete(null); setSelectedProduct(null); }
    setIsActionLoading(false);
  };

  const handleRate = async (productId: string, star: number) => {
    if (!user) return setShowAuthModal(true);
    const product = products.find(p => p.id === productId);
    const newSum = (product.rating_sum || 0) + star;
    const newCount = (product.rating_count || 0) + 1;
    await supabase.from('products').update({ rating_sum: newSum, rating_count: newCount }).eq('id', productId);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMyAds = showOnlyMyAds ? p.user_id === user?.id : true;
    return matchesCategory && matchesSearch && matchesMyAds;
  });

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-3xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-all`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs active:scale-90 transition-all shadow-lg">بيع منتج +</button>
        </div>
      </nav>

      {/* Hero & Filters */}
      <div className="max-w-7xl mx-auto p-6 space-y-6 text-center">
        <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="text" placeholder="ماذا تبحث في ميلة اليوم؟" className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-center shadow-2xl" onChange={(e) => setSearchQuery(e.target.value)} />
        
        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar w-full justify-start md:justify-center">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${activeCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>{cat}</button>
            ))}
          </div>
          {user && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowOnlyMyAds(!showOnlyMyAds)} className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all border ${showOnlyMyAds ? 'bg-amber-500 border-amber-500 text-black' : 'bg-transparent border-white/10 text-white/40'}`}>
              {showOnlyMyAds ? 'إظهار كل المنتجات' : '📦 منتجاتي فقط'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-xl relative hover:border-amber-500/30 transition-all">
              <div className="aspect-square relative overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black italic">★ {(product.rating_sum/(product.rating_count||1)).toFixed(1)}</div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-4 left-4 bg-red-500/80 backdrop-blur-md p-2 rounded-full text-white hover:scale-125 transition-all">🗑️</button>
                )}
              </div>
              <div className="p-5 text-center">
                <h3 className="font-black text-sm truncate opacity-90">{product.name}</h3>
                <p className="text-amber-500 font-black mt-1 text-xs">{product.price} دج</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Product Details Page */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black overflow-y-auto">
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSelectedProduct(null)} className="fixed top-8 right-8 z-[310] bg-white/10 backdrop-blur-2xl text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shadow-3xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </motion.button>

            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 30 }} className={`min-h-screen w-full ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-6 md:p-20`}>
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
                <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedProduct.image_url} className="w-full lg:w-1/2 aspect-square object-cover rounded-[3.5rem] shadow-3xl border border-white/5" />
                <div className="space-y-8 flex-1">
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">{selectedProduct.name}</h2>
                  <p className="text-amber-500 text-4xl font-black">{selectedProduct.price} دج</p>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 italic opacity-80">{selectedProduct.description}</div>
                  <div className="flex justify-between font-black text-xs opacity-40"><span>البائع: {selectedProduct.seller_name}</span><span>📍 {selectedProduct.location}</span></div>
                  <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="block bg-[#25D366] text-black text-center py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 transition-all">واتساب</a>
                  <div className="flex justify-center gap-4">
                    {[1,2,3,4,5].map(s => <button key={s} onClick={() => handleRate(selectedProduct.id, s)} className={`text-4xl ${(selectedProduct.rating_sum/selectedProduct.rating_count) >= s ? 'text-amber-500' : 'text-white/10'}`}>★</button>)}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal - Cinematic */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f0f] border border-red-500/30 p-12 rounded-[3.5rem] max-w-md w-full text-center shadow-2xl">
              <div className="text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-black italic mb-4">حذف المنتج؟</h2>
              <p className="text-white/40 font-bold mb-10 text-sm italic">سيختفي المنتج نهائياً من Mila Store فوراً.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="bg-red-500 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">نعم، احذف المنتج</button>
                <button onClick={() => setProductToDelete(null)} className="text-white/30 py-4 font-black text-xs">تراجع</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[3.5rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black italic text-amber-500 tracking-tighter">نشر منتج جديد 🔥</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/20 text-3xl">✕</button>
              </div>
              <div className="space-y-5">
                <div className="h-44 border-2 border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center relative hover:bg-white/5 transition-colors cursor-pointer">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-black opacity-30 text-xs">{imageFile ? "✅ صورة المنتج جاهزة" : "اضغط لرفع صورة المنتج"}</p>
                </div>
                <input type="text" placeholder="اسم البائع" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder="ما هو المنتج؟" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="وصف المنتج..." rows={3} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر دج" className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم واتساب (06..)" maxLength={10} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-6 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="p-6 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-7 bg-amber-500 text-black font-black rounded-[2.5rem] text-xl shadow-2xl active:scale-95 transition-all">
                  {isActionLoading ? "جاري المعالجة..." : "تأكيد نشر المنتج"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal & Success View (كما في الكود السابق لضمان الثبات) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-12 rounded-[3.5rem] w-full max-w-sm border border-white/10 shadow-3xl">
              <h2 className="text-2xl font-black mb-10 italic text-amber-500 uppercase">Mila Member</h2>
              <div className="space-y-4">
                <input type="email" placeholder="البريد" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} className="w-full bg-white text-black py-6 rounded-2xl font-black active:scale-95 transition-all">دخول / تسجيل</button>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-white/20 text-xs mt-8">إغلاق</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black flex items-center justify-center text-center">
             <div><div className="text-8xl mb-6">✨</div><h2 className="text-3xl font-black italic uppercase tracking-tighter">Product Published</h2></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}