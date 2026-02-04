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

  // --- ميزة التحديث اللحظي (Real-time) لإخفاء المنتج المحذوف فوراً ---
  useEffect(() => {
    // 1. جلب البيانات لأول مرة
    fetchProducts();

    // 2. الاشتراك في التغييرات (الحذف، الإضافة، التحديث)
    const channel = supabase
      .channel('realtime_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'INSERT') {
          setProducts((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts((prev) => prev.map(p => p.id === payload.new.id ? payload.new : p));
        }
      })
      .subscribe();

    // 3. التحقق من المستخدم
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
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
    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}.jpg`;
      await supabase.storage.from('mila-market-assests').upload(fileName, imageFile);
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
    const { error } = await supabase.from('products').delete().eq('id', productToDelete);
    if (!error) {
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  const handleRate = async (productId: string, star: number) => {
    if (!user) return setShowAuthModal(true);
    const product = products.find(p => p.id === productId);
    const newSum = (product.rating_sum || 0) + star;
    const newCount = (product.rating_count || 0) + 1;
    await supabase.from('products').update({ rating_sum: newSum, rating_count: newCount }).eq('id', productId);
  };

  const filteredProducts = products.filter(p => 
    (activeCategory === 'الكل' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-3xl animate-pulse tracking-tighter">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'} transition-all`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-lg"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* البحث والفئات */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <input 
          type="text" placeholder="ماذا تبحث في ميلة اليوم؟" 
          className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-center"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${activeCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/5'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* شبكة المنتجات */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
        <AnimatePresence>
          {filteredProducts.map(product => (
            <motion.div 
              layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              key={product.id} onClick={() => setSelectedProduct(product)}
              className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-xl relative"
            >
              <img src={product.image_url} className="aspect-square object-cover" alt="" />
              <div className="p-4 text-center">
                <h3 className="font-black text-sm truncate">{product.name}</h3>
                <p className="text-amber-500 font-black mt-1 text-xs">{product.price} دج</p>
              </div>
              {user?.id === product.user_id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} 
                  className="absolute top-4 left-4 bg-red-500/80 backdrop-blur-md p-2 rounded-full text-white hover:scale-110"
                >
                  🗑️
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* صفحة التفاصيل مع أيقونة العودة الشفافة والأنيميشن القوي */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black overflow-y-auto">
            <motion.button 
              initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed top-8 right-8 z-[310] bg-white/10 backdrop-blur-2xl text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shadow-3xl"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </motion.button>

            <div className={`min-h-screen w-full ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-6 md:p-20`}>
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
                <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedProduct.image_url} className="w-full lg:w-1/2 aspect-square object-cover rounded-[3.5rem] shadow-3xl border border-white/5" />
                <div className="space-y-8 flex-1">
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">{selectedProduct.name}</h2>
                  <p className="text-amber-500 text-4xl font-black">{selectedProduct.price} دج</p>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                    <p className="text-lg opacity-80 leading-relaxed italic">{selectedProduct.description}</p>
                    <div className="mt-6 flex justify-between font-black italic text-xs opacity-50">
                      <span>البائع: {selectedProduct.seller_name}</span>
                      <span>📍 {selectedProduct.location}</span>
                    </div>
                  </div>
                  <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="block bg-[#25D366] text-black text-center py-6 rounded-[2rem] font-black text-2xl shadow-2xl">واتساب</a>
                  {user?.id === selectedProduct.user_id && (
                    <button onClick={() => setProductToDelete(selectedProduct.id)} className="w-full text-red-500 font-black text-xs uppercase tracking-widest mt-4">حذف المنتج</button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة الحذف السينمائية */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#0f0f0f] border border-red-500/30 p-10 rounded-[3.5rem] max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-7xl mb-6">⚠️</div>
              <h2 className="text-2xl font-black italic mb-4">حذف نهائي؟</h2>
              <p className="text-white/40 font-bold mb-10 text-sm">بمجرد الحذف، سيختفي المنتج من "Mila Store" على جميع الأجهزة فوراً.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} disabled={isActionLoading} className="bg-red-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
                  {isActionLoading ? "جاري المسح..." : "نعم، احذف الإعلان"}
                </button>
                <button onClick={() => setProductToDelete(null)} className="text-white/30 py-4 font-black text-xs uppercase tracking-widest">تراجع</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* تسجيل الدخول والنجاح */}
      {/* ... (نفس كود AuthModal و SuccessView السابق) */}

    </div>
  );
}