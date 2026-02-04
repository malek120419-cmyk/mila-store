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

  const handleLogin = async () => {
    if (!email || !password) return alert("يرجى إدخال البيانات");
    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setTimeout(() => setShowAddForm(true), 400);
    } catch (e: any) {
      alert("خطأ في تسجيل الدخول");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return setShowAuthModal(true);
    if (!formData.name || !formData.price || !imageFile) return alert("يرجى إكمال البيانات");

    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}_m.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assests')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mila-market-assests/${fileName}`;

      const { error: dbError } = await supabase.from('products').insert([{
        ...formData, price: parseFloat(formData.price), image_url: publicUrl,
        user_id: user.id, user_email: user.email 
      }]);

      if (dbError) throw dbError;

      setShowAddForm(false);
      setShowSuccess(true);
      fetchProducts();
      setTimeout(() => { setShowSuccess(false); setImageFile(null); }, 2000);
    } catch (e: any) {
      alert("فشل الحفظ: " + e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- دالة الحذف (لصاحب المنتج فقط) ---
  const handleDelete = async (e: React.MouseEvent, productId: string, ownerId: string) => {
    e.stopPropagation(); // منع فتح نافذة التفاصيل عند الضغط على حذف
    if (!user || user.id !== ownerId) return;

    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
        setProducts(products.filter(p => p.id !== productId));
      } catch (e: any) {
        alert("خطأ أثناء الحذف");
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505]">
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-amber-500 font-black italic text-2xl">MILA STORE</motion.div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'} overflow-x-hidden`} dir="rtl">
      
      {/* Navbar الاحترافي */}
      <nav className="p-5 border-b border-white/5 flex justify-between items-center max-w-6xl mx-auto sticky top-0 z-[100] backdrop-blur-2xl">
        <motion.h1 initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-xl font-black italic tracking-tighter uppercase">Mila <span className="text-amber-500 font-normal">Market</span></motion.h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-lg opacity-60 hover:opacity-100 transition-opacity">{isDarkMode ? '🌞' : '🌚'}</button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-[11px] shadow-lg shadow-amber-500/10"
          >
            بيع سلعة
          </motion.button>
        </div>
      </nav>

      {/* البحث */}
      <div className="max-w-4xl mx-auto p-6 mt-4">
        <input 
          type="text" placeholder="ما الذي تبحث عنه في ميلة؟" 
          className="w-full p-5 rounded-[2rem] bg-white/5 border border-white/5 outline-none focus:border-amber-500/50 transition-all font-medium text-center shadow-inner"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شبكة المنتجات (تصميم عالمي مصغر) */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pb-20">
        <AnimatePresence mode="popLayout">
          {products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((product) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                key={product.id} onClick={() => setSelectedProduct(product)}
                className="group relative bg-neutral-900/30 rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer hover:bg-neutral-900/60 transition-all duration-500 shadow-xl"
              >
                <div className="aspect-[1/1.2] relative overflow-hidden">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" loading="lazy" />
                  
                  {/* أيقونة الحذف تظهر لصاحب المنتج فقط */}
                  {user && user.id === product.user_id && (
                    <motion.button 
                      whileHover={{ scale: 1.2, backgroundColor: '#ef4444' }}
                      onClick={(e) => handleDelete(e, product.id, product.user_id)}
                      className="absolute top-3 left-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </motion.button>
                  )}

                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                    <span className="text-amber-500 font-black text-[10px]">{product.price} دج</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-[12px] font-bold truncate opacity-90">{product.name}</h3>
                  <div className="flex justify-between items-center mt-2 opacity-40">
                    <span className="text-[9px] font-bold italic">📍 {product.location}</span>
                  </div>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* واجهة النجاح العصرية */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
          >
            <motion.div initial={{ y: 30, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="text-center">
              <div className="w-24 h-24 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">✨</motion.div>
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">تم تحديث المتجر بنجاح</h2>
              <p className="text-white/40 font-medium">منتجك الآن متاح لآلاف المشترين</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* تفاصيل المنتج (نافذة عالمية) */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-[#0f0f0f] rounded-[3rem] w-full max-w-lg border border-white/10 overflow-hidden shadow-2xl">
              <div className="relative aspect-square">
                <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 bg-black/50 backdrop-blur-xl w-10 h-10 rounded-full flex items-center justify-center text-xl">✕</button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-2xl font-black mb-1">{selectedProduct.name}</h2>
                     <p className="opacity-40 font-bold italic">📍 {selectedProduct.location}</p>
                   </div>
                   <div className="text-2xl font-black text-amber-500">{selectedProduct.price} دج</div>
                </div>
                <div className="flex gap-4">
                   <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="flex-1 bg-[#25D366] text-black text-center py-5 rounded-[1.5rem] font-black text-lg transition-transform active:scale-95">طلب المنتج عبر واتساب</a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* فورم الإضافة (عصري وسلس) */}
      <AnimatePresence>
        {showAddForm && user && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#0a0a0a] p-8 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-xl border-t border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black italic">نشر منتج جديد</h2>
                <button onClick={() => setShowAddForm(false)} className="opacity-40">إغلاق</button>
              </div>
              <div className="space-y-4">
                <div className="h-40 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center relative group overflow-hidden">
                   <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                   <div className="text-center group-hover:scale-110 transition-transform duration-500">
                     <p className="font-black text-sm opacity-30">{imageFile ? "✅ تم اختيار الصورة" : "اضغط هنا لرفع الصورة"}</p>
                   </div>
                </div>
                <input type="text" placeholder="اسم المنتج" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر (دج)" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="رقم الواتساب" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-[1.8rem] text-xl shadow-2xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  {isActionLoading ? "جاري المعالجة..." : "تأكيد النشر"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* تسجيل الدخول */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-sm border border-white/10 text-center">
              <h2 className="text-xl font-black mb-8 italic uppercase tracking-widest text-amber-500">Log In</h2>
              <div className="space-y-4">
                <input type="email" placeholder="Email" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-5 rounded-2xl bg-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} disabled={isActionLoading} className="w-full bg-white text-black py-5 rounded-2xl font-black transition-all active:scale-95">دخول</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}