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

const initialProducts = [
  { id: 1, name: "هاتف ذكي", price: "45000", location: "ميلة المركز", image: "📱" },
  { id: 2, name: "حذاء رياضي", price: "5500", location: "شلغوم العيد", image: "👟" },
  { id: 3, name: "دراجة جبلية", price: "32000", location: "فرجيوة", image: "🚲" },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // أنيميشن شريط التقدم في أعلى الصفحة عند السكرول
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
    if (error) alert("خطأ: " + error.message);
    else alert("تفقد بريدك لتفعيل الحساب!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020202] text-white font-sans overflow-x-hidden" dir="rtl">
      
      {/* شريط التقدم العلوي */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      {/* الهيدر مع أنيميشن الدخول */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-8 backdrop-blur-md sticky top-0 z-[100]"
      >
        <motion.h1 
          whileHover={{ scale: 1.05 }}
          className="text-3xl font-black italic tracking-tighter cursor-pointer"
        >
          MILA <span className="text-amber-500 text-shadow-glow">STORE</span>
        </motion.h1>
        
        <div className="flex items-center gap-4">
          {!user ? (
            <motion.button whileHover={{ y: -2 }} onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-gray-400">دخول</motion.button>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
              <span className="text-[10px] text-amber-500 font-mono">{user.email.split('@')[0]}</span>
              <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black">خروج</button>
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(245, 158, 11, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2.5 rounded-full font-black text-sm"
          >
            + انشر إعلانك
          </motion.button>
        </div>
      </motion.header>

      {/* قسم البطولة (Hero Section) */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-9xl font-black italic mb-6 leading-none tracking-tighter">
            اكشف عن <br/> <span className="text-amber-500">كنوز ميلة</span>
          </h2>
          <p className="text-gray-500 text-lg md:text-2xl max-w-2xl mx-auto font-medium">
            المنصة الأولى والوحيدة في الولاية التي تجمع البائع والمشتري في مكان واحد وبكل احترافية.
          </p>
        </motion.div>
      </section>

      {/* شبكة المنتجات مع أنيميشن الظهور المتسلسل */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
        {initialProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
            className="group relative bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-6 hover:border-amber-500/30 transition-colors"
          >
            <div className="h-64 bg-black/50 rounded-3xl mb-6 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500">
              {product.image}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{product.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-amber-500">{product.price} <small className="text-xs">دج</small></span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400 font-bold">📍 {product.location}</span>
              </div>
            </div>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full mt-8 py-4 bg-white text-black font-black rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            >
              عرض التفاصيل
            </motion.button>
          </motion.div>
        ))}
      </section>

      {/* نافذة التسجيل الأنثوية الانسيابية */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.8, opacity: 0 }}
              className="bg-neutral-900 p-8 md:p-12 rounded-[3.5rem] border border-white/10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <h3 className="text-3xl font-black mb-8 text-center text-amber-500 italic uppercase">Welcome Back</h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-all" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-all" onChange={(e)=>setPassword(e.target.value)} />
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSignUp}
                  className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg shadow-lg shadow-amber-500/20"
                >
                  انضم الآن
                </motion.button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-500 text-sm font-bold mt-4">إغلاق النافذة</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة إضافة المنتج مع أنيميشن انزلاقي */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 right-0 md:left-auto md:w-[500px] bg-neutral-900 z-[300] p-8 shadow-2xl border-r border-white/10"
          >
            <div className="h-full flex flex-col justify-center">
              <button onClick={() => setShowAddForm(false)} className="absolute top-8 left-8 text-3xl">✕</button>
              <h2 className="text-4xl font-black mb-10 text-amber-500">بيع شيء جديد</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2 uppercase">اسم السلعة</label>
                  <input type="text" className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5 focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2 uppercase">السعر المطلوب</label>
                  <input type="number" className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5 focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2 uppercase">البلدية</label>
                  <select className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5">
                    {municipalities.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-6 bg-white text-black font-black rounded-2xl text-xl mt-8"
                >
                  تأكيد ونشر الإعلان
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}