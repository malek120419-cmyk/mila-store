"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// الربط مع Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]); // مصفوفة المنتجات الحقيقية
  
  // حالات النوافذ والنموذج
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productLocation, setProductLocation] = useState('ميلة المركز');
  const [isPublishing, setIsPublishing] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // 1. جلب البيانات عند فتح الموقع
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

  // دالة جلب المنتجات من الداتابيز
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setProducts(data);
  };

  // دالة النشر
  const handlePublish = async () => {
    if (!productName || !productPrice) return alert("يرجى إكمال البيانات");
    setIsPublishing(true);

    const { error } = await supabase.from('products').insert([
      { 
        name: productName, 
        price: parseFloat(productPrice), 
        location: productLocation,
        user_id: user.id,
        user_email: user.email
      }
    ]);

    if (error) {
      alert("خطأ في النشر: " + error.message);
    } else {
      alert("تم النشر بنجاح!");
      setShowAddForm(false);
      setProductName('');
      setProductPrice('');
      fetchProducts(); // تحديث القائمة فوراً
    }
    setIsPublishing(false);
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("تأكد من بريدك الإلكتروني لتفعيل حسابك.");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden" dir="rtl">
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      {/* الهيدر الثابت */}
      <header className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-10 sticky top-0 z-[100] backdrop-blur-sm">
        <h1 className="text-3xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex items-center gap-6">
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-medium text-gray-400">دخول</button>
          ) : (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-gray-500 font-bold uppercase">Logout</button>
          )}
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-7 py-2.5 rounded-full font-black text-sm">
            اضف منتجك
          </button>
        </div>
      </header>

      {/* المجموعة ب */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <h2 className="text-6xl md:text-9xl font-black italic mb-8 leading-[1] tracking-tighter">وجهتك الأولى <br/> <span className="text-amber-500">لكل ما تحتاجه</span></h2>
        <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium">سوق ميلة الرقمي.. حيث تلتقي الجودة بسهولة الوصول.</p>
      </section>

      {/* عرض المنتجات الحقيقية من الداتابيز */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-40">
        {products.length > 0 ? products.map((product, index) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group">
            <div className="aspect-[4/5] bg-neutral-900/40 border border-white/5 rounded-[2.5rem] mb-6 flex items-center justify-center text-7xl shadow-2xl group-hover:bg-neutral-800/60 transition-all">
              📦
            </div>
            <div className="px-4 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-white/90">{product.name}</h3>
                <p className="text-gray-500 text-sm mt-1">📍 {product.location}</p>
              </div>
              <span className="text-xl font-black text-amber-500">{product.price} <small className="text-[10px]">دج</small></span>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full text-center py-20 text-gray-600 italic">لا توجد منتجات معروضة حالياً.. كن أول من يضيف منتجاً!</div>
        )}
      </section>

      {/* نافذة إضافة منتج */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 left-0 right-0 md:left-auto md:w-[500px] bg-[#0c0c0c] z-[300] p-12 border-r border-white/10">
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 mb-10 text-2xl">✕</button>
            <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter">New Product</h2>
            <div className="space-y-6">
              <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="اسم المنتج" className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none" />
              <input type="number" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} placeholder="السعر" className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none" />
              <select value={productLocation} onChange={(e)=>setProductLocation(e.target.value)} className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none text-gray-400">
                {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={handlePublish} disabled={isPublishing} className="w-full py-6 bg-white text-black font-black rounded-2xl text-xl mt-8 hover:bg-amber-500">
                {isPublishing ? "جاري النشر..." : "نشر المنتج الآن"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة التسجيل */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black mb-8 text-center text-amber-500 italic uppercase underline underline-offset-8">Join Mila Store</h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={handleSignUp} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg active:scale-95 transition-transform">تأكيد الانضمام</button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-600 text-xs mt-4">إغلاق</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}