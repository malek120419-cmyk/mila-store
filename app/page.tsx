"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MilaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات' 
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
    if (!formData.name || !formData.price || !imageFile) return alert("يرجى إكمال البيانات");

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
    } catch (e: any) { alert("فشل الحفظ"); } finally { setIsActionLoading(false); }
  };

  const handleDelete = async (e: React.MouseEvent, productId: string, ownerId: string) => {
    e.stopPropagation();
    if (!user || user.id !== ownerId) return;
    if (confirm("حذف المنتج نهائياً؟")) {
      await supabase.from('products').delete().eq('id', productId);
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  // --- نظام التقييم بالنجوم ---
  const handleRate = async (productId: string, star: number, currentSum: number, currentCount: number) => {
    if (!user) return setShowAuthModal(true);
    
    const newSum = (currentSum || 0) + star;
    const newCount = (currentCount || 0) + 1;

    const { error } = await supabase.from('products')
      .update({ rating_sum: newSum, rating_count: newCount })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, rating_sum: newSum, rating_count: newCount } : p));
      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, rating_sum: newSum, rating_count: newCount });
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505] text-amber-500 font-black italic tracking-widest animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'}`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-5 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-[100] backdrop-blur-2xl">
        <h1 className="text-xl font-black italic tracking-tighter uppercase">Mila <span className="text-amber-500 font-normal">Market</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg opacity-60">{isDarkMode ? '🌞' : '🌚'}</button>
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-[11px]">بيع سلعة</button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-6 mt-4 text-center">
        <input 
          type="text" placeholder="ابحث عن منتج..." 
          className="w-full p-5 rounded-[2rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-medium text-center"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شبكة المنتجات */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pb-20">
        <AnimatePresence mode="popLayout">
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
            const avgRating = product.rating_count > 0 ? (product.rating_sum / product.rating_count).toFixed(1) : "0";
            return (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                key={product.id} onClick={() => setSelectedProduct(product)}
                className="group relative bg-neutral-900/30 rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer hover:bg-neutral-900/60 transition-all"
              >
                <div className="aspect-[1/1.2] relative overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  
                  {/* أيقونة الحذف */}
                  {user && user.id === product.user_id && (
                    <button onClick={(e) => handleDelete(e, product.id, product.user_id)} className="absolute top-3 left-3 bg-black/40 p-2 rounded-full text-white/80 z-10 hover:bg-red-500 transition-colors">🗑️</button>
                  )}

                  {/* تقييم النجوم الصغير على الكارت */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-amber-500 text-[10px] font-black">★ {avgRating}</span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                    <span className="text-amber-500 font-black text-[10px]">{product.price} دج</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-[12px] font-bold truncate">{product.name}</h3>
                  <p className="text-[9px] opacity-40 mt-1 italic">📍 {product.location}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      {/* تفاصيل المنتج + نظام التقييم بالنجوم */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f0f0f] rounded-[3rem] w-full max-w-lg border border-white/10 overflow-hidden shadow-2xl">
              <div className="relative aspect-square">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 bg-black/50 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-2xl font-black mb-1">{selectedProduct.name}</h2>
                     <p className="opacity-40 font-bold italic">📍 {selectedProduct.location}</p>
                   </div>
                   <div className="text-2xl font-black text-amber-500">{selectedProduct.price} دج</div>
                </div>

                {/* نظام النجوم التفاعلي */}
                <div className="border-y border-white/5 py-4 text-center">
                  <p className="text-[10px] opacity-40 mb-2 font-bold uppercase tracking-widest">قيم هذا المنتج</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button 
                        key={star} whileTap={{ scale: 0.8 }}
                        onClick={() => handleRate(selectedProduct.id, star, selectedProduct.rating_sum, selectedProduct.rating_count)}
                        className={`text-2xl ${(selectedProduct.rating_sum / selectedProduct.rating_count) >= star ? 'text-amber-500' : 'text-white/10'}`}
                      >
                        ★
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[9px] mt-2 opacity-30 italic">({selectedProduct.rating_count || 0} تقييم)</p>
                </div>

                <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="block bg-[#25D366] text-black text-center py-5 rounded-[1.5rem] font-black text-lg active:scale-95 transition-transform">تواصل عبر واتساب</a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* واجهة النجاح */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-3xl">
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">✨</motion.div>
              <h2 className="text-2xl font-black">تم تحديث المتجر بنجاح</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* فورم إضافة منتج */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-[#0a0a0a] p-8 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl border-t border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black italic">نشر منتج جديد</h2>
                <button onClick={() => setShowAddForm(false)} className="opacity-40 font-bold">إلغاء</button>
              </div>
              <div className="space-y-4">
                <div className="h-32 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center relative">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <p className="font-black text-xs opacity-30">{imageFile ? "✅ تم الاختيار" : "ارفع صورة المنتج"}</p>
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-[1.8rem] text-xl active:scale-95 transition-all">تأكيد النشر</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}