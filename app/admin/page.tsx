"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, ShoppingCart, Plus, X, Phone } from "lucide-react";

export default function AdminDashboard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 border-l border-white/5 p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-10 flex items-center gap-2">
          <LayoutDashboard /> الإدارة
        </h2>
        <nav className="space-y-4 text-gray-400">
          <div className="text-blue-500 bg-blue-500/10 p-3 rounded-xl font-bold">الرئيسية</div>
          <div className="hover:text-white p-3 cursor-pointer">المنتجات</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black">Mila Store Control</h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> إضافة منتج جديد
          </button>
        </header>

        {/* Modal - نافذة إضافة منتج */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f0f0f] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-500">تفاصيل المنتج الجديد</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">اسم المنتج</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none" placeholder="مثلاً: ساعة ذكية" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">السعر (دج)</label>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none" placeholder="12000" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 text-green-500 flex items-center gap-1">
                        <Phone size={14} /> رقم الهاتف
                      </label>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-green-500 outline-none" placeholder="0661..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">رابط الصورة (URL)</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-blue-500 outline-none" placeholder="https://..." />
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg shadow-blue-600/20">
                    حفظ المنتج ونشره
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Stats Section Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5">
              <p className="text-gray-400 mb-2">إجمالي الطلبات</p>
              <h3 className="text-4xl font-black text-blue-500">24</h3>
           </div>
           <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/5">
              <p className="text-gray-400 mb-2">المبيعات المقدرة</p>
              <h3 className="text-4xl font-black text-green-500">182,000 دج</h3>
           </div>
        </div>
      </main>
    </div>
  );
}