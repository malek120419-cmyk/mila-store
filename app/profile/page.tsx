 "use client";
import React, { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";

let supabaseRef: SupabaseClient | null = null;
const getSupabase = (): SupabaseClient | null => {
  if (supabaseRef) return supabaseRef;
  const rawUrl = String((process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "") as string).trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !key) return null;
  if (!rawUrl.startsWith("https://") || !rawUrl.includes(".supabase.co")) return null;
  supabaseRef = createClient(rawUrl.replace(/\/+$/, ""), key);
  return supabaseRef;
};

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [dark] = useState(true);
  const [lang] = useState<"ar" | "en" | "fr">(() => {
    try {
      const saved = localStorage.getItem("lang") as "ar" | "en" | "fr" | null;
      if (saved) return saved;
    } catch {}
    return "ar";
  });

  useEffect(() => {
    const client = getSupabase();
    client?.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
    client?.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
  }, []);

  const emailAddr = user?.email || (user?.user_metadata as Record<string, unknown>)?.email_address as string | undefined || "";
  const avatarUrl = (user?.user_metadata as Record<string, unknown>)?.picture as string | undefined || (user?.user_metadata as Record<string, unknown>)?.avatar_url as string | undefined;

  return (
    <main className={`${dark ? "bg-[#050505] text-white" : "bg-white text-black"} min-h-screen`}>
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => { if (typeof window !== "undefined") window.location.href = "/"; }} className="fixed top-4 left-4 z-[1000] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur-2xl" aria-label="Back">
        <X size={18} />
      </motion.button>
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        <h1 className="text-3xl font-black italic mb-8">
          {lang === "ar" ? "الملف الشخصي" : lang === "fr" ? "Profil" : "Profile"}
        </h1>
        <div className={`rounded-3xl p-8 ${dark ? "bg-white/5 border border-white/10" : "bg-white border-2 border-amber-300"}`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
              ) : emailAddr ? (
                <span className="text-xl font-black">{String(emailAddr).charAt(0).toUpperCase()}</span>
              ) : (
                <Image src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" alt="Gmail" width={80} height={80} unoptimized className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-black mb-1">{emailAddr || (lang === "ar" ? "غير مسجل الدخول" : lang === "fr" ? "Non connecté" : "Not signed in")}</p>
              {user ? (
                <button onClick={() => getSupabase()?.auth.signOut()} className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  {lang === "ar" ? "خروج" : lang === "fr" ? "Déconnexion" : "Logout"}
                </button>
              ) : (
                <a href="/auth" className="text-xs bg-amber-500 text-black px-3 py-1 rounded-full border-2 border-amber-600">
                  {lang === "ar" ? "دخول" : lang === "fr" ? "Connexion" : "Login"}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
