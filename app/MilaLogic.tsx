"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"]
};

// بار البحث الفائق
export const SearchBar = ({ placeholder, onChange }: any) => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
    className="relative w-full max-w-3xl mx-auto mb-12 px-4 group"
  >
    <input 
      type="text" 
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 outline-none text-center font-bold text-white focus:border-amber-500/50 focus:bg-white/[0.07] transition-all shadow-2xl text-lg"
    />
    <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity text-2xl">🔍</div>
  </motion.div>
);

// شريط الفئات الذكي (يدعم السحب)
export const CategoryBar = ({ active, onChange, lang }: any) => (
  <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar px-4 justify-start md:justify-center">
    {CATEGORIES[lang as 'ar' | 'en'].map((cat, i) => (
      <motion.button 
        key={i} 
        whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}
        onClick={() => onChange(CATEGORIES.ar[i])}
        className={`px-8 py-3.5 rounded-full text-[10px] font-black border transition-all whitespace-nowrap uppercase tracking-widest ${
          active === CATEGORIES.ar[i] 
          ? 'bg-amber-500 text-black border-amber-500 shadow-[0_10px_30px_rgba(245,158,11,0.3)]' 
          : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
        }`}
      >
        {cat}
      </motion.button>
    ))}
  </div>
);