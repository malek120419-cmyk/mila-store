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
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true); // للتنقل بين دخول وتسجيل
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productLocation, setProductLocation] = useState('ميلة المركز');
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

  // --- دالة الدخول / التسجيل المباشر ---
  const handleAuth = async () => {
    if (!email || !password) return alert("يرجى إدخال البيانات");
    setIsActionLoading(true);

    if (isLoginView) {
      // تسجيل الدخول
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("خطأ في الدخول: " + error.message);
      else setShowAuthModal(false);
    } else {
      // إنشاء حساب جديد (بدون تفعيل إيميل - سيعمل إذا كانت الإعدادات الافتراضية تسمح)
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("خطأ في التسجيل: " + error.message);
      else alert("تم التسجيل! جرب الدخول الآن.");
    }
    setIsActionLoading(false);
  };

  const handlePublish = async () => {
    if (!productName || !productPrice) return alert("يرجى إكمال البيانات");
    setIsActionLoading(true);
    const { error } = await supabase.from('products').insert([
      { name: productName, price: parseFloat(productPrice), location: productLocation, user_id: user.id, user_email: user.email }
    ]);
    if (error) alert(error.message);
    else {
      setShowAddForm(false);
      setProductName(''); setProductPrice('');
      fetchProducts();
    }
    setIsActionLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-black italic">MILA STORE...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden" dir="rtl">
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      <header className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-10 sticky top-0 z-[100] backdrop-blur-sm">
        <h1 className="text-3xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex items-center gap-6">
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-medium text-gray-400">دخول</button>
          ) : (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-gray-500 font-bold uppercase">Logout</button>
          )}
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-7 py-2.5 rounded-full font-black text-sm">اضف منتجك</button>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <h2 className="text-6xl md:text-9xl font-black italic mb-8 leading-[1] tracking-tighter">وجهتك الأولى <br/> <span className="text-amber-500">لكل ما تحتاجه</span></h2>
        <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium">سوق ميلة الرقمي.. حيث تلتقي الجودة بسهولة الوصول.</p>
      </section>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-40">
        {products.map((product) => (
          <div key={product.id} className="group border border-white/5 rounded-[2.5rem] p-6 bg-neutral-900/40">
            <div className="aspect-square mb-6 flex items-center justify-center text-7xl bg-black/40 rounded-3xl">📦</div>
            <div className="flex justify-between items-end">
              <div><h3 className="text-2xl font-black">{product.name}</h3><p className="text-gray-500 text-sm">📍 {product.location}</p></div>
              <span className="text-xl font-black text-amber-500">{product.price} دج</span>
            </div>
          </div>
        ))}
      </section>

      {/* نافذة الدخول / التسجيل المطورة */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black mb-8 text-center text-amber-500 italic uppercase">
                {isLoginView ? "Login" : "Join Now"}
              </h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={handleAuth} disabled={isActionLoading} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg">
                  {isActionLoading ? "جاري..." : (isLoginView ? "دخول" : "إنشاء حساب")}
                </button>
                <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center text-amber-500/60 text-xs font-bold">
                  {isLoginView ? "ليس لديك حساب؟ سجل هنا" : "لديك حساب بالفعل؟ ادخل هنا"}
                </button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-600 text-[10px] mt-4 uppercase">Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة إضافة منتج */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 left-0 right-0 md:left-auto md:w-[500px] bg-[#0c0c0c] z-[300] p-12 border-r border-white/10 shadow-2xl">
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 mb-10 text-2xl">✕</button>
            <h2 className="text-4xl font-black mb-10 italic">New Listing</h2>
            <div className="space-y-6">
              <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="اسم المنتج" className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none" />
              <input type="number" value={productPrice} onChange={(e)=>setProductPrice(e.target.value)} placeholder="السعر" className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none" />
              <select value={productLocation} onChange={(e)=>setProductLocation(e.target.value)} className="w-full p-5 bg-black rounded-2xl border border-white/5 outline-none">
                {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-white text-black font-black rounded-2xl text-xl mt-8">
                {isActionLoading ? "جاري النشر..." : "نشر الآن"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}