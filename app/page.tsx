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
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', seller_name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات', description: '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error) setProducts(data);
    setLoading(false);
  };

  const handleLogin = async () => {
    setIsActionLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      await supabase.auth.signUp({ email, password }); // إذا لم يوجد حساب ينشئ واحد تلقائياً
    }
    setShowAuthModal(false);
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.price || !imageFile || !formData.seller_name) return alert("يرجى ملء كافة الخانات بما فيها اسم البائع");
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
      fetchProducts();
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) { alert("حدث خطأ أثناء النشر"); } finally { setIsActionLoading(false); }
  };

  const handleDelete = async (e: any, productId: string) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف المنتج؟")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setProducts(products.filter(p => p.id !== productId));
      setSelectedProduct(null);
    }
  };

  const handleRate = async (productId: string, star: number) => {
    if (!user) return setShowAuthModal(true);
    const product = products.find(p => p.id === productId);
    const newSum = (product.rating_sum || 0) + star;
    const newCount = (product.rating_count || 0) + 1;

    const { error } = await supabase.from('products').update({ rating_sum: newSum, rating_count: newCount }).eq('id', productId);
    if (!error) fetchProducts();
  };

  const filteredProducts = products.filter(p => 
    (activeCategory === 'الكل' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic animate-pulse text-3xl tracking-tighter">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-colors duration-500`} dir="rtl">
      
      {/* Header */}
      <nav className="p-6 sticky top-0 z-[100] backdrop-blur-3xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs active:scale-90 transition-transform"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* Categories & Search */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <input 
          type="text" placeholder="ابحث عن ما تحتاجه في ميلة..." 
          className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 outline-none focus:border-amber-500 transition-all font-bold text-center"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-amber-500 text-black' : 'bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
        <AnimatePresence>
          {filteredProducts.map(product => (
            <motion.div 
              layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              key={product.id} onClick={() => setSelectedProduct(product)}
              className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer"
            >
              <div className="aspect-square relative">
                <img src={product.image_url} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black italic">★ {(product.rating_sum/(product.rating_count||1)).toFixed(1)}</div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => handleDelete(e, product.id)} className="absolute top-4 left-4 bg-red-500 p-2 rounded-full text-white">🗑️</button>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-black text-sm truncate">{product.name}</h3>
                <p className="text-amber-500 font-black mt-1">{product.price} دج</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Product Details Page */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-8 right-8 z-[310] bg-white text-black p-4 rounded-full font-black shadow-2xl hover:scale-110 transition-transform">✕</button>
            <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-6 md:p-20`}>
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
                <img src={selectedProduct.image_url} className="w-full lg:w-1/2 aspect-square object-cover rounded-[3rem] shadow-2xl" />
                <div className="space-y-8 flex-1">
                  <div>
                    <h2 className="text-5xl font-black italic leading-tight">{selectedProduct.name}</h2>
                    <p className="text-amber-500 text-3xl font-black mt-4">{selectedProduct.price} دج</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2rem] space-y-4">
                    <p className="text-lg opacity-80 leading-relaxed">{selectedProduct.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5 font-black italic text-sm">
                      <span className="text-amber-500">البائع: {selectedProduct.seller_name}</span>
                      <span className="opacity-40">📍 {selectedProduct.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="bg-[#25D366] text-black text-center py-6 rounded-3xl font-black text-xl">تواصل عبر واتساب</a>
                    <div className="flex justify-center gap-4">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => handleRate(selectedProduct.id, s)} className={`text-4xl ${(selectedProduct.rating_sum/selectedProduct.rating_count) >= s ? 'text-amber-500' : 'text-white/10'}`}>★</button>
                      ))}
                    </div>
                    {user?.id === selectedProduct.user_id && (
                      <button onClick={(e) => handleDelete(e, selectedProduct.id)} className="text-red-500 font-black mt-4">حذف هذا المنتج نهائياً</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[3rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic">نشر منتج جديد</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/30 text-2xl">✕</button>
              </div>
              <div className="space-y-4">
                <div className="h-40 border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center relative">
                   <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-black opacity-30">{imageFile ? "✅ الصورة جاهزة" : "ارفع صورة المنتج"}</p>
                </div>
                <input type="text" placeholder="اسم البائع (أو المحل)" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                <input type="text" placeholder="ماذا تبيع؟" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="وصف المنتج..." rows={3} className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الهاتف" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="p-5 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl text-xl shadow-2xl">
                  {isActionLoading ? "جاري النشر..." : "تأكيد النشر"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10">
              <h2 className="text-xl font-black mb-8 italic text-amber-500 uppercase">Login / Sign Up</h2>
              <input type="email" placeholder="البريد" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center mb-4" onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="كلمة السر" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center mb-6" onChange={(e) => setPassword(e.target.value)} />
              <button onClick={handleLogin} className="w-full bg-white text-black py-5 rounded-2xl font-black active:scale-95">دخول</button>
              <button onClick={() => setShowAuthModal(false)} className="text-white/20 text-xs mt-6">إلغاء</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success View */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black flex items-center justify-center">
             <div className="text-center">
               <div className="text-7xl mb-4 animate-bounce">✨</div>
               <h2 className="text-2xl font-black italic">تم تحديث المتجر بنجاح</h2>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}