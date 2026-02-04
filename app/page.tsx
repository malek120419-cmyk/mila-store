// انسخ هذا الكود بالكامل وضعه في ملف page.tsx
import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="text-center space-y-8 max-w-3xl">
        
        {/* لمسة فنية فوق العنوان */}
        <div className="inline-block px-4 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-sm text-gray-400 mb-4">
          قريباً في ولاية ميلة 📍
        </div>

        {/* العنوان الفخم */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
          ميلة ستور <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            عنوان الفخامة
          </span>
        </h1>

        {/* وصف راقٍ */}
        <p className="text-gray-400 text-xl md:text-2xl max-w-xl mx-auto font-light leading-relaxed">
          نسقنا لك مجموعة استثنائية من أرقى الماركات العالمية، لنضع بين يديك تجربة تسوق تليق بذوقك الرفيع.
        </p>

        {/* أزرار بتصميم عصري */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
          <button className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
            استعرض المجموعة
          </button>
          <button className="px-10 py-4 border border-gray-700 rounded-xl font-medium hover:bg-white hover:text-black transition-all">
            من نحن
          </button>
        </div>

      </div>

      {/* لمسة أخيرة في الأسفل */}
      <div className="absolute bottom-10 flex items-center gap-2 text-gray-600">
        <span className="h-px w-8 bg-gray-800"></span>
        <span className="text-xs uppercase tracking-widest">Mila Store Luxury Edition</span>
        <span className="h-px w-8 bg-gray-800"></span>
      </div>
    </main>
  );
}