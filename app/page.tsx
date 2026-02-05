"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- تصحيح الشادو والأنيميشن ---

const GlassCard = ({ children, onClick }: any) => (
  <motion.div 
    whileHover={{ 
      y: -12, 
      boxShadow: "0px 20px 40px rgba(245, 158, 11, 0.15)", // توهج ذهبي خفيف بدل الخطأ السابق
      borderColor: "rgba(245, 158, 11, 0.4)" 
    }}
    onClick={onClick}
    className="bg-[#121212] border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl"
  >
    {children}
  </motion.div>
);

const MilaButton = ({ children, onClick, primary = false, className = "" }: any) => (
  <motion.button
    whileHover={{ scale: 1.05, boxShadow: primary ? "0px 10px 20px rgba(245, 158, 11, 0.3)" : "0px 10px 20px rgba(255, 255, 255, 0.05)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
      primary ? "bg-amber-500 text-black" : "bg-white/5 text-white border border-white/10"
    } ${className}`}
  >
    {children}
  </motion.button>
);

export default function MilaMarketplaceV2() {
  const [view, setView] = useState<'home' | 'details' | 'sell' | 'chat'>('home');
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const filtered = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-amber-500 font-black italic text-4xl animate-pulse">MILA LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-amber-500 selection:text-black">
      
      {/* Navbar الاحترافي */}
      <nav className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-2xl border-b border-white/5 p-6 flex justify-between items-center px-12">
        <h1 onClick={() => setView('home')} className="text-3xl font-black italic tracking-tighter cursor-pointer text-amber-500">MILA<span className="text-white">.AMZ</span></h1>
        
        <div className="flex-1 max-w-xl mx-10 relative hidden md:block">
          <input onChange={(e) => setSearch(e.target.value)} placeholder="Search everything..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-center focus:border-amber-500 transition-all font-bold" />
        </div>

        <div className="flex gap-4">
          <MilaButton onClick={() => setView('sell')} primary>Sell Now +</MilaButton>
          <div onClick={() => setView('chat')} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-amber-500 hover:text-black transition-all">💬</div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-8 max-w-[1800px] mx-auto">
        <AnimatePresence mode="wait">
          
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {filtered.map((p) => (
                <GlassCard key={p.id} onClick={() => { setSelected(p); setView('details'); }}>
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={p.image_url} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-amber-500 text-black text-[8px] font-black px-3 py-1 rounded-lg">PREMIUM</div>
                  </div>
                  <div className="p-8 text-center">
                    <h3 className="text-[11px] font-black opacity-30 uppercase truncate mb-2">{p.name}</h3>
                    <p className="text-3xl font-black tracking-tighter">{p.price} <small className="text-xs opacity-40">DZD</small></p>
                  </div>
                </GlassCard>
              ))}
            </motion.div>
          )}

          {view === 'details' && selected && (
            <motion.div key="details" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 py-10">
              <div className="w-full md:w-1/2 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-amber-500/20">
                <img src={selected.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <h2 className="text-6xl font-black italic text-amber-500 mb-6 uppercase tracking-tighter">{selected.name}</h2>
                <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 mb-8">
                  <p className="text-sm opacity-40 uppercase font-black mb-2">Price in Mila Province</p>
                  <p className="text-5xl font-black">{selected.price} DZD</p>
                </div>
                <a href={`https://wa.me/${selected.whatsapp}`} target="_blank" className="w-full bg-[#25D366] text-black p-8 rounded-[2.5rem] flex items-center justify-center gap-4 font-black uppercase text-sm hover:scale-105 transition-transform shadow-2xl">
                   WhatsApp Contact
                </a>
                <button onClick={() => setView('home')} className="mt-8 opacity-20 hover:opacity-100 font-black uppercase text-[10px] tracking-[0.5em]">Back to Store</button>
              </div>
            </motion.div>
          )}

          {view === 'sell' && (
             <motion.div key="sell" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-2xl mx-auto bg-[#111] p-12 rounded-[4rem] border border-white/5 shadow-2xl">
                <h2 className="text-4xl font-black italic text-amber-500 mb-10 text-center uppercase tracking-tighter">Publish Ad</h2>
                <form className="space-y-6" onSubmit={async (e: any) => {
                  e.preventDefault();
                  setLoading(true);
                  const fd = new FormData(e.target);
                  const file = fd.get('img') as File;
                  const fName = `${Date.now()}-${file.name}`;
                  await supabase.storage.from('product-images').upload(fName, file);
                  const { data: url } = supabase.storage.from('product-images').getPublicUrl(fName);
                  await supabase.from('products').insert([{ name: fd.get('name'), price: fd.get('price'), whatsapp: fd.get('whatsapp'), category: 'Global', image_url: url.publicUrl }]);
                  setView('home'); fetchProducts();
                }}>
                  <input name="name" placeholder="Item Name" className="w-full p-6 rounded-3xl bg-black border border-white/10 outline-none font-bold focus:border-amber-500" required />
                  <input name="price" placeholder="Price" className="w-full p-6 rounded-3xl bg-black border border-white/10 outline-none font-bold" required />
                  <input name="whatsapp" placeholder="WhatsApp Number" className="w-full p-6 rounded-3xl bg-black border border-white/10 outline-none font-bold" required />
                  <input type="file" name="img" className="w-full p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 text-xs font-black" required />
                  <MilaButton primary className="w-full !py-8 text-sm">Post Advertisement</MilaButton>
                  <button type="button" onClick={() => setView('home')} className="w-full text-[10px] font-black opacity-20 uppercase mt-4">Cancel</button>
                </form>
             </motion.div>
          )}

          {view === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[60vh] flex flex-col items-center justify-center text-center">
               <div className="text-8xl mb-6">💬</div>
               <h2 className="text-4xl font-black italic mb-4">LIVE CHAT</h2>
               <p className="text-white/30 max-w-sm font-bold italic">Chat system is connecting to Mila nodes... This feature will allow direct bargaining between users.</p>
               <MilaButton onClick={() => setView('home')} className="mt-10">Back to Market</MilaButton>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="p-20 text-center border-t border-white/5 opacity-20">
        <p className="font-black italic text-4xl mb-4">MILA GLOBAL MARKET</p>
        <p className="text-[9px] font-black uppercase tracking-[1em]">Wad Kniss & Amazon Hybrid 2026</p>
      </footer>
    </div>
  );
}