"use client";
import { motion, AnimatePresence } from 'framer-motion';

// أيقونات جميلة تفاعلية
export const ModernIcon = ({ icon, label, onClick }: any) => (
  <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all border border-white/5">
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-tighter">{label}</span>
  </motion.div>
);

// نافذة تفاصيل المنتج المظورة مع التقييم
export const ProductDetails = ({ product, onClose, lang, userRating, setUserRating, t }: any) => (
  <AnimatePresence>
    {product && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-3xl p-4 overflow-y-auto">
        <button onClick={onClose} className="fixed top-8 right-8 z-[610] bg-white/10 w-12 h-12 rounded-full text-white flex items-center justify-center hover:rotate-90 transition-transform">✕</button>
        <div className="max-w-5xl mx-auto mt-20 flex flex-col items-center pb-20">
          <div className="w-full max-w-xl aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5">
            <img src={product.image_url} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="mt-12 text-center space-y-8 w-full max-w-2xl px-6">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-amber-500">{product.name}</h2>
            
            {/* نظام التقييم بالنجوم */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setUserRating(star)} className={`text-3xl ${userRating >= star ? 'opacity-100' : 'opacity-20 grayscale'}`}>⭐</button>
                ))}
              </div>
              <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em]">إضغط للتقييم</p>
            </div>

            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
              <p className="text-amber-500 text-3xl font-black mb-4">{product.price} {t.price}</p>
              <p className="opacity-60 text-lg leading-relaxed">{product.description || "تفاصيل أكثر عند التواصل مع البائع."}</p>
            </div>
            
            <motion.a whileHover={{ scale: 1.05 }} href={`https://wa.me/${product.whatsapp}`} target="_blank" className="block bg-[#25D366] text-black py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl">
              {t.wa}
            </motion.a>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);