"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModernIcon, MilaAlert, AuthModal } from './MilaEngine';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TRANSLATIONS = {
  ar: { sell: "بيع +", theme: "الثيم", lang: "EN", login: "حسابي", search: "بحث في ميلة...", price: "دج", msg: "سجل دخولك أولاً" },
  en: { sell: "SELL +", theme: "THEME", lang: "AR", login: "ACCOUNT", search: "Search Mila...", price: "DZD", msg: "Please login first" }
};

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Auth States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleAuth = async () => {
    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else setShowAuthModal(false);
  };

  const openSellForm = () => {
    if (!user) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setShowAuthModal(true);
    } else {
      alert("استمارة البيع جاهزة!"); // هنا تفتح الـ Modal الخاصة بالبيع
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-2xl">MILA STORE...</div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <MilaAlert msg={t.msg} isVisible={showAlert} />
      
      <AuthModal 
        isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} 
        isSignUp={isSignUp} setIsSignUp={setIsSignUp}
        setEmail={setEmail} setPassword={setPassword}
        onAuth={handleAuth} lang={lang}
      />

      {/* Navbar مع ترجمة حقيقية */}
      <nav className="p-6 sticky top-0 z-[200] backdrop-blur-xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <h1 className="text-xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <ModernIcon icon={isDarkMode ? '🌞' : '🌚'} label={t.theme} onClick={() => setIsDarkMode(!isDarkMode)} />
          <ModernIcon icon="🌐" label={t.lang} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label={t.sell} onClick={openSellForm} />
          <ModernIcon icon={user ? "✅" : "👤"} label={user ? user.email.split('@')[0] : t.login} onClick={() => !user && setShowAuthModal(true)} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={p.id} onClick={() => setSelectedProduct(p)} 
            className="bg-neutral-900/40 rounded-[2rem] overflow-hidden border border-white/5 group shadow-xl cursor-pointer"
          >
             <div className="aspect-square overflow-hidden bg-black">
                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
             </div>
             <div className="p-5 text-center">
                <p className="text-[10px] font-black opacity-40 uppercase truncate">{p.name}</p>
                <p className="text-amber-500 font-black text-sm mt-1">{p.price} {t.price}</p>
             </div>
          </motion.div>
        ))}
      </main>

      {/* نافذة تفاصيل المنتج المفقودة */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-[#0a0a0a] rounded-[3rem] p-8 border border-white/10 relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 text-2xl opacity-20 hover:opacity-100">✕</button>
              <img src={selectedProduct.image_url} className="w-full h-64 object-cover rounded-2xl mb-6 shadow-2xl" />
              <h2 className="text-2xl font-black text-amber-500 uppercase">{selectedProduct.name}</h2>
              <p className="mt-4 opacity-60 text-sm leading-relaxed">{selectedProduct.description || "No description available."}</p>
              <div className="mt-8 flex justify-between items-center">
                <span className="text-2xl font-black">{selectedProduct.price} {t.price}</span>
                <a href={`https://wa.me/${selectedProduct.whatsapp}`} className="bg-green-500 text-black px-8 py-3 rounded-full font-black text-xs uppercase shadow-lg">WhatsApp</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}