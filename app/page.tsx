"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ModernIcon, ProductDetails } from "./MilaEngine";
import { Laptop, Car, Home, Phone as PhoneIcon, Sofa, Shirt, Sun, Moon, LogIn, LogOut, Search as SearchIcon, Heart, X, Eye, EyeOff, Trash2, Edit2, Copy, Share2 } from "lucide-react";
import { MUNICIPALITIES } from "./MilaLogic";

/* ================= SUPABASE ================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ================= DATA ================= */
const CATEGORIES = {
  ar: ["الكل","إلكترونيات","سيارات","عقارات","هواتف","أثاث","ملابس"],
  en: ["All","Electronics","Cars","Real Estate","Phones","Furniture","Clothing"],
  fr: ["Tous","Électronique","Voitures","Immobilier","Téléphones","Meubles","Vêtements"]
};

const UI = {
  ar: {
    search: "بحث في ميلة...",
    sell: "بيع +",
    login: "دخول",
    logout: "خروج",
    price: "دج",
    wa: "تواصل واتساب",
    contactUs: "اتصل بنا",
    addTitle: "إضافة منتج",
    publish: "نشر",
    publishing: "جارٍ النشر...",
    authTitle: "مرحبا بك في Mila Store",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    cash: "الدفع نقداً",
    reset: "إعادة تعيين",
    back: "رجوع",
    forgot: "هل نسيت كلمة المرور؟",
    nameLabel: "الاسم",
    descLabel: "الوصف",
    priceLabel: "السعر",
    whatsappLabel: "واتساب",
    noMore: "لا توجد عناصر إضافية",
    toastCopied: "تم نسخ الرابط",
    toastShared: "تمت المشاركة",
    toastDeleted: "تم حذف المنتج",
    copyLabel: "نسخ الرابط",
    shareLabel: "مشاركة",
    rateLabel: "إضغط للتقييم"
    ,
    toastUploadError: "فشل رفع الصورة",
    toastPublished: "تم نشر المنتج بنجاح",
    toastUpdated: "تم تعديل المنتج",
    toastError: "حدث خطأ",
    errorNameRequired: "الاسم مطلوب",
    errorPriceInvalid: "السعر غير صالح",
    errorWhatsAppRequired: "رقم واتساب مطلوب"
  },
  en: {
    search: "Search...",
    sell: "Sell +",
    login: "Login",
    logout: "Logout",
    price: "DZD",
    wa: "WhatsApp",
    contactUs: "Contact Us",
    addTitle: "Add Product",
    publish: "Publish",
    publishing: "Publishing...",
    authTitle: "Welcome to Mila Store",
    signIn: "Sign In",
    signUp: "Sign Up",
    cash: "Cash Only",
    reset: "Reset",
    back: "Back",
    forgot: "Forgot password?",
    nameLabel: "Name",
    descLabel: "Description",
    priceLabel: "Price",
    whatsappLabel: "WhatsApp",
    noMore: "No more items",
    toastCopied: "Link copied",
    toastShared: "Shared",
    toastDeleted: "Product deleted",
    copyLabel: "Copy link",
    shareLabel: "Share",
    rateLabel: "Tap to rate"
    ,
    toastUploadError: "Image upload failed",
    toastPublished: "Product published successfully",
    toastUpdated: "Product updated",
    toastError: "An error occurred",
    errorNameRequired: "Name is required",
    errorPriceInvalid: "Invalid price",
    errorWhatsAppRequired: "WhatsApp is required"
  },
  fr: {
    search: "Rechercher...",
    sell: "Vendre +",
    login: "Connexion",
    logout: "Déconnexion",
    price: "DZD",
    wa: "WhatsApp",
    contactUs: "Contactez-nous",
    addTitle: "Ajouter un produit",
    publish: "Publier",
    publishing: "Publication...",
    authTitle: "Bienvenue à Mila Store",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    cash: "Paiement en espèces",
    reset: "Réinitialiser",
    back: "Retour",
    forgot: "Mot de passe oublié ?",
    nameLabel: "Nom",
    descLabel: "Description",
    priceLabel: "Prix",
    whatsappLabel: "WhatsApp",
    noMore: "Plus d’articles",
    toastCopied: "Lien copié",
    toastShared: "Partagé",
    toastDeleted: "Produit supprimé",
    copyLabel: "Copier le lien",
    shareLabel: "Partager",
    rateLabel: "Touchez pour noter"
    ,
    toastUploadError: "Échec du téléversement de l’image",
    toastPublished: "Produit publié avec succès",
    toastUpdated: "Produit modifié",
    toastError: "Une erreur s’est produite",
    errorNameRequired: "Le nom est requis",
    errorPriceInvalid: "Prix invalide",
    errorWhatsAppRequired: "WhatsApp est requis"
  }
};

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

/* ================= COMPONENT ================= */
export default function MilaStore() {
  const [lang, setLang] = useState<"ar" | "en" | "fr">(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "ar" || saved === "en" || saved === "fr") return saved;
    } catch {}
    return "ar";
  });
  const [dark, setDark] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("favorites") : null;
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [location, setLocation] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const PAGE_SIZE = 16;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; type: "success" | "error" }[]>([]);

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
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);

  const t = UI[lang];
  const CATEGORY_ICONS = [SearchIcon, Laptop, Car, Home, PhoneIcon, Sofa, Shirt];
  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)));
    } catch {}
  }, [favorites]);
  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAdd) setShowAdd(false);
        if (showAuth) setShowAuth(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd, showAuth]);
  /* ================= AUTH ================= */
  const loadProducts = useCallback(async (append = false) => {
    const start = append ? (page + 1) * PAGE_SIZE : 0;
    const end = start + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end);

    const rows = (data as Product[]) || [];
    if (append) {
      setProducts(prev => [...prev, ...rows]);
      setPage(p => p + 1);
    } else {
      setProducts(rows);
      setPage(0);
    }
    if (rows.length < PAGE_SIZE) setHasMore(false);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    supabase.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
    supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    setTimeout(() => {
      loadProducts(false);
    }, 0);
  }, [loadProducts]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) loadProducts(true);
      });
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMoreRef, hasMore, page, loadProducts]);

  /* ================= LOAD PRODUCTS ================= */

  /* ================= AUTH HANDLER ================= */
  const handleAuth = async () => {
    const res = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (res.error) alert(res.error.message);
    else setShowAuth(false);
  };
  const resetPassword = async () => {
    if (!email) return alert(lang === "ar" ? "أدخل البريد الإلكتروني أولاً" : "Enter email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined
    });
    if (error) alert(error.message);
    else alert(lang === "ar" ? "تم إرسال رابط استعادة كلمة المرور إلى بريدك" : "Password reset link sent to your email");
  };

  /* ================= ADD PRODUCT ================= */
  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (!form.name) errs.name = t.errorNameRequired;
    if (!form.price || isNaN(Number(form.price))) errs.price = t.errorPriceInvalid;
    if (!form.whatsapp) errs.whatsapp = t.errorWhatsAppRequired;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const publish = async () => {
    if (!validate()) return;
    if (!user) return alert("يرجى تسجيل الدخول");
    const fileList = files ? Array.from(files) : [];
    const uploads: string[] = [];
    setIsPublishing(true);
    const processed = await Promise.all(fileList.map((f) => compressImage(f)));
    const results = await Promise.all(processed.map((blob, i) => {
      const ext = "jpg";
      const fileName = `${Date.now()}-${i}.${ext}`;
      return supabase.storage.from("mila-market-assests").upload(fileName, blob).then((up) => {
        if (up.error) return null;
        const { data } = supabase.storage.from("mila-market-assests").getPublicUrl(fileName);
        return data.publicUrl;
      });
    }));
    for (const url of results) {
      if (!url) {
        setToasts(prev => [...prev, { id: Date.now(), text: t.toastUploadError, type: "error" }]);
        setIsPublishing(false);
        return;
      }
      uploads.push(url);
    }

    const primaryImage = uploads[0];
    let ok = true;
    if (isEditing && selectedProduct) {
      const payload = { ...form, price: Number(form.price), user_id: user.id, additional_images: uploads.slice(1), ...(primaryImage ? { image_url: primaryImage } : {}) };
      const res = await supabase.from("products").update(payload).eq("id", selectedProduct.id);
      if (res.error) {
        const fallback = { ...form, price: Number(form.price), user_id: user.id, ...(primaryImage ? { image_url: primaryImage } : {}) };
        const res2 = await supabase.from("products").update(fallback).eq("id", selectedProduct.id);
        if (res2.error) ok = false;
      }
    } else {
      const payload = { ...form, price: Number(form.price), user_id: user.id, additional_images: uploads.slice(1), ...(primaryImage ? { image_url: primaryImage } : {}) };
      const res = await supabase.from("products").insert(payload);
      if (res.error) {
        const fallback = { ...form, price: Number(form.price), user_id: user.id, ...(primaryImage ? { image_url: primaryImage } : {}) };
        const res2 = await supabase.from("products").insert(fallback);
        if (res2.error) ok = false;
      }
    }

    setShowAdd(false);
    loadProducts();
    setIsPublishing(false);
    setToasts(prev => [...prev, { id: Date.now(), text: ok ? (isEditing ? t.toastUpdated : t.toastPublished) : t.toastError, type: ok ? "success" : "error" }]);
    setSelectedProduct(null);
    setIsEditing(false);
    setFiles(null);
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const base = products.filter(p =>
      (category === "الكل" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!location || p.location === location)
    );
    if (sortBy === "newest") return base;
    if (sortBy === "price_asc") return [...base].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") return [...base].sort((a, b) => b.price - a.price);
    return base;
  }, [products, category, search, location, sortBy]);

  const tinyBlur = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9J2xpbmVhcmdyYWRpZW50KDEyMCwgMTIwLCAxMjApJy8+PC9zdmc+";
  const compressImage = async (file: File, maxSide = 1920, quality = 0.8): Promise<Blob> => {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      return blob || file;
    } catch {
      return file;
    }
  };

  if (loading)
    return (
      <div className={`${dark ? "bg-black text-white" : "bg-gray-50 text-black"} min-h-screen`} dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/10" />
                <div className="p-4">
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div suppressHydrationWarning className={`${dark ? "bg-black text-white" : "bg-gray-50 text-black"} min-h-screen`} dir={typeof window !== "undefined" ? (lang === "ar" ? "rtl" : "ltr") : "ltr"}>

      <nav className="p-6 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur z-50">
        <h1 className="font-black italic text-xl">
          MILA <span className="text-amber-500">STORE</span>
        </h1>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : lang === "en" ? "fr" : "ar")}
            className="text-xs bg-amber-500 text-black px-3 py-1 rounded border-2 border-amber-600"
          >
            {lang === "ar" ? "EN" : lang === "en" ? "FR" : "AR"}
          </button>

          <ModernIcon icon={dark ? <Moon /> : <Sun />} label="Theme" onClick={() => setDark(!dark)} />

          {user ? (
            <ModernIcon icon={<LogOut />} label={t.logout} onClick={() => supabase.auth.signOut()} />
          ) : (
            <ModernIcon icon={<LogIn />} label={t.login} onClick={() => setShowAuth(true)} />
          )}

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              const gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=milastore@gmail.com";
              const win = window.open(gmailUrl, "_blank");
              if (!win) {
                window.location.href = "mailto:milastore@gmail.com";
              }
            }}
            className="bg-white/10 text-white px-3 py-1 rounded text-xs font-bold border-2 border-amber-600"
          >
            {t.contactUs}
          </motion.button>

          <button
            onClick={() => (user ? setShowAdd(true) : setShowAuth(true))}
            className="bg-amber-500 text-black px-4 py-2 rounded-full font-black border-2 border-amber-600"
          >
            {t.sell}
          </button>
        </div>
      </nav>

      {/* SEARCH */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center">
          <input
            placeholder={t.search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full sm:w-4/5 md:w-1/2 lg:w-2/5 p-2 md:p-3 rounded-full ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} text-center outline-none border-2 border-amber-500 ring-1 ring-amber-300 shadow-sm focus:ring-2 focus:ring-amber-400 text-sm md:text-base`}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select onChange={e => setLocation(e.target.value)} className={`p-3 rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} border-2 border-amber-500 ring-1 ring-amber-300 shadow-sm focus:ring-2 focus:ring-amber-400`}>
            <option value="">{lang === "ar" ? "كل المناطق" : lang === "fr" ? "Toutes les communes" : "All Locations"}</option>
            {(MUNICIPALITIES[lang] as string[]).map((m, i) => (
              <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>
            ))}
          </select>
          <select onChange={e => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")} className={`p-3 rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} border-2 border-amber-500 ring-1 ring-amber-300 shadow-sm focus:ring-2 focus:ring-amber-400`}>
            <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
            <option value="price_asc">{lang === "ar" ? "السعر: من الأقل" : "Price: Low to High"}</option>
            <option value="price_desc">{lang === "ar" ? "السعر: من الأعلى" : "Price: High to Low"}</option>
          </select>
          <button onClick={() => { setSearch(""); setCategory("الكل"); setLocation(""); setSortBy("newest"); }} className="p-3 rounded-2xl bg-amber-500 text-black font-black border-4 border-amber-600 ring-1 ring-amber-300 shadow-[0_8px_30px_rgba(255,191,71,0.25)]">
            {t.reset}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto my-8">
          {CATEGORIES[lang].map((c, i) => (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              key={i}
              onClick={() => setCategory(CATEGORIES.ar[i])}
              className={`px-6 py-2 rounded-full font-bold text-xs ${
                category === CATEGORIES.ar[i]
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {React.createElement(CATEGORY_ICONS[i], { size: 16 })}
                {c}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} className={`${dark ? 'bg-white/5' : 'bg-white border-4 border-amber-300'} rounded-3xl overflow-hidden relative`}>
              <div className="absolute left-3 top-3 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full"> {t.cash} </div>
              <button onClick={() => setSelectedProduct(p)} className="w-full">
                <div className="aspect-square relative">
                  {p.image_url && p.image_url.trim().length > 0 ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="33vw"
                      className="object-cover"
                      priority={i < 3}
                      placeholder="blur"
                      blurDataURL={tinyBlur}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-white/5" />
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-black text-base truncate">{p.name}</h3>
                  <p className="text-amber-500 font-black mt-2">
                    {p.price} {t.price}
                  </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 text-[10px] rounded-full bg-white/10">{p.category}</span>
                  <span className="px-3 py-1 text-[10px] rounded-full bg-white/10">{p.location}</span>
                </div>
                </div>
              </button>
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setFavorites(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} className="absolute top-3 right-3 bg-black/40 backdrop-blur rounded-full p-2">
                <Heart size={16} className={favorites.has(p.id) ? "text-amber-500" : "text-white/50"} />
              </motion.button>
              <a
                href={`https://wa.me/${p.whatsapp}`}
                target="_blank"
                className="block mx-4 mb-6 bg-green-500 text-black py-1.5 rounded-full font-black text-sm text-center border-2 border-green-700"
              >
                {t.wa}
              </a>
              <div className="px-4 pb-4 flex items-center justify-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Copy link"
                  onClick={() => {
                    const url = `https://wa.me/${p.whatsapp}`;
                    navigator.clipboard.writeText(url).then(() => {
                      setToasts(prev => [...prev, { id: Date.now(), text: t.toastCopied, type: "success" }]);
                    });
                  }}
                  className="p-2 rounded-2xl bg-amber-500 text-black border border-amber-600"
                >
                  <Copy size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Share"
                  onClick={async () => {
                    const url = `https://wa.me/${p.whatsapp}`;
                    const shareData = { title: p.name, text: p.description || p.name, url };
                    if (navigator.share) {
                      await navigator.share(shareData);
                      setToasts(prev => [...prev, { id: Date.now(), text: t.toastShared, type: "success" }]);
                    } else {
                      await navigator.clipboard.writeText(url);
                      setToasts(prev => [...prev, { id: Date.now(), text: t.toastCopied, type: "success" }]);
                    }
                  }}
                  className="p-2 rounded-2xl bg-amber-500 text-black border border-amber-600"
                >
                  <Share2 size={14} />
                </motion.button>
                {user && user.id === p.user_id && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={lang === "ar" ? "تعديل" : "Edit"}
                      onClick={() => { setShowAdd(true); setIsEditing(true); setForm({ name: p.name, description: p.description || "", price: String(p.price), category: p.category, location: p.location, whatsapp: p.whatsapp }); setSelectedProduct(p); }}
                      className="p-2 rounded-2xl bg-amber-500 text-black border border-amber-600"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={lang === "ar" ? "حذف" : "Delete"}
                      onClick={async () => { await supabase.from("products").delete().eq("id", p.id); await loadProducts(); setToasts(prev => [...prev, { id: Date.now(), text: t.toastDeleted, type: "success" }]); }}
                      className="p-2 rounded-2xl bg-amber-500 text-black border border-amber-600"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div ref={loadMoreRef} className="h-12" />
        {!hasMore && (
          <p className="text-center text-xs opacity-40 my-8">{lang === "ar" ? "لا توجد عناصر إضافية" : "No more items"}</p>
        )}
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuth && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl overflow-y-auto">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowAuth(false)} className="fixed top-4 right-4 z-[1000] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur-2xl">
              <X size={20} />
            </motion.button>
            <motion.div initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-full max-w-md mx-auto my-24">
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowAuth(false)} className="absolute top-3 right-3 z-[1001] w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 bg-white/10 backdrop-blur-2xl">
                <X size={18} />
              </motion.button>
              <h2 className="text-2xl font-black text-center mb-6 text-amber-500">
                {t.authTitle}
              </h2>

              <input placeholder="Email" onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded mb-6 bg-white/10 pr-12" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 w-9 h-9 rounded-lg flex items-center justify-center">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button onClick={handleAuth} className="w-full bg-amber-500 text-black py-4 rounded font-black">
                {isSignup ? t.signUp : t.signIn}
              </button>
              <button onClick={resetPassword} className="w-full mt-3 bg-white/10 text-white py-3 rounded font-bold text-xs">
                {t.forgot}
              </button>

              <button onClick={() => setIsSignup(!isSignup)} className="mt-4 text-xs text-amber-500 underline w-full">
                {isSignup ? (lang === "ar" ? "لديك حساب؟ دخول" : lang === "fr" ? "Vous avez un compte ? Se connecter" : "Have an account? Sign in") : (lang === "ar" ? "ليس لديك حساب؟ سجل" : lang === "fr" ? "Pas de compte ? S’inscrire" : "No account? Sign up")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD PRODUCT */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl overflow-y-auto">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowAdd(false)} className="fixed top-4 right-4 z-[1000] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur-2xl">
              <X size={20} />
            </motion.button>
            <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-xl w-full mx-auto my-24">
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowAdd(false)} className="absolute top-3 right-3 z-[1001] w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 bg-white/10 backdrop-blur-2xl">
                <X size={18} />
              </motion.button>
              <h2 className="text-xl font-black text-center mb-6 text-amber-500">
                {t.addTitle}
              </h2>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <input type="file" multiple onChange={e => setFiles(e.target.files)} className="w-full p-4 bg-white/10 rounded" />
                {files && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {Array.from(files).slice(0, 6).map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-white/10">
                        <Image src={URL.createObjectURL(f)} alt="" fill sizes="(min-width:768px) 20vw, 33vw" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <input placeholder={t.nameLabel} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
                {formErrors.name && <p className="text-red-500 text-xs mt-2">{formErrors.name}</p>}
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <textarea placeholder={t.descLabel} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <input placeholder={t.priceLabel} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
                {formErrors.price && <p className="text-red-500 text-xs mt-2">{formErrors.price}</p>}
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-4 bg-white/10 rounded">
                  {CATEGORIES[lang].slice(1).map((c, i) => (
                    <option key={i} value={CATEGORIES.ar.slice(1)[i]}>{c}</option>
                  ))}
                </select>
                <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="p-4 bg-white/10 rounded">
                  {(MUNICIPALITIES[lang] as string[]).map((m, i) => (
                    <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>
                  ))}
                </select>
              </div>
              <input placeholder={t.whatsappLabel} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded" />
              {formErrors.whatsapp && <p className="text-red-500 text-xs mt-2">{formErrors.whatsapp}</p>}

              <button onClick={publish} disabled={isPublishing} className={`w-full ${isPublishing ? "bg-amber-500/50" : "bg-amber-500"} text-black py-4 mt-6 rounded font-black`}>
                {isPublishing ? t.publishing : t.publish}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-6 right-6 z-[1100] px-4 py-3 rounded-2xl shadow-2xl ${toast.type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-black"}`}>
            <span className="font-black text-xs">{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} userRating={userRating} setUserRating={setUserRating} t={{ price: t.price, wa: t.wa, cash: t.cash, toastCopied: t.toastCopied, toastShared: t.toastShared, copyLabel: t.copyLabel, shareLabel: t.shareLabel, rateLabel: t.rateLabel }} dark={dark} />

    </div>
  );
}
