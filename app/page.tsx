"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productLocation, setProductLocation] = useState('ميلة المركز');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    const savedLikes = localStorage.getItem('mila_ultra_v3');
    if (savedLikes) setLikedProducts(JSON.parse(savedLikes));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleLike = async (productId: string, currentLikes: number) => {
    const isAlreadyLiked = likedProducts.includes(productId);
    
    // أنميشن اهتزاز للهاتف (إذا كان يدعم)
    if (window.navigator.vibrate) window.navigator.vibrate(50);

    const newLikesCount = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // تحديث فوري (Optimistic UI)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newLikesCount } : p));
    const newLikedList = isAlreadyLiked ? likedProducts.filter(id => id !== productId) : [...likedProducts, productId];
    setLikedProducts(newLikedList);
    localStorage.setItem('mila_ultra_v3', JSON.stringify(newLikedList));

    await supabase.from('products').update({ likes_count: newLikesCount }).eq('id', productId);
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("البيانات ناقصة يا بطل! ⚠️");
    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile);

      if (uploadError) throw new Error("البكت محمي أو غير موجود! تأكد من تشغيل كود SQL");

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        name: productName, price: parseFloat(productPrice), location: productLocation, 
        image_url: publicUrl, whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح! 🔥🚀");
    } catch (e: any) { 
      alert(e.message);
    } finally { 
      setIsActionLoading(false); 
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-7xl"
      >💎</motion.div>
    </div>
  );

  return (
    <main className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f4f4f4] text-black'} transition-all duration-700 font-sans`} dir="rtl">
      
      {/* Header بلمسة فنية */}
      <header className="max-w-7xl mx-auto p-10 flex justify-between items-center">
        <motion.h1 
          initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="text-6xl font-black italic tracking-tighter"
        >
          MILA <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">STORE</span>
        </motion.h1>
        <div className="flex gap-8 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-4xl hover:scale-125 transition-transform">
            {isDarkMode ? '💡' : '🌑'}
          </button>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddForm(true)}
            className="bg-amber-500 text-black px-12 py-5 rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(245,158,11,0.4)]"
          >
            بيع الآن ⚡
          </motion.button>
        </div>
      </header>

      {/* البحث المطور */}
      <div className="max-w-4xl mx-auto px-10 mb-20">
        <motion.input 
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          type="text" placeholder="تبحث عن شيء معين؟ اكتبه هنا... ✨"
          className={`w-full p-8 rounded-[3rem] text-2xl font-black outline-none border-none shadow-2xl ${isDarkMode ? 'bg-white/10 focus:bg-white/15' : 'bg-white'}`}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* شبكة المنتجات بأنميشن خيالي */}
      <section className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        <AnimatePresence>
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product, idx) => {
            const isLiked = likedProducts.includes(product.id);
            return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -10 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`rounded-[4.5rem] p-6 relative overflow-hidden ${isDarkMode ? 'bg-neutral-900/80 border border-white/5' : 'bg-white shadow-xl'}`}
              >
                <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden relative mb-8">
                  <motion.img 
                    src={product.image_url} className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }} transition={{ duration: 1 }}
                  />
                  
                  {/* زر الإعجاب (قلب عملاق وأنميشن انفجار) */}
                  <motion.button 
                    onClick={() => handleLike(product.id, product.likes_count)}
                    className={`absolute top-8 left-8 p-6 rounded-[2.5rem] backdrop-blur-3xl transition-all ${isLiked ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)]' : 'bg-black/50'}`}
                    whileTap={{ scale: 2, rotate: [0, 15, -15, 0] }}
                  >
                    <span className="text-4xl">{isLiked ? '❤️' : '🤍'}</span>
                  </motion.button>
                  
                  <div className="absolute bottom-8 right-8 bg-amber-500 text-black font-black px-6 py-2 rounded-2xl text-sm">
                    {product.location} 📍
                  </div>
                </div>

                <div className="px-6 pb-4">
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="text-4xl font-black max-w-[60%] leading-tight">{product.name}</h3>
                    <div className="text-left">
                      <p className="text-4xl font-black text-amber-500 leading-none">{product.price}</p>
                      <span className="text-xs opacity-40 font-bold uppercase tracking-widest">DZD</span>
                    </div>
                  </div>

                  <motion.a 
                    whileHover={{ x: 10 }}
                    href={`https://wa.me/${product.whatsapp_number}`} target="_blank"
                    className="flex justify-center items-center gap-4 w-full py-7 bg-[#25D366] text-white rounded-[2.5rem] text-2xl font-black shadow-2xl"
                  >
                    واتساب <span className="text-3xl">💬</span>
                  </motion.a>
                  
                  <div className="mt-6 flex justify-center gap-2 opacity-20">
                    <span className="text-xl">❤️ {product.likes_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl p-10 flex items-center justify-center"
          >
            <motion.div 
              initial={{ y: 500 }} animate={{ y: 0 }}
              className={`max-w-2xl w-full p-16 rounded-[5rem] ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-6xl font-black italic">نشر جديد <span className="text-amber-500">✨</span></h2>
                <button onClick={() => setShowAddForm(false)} className="text-5xl opacity-30">✕</button>
              </div>

              <div className="space-y-8">
                <div className="border-4 border-dashed border-white/10 rounded-[4rem] p-20 text-center relative group hover:border-amber-500/50 transition-all">
                  <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-8xl block mb-4 group-hover:scale-110 transition-transform">📸</span>
                  <p className="font-black opacity-40 uppercase tracking-widest text-sm">{imageFile ? `✅ ${imageFile.name}` : "ارفع صورة تجذب الزبائن"}</p>
                </div>
                
                <input type="text" placeholder="اسم المنتج" className="w-full p-8 rounded-3xl bg-white/5 outline-none font-black text-2xl focus:ring-4 ring-amber-500/20" value={productName} onChange={(e)=>setProductName(e.target.value)} />
                <div className="grid grid-cols-2 gap-8">
                  <input type="number" placeholder="السعر" className="w-full p-8 rounded-3xl bg-white/5 outline-none font-black text-2xl" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} />
                  <input type="tel" placeholder="رقم واتساب" className="w-full p-8 rounded-3xl bg-white/5 outline-none font-black text-2xl" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} />
                </div>
                
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-10 bg-amber-500 text-black font-black rounded-[3rem] text-4xl shadow-2xl active:scale-90 transition-all"
                >
                  {isActionLoading ? "🚀 جاري التحليق..." : "انشر الآن 🔥"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}