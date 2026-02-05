"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: any) => {
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
    <div className="h-screen bg-[#050505] flex items-center justify-center p-6 selection:bg-amber-500">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a0a0a] w-full max-w-md p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center">
        <h2 className="text-4xl font-black italic text-amber-500 mb-2 uppercase tracking-tighter">MILA STORE</h2>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-12">Global Marketplace Access</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email Address" onChange={(e)=>setEmail(e.target.value)} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold text-white text-center" required />
          <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold text-white text-center" required />
          <button type="submit" disabled={loading} className="w-full bg-amber-500 text-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-amber-400 transition-all">
            {loading ? "PROCESSING..." : (isSignUp ? "CREATE ACCOUNT" : "SIGN IN")}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-10 text-[10px] font-black text-amber-500/40 uppercase tracking-widest hover:text-amber-500 transition-colors underline">
          {isSignUp ? "Already have an account? Login" : "New to Mila? Create Account"}
        </button>
      </motion.div>
    </div>
  );
}