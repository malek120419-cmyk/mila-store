"use client";
import React from 'react';

export const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"]
};

// بار البحث (تصميم مريح لليد على الجوال)
export const SearchBar = ({ placeholder, onChange }: any) => (
  <div className="relative w-full max-w-2xl mx-auto mb-8 px-4">
    <input 
      type="text" 
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-5 rounded-[2rem] bg-white/5 border border-white/10 outline-none text-center font-bold text-white focus:ring-2 ring-amber-500/50 transition-all shadow-inner"
    />
    <span className="absolute left-10 top-1/2 -translate-y-1/2 opacity-20 text-xl">🔍</span>
  </div>
);

// شريط الفئات (يدعم السحب الأفقي باللمس)
export const CategoryBar = ({ active, onChange, lang }: any) => (
  <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar px-4">
    {CATEGORIES[lang as 'ar' | 'en'].map((cat, i) => (
      <button 
        key={i} 
        onClick={() => onChange(CATEGORIES.ar[i])}
        className={`px-7 py-3 rounded-full text-[10px] font-black border transition-all whitespace-nowrap ${
          active === CATEGORIES.ar[i] 
          ? 'bg-amber-500 text-black border-amber-500 shadow-xl scale-105' 
          : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
);