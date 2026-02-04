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
    const savedLikes = localStorage.getItem('mila_pro_likes');
    if (savedLikes) setLikedProducts(JSON.parse(savedLikes));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleLike = async (productId: string, currentLikes: number) => {
    const isAlreadyLiked = likedProducts.includes(productId);
    const newLikesCount = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // تحديث فوري فائق السرعة
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newLikesCount } : p));
    const newLikedList = isAlreadyLiked ? likedProducts.filter(id => id !== productId) : [...likedProducts, productId];
    setLikedProducts(newLikedList);
    localStorage.setItem('mila_pro_likes', JSON.stringify(newLikedList));

    await supabase.from('products').update({ likes_count: newLikesCount }).eq('id', productId);
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى ملء البيانات");
    setIsActionLoading(true);
    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      
      // الرفع مع اسم الـ Bucket الجديد
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, imageFile);

      if (uploadError) throw new Error(`خطأ في الـ Bucket: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        name: productName, price: parseFloat(productPrice), location: productLocation, 
        image_url: publicUrl, whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح! 🚀");
    } catch (e: any) { 
      alert(e.message);
    } finally { 
      setIsActionLoading(false); 
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-4"
      >📦</motion.div>
      <h1 className="text-amber-500 font-black text-2xl tracking-widest animate-pulse">MILA STORE...</h1>
    </div>
  );

  return (
    <main className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f0f0f0] text-black'} transition-colors duration-500`} dir="rtl">
      
      {/* Header مع أنميشن ظهور */}
      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="max-w-7xl mx-auto p-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl border-b border-white/5"
      >
        <motion.h1 
          whileHover={{ scale: 1.1, rotate: -2 }}
          className="text-4xl font-black italic cursor-pointer"
        >
          MILA <span className="text-amber-500 underline decoration-double">STORE</span>
        </motion.h1>
        
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-3xl hover:rotate-12 transition-transform">
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          <motion.button 
            whileHover={{ scale: 1.1, boxShadow: "0px 0px 20px rgba(245, 158, 11, 0.5)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddForm(true)} 
            className="bg-amber-500 text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider"
          >
            بيع منتجك 💰
          </motion.button>
        </div>
      </motion.header>

      {/* البحث مع أنميشن */}
      <div className="max-w-4xl mx-auto p-8">
         <motion.input 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            type="text" placeholder="ماذا تريد أن تشتري اليوم؟ 🔍" 
            className={`w-full p-5 rounded-[2rem] outline-none border-2 transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-amber-500' : 'bg-white border-black/5 focus:border-amber-500 shadow-lg'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* المنتجات مع أنميشن قوي */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-10">
        <AnimatePresence>
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product, index) => {
            const isLiked = likedProducts.includes(product.id);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 50, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -15 }}
                key={product.id} 
                className={`p-5 rounded-[3.5rem] border-2 transition-all ${isDarkMode ? 'bg-neutral-900/50 border-white/5 hover:border-amber-500/50' : 'bg-white border-black/5 shadow-2xl hover:border-amber-500'}`}
              >
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6 relative group">
                  <motion.img 
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.6 }}
                    src={product.image_url} className="w-full h-full object-cover" 
                  />
                  
                  {/* زر الإعجاب المطور */}
                  <motion.button 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.5 }}
                    onClick={() => handleLike(product.id, product.likes_count)} 
                    className={`absolute top-6 left-6 p-4 rounded-3xl backdrop-blur-xl flex items-center gap-3 shadow-2xl transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-black/60 text-white'}`}
                  >
                    <span className="text-2xl">{isLiked ? '💖' : '🤍'}</span>
                    <span className="font-black text-lg">{product.likes_count || 0}</span>
                  </motion.button>

                  <div className="absolute bottom-6 right-6 bg-amber-500 text-black px-5 py-2 rounded-full text-xs font-black shadow-xl">
                    📍 {product.location}
                  </div>
                </div>

                <div className="flex justify-between items-center px-4 mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{product.name}</h3>
                  <div className="text-left">
                    <span className="text-3xl font-black text-amber-500">{product.price}</span>
                    <span className="text-[10px] block opacity-50 font-bold">دج (جزائري)</span>
                  </div>
                </div>

                <motion.a 
                  whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${product.whatsapp_number}`} target="_blank" 
                  className="w-full py-6 bg-[#25D366] text-white flex justify-center items-center gap-4 rounded-[2rem] font-black text-xl shadow-lg shadow-green-500/20"
                >
                  اطلب الآن عبر واتساب ✅
                </motion.a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      {/* نافذة الإضافة بأنيميشن احتفالي */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] p-6 flex items-center justify-center bg-black/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.7, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.7, rotate: 5 }}
              className={`max-w-lg w-full p-10 rounded-[4rem] border-2 ${isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black text-amber-500 italic">إعلان جديد ✨</h2>
                <button onClick={() => setShowAddForm(false)} className="text-4xl hover:rotate-90 transition-transform opacity-30">✕</button>
              </div>

              <div className="space-y-5">
                <div className="border-4 border-dashed border-amber-500/20 rounded-[2.5rem] p-10 text-center relative hover:bg-amber-500/5 transition-all">
                  <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <p className="text-4xl mb-2">🖼️</p>
                  <p className="font-black opacity-60 uppercase text-xs">{imageFile ? `✅ ${imageFile.name}` : "اضغط لرفع صورة احترافية"}</p>
                </div>
                
                <input type="text" placeholder="اسم السلعة" className="w-full p-5 rounded-2xl bg-gray-500/10 outline-none font-black focus:ring-2 ring-amber-500" value={productName} onChange={(e)=>setProductName(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-5 rounded-2xl bg-gray-500/10 outline-none font-black" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} />
                  <input type="tel" placeholder="رقم واتساب" className="w-full p-5 rounded-2xl bg-gray-500/10 outline-none font-black" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} />
                </div>
                
                <button 
                  onClick={handlePublish} disabled={isActionLoading}
                  className="w-full py-6 bg-amber-500 text-black font-black rounded-[2rem] text-2xl shadow-2xl shadow-amber-500/30 active:scale-95 transition-all"
                >
                  {isActionLoading ? "جاري الرفع الصاروخي... 🚀" : "انشر إعلانك الآن 🔥"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}