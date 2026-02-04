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
    const savedLikes = localStorage.getItem('mila_likes_final');
    if (savedLikes) setLikedProducts(JSON.parse(savedLikes));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  // --- إصلاح منطق الإعجاب والأنميشن ---
  const handleLike = async (productId: string, currentLikes: number) => {
    const isAlreadyLiked = likedProducts.includes(productId);
    
    // 1. التحديث المحلي الفوري (للواجهة)
    const newLikesCount = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikedList = isAlreadyLiked 
      ? likedProducts.filter(id => id !== productId) 
      : [...likedProducts, productId];

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes_count: newLikesCount } : p));
    setLikedProducts(newLikedList);
    localStorage.setItem('mila_likes_final', JSON.stringify(newLikedList));

    // 2. التحديث في قاعدة البيانات في الخلفية
    const { error } = await supabase
      .from('products')
      .update({ likes_count: newLikesCount })
      .eq('id', productId);

    if (error) {
        console.error("Like error:", error);
        // في حال فشل السيرفر نرجع البيانات للأصل
        fetchProducts();
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
          const MAX_WIDTH = 700; // تقليل الحجم لسرعة الرفع
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.6); // ضغط أقوى لضمان النجاح
        };
      };
    });
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("أكمل البيانات");
    setIsActionLoading(true);
    try {
      const compressed = await compressImage(imageFile);
      const fileName = `${Date.now()}.jpg`;
      
      // الرفع مع إعدادات صريحة لتفادي مشاكل الـ Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mila-market-assets')
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error("مشكلة في الـ Bucket: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('mila-market-assets').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('products').insert([{
        name: productName, price: parseFloat(productPrice), location: productLocation, 
        image_url: publicUrl, whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (dbError) throw dbError;

      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح! 🎉");
    } catch (e: any) { 
      alert(e.message);
    } finally { 
      setIsActionLoading(false); 
    }
  };

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-amber-500 font-black italic animate-pulse">MILA STORE...</div>;

  return (
    <main className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'}`} dir="rtl">
      <header className="max-w-7xl mx-auto p-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-3xl font-black italic">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-xl">{isDarkMode ? '🌙' : '☀️'}</button>
          <button onClick={() => setShowAddForm(true)} className="bg-amber-500 text-black px-6 py-2 rounded-xl font-black text-xs">بيع سلعة</button>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
         <input 
            type="text" 
            placeholder="ابحث هنا..." 
            className={`w-full p-4 rounded-2xl outline-none border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
          const isLiked = likedProducts.includes(product.id);
          return (
            <div key={product.id} className={`p-4 rounded-[2.5rem] border ${isDarkMode ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
              <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative">
                <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                
                {/* زر الإعجاب فائق السرعة */}
                <motion.button 
                  whileTap={{ scale: 0.6 }} // أنميشن ضغطة سريع جداً
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  onClick={() => handleLike(product.id, product.likes_count)} 
                  className={`absolute top-4 left-4 p-2 px-3 rounded-xl backdrop-blur-md flex items-center gap-2 ${isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white'}`}
                >
                  <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                  <span className="font-bold text-sm">{product.likes_count || 0}</span>
                </motion.button>
              </div>

              <div className="flex justify-between items-center px-2 mb-4">
                <h3 className="text-xl font-black">{product.name}</h3>
                <span className="text-amber-500 font-black">{product.price} دج</span>
              </div>

              <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="block w-full text-center py-4 bg-[#25D366] text-white rounded-2xl font-black">واتساب 💬</a>
            </div>
          );
        })}
      </section>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] p-6 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className={`max-w-md w-full p-8 rounded-[2.5rem] ${isDarkMode ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}>
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-black text-amber-500">نشر إعلان</h2>
                <button onClick={() => setShowAddForm(false)}>✕</button>
              </div>
              <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mb-4 block w-full text-sm text-gray-500" />
              <input type="text" placeholder="اسم المنتج" className="w-full p-4 mb-3 rounded-xl bg-gray-500/10 outline-none" onChange={(e)=>setProductName(e.target.value)} />
              <input type="number" placeholder="السعر" className="w-full p-4 mb-3 rounded-xl bg-gray-500/10 outline-none" onChange={(e)=>setProductPrice(e.target.value)} />
              <input type="tel" placeholder="رقم الواتساب" className="w-full p-4 mb-6 rounded-xl bg-gray-500/10 outline-none" onChange={(e)=>setWhatsapp(e.target.value)} />
              <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-4 bg-amber-500 text-black font-black rounded-xl">
                {isActionLoading ? "جاري الرفع..." : "انشر الآن"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}