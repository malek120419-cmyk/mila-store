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

  const handleLike = async (id: string, currentLikes: number) => {
    const { error } = await supabase
      .from('products')
      .update({ likes_count: (currentLikes || 0) + 1 })
      .eq('id', id);
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePublish = async () => {
    if (!productName || !productPrice || !imageFile || !whatsapp) return alert("يرجى إكمال البيانات");
    setIsActionLoading(true);
    try {
      const compressedBlob = await compressImage(imageFile);
      const fileName = `${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('products').insert([
        { name: productName, price: parseFloat(productPrice), location: productLocation, image_url: publicUrl, user_id: user.id, user_email: user.email, whatsapp_number: whatsapp, likes_count: 0 }
      ]);
      if (insertError) throw insertError;
      setShowAddForm(false);
      setProductName(''); setProductPrice(''); setImageFile(null); setWhatsapp('');
      fetchProducts();
    } catch (error: any) { alert(error.message); }
    finally { setIsActionLoading(false); }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'الكل' || p.location === selectedCity;
    return matchesSearch && matchesCity;
  });

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <main className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f0f0f0] text-black'}`} dir="rtl">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-amber-500 z-[1000]" style={{ scaleX }} />

      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center p-6 gap-6 sticky top-0 z-[100] backdrop-blur-md">
        <h1 className="text-4xl font-black italic tracking-tighter cursor-pointer">
          MILA <span className="text-amber-500">STORE</span>
        </h1>
        
        <div className={`flex items-center rounded-2xl px-5 py-2 w-full max-w-md border shadow-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
          <input type="text" placeholder="ماذا تبحث في ميلة؟" className="bg-transparent outline-none w-full text-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="bg-transparent text-amber-500 font-black outline-none text-xs mr-2 cursor-pointer" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
             <option value="الكل">كل ميلة</option>
             {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-5">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-2xl">{isDarkMode ? '🌙' : '☀️'}</button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} 
            className="bg-amber-500 text-black px-8 py-3 rounded-2xl font-black text-sm uppercase"
          >
            بيع منتجك
          </motion.button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 py-12">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div 
              layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              key={product.id} className={`p-5 rounded-[3.5rem] border group transition-all duration-500 ${isDarkMode ? 'bg-neutral-900/40 border-white/5' : 'bg-white border-black/5 shadow-md'}`}
            >
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6 bg-black relative">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-5 right-5 bg-amber-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black">📍 {product.location}</div>
                
                <button 
                  onClick={() => handleLike(product.id, product.likes_count)}
                  className="absolute bottom-5 right-5 bg-black/50 backdrop-blur-md text-white p-3 rounded-2xl flex items-center gap-2 hover:bg-red-500 transition-colors"
                >
                  <span className="text-sm font-black">{product.likes_count || 0}</span>
                  <span>❤️</span>
                </button>
              </div>

              <div className="flex justify-between items-center px-3 mb-6">
                <div>
                  <h3 className="text-2xl font-black">{product.name}</h3>
                  <p className="opacity-40 text-xs font-bold uppercase mt-1">{product.user_email.split('@')[0]}</p>
                </div>
                <span className="text-2xl font-black text-amber-500">{product.price} دج</span>
              </div>

              <a href={`https://wa.me/${product.whatsapp_number}`} target="_blank" className="w-full py-5 bg-[#25D366] text-white flex justify-center items-center gap-3 rounded-[1.5rem] font-black hover:brightness-110 transition-all">
                تواصل واتساب 💬
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed inset-0 z-[300] p-6 md:p-16 flex flex-col overflow-y-auto ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
             <button onClick={() => setShowAddForm(false)} className="text-3xl self-start mb-10 opacity-30">✕</button>
             <div className="max-w-xl mx-auto w-full space-y-8">
                <h2 className="text-5xl font-black italic mb-8 tracking-tighter text-amber-500">نشر إعلان</h2>
                <div className="border-4 border-dashed border-gray-500/10 rounded-[3rem] p-16 text-center relative bg-black/5">
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                   <p className="font-black opacity-50 text-xl">{imageFile ? `✅ جاهز` : "📷 اختر صورة"}</p>
                </div>
                <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="اسم السلعة" className={`w-full p-6 rounded-3xl outline-none font-black ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-black/5 border border-black/5'}`} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} placeholder="السعر" className={`w-full p-6 rounded-3xl outline-none font-black ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                  <input type="tel" value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="واتساب" className={`w-full p-6 rounded-3xl outline-none font-black ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                </div>
                <select value={productLocation} onChange={(e)=>setProductLocation(e.target.value)} className={`w-full p-6 rounded-3xl outline-none font-black ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl text-2xl shadow-lg shadow-amber-500/10">
                   {isActionLoading ? "جاري الرفع..." : "نشر الإعلان"}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}