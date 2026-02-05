"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

/* ================= SUPABASE ================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ================= DATA ================= */
const MUNICIPALITIES = {
  ar: ["ميلة المركز","شلغوم العيد","فرجيوي","تاجنانت","التلاغمة","وادي العثمانية","زغاية","القرارم قوقة","سيدي مروان","مشديرة"],
  en: ["Mila Center","Chelghoum Laid","Ferdjioua","Tadjenanet","Teleghma","Oued Athmania","Zeghaia","Grarem Gouga","Sidi Merouane","Mechira"]
};

const CATEGORIES = {
  ar: ["الكل","إلكترونيات","سيارات","عقارات","هواتف","أثاث","ملابس"],
  en: ["All","Electronics","Cars","Real Estate","Phones","Furniture","Clothing"]
};

const UI = {
  ar: {
    search: "بحث في ميلة...",
    sell: "بيع +",
    login: "دخول",
    logout: "خروج",
    price: "دج",
    wa: "تواصل واتساب",
    addTitle: "إضافة منتج",
    publish: "نشر",
    authTitle: "مرحبا بك في Mila Store",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب"
  },
  en: {
    search: "Search...",
    sell: "Sell +",
    login: "Login",
    logout: "Logout",
    price: "DZD",
    wa: "WhatsApp",
    addTitle: "Add Product",
    publish: "Publish",
    authTitle: "Welcome to Mila Store",
    signIn: "Sign In",
    signUp: "Sign Up"
  }
};

/* ================= COMPONENT ================= */
export default function MilaStore() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [dark, setDark] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");

  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "إلكترونيات",
    location: "ميلة المركز",
    whatsapp: ""
  });

  const t = UI[lang];

  /* ================= AUTH ================= */
  useEffect(() => {
    supabase.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
    supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    loadProducts();
  }, []);

  /* ================= LOAD PRODUCTS ================= */
  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
    setLoading(false);
  };

  /* ================= AUTH HANDLER ================= */
  const handleAuth = async () => {
    const res = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (res.error) alert(res.error.message);
    else setShowAuth(false);
  };

  /* ================= ADD PRODUCT ================= */
  const publish = async () => {
    if (!files || !form.name) return alert("بيانات ناقصة");

    const file = files[0];
    const fileName = `${Date.now()}-${file.name}`;

    await supabase.storage
      .from("mila-market-assests")
      .upload(fileName, file);

    const { data } = supabase.storage
      .from("mila-market-assests")
      .getPublicUrl(fileName);

    await supabase.from("products").insert({
      ...form,
      price: Number(form.price),
      image_url: data.publicUrl,
      user_id: user.id
    });

    setShowAdd(false);
    loadProducts();
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return products.filter(p =>
      (category === "الكل" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, category, search]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-black text-amber-500 text-4xl font-black animate-pulse">
        MILA STORE
      </div>
    );

  return (
    <div className={`${dark ? "bg-black text-white" : "bg-gray-50 text-black"} min-h-screen`} dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur z-50">
        <h1 className="font-black italic text-xl">
          MILA <span className="text-amber-500">STORE</span>
        </h1>

        <div className="flex gap-4 items-center">
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-xs bg-amber-500 text-black px-3 py-1 rounded">
            {lang === "ar" ? "EN" : "AR"}
          </button>

          <button onClick={() => setDark(!dark)}>🌗</button>

          {user ? (
            <button onClick={() => supabase.auth.signOut()}>{t.logout}</button>
          ) : (
            <button onClick={() => setShowAuth(true)}>{t.login}</button>
          )}

          <button
            onClick={() => (user ? setShowAdd(true) : setShowAuth(true))}
            className="bg-amber-500 text-black px-4 py-2 rounded-full font-black"
          >
            {t.sell}
          </button>
        </div>
      </nav>

      {/* SEARCH */}
      <div className="max-w-6xl mx-auto p-6">
        <input
          placeholder={t.search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-6 rounded-full bg-white/10 text-center outline-none"
        />

        {/* CATEGORIES */}
        <div className="flex gap-3 overflow-x-auto my-8">
          {CATEGORIES[lang].map((c, i) => (
            <button
              key={i}
              onClick={() => setCategory(CATEGORIES.ar[i])}
              className={`px-6 py-2 rounded-full font-bold text-xs ${
                category === CATEGORIES.ar[i]
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white/5 rounded-3xl overflow-hidden">
              <img src={p.image_url} className="aspect-square object-cover" />
              <div className="p-4 text-center">
                <h3 className="font-black text-xs truncate">{p.name}</h3>
                <p className="text-amber-500 font-black mt-2">
                  {p.price} {t.price}
                </p>
                <a
                  href={`https://wa.me/${p.whatsapp}`}
                  target="_blank"
                  className="block mt-4 bg-green-500 text-black py-2 rounded-full font-black"
                >
                  {t.wa}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuth && (
          <motion.div className="fixed inset-0 bg-black/90 flex items-center justify-center">
            <div className="bg-neutral-900 p-10 rounded-3xl w-full max-w-md">
              <h2 className="text-2xl font-black text-center mb-6 text-amber-500">
                {t.authTitle}
              </h2>

              <input placeholder="Email" onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
              <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded mb-6 bg-white/10" />

              <button onClick={handleAuth} className="w-full bg-amber-500 text-black py-4 rounded font-black">
                {isSignup ? t.signUp : t.signIn}
              </button>

              <button onClick={() => setIsSignup(!isSignup)} className="mt-4 text-xs text-amber-500 underline w-full">
                {isSignup ? "لديك حساب؟ دخول" : "ليس لديك حساب؟ سجل"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD PRODUCT */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-neutral-900 p-8 rounded-3xl max-w-xl w-full">
              <h2 className="text-xl font-black text-center mb-6 text-amber-500">
                {t.addTitle}
              </h2>

              <input type="file" onChange={e => setFiles(e.target.files)} />
              <input placeholder="الاسم" onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
              <textarea placeholder="الوصف" onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
              <input placeholder="السعر" onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
              <input placeholder="واتساب" onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />

              <button onClick={publish} className="w-full bg-amber-500 text-black py-4 mt-6 rounded font-black">
                {t.publish}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
