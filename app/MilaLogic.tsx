"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"]
};

export const SearchBar = ({ placeholder, onChange }: any) => (
  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-4xl mx-auto mb-10 px-4 group">
    <input type="text" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full p-8 rounded-[3rem] bg-white/[0.03] border border-white/10 outline-none text-center font-black text-white focus:border-amber-500/50 transition-all shadow-2xl text-xl" />
    <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity text-3xl">🔍</div>
  </motion.div>
);

export const CategoryBar = ({ active, onChange, lang }: any) => (
  <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar px-4 justify-start md:justify-center">
    {CATEGORIES[lang as 'ar' | 'en'].map((cat, i) => (
      <button key={i} onClick={() => onChange(CATEGORIES.ar[i])} className={`px-10 py-4 rounded-full text-[10px] font-black border transition-all whitespace-nowrap uppercase tracking-widest ${active === CATEGORIES.ar[i] ? 'bg-amber-500 text-black border-amber-500 shadow-xl' : 'bg-white/5 border-white/10 text-white/40'}`}>
        {cat}
      </button>
    ))}
  </div>
);