"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModernIcon, MilaAlert, UserProfile, AuthModal } from './MilaEngine';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // حالات النوافذ
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);

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
    setAuthLoading(true);
    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else setShowAuthModal(false);
    setAuthLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-2xl animate-pulse">MILA STORE...</div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'}`}>
      
      <MilaAlert msg="يرجى تسجيل الدخول أولاً" isVisible={showAlert} />
      
      <AuthModal 
        isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} 
        isSignUp={isSignUp} setIsSignUp={setIsSignUp}
        email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        onAuth={handleAuth} loading={authLoading}
      />

      <nav className="p-6 sticky top-0 z-[200] backdrop-blur-xl border-b border-white/5 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4 items-center">
          <ModernIcon icon={isDarkMode ? '🌞' : '🌚'} label="الثيم" onClick={() => setIsDarkMode(!isDarkMode)} />
          <ModernIcon icon="🌐" label={lang === 'ar' ? 'EN' : 'AR'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
          <ModernIcon icon="🛍️" label="بيع +" onClick={() => !user ? (setShowAlert(true), setTimeout(()=>setShowAlert(false),3000), setShowAuthModal(true)) : alert('افتح استمارة البيع')} />
          <UserProfile user={user} onLogin={() => setShowAuthModal(true)} onLogout={() => supabase.auth.signOut()} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-neutral-900/40 rounded-3xl overflow-hidden border border-white/5 group shadow-xl">
             <div className="aspect-square overflow-hidden bg-black">
                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
             </div>
             <div className="p-4 text-center">
                <p className="text-[10px] font-black opacity-40 uppercase truncate">{p.name}</p>
                <p className="text-amber-500 font-black text-xs mt-1">{p.price} DZD</p>
             </div>
          </div>
        ))}
      </main>
    </div>
  );
}
