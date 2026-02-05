"use client";
import { motion, AnimatePresence } from 'framer-motion';

// أيقونات متفاعلة مع الأنيميشن
export const ModernIcon = ({ icon, label, onClick, active }: any) => (
  <motion.div whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer group">
    <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-2xl transition-all border shadow-2xl ${active ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-white border-white/10 backdrop-blur-md'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-widest">{label}</span>
  </motion.div>
);

// نافذة إضافة منتج (مع نموذج الرفع)
export const AddProductModal = ({ isOpen, onClose, onSave, lang }: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
        <motion.div initial={{ y: 100, scale: 0.9 }} animate={{ y: 0, scale: 1 }} className="bg-neutral-900 w-full max-w-xl rounded-[3rem] p-8 border border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-6 right-6 text-2xl opacity-30 hover:opacity-100">✕</button>
          <h2 className="text-3xl font-black italic text-amber-500 mb-8 uppercase text-center italic">ADD PRODUCT</h2>
          <form onSubmit={onSave} className="space-y-4">
            <input name="name" placeholder={lang === 'ar' ? "اسم المنتج" : "Product Name"} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" required />
            <div className="grid grid-cols-2 gap-4">
              <input name="price" type="number" placeholder={lang === 'ar' ? "السعر" : "Price"} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" required />
              <input name="whatsapp" placeholder={lang === 'ar' ? "رقم الواتساب" : "WhatsApp"} className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold" required />
            </div>
            <select name="category" className="w-full p-5 rounded-2xl bg-white/5 border border-white/5 outline-none font-bold text-white/50">
              <option value="إلكترونيات">إلكترونيات</option>
              <option value="سيارات">سيارات</option>
              <option value="هواتف">هواتف</option>
              <option value="عقارات">عقارات</option>
            </select>
            <div className="relative group">
              <input type="file" name="image" accept="image/*" className="w-full p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-black cursor-pointer" required />
            </div>
            <button type="submit" className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-amber-400 transition-colors">
               {lang === 'ar' ? 'انشر الآن في ميلة' : 'PUBLISH NOW'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// نافذة عرض التفاصيل
export const ProductDetails = ({ product, onClose, lang }: any) => (
  <AnimatePresence>
    {product && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-neutral-900 w-full max-w-4xl rounded-[3rem] overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-2xl">
          <div className="w-full md:w-1/2 h-80 md:h-auto"><img src={product.image_url} className="w-full h-full object-cover" /></div>
          <div className="p-10 md:w-1/2 flex flex-col justify-center">
            <h2 className="text-4xl font-black italic text-amber-500 uppercase mb-4">{product.name}</h2>
            <p className="text-white/50 text-sm mb-8 leading-relaxed italic">Premium product available in Mila city marketplace.</p>
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl">
              <span className="text-3xl font-black">{product.price} DZD</span>
              <a href={`https://wa.me/${product.whatsapp}`} target="_blank" className="bg-[#25D366] text-black px-8 py-4 rounded-2xl font-black text-xs">WHATSAPP</a>
            </div>
            <button onClick={onClose} className="mt-8 text-[10px] font-black opacity-20 hover:opacity-100 uppercase tracking-widest">Close details</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const MilaAlert = ({ msg, isVisible }: any) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] bg-amber-500 text-black px-10 py-5 rounded-full font-black shadow-2xl border-4 border-black">
        {msg}
      </motion.div>
    )}
  </AnimatePresence>
);