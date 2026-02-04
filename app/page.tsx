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
    const savedLikes = localStorage.getItem('mila_likes_v2');
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

    // تحديث فوري في الواجهة (Optimistic Update)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newLikesCount } : p));

    const { error } = await supabase
      .from('products')
      .update({ likes_count: newLikesCount })
      .eq('id', productId);

    if (!error) {
      const updatedLikes = isAlreadyLiked 
        ? likedProducts.filter(id => id !== productId) 
        : [...likedProducts, productId];
      
      setLikedProducts(updatedLikes);
      localStorage.setItem('mila_likes_v2', JSON.stringify(updatedLikes));
    } else {
      fetchProducts(); // تراجع عن التغيير في حال الخطأ
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى ملء كافة الخانات");
    setIsActionLoading(true);
    try {
      const compressed = await compressImage(imageFile);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // استخدام الـ Bucket الجديد تماماً
      const { error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        name: productName,
        price: parseFloat(productPrice),
        location: productLocation, 
        image_url: publicUrl,
        whatsapp_number: whatsapp,
        likes_count: 0
      }]);

      if (dbError) throw dbError;

      setShowAddForm(false);
      setProductName(''); setProductPrice(''); setImageFile(null); setWhatsapp('');
      fetchProducts();
      alert("تم النشر بنجاح في ميلة ستور! 🎉");
    } catch (e: any) { 
      alert("فشل الرفع: " + e.message + "\nتأكد من إنشاء Bucket باسم mila-market-assets وجعله Public");
    } finally { 
      setIsActionLoading(false); 
    }
  };

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-amber-500 font-black tracking-widest animate-pulse text-2xl italic">MILA STORE...</div>;

  return (
    <main className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f8f8] text-black'}`} dir="rtl">
      <header className="max-w-7xl mx-auto p-6 flex flex-wrap justify-between items-center gap-6 sticky top-0 z-[100] backdrop-blur-xl border-b border-white/5">
        <h1 className="text-4xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="عن ماذا تبحث؟" 
            className={`p-3 px-5 rounded-2xl outline-none text-sm border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-amber-500' : 'bg-black/5 border-black/10 focus:border-amber-500'}`} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl hover:scale-110 transition-transform">{isDarkMode ? '🌙' : '☀️'}</button>
          <button onClick={() => setShowAddForm(true)} className="bg-amber-500 text-black px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all">بيع سلعة</button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 py-12">
        <AnimatePresence>
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
            const isLiked = likedProducts.includes(product.id);
            return (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={product.id} className={`p-5 rounded-[3rem] border group hover:shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                <div className="aspect-[4/5] rounded-[2.2rem] overflow-hidden mb-5 relative">
                  <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  
                  <motion.button 
                    whileTap={{ scale: 0.7 }}
                    onClick={() => handleLike(product.id, product.likes_count)} 
                    className={`absolute top-5 left-5 p-3 px-4 rounded-2xl backdrop-blur-md flex items-center gap-2 transition-all ${isLiked ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-black/40 text-white'}`}
                  >
                    <motion.span animate={isLiked ? { scale: [1, 1.5, 1] } : {}}>{isLiked ? '❤️' : '🤍'}</motion.span>
                    <span className="text-sm font-black">{product.likes_count || 0}</span>
                  </motion.button>
                  
                  <div className="absolute bottom-5 right-5 bg-amber-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black italic shadow-lg">📍 {product.location}</div>
                </div>

                <div className="flex justify-between items-end mb-6 px-2">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{product.name}</h3>
                    <p className="opacity-40 text-[10px] mt-1 uppercase font-bold tracking-widest">التوفر: متوفر حالياً</p>
                  </div>
                  <span className="text-2xl font-black text-amber-500">{product.price} <small className="text-xs">دج</small></span>
                </div>

                <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="w-full py-5 bg-[#25D366] text-white flex justify-center items-center gap-3 rounded-2xl font-black hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-500/20">
                  تواصل عبر الواتساب 💬
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] p-6 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`max-w-md w-full p-10 rounded-[3rem] space-y-6 ${isDarkMode ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white text-black shadow-2xl'}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black italic text-amber-500">نشر إعلان</h2>
                <button onClick={() => setShowAddForm(false)} className="text-3xl opacity-30 hover:opacity-100 transition-opacity">✕</button>
              </div>
              
              <div className="border-2 border-dashed border-gray-500/20 rounded-3xl p-8 text-center relative hover:border-amber-500 transition-colors group">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📸</div>
                <p className="font-bold opacity-50 text-sm">{imageFile ? `✅ جاهز: ${imageFile.name.substring(0,10)}...` : "اختر صورة السلعة"}</p>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none font-bold focus:ring-2 ring-amber-500/50" value={productName} onChange={(e)=>setProductName(e.target.value)} />
                <input type="number" placeholder="السعر (دج)" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none font-bold focus:ring-2 ring-amber-500/50" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} />
                <input type="tel" placeholder="رقم واتساب" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none font-bold text-green-500 focus:ring-2 ring-green-500/50" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} />
                <select className="w-full p-4 bg-gray-500/10 rounded-xl outline-none font-bold" value={productLocation} onChange={(e)=>setProductLocation(e.target.value)}>
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl shadow-amber-500/20 text-xl active:scale-95 transition-transform">
                {isActionLoading ? "جاري الرفع الصاروخي... 🚀" : "انشر الآن"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}