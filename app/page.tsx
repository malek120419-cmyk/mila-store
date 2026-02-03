"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, X, Phone, MessageCircle, Package, Info, ArrowRight, LayoutGrid, Sparkles, Camera } from "lucide-react";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [desc, setDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");

  const commission = 1.20;

  useEffect(() => {
    const saved = localStorage.getItem("mila_pro_v3");
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const handleAdd = () => {
    if (!name || price <= 0 || !phone) return alert("يرجى إكمال البيانات الأساسية");
    const newP = { 
        id: Date.now(), 
        name, 
        price: (price * commission).toFixed(0), 
        desc, 
        phone,
        image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop"
    };
    const newList = [newP, ...products];
    setProducts(newList);
    localStorage.setItem("mila_pro_v3", JSON.stringify(newList));
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setName(""); setPrice(0); setDesc(""); setPhone(""); setImage("");
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden font-sans selection:bg-blue-500/30" dir="rtl">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20">
              <Sparkles size={22} className="text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic uppercase">MILA<span className="text-blue-500">STORE</span></h1>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Plus size={20}/> ابدأ البيع
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-24 px-6 text-center">
          <h2 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1]">تسوق بذكاء، <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">بع بلمسة واحدة</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl">أكبر تجمع تجاري في ولاية ميلة 🇩🇿</p>
      </header>

      {/* Grid المنتجات */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40">
        <AnimatePresence>
          {products.map((p) => (
            <motion.div 
              key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setSelectedProduct(p)}
              className="group bg-[#0a0a0a] border border-white/5 rounded-[2.8rem] p-5 cursor-pointer hover:border-blue-500/40 transition-all duration-500 shadow-xl"
            >
              <div className="h-64 bg-gray-900 rounded-[2.2rem] mb-6 overflow-hidden relative">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="px-2">
                <h4 className="text-2xl font-bold mb-2">{p.name}</h4>
                <div className="text-3xl font-black text-blue-500">{Number(p.price).toLocaleString()} <span className="text-sm">دج</span></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* نافذة إضافة منتج - تم إصلاح مشكلة النزول لتحت هنا */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl relative z-10 shadow-3xl max-h-[90vh] flex flex-col"
            >
              {/* Header ثابت */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-3xl font-black italic tracking-tighter">انضم <span className="text-blue-500">للتجار</span></h3>
                <button onClick={() => setShowForm(false)} className="bg-white/5 p-2 rounded-full hover:bg-red-500/20 text-white"><X size={24}/></button>
              </div>

              {/* محتوى الاستمارة - قابل للتمرير */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2 uppercase">اسم السلعة</label>
                    <input placeholder="مثلاً: MacBook M3" onChange={(e)=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2 uppercase">رابط الصورة (URL)</label>
                    <input placeholder="https://..." onChange={(e)=>setImage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2 uppercase">سعر البيع</label>
                    <input type="number" placeholder="0" onChange={(e)=>setPrice(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-500 uppercase">سعر العرض للزبون</label>
                    <div className="w-full bg-blue-600/10 border border-blue-600/20 rounded-2xl p-4 text-blue-500 font-black text-center">{(price * commission).toFixed(0)} دج</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2 uppercase">وصف المنتج</label>
                  <textarea placeholder="اشرح للناس مميزات منتجك..." onChange={(e)=>setDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-28 outline-none focus:border-blue-500 resize-none text-white" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2 uppercase text-right block">رقم الهاتف للطلبات</label>
                  <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-green-500 transition-all">
                    <input placeholder="06... / 05... / 07..." onChange={(e)=>setPhone(e.target.value)} className="w-full bg-transparent p-4 outline-none text-left font-mono text-lg text-white" dir="ltr" />
                    <div className="px-4 border-r border-white/10 text-gray-500"><Phone size={20} /></div>
                  </div>
                </div>

                <button onClick={handleAdd} className="w-full bg-blue-600 py-5 rounded-3xl font-black text-xl shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-all mt-4 mb-2">نشر العرض الآن</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة التفاصيل الجانبية (بقية الكود) */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }}
              className="relative bg-[#080808] w-full max-w-xl h-full p-8 md:p-12 border-r border-white/10 overflow-y-auto"
            >
              <button onClick={() => setSelectedProduct(null)} className="mb-10 p-4 bg-white/5 rounded-2xl hover:bg-red-500/20 text-white"><ArrowRight/></button>
              <img src={selectedProduct.image} className="w-full aspect-video object-cover rounded-[2.5rem] mb-8 shadow-2xl" alt="" />
              <h2 className="text-5xl font-black mb-4 leading-tight">{selectedProduct.name}</h2>
              <p className="text-4xl font-black text-blue-500 mb-8">{Number(selectedProduct.price).toLocaleString()} دج</p>
              <div className="bg-white/5 p-8 rounded-[2rem] mb-10 border border-white/5">
                <p className="text-gray-300 leading-relaxed text-xl whitespace-pre-wrap">{selectedProduct.desc || "لا يوجد وصف."}</p>
              </div>
              <a href={`https://wa.me/213${selectedProduct.phone.substring(1)}`} className="flex items-center justify-center gap-4 w-full bg-green-600 py-6 rounded-3xl font-black text-2xl hover:bg-green-500 transition-all">
                <MessageCircle size={28}/> اطلب عبر واتساب
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 10px; }
      `}</style>

    </div>
  );
}