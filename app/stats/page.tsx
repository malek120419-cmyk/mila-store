 "use client";
 import React, { useEffect, useMemo, useState } from "react";
 import { createClient } from "@supabase/supabase-js";
 
 const supabase = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );
 
 type Product = {
   id: string;
   name: string;
   description: string | null;
   price: number;
   category: string;
   location: string;
   whatsapp: string;
   image_url: string;
   created_at: string;
   user_id: string;
 };
 
 export default function StatsPage() {
   const [user, setUser] = useState<{ id: string } | null>(null);
   const [products, setProducts] = useState<Product[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     supabase.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
   }, []);
 
   useEffect(() => {
     if (!user) return;
     supabase
       .from("products")
       .select("id,name,price,category,created_at")
       .eq("user_id", user.id)
       .order("created_at", { ascending: false })
       .then(({ data }) => {
         setProducts((data as Product[]) || []);
         setLoading(false);
       });
   }, [user]);
 
   const stats = useMemo(() => {
     const totalListed = products.length;
     const totalValue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
     const avgPrice = totalListed > 0 ? Math.round(totalValue / totalListed) : 0;
     const byCategory: Record<string, number> = {};
     products.forEach(p => {
       byCategory[p.category] = (byCategory[p.category] || 0) + 1;
     });
     const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
     const month = new Date().getMonth();
     const year = new Date().getFullYear();
     const listedThisMonth = products.filter(p => {
       const d = new Date(p.created_at);
       return d.getMonth() === month && d.getFullYear() === year;
     }).length;
     return { totalListed, totalValue, avgPrice, topCategory, listedThisMonth };
   }, [products]);
 
   if (!user) {
     return (
       <main className="min-h-screen bg-[#050505] text-white p-8">
         <div className="max-w-4xl mx-auto">
           <h1 className="text-3xl font-black mb-4 text-amber-500">Seller Stats</h1>
           <p className="opacity-60">Please sign in to view your statistics.</p>
         </div>
       </main>
     );
   }
 
   return (
     <main className="min-h-screen bg-[#050505] text-white p-8">
       <div className="max-w-5xl mx-auto">
         <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-black text-amber-500">Seller Stats</h1>
           <a href="/seller" className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20">My Listings</a>
         </div>
 
         {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl animate-pulse">
                 <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                 <div className="h-6 bg-white/10 rounded w-1/3" />
               </div>
             ))}
           </div>
         ) : (
           <>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                 <p className="text-white/50 text-xs">Total Listed</p>
                 <p className="text-3xl font-black">{stats.totalListed}</p>
               </div>
               <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                 <p className="text-white/50 text-xs">Avg Price</p>
                 <p className="text-3xl font-black">{stats.avgPrice}</p>
               </div>
               <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                 <p className="text-white/50 text-xs">Listed This Month</p>
                 <p className="text-3xl font-black">{stats.listedThisMonth}</p>
               </div>
               <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                 <p className="text-white/50 text-xs">Top Category</p>
                 <p className="text-3xl font-black truncate">{stats.topCategory}</p>
               </div>
             </div>
 
             <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
               <h2 className="text-xl font-black mb-4">Recent Listings</h2>
               <div className="space-y-3">
                 {products.slice(0, 10).map(p => (
                   <div key={p.id} className="flex items-center justify-between">
                     <div className="text-sm">
                       <p className="font-bold">{p.name}</p>
                       <p className="opacity-60 text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
                     </div>
                     <div className="font-black text-amber-500">{p.price}</div>
                   </div>
                 ))}
                 {products.length === 0 && <p className="opacity-60 text-sm">No listings yet.</p>}
               </div>
             </div>
           </>
         )}
       </div>
     </main>
   );
 }
