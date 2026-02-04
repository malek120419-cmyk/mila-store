import React, { useState } from 'react';

const municipalities = ["ميلة المركز", "شلغوم العيد", "فرجيوة", "تاجنانت", "تلاغمة", "القرارم قوقة", "وادي العثمانية", "سيدي مروان", "زغاية"];

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMun, setSelectedMun] = useState(municipalities[0]);
  const sellerWhatsApp = "213XXXXXXXXX"; // ضع رقمك هنا

  const handleOrder = () => {
    if(!name || !phone) { alert("يرجى ملء البيانات"); return; }
    const message = `طلب جديد من ميلة ستور:%0A- الاسم: ${name}%0A- الهاتف: ${phone}%0A- البلدية: ${selectedMun}`;
    window.open(`https://wa.me/${sellerWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-6" dir="rtl">
      <div className="text-center space-y-10 max-w-2xl w-full">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight">
          ميلة ستور <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">عنوان الفخامة</span>
        </h1>
        <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 space-y-6 backdrop-blur-md shadow-2xl">
          <input type="text" placeholder="الاسم الكامل" className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white" onChange={(e) => setName(e.target.value)} />
          <input type="text" placeholder="رقم الهاتف" className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white" onChange={(e) => setPhone(e.target.value)} />
          <select className="w-full p-4 bg-black/60 border border-gray-700 rounded-2xl focus:border-amber-500 outline-none transition text-white appearance-none cursor-pointer" onChange={(e) => setSelectedMun(e.target.value)}>
            {municipalities.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
          </select>
          <button onClick={handleOrder} className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold rounded-2xl shadow-xl hover:scale-[1.03] transition-all text-xl mt-4">تأكيد الطلب</button>
        </div>
      </div>
    </main>
  );
}