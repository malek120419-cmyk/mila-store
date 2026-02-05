"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerDashboard() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number }>>([]);
  useEffect(() => {
    supabase.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
  }, []);
  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setProducts(data || []));
  }, [user]);
  const total = products.length;
  const favorites = 0;
  return (
    <main className="min-h-screen bg-[#050505] text-white p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 text-amber-500 underline decoration-white/10">منتجاتي المعروضة</h1>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
            <p className="text-white/50 text-xs">عدد المنتجات</p>
            <p className="text-3xl font-black">{total}</p>
          </div>
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
            <p className="text-white/50 text-xs">الإعجابات</p>
            <p className="text-3xl font-black">{favorites}</p>
          </div>
        </div>
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="bg-neutral-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl" />
                <div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-gray-500 text-sm">{p.price} دج</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">تعديل</button>
                <button className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
