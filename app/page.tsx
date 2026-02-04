"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

// عينة لمنتجات تجريبية لتظهر في المتجر
const initialProducts = [
  { id: 1, name: "هاتف ذكي", price: "45000", location: "ميلة المركز", image: "📱" },
  { id: 2, name: "حذاء رياضي", price: "5500", location: "شلغوم العيد", image: "👟" },
  { id: 3, name: "ساعة يد", price: "12000", location: "فرجيوة", image: "⌚" },
];

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState(initialProducts);

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-8" dir="rtl">
      
      {/* الهيدر (الشعار وزر الإضافة) */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <motion.h1 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-3xl font-black italic tracking-tighter"
        >
          MILA <span className="text-amber-500">STORE</span>
        </motion.h1>
        
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-amber-500 text-black px-6 py-2 rounded-full font-bold shadow-lg shadow-amber-500/20"
        >
          + أضف منتجك
        </motion.button>
      </header>

      {/* قسم عرض المنتجات */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl text-gray-400 mb-6 mr-2">أحدث المنتجات في ولاية ميلة:</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 hover:border-amber-500/30 transition-all group"
            >
              <div className="h-48 bg-black/40 rounded-2xl mb-4 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                {product.image}
              </div>
              <h3 className="text-xl font-bold mb-1">{product.name}</h3>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span className="text-amber-500 font-bold">{product.price} دج</span>
                <span>📍 {product.location}</span>
              </div>
              <button 
                onClick={() => alert(`سيتم فتح تفاصيل ${product.name} مع رقم الواتساب قريباً`)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors"
              >
                تفاصيل المنتج
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* نافذة إضافة منتج (تظهر للجميع) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg relative"
            >
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 left-6 text-gray-500">✕</button>
              
              <h2 className="text-2xl font-black mb-6 text-amber-500">انشر منتجك الآن</h2>
              
              <div className="space-y-4">
                <input type="text" placeholder="ماذا تبيع؟ (اسم المنتج)" className="w-full p-4 bg-black border border-white/10 rounded-2xl focus:border-amber-500 outline-none" />
                <input type="number" placeholder="السعر بالدينار" className="w-full p-4 bg-black border border-white/10 rounded-2xl focus:border-amber-500 outline-none" />
                <select className="w-full p-4 bg-black border border-white/10 rounded-2xl focus:border-amber-500 outline-none appearance-none">
                  {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="w-full p-8 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-500 hover:bg-white/5 cursor-pointer">
                  📸 ارفع صور المنتج
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-lg mt-4"
                >
                  نشر المنتج للجميع
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}