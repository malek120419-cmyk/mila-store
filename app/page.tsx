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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#050505] text-amber-500 font-black text-2xl animate-pulse italic">MILA STORE...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'} transition-colors duration-500 overflow-x-hidden`} dir="rtl">
      
      {/* Navbar */}
      <nav className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-[100] backdrop-blur-3xl bg-inherit/80">
        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500 font-normal">STORE</span></h1>
        <div className="flex gap-3 md:gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg opacity-50 hover:opacity-100">{isDarkMode ? '🌞' : '🌚'}</button>
          <button 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-4 md:px-6 py-2 rounded-full font-black text-[10px] md:text-xs active:scale-95 shadow-lg"
          >
            بيع سلعة +
          </button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4">
        <input 
          type="text" placeholder="ابحث عن العروض في ميلة..." 
          className="w-full p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-bold text-center text-sm md:text-base shadow-2xl"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شبكة المنتجات */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-6 pb-32">
        <AnimatePresence mode="popLayout">
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
            const avg = product.rating_count > 0 ? (product.rating_sum / product.rating_count).toFixed(1) : "0";
            return (
              <motion.div 
                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                key={product.id} onClick={() => setSelectedProduct(product)}
                className="group relative bg-neutral-900/40 rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer shadow-xl"
              >
                <div className="aspect-[1/1.2] relative overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-amber-500 text-[9px] font-black">★ {avg}</div>
                  <div className="absolute bottom-3 right-3 bg-amber-500 text-black px-2 py-1 rounded-xl font-black text-[9px]">{product.price} دج</div>
                </div>
                <div className="p-4">
                  <h3 className="text-[11px] md:text-sm font-black truncate">{product.name}</h3>
                  <p className="text-[9px] opacity-40 mt-1 font-bold italic">📍 {product.location}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      {/* صفحة تفاصيل المنتج الكاملة مع زر العودة */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black overflow-y-auto"
          >
            {/* أيقونة العودة العلوية الثابتة */}
            <motion.button 
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed top-6 right-6 z-[310] bg-white/10 backdrop-blur-3xl p-4 rounded-full border border-white/10 hover:bg-amber-500 hover:text-black transition-all shadow-2xl"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </motion.button>

            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`min-h-screen w-full ${isDarkMode ? 'bg-[#050505]' : 'bg-white text-black'} p-4 md:p-12`}
            >
              <div className="max-w-6xl mx-auto">
                <button onClick={() => setSelectedProduct(null)} className="mb-8 text-amber-500 font-black flex items-center gap-2 text-xs tracking-widest italic uppercase">← العودة للمتجر</button>
                
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                  <div className="w-full lg:w-1/2">
                    <motion.img 
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      src={selectedProduct.image_url} className="w-full aspect-square object-cover rounded-[2.5rem] md:rounded-[4rem] shadow-3xl border border-white/5" 
                    />
                  </div>
                  
                  <div className="w-full lg:w-1/2 space-y-6 md:space-y-10">
                    <div>
                      <span className="text-amber-500 text-xs font-black uppercase tracking-[0.3em]">{selectedProduct.category}</span>
                      <h2 className="text-4xl md:text-7xl font-black italic mt-4 mb-4 leading-tight tracking-tighter">{selectedProduct.name}</h2>
                      <p className="text-3xl md:text-5xl font-black text-amber-500">{selectedProduct.price} دج</p>
                    </div>

                    <div className="bg-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5">
                      <h4 className="text-[10px] font-black opacity-30 mb-4 tracking-[0.3em] uppercase italic">وصف السلعة</h4>
                      <p className="text-base md:text-xl leading-relaxed opacity-80 whitespace-pre-wrap">{selectedProduct.description || "لا يوجد وصف."}</p>
                      <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center opacity-60 font-bold italic text-xs">
                        <span>📍 بلدية: {selectedProduct.location}</span>
                        <span>👤 المعلن: {selectedProduct.user_email?.split('@')[0]}</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="block bg-[#25D366] text-black text-center py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black text-xl md:text-3xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">اطلب الآن (واتساب)</a>
                      
                      <div className="text-center pt-4">
                        <p className="text-[10px] font-black opacity-20 mb-4 uppercase italic">تقييم المشتري</p>
                        <div className="flex justify-center gap-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => handleRate(selectedProduct.id, star, selectedProduct.rating_sum, selectedProduct.rating_count)} className={`text-4xl md:text-6xl transition-all ${(selectedProduct.rating_sum / selectedProduct.rating_count) >= star ? 'text-amber-500' : 'text-white/10'}`}>★</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* باقي الواجهات (Add Form, Auth, Success) - ستبقى كما هي بأنيمشناتها القوية */}
      {/* ... (نفس بقية كود الاستمارة وتسجيل الدخول السابق) */}

    </div>
  );
}