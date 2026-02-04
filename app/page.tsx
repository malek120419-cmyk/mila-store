"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MUNICIPALITIES = { ar: ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "التلاغمة", "وادي العثمانية", "زغاية", "القرارم قوقة", "سيدي مروان", "مشديرة"], en: ["Mila Center", "Chelghoum Laid", "Ferdjioua", "Tadjenanet", "Teleghma", "Oued Athmania", "Zeghaia", "Grarem Gouga", "Sidi Merouane", "Mechira"] };
const CATEGORIES = { ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"], en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"] };
const UI = { ar: { search: "بحث عن منتج...", sell: "بيع +", login: "دخول", logout: "خروج", price: "دج", wa: "واتساب", delTitle: "حذف نهائي؟", confirm: "نعم", cancel: "لا", addTitle: "إضافة منتج", publish: "نشر الآن", uploadImg: "اختر الصور" }, en: { search: "Search...", sell: "Sell +", login: "Login", logout: "Logout", price: "DZD", wa: "WhatsApp", delTitle: "Delete?", confirm: "Yes", cancel: "No", addTitle: "Add Product", publish: "Publish", uploadImg: "Upload" } };

export default function MilaStore() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ name: '', seller_name: '', price: '', whatsapp: '', location: 'ميلة المركز', category: 'إلكترونيات', description: '' });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const t = UI[lang];

  useEffect(() => {
    fetchProducts();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!imageFiles || imageFiles.length === 0) return alert("يرجى اختيار الصور");
    setIsActionLoading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileName = `${Date.now()}_${i}.jpg`;
        const { error: upErr } = await supabase.storage.from('mila-market-assests').upload(fileName, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('mila-market-assests').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      // إرسال البيانات
      const { error: insErr } = await supabase.from('products').insert([{
        name: formData.name,
        seller_name: formData.seller_name,
        price: parseFloat(formData.price),
        whatsapp: formData.whatsapp,
        location: formData.location,
        category: formData.category,
        description: formData.description, // هذا هو العمود الذي أضفناه في SQL
        image_url: uploadedUrls[0],
        images: uploadedUrls,
        user_id: user?.id
      }]);

      if (insErr) throw insErr;
      setShowAddForm(false);
      fetchProducts();
      alert("تم النشر بنجاح! مبروك 🎉");
    } catch (e: any) {
      alert("خطأ: " + e.message + "\nتأكد من تطبيق كود SQL في Supabase أولاً");
    } finally { setIsActionLoading(false); }
  };

  const forceDelete = async () => {
    if (!productToDelete) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', productToDelete);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setSelectedProduct(null);
    }
    setIsActionLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-amber-500 font-black italic text-4xl animate-pulse">MILA STORE</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Navbar */}
      <nav className="p-4 md:p-6 sticky top-0 z-[100] backdrop-blur-2xl border-b border-white/5 bg-inherit/80 flex justify-between items-center max-w-7xl mx-auto shadow-2xl">
        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter">MILA <span className="text-amber-500">STORE</span></h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black uppercase">خروج</button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase opacity-40">دخول</button>
          )}
          <button onClick={() => user ? setShowAddForm(true) : setShowAuthModal(true)} className="bg-amber-500 text-black px-5 py-2 rounded-full font-black text-[10px] shadow-xl uppercase transition-transform active:scale-90 tracking-widest">{t.sell}</button>
        </div>
      </nav>

      {/* Grid - الصور تظهر كاملة الآن */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <input type="text" placeholder={t.search} className="w-full p-5 md:p-7 rounded-[2rem] bg-white/5 border border-white/5 outline-none text-center font-bold shadow-2xl focus:border-amber-500/30 transition-all text-sm" onChange={(e) => setSearchQuery(e.target.value)} />
        
        <main className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
              <motion.div layout key={product.id} className="group bg-neutral-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl h-full flex flex-col hover:border-amber-500/40 transition-all">
                <div onClick={() => setSelectedProduct(product)} className="aspect-square cursor-pointer overflow-hidden bg-black flex items-center justify-center p-3">
                  <img src={product.image_url} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                {user?.id === product.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="absolute top-4 left-4 bg-red-600 p-2 rounded-full text-white shadow-2xl z-30 transition-transform active:scale-75">✕</button>
                )}
                <div className="p-4 md:p-6 text-center">
                  <h3 className="font-black text-[10px] md:text-xs truncate opacity-70 uppercase tracking-tighter mb-2">{product.name}</h3>
                  <p className="text-amber-500 font-black text-xs md:text-sm">{product.price} {t.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Modals (X Standard) --- */}

      {/* Details View */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl overflow-y-auto">
            <button onClick={() => setSelectedProduct(null)} className="fixed top-6 right-6 z-[310] bg-white/10 text-white w-12 h-12 rounded-full text-2xl">✕</button>
            <div className="max-w-5xl mx-auto p-4 md:p-10 flex flex-col items-center mt-20">
              <div className="w-full max-w-2xl aspect-square bg-neutral-800 rounded-[3rem] overflow-hidden flex items-center justify-center shadow-2xl border border-white/5">
                <img src={selectedProduct.image_url} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="mt-10 text-center w-full max-w-2xl space-y-6">
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">{selectedProduct.name}</h2>
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-inner">
                  <p className="text-amber-500 text-3xl font-black">{selectedProduct.price} {t.price}</p>
                  <p className="opacity-60 text-lg leading-relaxed">{selectedProduct.description || "لا يوجد وصف متاح"}</p>
                </div>
                <div className="flex justify-center gap-4 text-[10px] font-black opacity-30 uppercase tracking-widest">
                  <span>الموقع: {selectedProduct.location}</span>
                  <span>•</span>
                  <span>البائع: {selectedProduct.seller_name}</span>
                </div>
                <a href={`https://wa.me/${selectedProduct.whatsapp}`} target="_blank" className="block bg-[#25D366] text-black text-center py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/10 active:scale-95 transition-transform">{t.wa}</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Form View */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0a0a0a] p-8 md:p-12 rounded-[3rem] w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-white/30 text-2xl hover:text-white transition-colors">✕</button>
              <h2 className="text-2xl font-black italic text-amber-500 mb-10 uppercase text-center tracking-tighter">{t.addTitle}</h2>
              <div className="space-y-4">
                <div className="p-10 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] text-center relative hover:border-amber-500/30 transition-all cursor-pointer">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFiles(e.target.files)} />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{imageFiles ? `✅ ${imageFiles.length} صور مختارة` : t.uploadImg}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم البائع" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, seller_name: e.target.value})} />
                    <input type="text" placeholder="اسم المنتج" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <textarea placeholder="وصف المنتج وتفاصيله..." rows={4} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="السعر" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  <input type="tel" placeholder="واتساب" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold" onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
                <button onClick={handlePublish} disabled={isActionLoading} className="w-full py-6 bg-amber-500 text-black font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-transform">
                  {isActionLoading ? "جاري النشر..." : t.publish}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-[#0f0f0f] border border-red-500/20 p-10 rounded-[3rem] text-center shadow-2xl max-w-xs w-full">
              <div className="text-4xl mb-6">⚠️</div>
              <h2 className="text-lg font-black italic mb-8 uppercase tracking-tighter">{t.delTitle}</h2>
              <button onClick={forceDelete} className="bg-red-600 text-white w-full py-4 rounded-2xl font-black mb-4 uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20">تأكيد الحذف</button>
              <button onClick={() => setProductToDelete(null)} className="text-white/20 font-black text-[9px] uppercase tracking-widest block mx-auto">إلغاء ✕</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}