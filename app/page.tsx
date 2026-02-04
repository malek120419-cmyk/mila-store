"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// --- الربط مع الملف السري .env.local ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

// منتجات تجريبية (سيتم استبدالها ببيانات الداتابيز لاحقاً)
const initialProducts = [
  { id: 1, name: "هاتف ذكي", price: "45000", location: "ميلة المركز", image: "📱" },
  { id: 2, name: "حذاء رياضي", price: "5500", location: "شلغوم العيد", image: "👟" },
  { id: 3, name: "ساعة يد", price: "12000", location: "فرجيوة", image: "⌚" },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [products] = useState(initialProducts);

  // التأكد من حالة تسجيل الدخول عند فتح الموقع
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // دالة التسجيل
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
    });
    if (error) alert("خطأ: " + error.message);
    else alert("تم بنجاح! تفقد إيميلك لتفعيل الحساب.");
  };

  // دالة الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-8" dir="rtl">
      
      {/* الهيدر الكامل (Logo + Auth) */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-black italic tracking-tighter">
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>
        
        <div className="flex items-center gap-4">
          {!user ? (
            <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-gray-400 hover:text-white transition">دخول</button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-gray-500">{user.email}</span>
              <button onClick={handleLogout} className="text-xs text-red-500 underline">خروج</button>
            </div>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-bold shadow-lg shadow-amber-500/20"
          >
            + أضف منتجك
          </motion.button>
        </div>
      </header>

      {/* قسم عرض المنتجات (الذي كان موجوداً سابقاً) */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black italic mb-4">سوق ميلة المفتوح</h2>
          <p className="text-gray-500">تصفح أحدث السلع في ولايتك</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div key={product.id} whileHover={{ y: -5 }} className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-sm">
              <div className="h-48 bg-black/40 rounded-3xl mb-4 flex items-center justify-center text-6xl">{product.image}</div>
              <h3 className="text-xl font-bold mb-1">{product.name}</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-500 font-black">{product.price} دج</span>
                <span className="text-gray-500">📍 {product.location}</span>
              </div>
              <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition">تفاصيل المنتج</button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* نافذة التسجيل (Auth Modal) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-neutral-900 p-10 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl">
              <h3 className="text-3xl font-black mb-6 text-center text-amber-500 italic">حساب جديد</h3>
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" onChange={(e)=>setPassword(e.target.value)} />
                <button onClick={handleSignUp} className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl text-lg mt-4 hover:bg-amber-400 transition-all">إنشاء حساب</button>
                <button onClick={() => setShowAuthModal(false)} className="w-full text-center text-gray-600 text-sm mt-4">إغلاق</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة إضافة منتج (التي كانت موجودة سابقاً) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg relative">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 left-6 text-gray-500">✕</button>
              <h2 className="text-2xl font-black mb-6 text-amber-500">تفاصيل المنتج الجديد</h2>
              <div className="space-y-4">
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" />
                <input type="number" placeholder="السعر" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" />
                <select className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500">
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => {alert("سيتم النشر فور ربط الجداول قريباً!"); setShowAddForm(false);}} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl">نشر الآن</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}