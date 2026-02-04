"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

const initialProducts = [
  { id: 1, name: "هاتف ذكي", price: "45000", location: "ميلة المركز", image: "📱" },
  { id: 2, name: "حذاء رياضي", price: "5500", location: "شلغوم العيد", image: "👟" },
  { id: 3, name: "ساعة كلاسيكية", price: "12000", location: "فرجيوة", image: "⌚" },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("عذراً، حدث خطأ: " + error.message);
    else alert("تم إرسال رابط التفعيل إلى بريدك الإلكتروني.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 italic">جاري التحميل...</div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden" dir="rtl">
      
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      {/* الهيدر: الستايل واللوقو ثابتين كما طلبت */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-10 sticky top-0 z-[100] backdrop-blur-sm"
      >
        <h1 className="text-3xl font-black italic tracking-tighter cursor-default">
          MILA <span className="text-amber-500">STORE</span>
        </h1>
        
        <div className="flex items-center gap-6">
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-medium text-gray-400 hover:text-white transition">دخول</button>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span className="text-xs text-amber-500 font-mono">{user.email.split('@')[0]}</span>
              <button onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-red-500 transition">خروج</button>
            </div>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-7 py-2.5 rounded-full font-bold text-sm"
          >
            إضافة إعلان
          </motion.button>
        </div>
      </motion.header>

      {/* قسم البطولة: نصوص راقية وهادئة */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h2 className="text-5xl md:text-8xl font-black italic mb-8 leading-[1.1] tracking-tighter">
            تسوّق بذكاء <br/> <span className="text-amber-500 underline decoration-1 underline-offset-8">في ولايتك</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            منصة مخصصة لسكان ولاية ميلة، تجمع بين سهولة الاستخدام وأمان التعاملات التجارية.
          </p>
        </motion.div>
      </section>

      {/* شبكة المنتجات: أنيميشن انسيابي */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40">
        {initialProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="aspect-square bg-neutral-900/30 border border-white/5 rounded-[2rem] mb-6 flex items-center justify-center text-7xl transition-all duration-500 group-hover:bg-neutral-800/50 group-hover:border-amber-500/20">
              {product.image}
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white/90">{product.name}</h3>
                <span className="text-lg font-black text-amber-500">{product.price} دج</span>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                {product.location}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* نافذة التسجيل: هادئة وراقية */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/10 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 text-center italic">انضمام للمنصة</h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-amber-500/50 transition-all text-sm" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-amber-500/50 transition-all text-sm" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={handleSignUp} className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl mt-4">تسجيل الحساب</button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-500 text-xs mt-6 hover:text-white transition">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة إضافة منتج: جانبية راقية */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 right-0 md:left-auto md:w-[450px] bg-[#0c0c0c] z-[300] p-10 shadow-2xl border-r border-white/10"
          >
            <div className="h-full flex flex-col justify-center">
              <button onClick={() => setShowAddForm(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white">✕</button>
              <h2 className="text-3xl font-black mb-10 italic">إضافة عرض جديد</h2>
              <div className="space-y-6">
                <input type="text" placeholder="ما هو المنتج؟" className="w-full p-4 bg-white/5 rounded-xl outline-none border border-white/5 focus:border-amber-500/50 text-sm" />
                <input type="number" placeholder="حدد السعر المطلوب" className="w-full p-4 bg-white/5 rounded-xl outline-none border border-white/5 focus:border-amber-500/50 text-sm" />
                <select className="w-full p-4 bg-white/5 rounded-xl outline-none border border-white/5 text-sm text-gray-400">
                  {municipalities.map(m => <option key={m}>{m}</option>)}
                </select>
                <button className="w-full py-5 bg-white text-black font-bold rounded-xl text-md mt-6 shadow-xl">نشر الإعلان</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}