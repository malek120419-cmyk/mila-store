"use client";
import React from 'react';

export default function AdminPanel() {
  return (
    <main className="min-h-screen bg-[#050505] text-white p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black text-red-500">لوحة تحكم المسؤول (ADMIN)</h1>
          <div className="flex gap-4 text-xs">
            <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">المنتجات: <span className="text-amber-500 font-bold">128</span></div>
            <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">المستخدمين: <span className="text-amber-500 font-bold">45</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <h2 className="text-xl font-bold mb-2">إدارة المحتوى العام:</h2>
          {/* جدول بسيط لإدارة المنتجات */}
          <table className="w-full text-right bg-neutral-900/50 rounded-3xl overflow-hidden">
            <thead className="bg-neutral-800 text-gray-400 text-sm">
              <tr>
                <th className="p-4">المنتج</th>
                <th className="p-4">البائع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="p-4 font-bold">حذاء رياضي</td>
                <td className="p-4 text-gray-400 text-sm">محمد ميلة</td>
                <td className="p-4"><span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-md text-xs">نشط</span></td>
                <td className="p-4"><button className="text-red-500 font-bold hover:underline">حذف المنتج</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}