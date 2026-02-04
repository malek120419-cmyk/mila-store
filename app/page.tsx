"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [sortBy, setSortBy] = useState('newest'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productLocation, setProductLocation] = useState('ميلة المركز');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    fetchProducts();
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase.from('products').update({ likes_count: (currentLikes || 0) + 1 }).eq('id', id);
    if (!error) setProducts(products.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
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
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى إكمال جميع البيانات");
    setIsActionLoading(true);
    try {
      const compressed = await compressImage(imageFile);
      const fileName = `${Date.now()}.jpg`;
      
      // تأكد أن الاسم هنا 'product-images' يطابق تماماً اسم الـ Bucket في سوبابيس
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      const { error: insertError } = await supabase.from('products').insert([{
        name: productName, price: parseFloat(productPrice), location: productLocation, 
        image_url: publicUrl, user_id: user.id, user_email: user.email, 
        whatsapp_number: whatsapp, likes_count: 0
      }]);

      if (insertError) throw insertError;

      setShowAddForm(false);
      setShowSuccess(true); 
      setProductName(''); setProductPrice(''); setImageFile(null); setWhatsapp('');
      fetchProducts();
    } catch (e: any) { 
      alert("خطأ في الرفع: " + e.message + " (تأكد من إنشاء Bucket باسم product-images)"); 
    }
    finally { setIsActionLoading(false); }
  };

  const processedProducts = products
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCity === 'الكل' || p.location === selectedCity))
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <main className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f7f7f7] text-black'}`} dir="rtl">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-amber-500 z-[1000]" style={{ scaleX }} />

      <header className="max-w-7xl mx-auto p-6 flex flex-wrap justify-between items-center gap-6 sticky top-0 z-[100] backdrop-blur-md">
        <h1 className="text-4xl font-black italic tracking-tighter cursor-pointer">MILA <span className="text-amber-500">STORE</span></h1>
        
        <div className="flex gap-4 flex-wrap items-center">
          <input type="text" placeholder="ابحث..." className={`p-3 rounded-xl outline-none text-sm w-40 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="bg-transparent text-amber-500 font-bold outline-none text-xs" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">الأحدث</option>
            <option value="price_low">الأرخص</option>
            <option value="likes">الأكثر إعجاباً</option>
          </select>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌙' : '☀️'}</button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2 rounded-xl font-black text-xs">بيع الآن</motion.button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
        <AnimatePresence>
          {processedProducts.map((product) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={product.id} className={`p-4 rounded-[2.5rem] border shadow-sm group ${isDarkMode ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5'}`}>
              <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative bg-black/10">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <button onClick={() => handleLike(product.id, product.likes_count)} className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-xl flex items-center gap-2 text-white">
                  <span className="text-xs font-bold">{product.likes_count || 0}</span> ❤️
                </button>
              </div>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xl font-black">{product.name}</h3>
                <span className="text-amber-500 font-black">{product.price} دج</span>
              </div>
              <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="w-full py-4 bg-[#25D366] text-white flex justify-center items-center rounded-2xl font-bold">تواصل واتساب</a>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }} className={`p-10 rounded-[3rem] text-center max-w-sm w-full ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}>
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-3xl font-black mb-4">شكراً لك!</h2>
              <p className="opacity-60 mb-8 font-bold">تم نشر منتجك بنجاح في سوق ميلة. نتمنى لك بيعاً سريعاً!</p>
              <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl">رائع</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed inset-0 z-[300] p-6 flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
            <div className="max-w-md w-full space-y-4">
              <button onClick={() => setShowAddForm(false)} className="text-2xl opacity-30">✕</button>
              <h2 className="text-4xl font-black mb-6">إعلان جديد</h2>
              <div className="border-2 border-dashed border-gray-500/20 rounded-2xl p-6 text-center relative cursor-pointer">
                <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="font-bold opacity-50">{imageFile ? `✅ ${imageFile.name}` : "📷 اضغط لاختيار صورة"}</p>
              </div>
              <input type="text" placeholder="الاسم" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none" value={productName} onChange={(e)=>setProductName(e.target.value)} />
              <input type="number" placeholder="السعر" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} />
              <input type="tel" placeholder="واتساب" className="w-full p-4 bg-gray-500/10 rounded-xl outline-none" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} />
              <select className="w-full p-4 bg-gray-500/10 rounded-xl outline-none" value={productLocation} onChange={(e)=>setProductLocation(e.target.value)}>
                {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl shadow-xl">
                {isActionLoading ? "جاري الرفع..." : "انشر الآن"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}