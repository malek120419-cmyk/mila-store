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
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

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
    else alert("تم إرسال رابط التفعيل لبريدك.");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 italic font-black">MILA STORE...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden" dir="rtl">
      
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-right z-[1000]" style={{ scaleX }} />

      {/* الهيدر: ثابت اللوقو والزر (اضف منتجك) */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto flex justify-between items-center p-6 md:p-10 sticky top-0 z-[100] backdrop-blur-sm"
      >
        <h1 className="text-3xl font-black italic tracking-tighter">
          MILA <span className="text-amber-500">STORE</span>
        </h1>
        
        <div className="flex items-center gap-6">
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-medium text-gray-400 hover:text-white transition">دخول</button>
          ) : (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-gray-500 hover:text-red-500 transition font-bold">تسجيل الخروج</button>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-7 py-2.5 rounded-full font-black text-sm transition-shadow hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            اضف منتجك
          </motion.button>
        </div>
      </motion.header>

      {/* قسم البطولة: المجموعة (ب) المعتمدة */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h2 className="text-6xl md:text-9xl font-black italic mb-8 leading-[1] tracking-tighter">
            وجهتك الأولى <br/> <span className="text-amber-500">لكل ما تحتاجه</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            سوق ميلة الرقمي.. حيث تلتقي الجودة بسهولة الوصول.
          </p>
        </motion.div>
      </section>

      {/* شبكة العرض الانسيابية */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pb-40">
        {initialProducts.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[4/5] bg-neutral-900/40 border border-white/5 rounded-[2.5rem] mb-6 flex items-center justify-center text-8xl transition-all duration-500 group-hover:border-amber-500/20 group-hover:bg-neutral-800/60 shadow-2xl">
              {product.image}
            </div>
            <div className="px-4 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-white/90">{product.name}</h3>
                <p className="text-gray-500 text-sm mt-1">📍 {product.location}</p>
              </div>
              <span className="text-xl font-black text-amber-500">{product.price} <small className="text-[10px]">دج</small></span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* النوافذ المنبثقة */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/10 w-full max-w-md">
              <h3 className="text-3xl font-black mb-8 text-center italic tracking-tighter text-amber-500">MILA MEMBER</h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none focus:border-amber-500/50 transition-all text-sm" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-black border border-white/5 rounded-2xl outline-none focus:border-amber-500/50 transition-all text-sm" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={handleSignUp} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg shadow-lg active:scale-95 transition-transform">تأكيد الانضمام</button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-600 text-xs mt-6 hover:text-white transition font-bold uppercase tracking-widest">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25 }} className="fixed inset-y-0 left-0 right-0 md:left-auto md:w-[500px] bg-[#0c0c0c] z-[300] p-12 shadow-2xl border-r border-white/10">
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white mb-10 text-2xl">✕</button>
            <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter">New Product</h2>
            <div className="space-y-6">
              <input type="text" placeholder="ماذا تبيع اليوم؟" className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5 focus:border-amber-500/50" />
              <input type="number" placeholder="حدد السعر" className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5 focus:border-amber-500/50" />
              <select className="w-full p-5 bg-black rounded-2xl outline-none border border-white/5 text-gray-400">
                {municipalities.map(m => <option key={m}>{m}</option>)}
              </select>
              <button className="w-full py-6 bg-white text-black font-black rounded-2xl text-xl mt-8 hover:bg-amber-500 transition-colors">نشر المنتج</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}