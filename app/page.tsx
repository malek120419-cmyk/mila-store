import React, { useState } from 'react';

// قائمة بلديات ولاية ميلة
const municipalities = [
  "ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", 
  "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"
];

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMun, setSelectedMun] = useState(municipalities[0]);

  // استبدل الرقم التالي برقمك (ابدأ بـ 213)
  const sellerWhatsApp = "213XXXXXXXXX"; 

  const handleOrder = () => {
    if(!name || !phone) {
      alert("يرجى إدخال الاسم ورقم الهاتف لإتمام الطلب");
      return;
    }
    const message = `طلب جديد من ميلة ستور:%0A- الاسم: ${name}%0A- الهاتف: ${phone}%0A- البلدية: ${selectedMun}`;
    window.open(`https://wa.me/${sellerWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-6" dir="rtl">
      <div className="text-center space-y-10 max-w-2xl w-full">
        
        {/* العنوان الفخم (لم يحذف) */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
          ميلة ستور <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            عنوان الفخامة
          </span>
        </h1>

        <p className="text-gray-400 text-xl font-light leading-relaxed">
          نسقنا لك مجموعة استثنائية تليق بذوقك الرفيع. اطلب الآن واستلم في بلديتك.
        </p>

        {/* نموذج الطلب المدمج بتصميم أنيق يتناسب مع الخلفية السوداء */}
        <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 space-y-6 backdrop-blur-md shadow-2xl">
          
          <div className="text-right">
            <label className="text-sm text-amber-500 mb-2 block mr-2">الاسم الكامل</label>
            <input 
              type="text" 
              placeholder="مثلاً: محمد ميلة"
              className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="text-right">
            <label className="text-sm text-amber-500 mb-2 block mr-2">رقم الهاتف</label>
            <input 
              type="text" 
              placeholder="06xxxxxxxx"
              className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="text-right relative">
            <label className="text-sm text-amber-500 mb-2 block mr-2">اختر بلديتك في ميلة</label>
            <select 
              className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white appearance-none cursor-pointer"
              onChange={(e) => setSelectedMun(e.target.value)}
            >
              {municipalities.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
            </select>
            {/* سهم صغير لجمالية القائمة */}
            <div className="absolute left-4 top-12 pointer-events-none text-amber-500">▼</div>
          </div>

          <button 
            onClick={handleOrder}
            className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold rounded-2xl shadow-xl hover:scale-[1.03] transition-all text-xl mt-4"
          >
            تأكيد الطلب (دفع عند الاستلام)
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-gray-500 text-sm italic">
          <span>التوصيل متوفر</span>
          <div className="h-1 w-1 bg-gray-700 rounded-full"></div>
          <span>منتجات أصلية</span>
          <div className="h-1 w-1 bg-gray-700 rounded-full"></div>
          <span>ميلة ستور 2026</span>
        </div>
      </div>
    </main>
  );
}