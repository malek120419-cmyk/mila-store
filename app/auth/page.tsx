"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang] = useState<"ar" | "en" | "fr">(() => {
    try {
      const saved = localStorage.getItem("lang") as "ar" | "en" | "fr" | null;
      if (saved) return saved;
    } catch {}
    return "ar";
  });
  const router = useRouter();
  const T = {
    ar: {
      title: "ميلة ستور",
      tagline: "وصول إلى سوق عالمي",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      processing: "جارٍ المعالجة...",
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      toggleHave: "لديك حساب؟ دخول",
      toggleNew: "جديد على ميلة؟ إنشاء حساب"
    },
    en: {
      title: "MILA STORE",
      tagline: "Global Marketplace Access",
      email: "Email Address",
      password: "Password",
      processing: "PROCESSING...",
      signIn: "SIGN IN",
      signUp: "CREATE ACCOUNT",
      toggleHave: "Already have an account? Login",
      toggleNew: "New to Mila? Create Account"
    },
    fr: {
      title: "MILA STORE",
      tagline: "Accès au marché mondial",
      email: "Adresse e-mail",
      password: "Mot de passe",
      processing: "TRAITEMENT...",
      signIn: "SE CONNECTER",
      signUp: "CRÉER UN COMPTE",
      toggleHave: "Vous avez un compte ? Connexion",
      toggleNew: "Nouveau sur Mila ? Créer un compte"
    }
  } as const;
  const t = T[lang];

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else window.location.href = '/';
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 selection:bg-amber-500 relative overflow-y-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => router.back()} className="fixed top-4 right-4 z-[1000] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur-2xl">
        <X size={20} />
      </motion.button>
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl w-full max-w-md mx-auto my-24 p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center">
        <h2 className="text-4xl font-black italic text-amber-500 mb-2 uppercase tracking-tighter">{t.title}</h2>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-12">{t.tagline}</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder={t.email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold text-white text-center" required />
          <input type="password" placeholder={t.password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold text-white text-center" required />
          <button type="submit" disabled={loading} className="w-full bg-amber-500 text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-amber-400 transition-all">
            {loading ? t.processing : (isSignUp ? t.signUp : t.signIn)}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-10 text-[10px] font-black text-amber-500/40 uppercase tracking-widest hover:text-amber-500 transition-colors underline">
          {isSignUp ? t.toggleHave : t.toggleNew}
        </button>
      </motion.div>
    </div>
  );
}
