"use client";
import { motion } from "framer-motion";
import { Layout, Package, Eye, DollarSign, ArrowUpRight } from "lucide-react";

export default function SellerDashboard() {
  // بيانات تجريبية لبائع واحد (مثلاً بائع هواتف من ميلة)
  const myProducts = [
    { id: 1, name: "iPhone 13 Pro", price: "140,000", views: 240, status: "نشط" },
    { id: 2, name: "AirPods Pro", price: "35,000", views: 85, status: "قيد المراجعة" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12" dir="rtl">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black italic">لوحة <span className="text-blue-500">البائع</span></h1>
          <p className="text-gray-500 mt-1">أهلاً بك! إليك أداء منتجاتك اليوم في Mila Store</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-500 text-sm font-bold">
          معرّف البائع: #MILA_2026
        </div>
      </header>

      {/* Stats Cards - إحصائيات البائع فقط */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="إجمالي مبيعاتك" value="175,000 دج" icon={<DollarSign className="text-green-500" />} />
        <StatCard title="مشاهدات المنتجات" value="325" icon={<Eye className="text-blue-500" />} />
        <StatCard title="منتجات معروضة" value="2" icon={<Package className="text-purple-500" />} />
      </div>

      {/* Table - قائمة منتجات هذا البائع */}
      <div className="max-w-6xl mx-auto bg-[#0f0f0f] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">منتجاتي المعروضة</h2>
          <button className="text-sm text-blue-500 hover:underline">إضافة منتج آخر</button>
        </div>
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-400 text-sm">
            <tr>
              <th className="p-5 font-medium">اسم المنتج</th>
              <th className="p-5 font-medium text-center">السعر</th>
              <th className="p-5 font-medium text-center">المشاهدات</th>
              <th className="p-5 font-medium text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {myProducts.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-5 font-bold flex items-center gap-2">
                   <div className="w-8 h-8 bg-gray-800 rounded-lg" /> {p.name}
                </td>
                <td className="p-5 text-center font-black">{p.price} دج</td>
                <td className="p-5 text-center text-gray-400">{p.views} <ArrowUpRight size={14} className="inline text-green-500" /></td>
                <td className="p-5 text-center">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.status === 'نشط' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                     {p.status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// مكون صغير لبطاقات الإحصائيات
function StatCard({ title, value, icon }: { title: string, value: string, icon: any }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-[#0f0f0f] p-6 rounded-[2rem] border border-white/10">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 font-bold">{title}</span>
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
      </div>
      <div className="text-3xl font-black">{value}</div>
    </motion.div>
  );
}