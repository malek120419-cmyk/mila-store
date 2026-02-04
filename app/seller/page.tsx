"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function SellerDashboard() {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 text-amber-500 underline decoration-white/10">منتجاتي المعروضة</h1>
        
        {/* قائمة منتجات البائع فقط */}
        <div className="space-y-4">
          <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-2xl">📱</div>
              <div>
                <h3 className="font-bold text-lg">هاتف ذكي للبيع</h3>
                <p className="text-gray-500 text-sm">السعر: 45000 دج</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold">تعديل</button>
              <button className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold">حذف</button>
            </div>
          </div>
          {/* يمكن تكرار المنتجات هنا */}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          className="w-full mt-8 py-4 border-2 border-dashed border-amber-500/30 rounded-3xl text-amber-500 font-bold"
        >
          + أضف منتجاً جديداً للمتجر
        </motion.button>
      </div>
    </main>
  );
}