"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue, startTransition } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ModernIcon, ProductDetails } from "./MilaEngine";
import { Laptop, Car, Home, Phone as PhoneIcon, Sofa, Shirt, Sun, Moon, LogIn, LogOut, Search as SearchIcon, Heart, X, Eye, EyeOff, Trash2, Edit2, Copy, Share2, MapPin, Clock, RotateCcw, Tag, DollarSign, Loader2, ChevronDown, Menu } from "lucide-react";
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
    editMode: "وضع التعديل",
    deleteMode: "وضع الحذف",
    price: "دج",
    wa: "اتصال هاتفي",
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
    nameLabel: "اسم المنتج",
    descLabel: "الوصف",
    priceLabel: "السعر",
    whatsappLabel: "رقم الهاتف",
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
    toastTooManyImages: "الحد الأقصى 30 صورة",
    errorNameRequired: "الاسم مطلوب",
    errorPriceInvalid: "السعر غير صالح",
    errorWhatsAppRequired: "رقم الهاتف مطلوب"
  },
  en: {
    search: "Search...",
    sell: "Sell +",
    login: "Login",
    logout: "Logout",
    editMode: "Edit Mode",
    deleteMode: "Delete Mode",
    price: "DZD",
    wa: "Call",
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
    nameLabel: "Product Name",
    descLabel: "Description",
    priceLabel: "Price",
    whatsappLabel: "Phone number",
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
    toastTooManyImages: "Maximum 30 images",
    errorNameRequired: "Name is required",
    errorPriceInvalid: "Invalid price",
    errorWhatsAppRequired: "Phone number is required"
  },
  fr: {
    search: "Rechercher...",
    sell: "Vendre +",
    login: "Connexion",
    logout: "Déconnexion",
    editMode: "Mode édition",
    deleteMode: "Mode suppression",
    price: "DZD",
    wa: "Appeler",
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
    nameLabel: "Nom du produit",
    descLabel: "Description",
    priceLabel: "Prix",
    whatsappLabel: "Numéro de téléphone",
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
    toastTooManyImages: "Maximum 30 images",
    errorNameRequired: "Le nom est requis",
    errorPriceInvalid: "Prix invalide",
    errorWhatsAppRequired: "Numéro de téléphone requis"
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
  const [user, setUser] = useState<User | null>(null);

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
  const [sortBy, setSortBy] = useState<"newest">("newest");
  const PAGE_SIZE = 16;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadTsRef = useRef(0);
  const CACHE_KEY = "mila_products_cache";
  const CACHE_TTL_MS = 5 * 60 * 1000;

  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; type: "success" | "error" }[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
      document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
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
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const start = append ? (page + 1) * PAGE_SIZE : 0;
      const end = start + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,category,location,whatsapp,image_url,created_at,user_id")
        .order("created_at", { ascending: false })
        .range(start, end);
      if (error) {
        const msg = String((error as any)?.message || "");
        if (msg.toLowerCase().includes("abort")) {
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }
      const rows = (data as Product[]) || [];
      if (append) {
        startTransition(() => {
          setProducts(prev => [...prev, ...rows]);
          setPage(p => p + 1);
        });
      } else {
        startTransition(() => {
          setProducts(rows);
          setPage(0);
        });
      }
      if (rows.length < PAGE_SIZE) setHasMore(false);
      setLoading(false);
      isLoadingRef.current = false;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }));
      } catch {}
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("abort")) {
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [page]);

  useEffect(() => {
    supabase.auth.getSession().then(r => setUser(r.data.session?.user ?? null));
    supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && Array.isArray(parsed.data) && (Date.now() - parsed.ts) < CACHE_TTL_MS) {
          startTransition(() => {
            setProducts(parsed.data as Product[]);
            setLoading(false);
          });
        }
      }
    } catch {}
    loadProducts(false);
  }, [loadProducts]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const now = Date.now();
        if (isLoadingRef.current) return;
        if (now - lastLoadTsRef.current < 800) return;
        lastLoadTsRef.current = now;
        loadProducts(true);
      });
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMoreRef, hasMore, page, loadProducts]);

  /* ================= LOAD PRODUCTS ================= */

  /* ================= AUTH HANDLER ================= */
  const handleAuth = async () => {
    const res = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: signupUsername,
              phone: signupPhone,
              email_address: email
            }
          }
        })
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
    const rawList = files ? Array.from(files) : [];
    const fileList = rawList.slice(0, 30);
    if (rawList.length > 30) {
      setToasts(prev => [...prev, { id: Date.now(), text: t.toastTooManyImages, type: "error" }]);
    }
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
      const basePayload = { ...form, price: Number(form.price), user_id: user.id };
      const imagesPayload = primaryImage ? { image_url: primaryImage } : {};
      const additionalPayload = uploads.length > 1 ? { additional_images: uploads.slice(1) } : {};
      const payload = { ...basePayload, ...imagesPayload, ...additionalPayload };
      const res = await supabase.from("products").update(payload).eq("id", selectedProduct.id);
      if (res.error) {
        const fallback = { ...basePayload, ...imagesPayload };
        const res2 = await supabase.from("products").update(fallback).eq("id", selectedProduct.id);
        if (res2.error) ok = false;
      }
    } else {
      const basePayload = { ...form, price: Number(form.price), user_id: user.id };
      const imagesPayload = primaryImage ? { image_url: primaryImage } : {};
      const additionalPayload = uploads.length > 1 ? { additional_images: uploads.slice(1) } : {};
      const payload = { ...basePayload, ...imagesPayload, ...additionalPayload };
      const res = await supabase.from("products").insert(payload);
      if (res.error) {
        const fallback = { ...basePayload, ...imagesPayload };
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
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const base = products.filter(p =>
      (category === "الكل" || p.category === category) &&
      p.name.toLowerCase().includes(deferredSearch.toLowerCase()) &&
      (!location || p.location === location)
    );
    return base;
  }, [products, category, deferredSearch, location]);

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
      <div suppressHydrationWarning className={`${dark ? "bg-black text-white" : "bg-gray-50 text-black"} min-h-screen`} dir={typeof window !== "undefined" ? (lang === "ar" ? "rtl" : "ltr") : "ltr"}>
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

      <nav style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }} className={`px-6 pb-6 flex justify-between items-center relative sticky top-0 backdrop-blur z-50 ${dark ? 'bg-black/80' : 'bg-white border-b border-amber-300'}`}>
        <div className="flex items-center gap-3">
          <h1 className="font-black italic text-xl">
            MILA <span className="text-amber-500">STORE</span>
          </h1>
          <button
            onClick={() => (user ? setShowAdd(true) : setShowAuth(true))}
            className="bg-amber-500 text-black px-4 py-2 rounded-full font-black border-2 border-amber-600 active:border-0 focus:outline-none"
          >
            {t.sell}
          </button>
        </div>

        <div className="flex gap-4 items-center pr-16">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : lang === "en" ? "fr" : "ar")}
            className="text-xs bg-amber-500 text-black px-3 py-1 rounded border-2 border-amber-600 active:border-0"
          >
            {lang === "ar" ? "EN" : lang === "en" ? "FR" : "AR"}
          </button>
          <ModernIcon icon={dark ? <Moon /> : <Sun />} label="Theme" onClick={() => setDark(!dark)} />

          {!user && (
            <ModernIcon icon={<LogIn />} label={t.login} onClick={() => setShowAuth(true)} />
          )}

        </div>
        {user && (
          <button
            onClick={() => setShowProfile(p => !p)}
            aria-label="Profile"
            className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center"
            style={{ top: '0.25rem' }}
          >
            {(() => {
              const meta = user?.user_metadata || {};
              const avatarUrl = (meta as Record<string, unknown>)?.picture as string | undefined || (meta as Record<string, unknown>)?.avatar_url as string | undefined;
              const emailAddr = user?.email || (meta as Record<string, unknown>)?.email_address as string | undefined || "";
              if (avatarUrl) {
                return <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />;
              }
              const letter = emailAddr ? String(emailAddr).charAt(0).toUpperCase() : "U";
              return <span className="text-xs font-black">{letter}</span>;
            })()}
          </button>
        )}
      </nav>
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ top: 'calc(env(safe-area-inset-top) + 3.75rem)' }}
            className={`fixed left-1/2 -translate-x-1/2 z-[950] px-4 py-3 rounded-2xl shadow-2xl ${dark ? 'bg-neutral-900 text-white border border-white/10' : 'bg-white text-black border-2 border-amber-300'}`}
          >
            <p className="text-xs font-black">{user?.email || (user?.user_metadata as Record<string, unknown>)?.email_address as string || "Unknown"}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowMenu(true)}
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)', right: 'calc(env(safe-area-inset-right) + 0.75rem)' }}
        className="fixed z-[900] w-12 h-12 rounded-2xl flex items-center justify-center text-white border border-white/5 bg-white/5"
        aria-label="Menu"
      >
        <Menu size={20} />
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
            <motion.aside
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 120, opacity: 0 }}
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)', paddingRight: 'calc(env(safe-area-inset-right) + 1rem)' }}
              className={`absolute right-0 top-0 h-full w-80 sm:w-96 p-6 flex flex-col gap-4 ${dark ? 'bg-neutral-900 text-white border-l border-white/10' : 'bg-white text-black border-l-2 border-amber-300'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-amber-500">{lang === "ar" ? "القائمة" : lang === "fr" ? "Menu" : "Menu"}</h2>
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowMenu(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur">
                  <X size={18} />
                </motion.button>
              </div>
              <button onClick={() => { setShowMenu(false); user ? setShowAdd(true) : setShowAuth(true); }} className="w-full px-4 py-3 rounded-2xl bg-amber-500 text-black font-black border-2 border-amber-600">
                {t.sell}
              </button>
              {user ? (
                <button onClick={() => { setShowMenu(false); supabase.auth.signOut(); }} className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border`}>
                  {t.logout}
                </button>
              ) : (
                <button onClick={() => { setShowMenu(false); setShowAuth(true); }} className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border`}>
                  {t.login}
                </button>
              )}
              <a href="/stats" className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border text-center`}>Stats</a>
              <button onClick={() => { const url = typeof window !== "undefined" ? window.location.href : ""; if (navigator.share) { navigator.share({ title: "Mila Store", url }); } else { navigator.clipboard.writeText(url); } }} className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border`}>
                {lang === "ar" ? "شارك التطبيق" : lang === "fr" ? "Partager l’app" : "Share App"}
              </button>
              <a href="mailto:milastore@gmail.com" className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border text-center`}>
                {t.contactUs}
              </a>
              <button onClick={() => setLang(lang === "ar" ? "en" : lang === "en" ? "fr" : "ar")} className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border`}>
                {lang === "ar" ? "EN" : lang === "en" ? "FR" : "AR"}
              </button>
              <button onClick={() => setDark(!dark)} className={`${dark ? 'bg-white/10' : 'bg-amber-50 border-amber-200'} w-full px-4 py-3 rounded-2xl border`}>
                {lang === "ar" ? "الوضع" : lang === "fr" ? "Thème" : "Theme"}
              </button>
              <button onClick={() => { setSearch(""); setCategory("الكل"); setLocation(""); setSortBy("newest"); setShowMenu(false); }} className="w-full px-4 py-3 rounded-2xl bg-amber-500 text-black font-black border-2 border-amber-600">
                {t.reset}
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      {/* SEARCH */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center">
          <div className="relative w-full sm:w-3/5 md:w-1/2 lg:w-2/5">
            <span className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-amber-500`}>
              <SearchIcon size={20} />
            </span>
            <input
              value={search}
              placeholder={t.search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 md:py-5 rounded-full ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} ${lang === "ar" ? "text-right" : ""} outline-none text-sm md:text-base`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className={`absolute ${lang === "ar" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 bg-white/10 text-white w-9 h-9 rounded-full flex items-center justify-center border border-white/20`}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className={`mt-4 flex flex-wrap gap-3 ${lang === "ar" ? "flex-row-reverse" : "flex-row"}`}>
          <div className="relative w-full md:w-1/3">
            <span className={`absolute ${lang === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-amber-500`}>
              <MapPin size={16} />
            </span>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className={`appearance-none w-full ${lang === "ar" ? "pr-12 pl-9 text-right" : "pl-12 pr-9"} p-4 rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} border-2 border-amber-500 ring-1 ring-amber-300 shadow-sm focus:ring-2 focus:ring-amber-400`}
            >
              <option value="">{lang === "ar" ? "كل المناطق" : lang === "fr" ? "Toutes les communes" : "All Locations"}</option>
              {(MUNICIPALITIES[lang] as string[]).map((m, i) => (
                <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>
              ))}
            </select>
            <span className={`pointer-events-none absolute ${lang === "ar" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-white/80`}>
              <ChevronDown size={16} />
            </span>
          </div>
          <div className="relative w-full md:w-1/3">
            <span className={`absolute ${lang === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-amber-500`}>
              <Clock size={16} />
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "newest")}
              className={`appearance-none w-full ${lang === "ar" ? "pr-12 pl-9 text-right" : "pl-12 pr-9"} p-4 rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-black'} border-2 border-amber-500 ring-1 ring-amber-300 shadow-sm focus:ring-2 focus:ring-amber-400`}
            >
              <option value="newest">{lang === "ar" ? "الأحدث" : lang === "fr" ? "Le plus récent" : "Newest"}</option>
            </select>
            <span className={`pointer-events-none absolute ${lang === "ar" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-white/80`}>
              <ChevronDown size={16} />
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97, borderWidth: 0 }}
            onClick={() => { setSearch(""); setCategory("الكل"); setLocation(""); setSortBy("newest"); }}
            className="w-full md:w-1/3 p-3 rounded-2xl bg-amber-500 text-black font-black border-2 border-amber-600 shadow-[0_8px_30px_rgba(255,191,71,0.25)] flex items-center justify-center gap-2 focus:outline-none"
          >
            <RotateCcw size={16} />
            {t.reset}
          </motion.button>
        </div>

        <div className={`flex gap-3 overflow-x-auto no-scrollbar my-8 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
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

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} className={`${dark ? 'bg-white/5' : 'bg-white border-4 border-amber-300'} rounded-3xl overflow-hidden relative`}>
              <div className="absolute left-3 top-3 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full"> {t.cash} </div>
              <button
                onClick={() => {
                  setSelectedProduct(p);
                }}
                className="w-full"
              >
                <div className="aspect-square relative">
                  {p.image_url && p.image_url.trim().length > 0 ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      unoptimized
                      sizes="50vw"
                      className="object-cover"
                      priority={i < 2}
                      placeholder="blur"
                      blurDataURL={tinyBlur}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-white/5" />
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-black text-sm truncate">{p.name}</h3>
                  <p className="text-amber-500 font-black mt-1">
                    {p.price} {t.price}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] rounded-full bg-white/10">{p.category}</span>
                    <span className="px-2.5 py-1 text-[10px] rounded-full bg-white/10">{p.location}</span>
                  </div>
                </div>
              </button>
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setFavorites(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} className="absolute top-3 right-3 bg-black/40 backdrop-blur rounded-full p-2">
                <Heart size={16} className={favorites.has(p.id) ? "text-amber-500" : "text-white/50"} />
              </motion.button>
              <div className="px-4 pb-2 flex items-center justify-center">
                <motion.a
                  href={`tel:${p.whatsapp}`}
                  target="_blank"
                  whileTap={{ borderWidth: 0, scale: 0.98 }}
                  aria-label={t.wa}
                  className="min-w-[140px] px-4 h-10 sm:h-12 rounded-2xl bg-green-500 text-black border-2 border-green-700 inline-flex items-center justify-center gap-2"
                >
                  <PhoneIcon size={16} />
                  <span className="font-black text-xs sm:text-sm">{t.wa}</span>
                </motion.a>
              </div>
              <div className="px-4 pb-4 flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, borderWidth: 0 }}
                  aria-label="Copy link"
                  onClick={() => {
                    navigator.clipboard.writeText(p.whatsapp).then(() => {
                      setToasts(prev => [...prev, { id: Date.now(), text: t.toastCopied, type: "success" }]);
                    });
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-amber-500 text-black border border-amber-600 flex items-center justify-center"
                >
                  <Copy size={12} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, borderWidth: 0 }}
                  aria-label="Share"
                  onClick={async () => {
                    const phone = String(p.whatsapp || "").replace(/\D+/g, "");
                    const waUrl = `https://wa.me/${phone}`;
                    if (navigator.share) {
                      await navigator.share({ title: p.name, text: p.description || p.name, url: waUrl });
                      setToasts(prev => [...prev, { id: Date.now(), text: t.toastShared, type: "success" }]);
                    } else {
                      window.open(waUrl, "_blank");
                    }
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-amber-500 text-black border border-amber-600 flex items-center justify-center"
                >
                  <Share2 size={12} />
                </motion.button>
                {user && user.id === p.user_id && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95, borderWidth: 0 }}
                      aria-label={lang === "ar" ? "تعديل" : "Edit"}
                      onClick={() => { setShowAdd(true); setIsEditing(true); setForm({ name: p.name, description: p.description || "", price: String(p.price), category: p.category, location: p.location, whatsapp: p.whatsapp }); setSelectedProduct(p); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-amber-500 text-black border border-amber-600 flex items-center justify-center"
                    >
                      <Edit2 size={12} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95, borderWidth: 0 }}
                      aria-label={lang === "ar" ? "حذف" : "Delete"}
                      onClick={async () => { await supabase.from("products").delete().eq("id", p.id); await loadProducts(); setToasts(prev => [...prev, { id: Date.now(), text: t.toastDeleted, type: "success" }]); }}
                      className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-amber-500 text-black border border-amber-600 flex items-center justify-center"
                    >
                      <Trash2 size={12} />
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)', paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)', paddingRight: 'calc(env(safe-area-inset-right) + 1rem)' }} className="fixed inset-0 bg-black/70 backdrop-blur-3xl overflow-y-auto no-scrollbar z-[1000]">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setShowAuth(false)} className="fixed top-6 right-6 z-[1001] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/20 bg-white/10 backdrop-blur-2xl">
              <X size={20} />
            </motion.button>
            <motion.div initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} className="relative bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-10 rounded-none w-full h-full mx-auto my-0 flex items-center justify-center">
              <div className="w-full max-w-md mx-auto bg-neutral-900/80 rounded-3xl border border-white/10 p-8">
              <h2 className="text-2xl font-black text-center mb-6 text-amber-500">
                {t.authTitle}
              </h2>

              {isSignup ? (
                <>
                  <input placeholder={lang === "ar" ? "اسم المستخدم" : lang === "fr" ? "Nom d’utilisateur" : "Username"} onChange={e => setSignupUsername(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
                  <input placeholder={lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Numéro de téléphone" : "Phone number"} onChange={e => setSignupPhone(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
                  <input placeholder={lang === "ar" ? "عنوان البريد الإلكتروني" : lang === "fr" ? "Adresse e-mail" : "Email Address"} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
                </>
              ) : (
                <input placeholder="Email Address" onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded mb-3 bg-white/10" />
              )}
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded mb-6 bg-white/10 pr-12" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-2 md:top-3 bg-white/10 w-9 h-9 rounded-lg flex items-center justify-center">
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 mb-6">
        <p className="text-center text-xs opacity-50">
          <a href="mailto:milastore@gmail.com" className="underline">
            {t.contactUs}
          </a>
        </p>
      </footer>
      {/* ADD PRODUCT */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)', paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)', paddingRight: 'calc(env(safe-area-inset-right) + 1rem)' }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl overflow-y-auto no-scrollbar">
            {/* Inner close in modal header */}
            <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} className={`relative p-6 sm:p-8 rounded-3xl w-[92%] max-w-md sm:max-w-xl mx-auto my-10 sm:my-24 shadow-2xl ${dark ? 'bg-neutral-900 text-white border border-white/10' : 'bg-white text-black border-2 border-amber-300'}`}>
              <button
                aria-label="Close"
                onClick={() => setShowAdd(false)}
                className={`absolute top-3 right-3 z-[1001] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${dark ? 'text-white border border-white/40 bg-white/20' : 'text-black border border-amber-300 bg-amber-50'}`}
              >
                <X size={18} />
              </button>
              <h2 className="text-lg sm:text-xl font-black text-center mb-6 text-amber-500">
                {t.addTitle}
              </h2>

              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <input type="file" multiple onChange={e => { const f = e.target.files; if (f && f.length > 30) { setToasts(prev => [...prev, { id: Date.now(), text: t.toastTooManyImages, type: "error" }]); } setFiles(f); }} className="w-full p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300" />
                {files && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from(files).slice(0, 30).map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-white/10 border border-white/10">
                        <Image src={URL.createObjectURL(f)} alt="" fill unoptimized sizes="(min-width:768px) 20vw, 33vw" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className="relative mt-3">
                  <span className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-amber-500`}>
                    <Tag size={16} />
                  </span>
                  <input placeholder={t.nameLabel} onChange={e => setForm({ ...form, name: e.target.value })} className={`w-full ${lang === "ar" ? "pr-9 text-right" : "pl-9"} p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300`} />
                </div>
                {formErrors.name && <p className="text-red-500 text-xs mt-2">{formErrors.name}</p>}
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <textarea placeholder={t.descLabel} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-4 mt-3 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300" />
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className="relative mt-3">
                  <span className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-amber-500`}>
                    <DollarSign size={16} />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t.priceLabel}
                    value={form.price}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D+/g, "");
                      setForm({ ...form, price: digits });
                    }}
                    onKeyDown={e => {
                      const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab"];
                      if (!/^\d$/.test(e.key) && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full ${lang === "ar" ? "pr-9 text-right" : "pl-9"} p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300`}
                  />
                  <span className={`absolute ${lang === "ar" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-amber-500 text-xs`}>
                    {t.price}
                  </span>
                </div>
                {formErrors.price && <p className="text-red-500 text-xs mt-2">{formErrors.price}</p>}
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="relative px-2">
                  <span className={`absolute ${lang === "ar" ? "right-5" : "left-5"} top-1/2 -translate-y-1/2 text-amber-500`}>
                    <Tag size={16} />
                  </span>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`appearance-none w-full ${lang === "ar" ? "pr-14 pl-9 text-right" : "pl-14 pr-9"} p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300`}>
                  {CATEGORIES[lang].slice(1).map((c, i) => (
                    <option key={i} value={CATEGORIES.ar.slice(1)[i]}>{c}</option>
                  ))}
                  </select>
                  <span className={`pointer-events-none absolute ${lang === "ar" ? "left-5" : "right-5"} top-1/2 -translate-y-1/2 text-white/80`}>
                    <ChevronDown size={16} />
                  </span>
                </div>
                <div className="relative px-2">
                  <span className={`absolute ${lang === "ar" ? "right-5" : "left-5"} top-1/2 -translate-y-1/2 text-amber-500`}>
                    <MapPin size={16} />
                  </span>
                  <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={`appearance-none w-full ${lang === "ar" ? "pr-14 pl-9 text-right" : "pl-14 pr-9"} p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300`}>
                  {(MUNICIPALITIES[lang] as string[]).map((m, i) => (
                    <option key={i} value={MUNICIPALITIES.ar[i]}>{m}</option>
                  ))}
                  </select>
                  <span className={`pointer-events-none absolute ${lang === "ar" ? "left-5" : "right-5"} top-1/2 -translate-y-1/2 text-white/80`}>
                    <ChevronDown size={16} />
                  </span>
                </div>
              </div>
              <div className="relative mt-3">
                <span className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-amber-500`}>
                  <PhoneIcon size={16} />
                </span>
                <input type="tel" placeholder={t.whatsappLabel} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className={`w-full ${lang === "ar" ? "pr-9 text-right" : "pl-9"} p-4 bg-white/10 rounded-2xl border-2 border-amber-500 ring-1 ring-amber-300`} />
              </div>
              {formErrors.whatsapp && <p className="text-red-500 text-xs mt-2">{formErrors.whatsapp}</p>}

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97, borderWidth: 0 }} onClick={publish} disabled={isPublishing} className={`w-full ${isPublishing ? "bg-amber-500/50" : "bg-amber-500"} text-black py-4 mt-6 rounded-2xl font-black border-2 border-amber-600 flex items-center justify-center gap-2`}>
                {isPublishing && <Loader2 size={18} className="animate-spin" />}
                {isPublishing ? t.publishing : t.publish}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }} className={`fixed right-6 z-[1100] px-4 py-3 rounded-2xl shadow-2xl ${toast.type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-black"}`}>
            <span className="font-black text-xs">{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <ProductDetails
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        userRating={userRating}
        setUserRating={setUserRating}
        t={{
          price: t.price,
          wa: t.wa,
          cash: t.cash,
          toastCopied: t.toastCopied,
          toastShared: t.toastShared,
          copyLabel: t.copyLabel,
          shareLabel: t.shareLabel,
          rateLabel: t.rateLabel,
          editLabel: lang === "ar" ? "تعديل" : lang === "fr" ? "Modifier" : "Edit",
          deleteLabel: lang === "ar" ? "حذف" : lang === "fr" ? "Supprimer" : "Delete",
        }}
        dark={dark}
        currentUserId={user?.id ?? null}
        onEdit={(p) => {
          setShowAdd(true);
          setIsEditing(true);
          setForm({ name: p.name, description: p.description || "", price: String(p.price), category: p.category || "إلكترونيات", location: p.location || "ميلة المركز", whatsapp: p.whatsapp || "" });
          setSelectedProduct(null);
        }}
        onDelete={async (p) => {
          await supabase.from("products").delete().eq("id", p.id);
          await loadProducts();
          setToasts(prev => [...prev, { id: Date.now(), text: t.toastDeleted, type: "success" }]);
          setSelectedProduct(null);
        }}
      />

    </div>
  );
}
