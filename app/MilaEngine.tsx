"use client";
import { motion, AnimatePresence } from 'framer-motion';

// أيقونات جميلة وتفاعلية للنافبار
export const ModernIcon = ({ icon, label, onClick }: any) => (
  <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all border border-white/5 shadow-xl">
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-tighter text-white">{label}</span>
  </motion.div>
);

// نافذة تفاصيل المنتج (تعمل عند الضغط على أي منتج)
export const ProductDetails = ({ product, onClose, lang }: any) => (
  <AnimatePresence>
    {product && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#0a0a0a] w-full max-w-2xl rounded-[3rem] p-8 border border-white/10 relative overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-6 right-6 text-3xl text-white/20 hover:text-white">✕</button>
          <img src={product.image_url} className="w-full h-80 object-cover rounded-[2rem] mb-6 shadow-2xl" />
          <h2 className="text-3xl font-black text-amber-500 uppercase italic mb-4">{product.name}</h2>
          <div className="flex gap-4 mb-6">
            <span className="bg-white/5 px-4 py-2 rounded-full text-[10px] font-black uppercase opacity-60 italic">📍 {product.location}</span>
            <span className="bg-white/5 px-4 py-2 rounded-full text-[10px] font-black uppercase opacity-60 italic">📁 {product.category}</span>
          </div>
          <p className="text-white/70 leading-relaxed mb-8">{product.description || "لا يوجد وصف حالياً لهذا المنتج في ولاية ميلة."}</p>
          <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem]">
            <span className="text-3xl font-black text-white">{product.price} <span className="text-sm opacity-50">دج</span></span>
            <a href={`https://wa.me/${product.whatsapp}`} target="_blank" className="bg-[#25D366] text-black px-10 py-4 rounded-full font-black text-sm shadow-xl hover:scale-105 transition-transform">WhatsApp</a>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// نظام التنبيهات
export const MilaAlert = ({ msg, isVisible }: { msg: string, isVisible: boolean }) => (
  <motion.div initial={{ x: 100, opacity: 0 }} animate={isVisible ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }} className="fixed bottom-10 right-10 bg-amber-500 text-black px-6 py-4 rounded-2xl font-black z-[1100] shadow-2xl border-2 border-black text-[10px] uppercase">
    {msg} ⚠️
  </motion.div>
);