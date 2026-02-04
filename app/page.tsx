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
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
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

  // --- دالة ضغط الصورة (السر في السرعة) ---
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // تصغير العرض لسرعة الرفع
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.7); // ضغط الجودة لـ 70%
        };
      };
    });
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى إكمال البيانات");
    setIsActionLoading(true);

    try {
      // 1. ضغط الصورة قبل الرفع
      const compressedBlob = await compressImage(imageFile);
      const fileName = `${Date.now()}.jpg`;

      // 2. الرفع السريع لـ Supabase
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

      // 3. الحفظ في الداتابيز
      const { error: insertError } = await supabase.from('products').insert([
        { 
          name: productName, price: parseFloat(productPrice), 
          location: productLocation, image_url: publicUrl,
          user_id: user.id, user_email: user.email, whatsapp_number: whatsapp 
        }
      ]);

      if (insertError) throw insertError;

      setShowAddForm(false);
      setProductName(''); setProductPrice(''); setImageFile(null); setWhatsapp('');
      fetchProducts();
      alert("تم النشر بنجاح صاروخي! 🚀");

    } catch (error: any) {
      alert("حدث خطأ: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'الكل' || p.location === selectedCity;
    return matchesSearch && matchesCity;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <main className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f8f8] text-black'}`} dir="rtl">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-amber-500 z-[1000]" style={{ scaleX }} />

      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center p-6 gap-6 sticky top-0 z-[100] backdrop-blur-md">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-black italic">MILA <span className="text-amber-500">STORE</span></motion.h1>
        
        <div className={`flex items-center rounded-2xl px-4 py-2 w-full max-w-md border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
          <input type="text" placeholder="بحث..." className="bg-transparent outline-none w-full text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="bg-transparent text-amber-500 font-bold outline-none text-xs" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
             <option value="الكل">الكل</option>
             {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl">{isDarkMode ? '🌙' : '☀️'}</button>
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm opacity-50 font-bold">دخول</button>
          ) : (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] opacity-30 font-black">LOGOUT</button>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-sm">بيع منتجك</motion.button>
        </div>
      </header>

      {/* عرض المنتجات بأنيميشن مطور */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div 
              layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              key={product.id} className={`p-4 rounded-[2.5rem] border shadow-sm group relative ${isDarkMode ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5'}`}
            >
              {user?.id === product.user_id && (
                <button onClick={() => handleDelete(product.id)} className="absolute top-6 left-6 z-10 bg-red-500 p-2 rounded-full text-[10px]">🗑️</button>
              )}
              <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 bg-black/20">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex justify-between items-center px-2 mb-4">
                <div><h3 className="text-xl font-black">{product.name}</h3><p className="opacity-40 text-xs italic">📍 {product.location}</p></div>
                <span className="text-xl font-black text-amber-500">{product.price} دج</span>
              </div>
              <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="w-full py-4 bg-[#25D366] text-white flex justify-center items-center gap-2 rounded-2xl font-black hover:brightness-105 transition-all">تواصل واتساب 💬</a>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* نافذة الإضافة */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed inset-0 z-[300] p-6 md:p-12 flex flex-col ${isDarkMode ? 'bg-[#0c0c0c]' : 'bg-white'}`}>
             <button onClick={() => setShowAddForm(false)} className="text-2xl self-start mb-8 opacity-40">✕</button>
             <div className="max-w-xl mx-auto w-full space-y-6">
                <h2 className="text-4xl font-black italic mb-8">إضافة منتج جديد</h2>
                <div className="border-2 border-dashed border-gray-500/20 rounded-3xl p-10 text-center relative hover:border-amber-500/50 transition-colors">
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                   <p className="font-bold opacity-60">{imageFile ? `✅ ${imageFile.name}` : "📷 اختر صورة السلعة"}</p>
                </div>
                <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="اسم السلعة" className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} placeholder="السعر" className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none font-bold" />
                  <input type="tel" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="واتساب" className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none font-bold text-green-500" />
                </div>
                <select value={productLocation} onChange={(e)=>setProductLocation(e.target.value)} className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none font-bold">
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl text-xl shadow-xl shadow-amber-500/20">
                   {isActionLoading ? "جاري الرفع بسرعة صاروخية... 🚀" : "نشر الإعلان الآن"}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4">
            <div className={`p-10 rounded-[2.5rem] w-full max-w-md border ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-black/10'}`}>
              <h3 className="text-2xl font-black mb-6 text-center text-amber-500 uppercase italic">{isLoginView ? "Login" : "Join"}</h3>
              <div className="space-y-4">
                <input type="email" placeholder="الإيميل" className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-gray-500/10 rounded-2xl outline-none" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={() => {}} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg">تأكيد</button>
                <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center text-xs font-bold opacity-50">{isLoginView ? "سجل حساباً جديداً" : "ادخل لحسابك"}</button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-[10px] mt-4 opacity-20">إغلاق</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}