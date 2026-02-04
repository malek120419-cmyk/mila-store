import React, { useState } from 'react';

// قائمة بلديات ميلة
const municipalities = [
  "ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", 
  "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"
];

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMun, setSelectedMun] = useState(municipalities[0]);

  // هنا يمكنك تغيير الرقم حسب البائع (حالياً وضعنا رقمك كمثال)
  const sellerWhatsApp = "213XXXXXXXXX"; 

  const handleOrder = () => {
    if(!name || !phone) {
      alert("يرجى ملء الاسم والهاتف أولاً");
      return;
    }
    const message = `طلب جديد من ميلة ستور:%0A- الاسم: ${name}%0A- الهاتف: ${phone}%0A- البلدية: ${selectedMun}`;
    window.open(`https://wa.me/${sellerWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 font-sans" dir="rtl">
      <div className="text-center space-y-8 max-w-2xl w-full">
        
        {/* العنوان الراقي الذي طلبته سابقاً */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight">
          ميلة ستور <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            عنوان الفخامة
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl font-light">
          وجهتكم الأولى في ميلة - اطلب الآن وادفع عند الاستلام
        </p>

        {/* نموذج الطلب المدمج بتصميم أنيق */}
        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 space-y-5 backdrop-blur-sm">
          <div className="text-right">
            <label className="text-sm text-amber-500 mb-2 block">الاسم الكامل</label>
            <input 
              type="text" 
              placeholder="أدخل اسمك هنا"
              className="w-full p-4 bg-black/40 border border-gray-700 rounded-xl focus:border-amber-500 outline-none transition"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="text-right">
            <label className="text-sm text-amber-500 mb-2 block">رقم الهاتف</label>
            <input 
              type="text" 
              placeholder="213550031200"
              className="w-full p-4 bg-black/40 border border-gray-700 rounded-xl focus:border-amber-500 outline-none transition"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="text-right">
            <label className="text-sm text-amber-500 mb-2 block">اختر البلدية</label>
            <select 
              className="w-full p-4 bg-black/40 border border-gray-700 rounded-xl focus:border-amber-500 outline-none transition appearance-none"
              onChange={(e) => setSelectedMun(e.target.value)}
            >
              {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button 
            onClick={handleOrder}
            className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xl mt-4"
          >
            تأكيد الطلب عبر واتساب
          </button>
        </div>

        <p className="text-gray-600 text-sm">التوصيل متوفر لجميع بلديات ولاية ميلة 🚚</p>
      </div>
    </main>
  );
}