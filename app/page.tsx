"use client";

import React, { useState } from 'react';

const municipalities = [
  "ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", 
  "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"
];

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMun, setSelectedMun] = useState(municipalities[0]);
  const [showSellerSection, setShowSellerSection] = useState(false);

  const sellerWhatsApp = "213550031200"; 

  const handleOrder = () => {
    if(!name || !phone) { alert("يرجى ملء البيانات"); return; }
    const message = `طلب جديد من ميلة ستور:%0A- الاسم: ${name}%0A- الهاتف: ${phone}%0A- البلدية: ${selectedMun}`;
    window.open(`https://wa.me/${sellerWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white p-6 font-sans" dir="rtl">
      
      {/* القسم العلوي - اللوجو والاسم الجديد */}
      <div className="absolute top-8 flex items-center gap-2 border border-amber-500/30 px-4 py-1 rounded-full bg-amber-500/5">
        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        <span className="text-amber-500 font-bold tracking-widest text-sm">MILA MARKET HUB</span>
      </div>

      <div className="text-center space-y-10 max-w-2xl w-full mt-20">
        
        {/* الاسم الجديد العصري */}
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none italic">
          MILA <span className="text-amber-500 underline decoration-white/20">STORE</span>
        </h1>

        <p className="text-gray-500 text-lg">سوق ميلة الرقمي - البيع والشراء بكل ثقة</p>

        {/* واجهة المشتري (الطلب) */}
        {!showSellerSection ? (
          <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/10 space-y-6 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-bold text-amber-500">تأكيد طلبك السريع</h2>
            <input 
              type="text" placeholder="اسمك الكامل" 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500 outline-none transition"
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="text" placeholder="رقم الهاتف" 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500 outline-none transition"
              onChange={(e) => setPhone(e.target.value)}
            />
            <select 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500 outline-none transition appearance-none cursor-pointer"
              onChange={(e) => setSelectedMun(e.target.value)}
            >
              {municipalities.map(m => <option key={m} value={m} className="bg-black text-white">{m}</option>)}
            </select>
            <button 
              onClick={handleOrder}
              className="w-full py-5 bg-amber-500 text-black font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all text-xl"
            >
              إرسال الطلب عبر واتساب
            </button>
            
            <button 
              onClick={() => setShowSellerSection(true)}
              className="text-sm text-gray-500 hover:text-white underline transition"
            >
              هل أنت بائع؟ أضف منتجاتك هنا
            </button>
          </div>
        ) : (
          /* واجهة البائع (إضافة منتجات) - لوحة تحكم مصغرة */
          <div className="bg-amber-500 p-8 rounded-[2.5rem] text-black space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black italic">لوحة تحكم الباعة</h2>
            <div className="space-y-4">
              <input type="text" placeholder="اسم المنتج" className="w-full p-4 bg-white/20 border border-black/10 rounded-2xl placeholder-black/50 outline-none" />
              <input type="number" placeholder="السعر (دج)" className="w-full p-4 bg-white/20 border border-black/10 rounded-2xl placeholder-black/50 outline-none" />
              <div className="w-full p-8 border-2 border-dashed border-black/20 rounded-2xl text-center cursor-pointer hover:bg-white/10 transition">
                + ارفع صورة المنتج
              </div>
            </div>
            <button className="w-full py-4 bg-black text-white font-bold rounded-2xl">نشر المنتج في المتجر</button>
            <button 
              onClick={() => setShowSellerSection(false)}
              className="text-sm font-bold underline"
            >
              العودة لصفحة الشراء
            </button>
          </div>
        )}

        <div className="flex justify-center gap-8 text-xs text-gray-600 font-bold uppercase tracking-widest">
          <span>COD SERVICE</span>
          <span>MILA PROVINCE</span>
          <span>SECURE HUB</span>
        </div>
      </div>
    </main>
  );
}