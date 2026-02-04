"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

const initialProducts = [
  { id: 1, name: "هاتف ذكي", price: "45000", location: "ميلة المركز", image: "📱" },
  { id: 2, name: "حذاء رياضي", price: "5500", location: "شلغوم العيد", image: "👟" },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // حالة تسجيل الدخول
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // نافذة التسجيل
  const [products, setProducts] = useState(initialProducts);

  // دالة التعامل مع إضافة منتج
  const handleAddProductClick = () => {
    if (isLoggedIn) {
      setShowAddForm(true);
    } else {
      setShowAuthModal(true); // إذا لم يسجل، تظهر نافذة التسجيل
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-8" dir="rtl">
      
      {/* الهيدر */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <motion.h1 className="text-3xl font-black italic tracking-tighter">
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>
        
        <div className="flex gap-4">
          {!isLoggedIn ? (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-bold text-gray-400 hover:text-white transition"
            >
              تسجيل الدخول
            </button>
          ) : (
            <span className="text-green-500 text-sm font-bold">● متصل الآن</span>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleAddProductClick}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-bold shadow-lg shadow-amber-500/20"
          >
            + أضف منتجك
          </motion.button>
        </div>
      </header>

      {/* عرض المنتجات */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
              <div className="h-48 bg-black/40 rounded-2xl mb-4 flex items-center justify-center text-6xl">{product.image}</div>
              <h3 className="text-xl font-bold mb-1">{product.name}</h3>
              <p className="text-amber-500 font-bold mb-4">{product.price} دج</p>
              <button className="w-full py-3 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition">تفاصيل المنتج</button>
            </div>
          ))}
        </div>
      </div>

      {/* 1. نافذة التسجيل (Auth Modal) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-neutral-900 p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 text-center">
              <h2 className="text-3xl font-black mb-2">انضم إلى ميلة ستور</h2>
              <p className="text-gray-500 mb-8 text-sm">يجب إنشاء حساب لتتمكن من رفع منتجاتك</p>
              
              <div className="space-y-4">
                <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" />
                <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-amber-500" />
                <button 
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); }}
                  className="w-full py-4 bg-white text-black font-black rounded-2xl text-lg hover:bg-amber-500 transition-colors"
                >
                  إنشاء حساب جديد
                </button>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="mt-6 text-gray-600 text-sm">إلغاء</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. نافذة إضافة منتج (تظهر فقط بعد التسجيل) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg relative">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 left-6 text-gray-500">✕</button>
              <h2 className="text-2xl font-black mb-6 text-amber-500">تفاصيل المنتج الجديد</h2>
              <div className="space-y-4">
                <input type="text" placeholder="اسم المنتج" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none" />
                <input type="number" placeholder="السعر" className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none" />
                <select className="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none">
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => setShowAddForm(false)} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl">نشر الآن</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}