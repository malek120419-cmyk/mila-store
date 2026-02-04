"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "التلاغمة", "وادي العثمانية", "زغاية", "القرارم قوقة", "سيدي مروان", "مشديرة"];
const CATEGORIES = ["الكل", "إلكترونيات", "سيارات", "عقارات", "ملابس", "أخرى"];

export default function MilaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // هذه ستكون صفحة التفاصيل
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات', description: '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("أكمل البيانات");

    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}_m.jpg`;
      await supabase.storage.from('mila-market-assests').upload(fileName, imageFile!);
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;

      const { error } = await supabase.from('products').insert([{
        ...formData, price: parseFloat(formData.price), image_url: publicUrl,
        user_id: user.id, user_email: user.email, rating_sum: 0, rating_count: 0
      }]);

      if (error) throw error;
      setShowAddForm(false);
      setShowSuccess(true);
      fetchProducts();
      setTimeout(() => { setShowSuccess(false); setImageFile(null); }, 2000);
    } catch (e: any) { alert("خطأ في النشر"); } finally { setIsActionLoading(false); }
  };

  const handleDelete = async (e: React.MouseEvent, productId: string, ownerId: string) => {
    e.stopPropagation();
    if (!user || user.id !== ownerId) return;
    if (confirm("هل تريد حذف هذا المنتج نهائياً؟")) {
      await supabase.from('products').delete().eq('id', productId);
      setProducts(products.filter(p => p.id !== productId));
      if (selectedProduct?.id === productId) setSelectedProduct(null);
    }
  };

  const handleRate = async (productId: string, star: number, currentSum: number, currentCount: number) => {
    if (!user) return setShowAuthAlert(true);
    const newSum = (currentSum || 0) + star;
    const newCount = (currentCount || 0) + 1;
    const { error } = await supabase.from('products').update({ rating_sum: newSum, rating_count: newCount }).eq('id', productId);
    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, rating_sum: newSum, rating_count: newCount } : p));
      if (selectedProduct?.id === productId) setSelectedProduct({ ...selectedProduct, rating_sum: newSum, rating_count: newCount });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black text-2xl animate-pulse italic">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} transition-all duration-500`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-6 border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-[100] backdrop-blur-3xl">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></motion.h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl opacity-50 hover:opacity-100 transition-all">{isDarkMode ? '🌞' : '🌚'}</button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs shadow-xl"
          >
            بيع سلعة +
          </motion.button>
        </div>
      </nav>

      {/* البحث */}
      <header className="max-w-4xl mx-auto p-6 mt-6">
        <motion.input 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          type="text" placeholder="ابحث في بلديات ميلة..." 
          className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-bold text-center shadow-2xl"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {/* شبكة المنتجات */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mt-8 pb-32">
        <AnimatePresence mode="popLayout">
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
            const avg = product.rating_count > 0 ? (product.rating_sum / product.rating_count).toFixed(1) : "0";
            return (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                key={product.id} onClick={() => setSelectedProduct(product)}
                className="group relative bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer shadow-2xl hover:bg-neutral-900/80 transition-all"
              >
                <div className="aspect-[1/1.2] relative overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute top-4 left-4 flex gap-2">
                     {user?.id === product.user_id && (
                       <button onClick={(e) => handleDelete(e, product.id, product.user_id)} className="bg-black/50 p-2 rounded-full backdrop-blur-md hover:bg-red-500 transition-colors text-[10px]">🗑️</button>
                     )}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[10px] font-black italic">★ {avg}</div>
                  <div className="absolute bottom-4 right-4 bg-amber-500 text-black px-3 py-1 rounded-xl font-black text-[10px] shadow-lg">{product.price} دج</div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-black truncate">{product.name}</h3>
                  <p className="text-[10px] opacity-40 mt-1 font-bold italic">📍 {product.location}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      {/* صفحة المنتج الكاملة (عند الضغط على المنتج) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black flex items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
              className={`w-full min-h-screen ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-6 md:p-12`}
            >
              <div className="max-w-5xl mx-auto">
                <button onClick={() => setSelectedProduct(null)} className="mb-8 text-amber-500 font-black flex items-center gap-2 uppercase tracking-widest text-sm italic">← العودة للمتجر</button>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                    src={selectedProduct.image_url} className="w-full aspect-square object-cover rounded-[3rem] shadow-2xl border border-white/5" 
                  />
                  
                  <div className="space-y-8">
                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                      <span className="bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full text-[10px] font-black mb-4 inline-block">{selectedProduct.category}</span>
                      <h2 className="text-4xl md:text-6xl font-black italic mb-4 tracking-tighter">{selectedProduct.name}</h2>
                      <div className="flex items-center gap-4 text-2xl font-black text-amber-500">{selectedProduct.price} دج</div>
                    </motion.div>

                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <h4 className="text-[10px] font-black opacity-30 mb-4 uppercase tracking-[0.2em]">المميزات والموقع</h4>
                      <p className="text-lg leading-relaxed opacity-80 whitespace-pre-wrap mb-6">{selectedProduct.description || "لا توجد تفاصيل إضافية."}</p>
                      <div className="flex items-center gap-2 text-sm font-bold italic opacity-60">📍 بلدية: {selectedProduct.location}</div>
                    </motion.div>

                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col gap-4">
                      <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="bg-[#25D366] text-black text-center py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-[1.02] transition-all">تواصل مع البائع (واتساب)</a>
                      <div className="flex justify-center gap-4 py-4">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => handleRate(selectedProduct.id, star, selectedProduct.rating_sum, selectedProduct.rating_count)} className={`text-4xl transition-all ${(selectedProduct.rating_sum / selectedProduct.rating_count) >= star ? 'text-amber-500' : 'text-white/10'}`}>★</button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* استمارة النشر الاحترافية */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-10 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-2xl border-t border-white/10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black italic">نشر منتج جديد 🔥</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/30 font-bold">إلغاء</button>
              </div>
              <div className="space-y-5">
                <div className="h-44 border-2 border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center relative hover:bg-white/5 transition-all">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-black text-xs opacity-30 text-center">{imageFile ? "✅ الصورة جاهزة" : "إضغط لرفع صورة المنتج"}</p>
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="أكتب مميزات المنتج بالتفصيل..." rows={4} className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold resize-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الواتساب" className="w-full p-6 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select className="p-6 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="p-6 rounded-2xl bg-neutral-900 border border-white/10 font-bold" onChange={(e) => setFormData({...formData, location: e.target.value})}>
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl text-xl shadow-2xl shadow-amber-500/20 active:scale-95 transition-all">
                  {isActionLoading ? "جاري النشر..." : "تأكيد النشر في ميلة"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* تنبيه تسجيل الدخول */}
      <AnimatePresence>
        {showAuthAlert && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] p-10 rounded-[3rem] w-full max-w-sm border border-amber-500/20 text-center">
              <div className="text-5xl mb-6">🔑</div>
              <h2 className="text-xl font-black mb-4">يجب تسجيل الدخول</h2>
              <p className="text-white/40 text-sm mb-8 font-bold">عليك أن تكون عضواً في MILA STORE لتتمكن من التقييم.</p>
              <button onClick={() => { setShowAuthAlert(false); setShowAuthModal(true); }} className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black mb-3">تسجيل الدخول</button>
              <button onClick={() => setShowAuthAlert(false)} className="text-white/20 text-xs font-black uppercase">إغلاق</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* تسجيل الدخول */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 text-center">
              <h2 className="text-xl font-black mb-8 italic text-amber-500">SIGN IN</h2>
              <div className="space-y-4">
                <input type="email" placeholder="البريد" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة السر" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={() => { /* دالة الدخول */ }} className="w-full bg-white text-black py-5 rounded-2xl font-black active:scale-95">دخول</button>
                <button onClick={() => setShowAuthModal(false)} className="text-white/20 text-xs mt-4">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* شاشة النجاح */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[700] bg-black flex items-center justify-center">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
              <div className="text-7xl mb-6 animate-bounce">✨</div>
              <h2 className="text-3xl font-black italic">تم تحديث المتجر بنجاح</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}