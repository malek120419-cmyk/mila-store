"use client";
import { motion, AnimatePresence } from 'framer-motion';

// أيقونات "ميلة" التفاعلية
export const ModernIcon = ({ icon, label, onClick, active }: any) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.1 }} 
    whileTap={{ scale: 0.9 }} 
    onClick={onClick} 
    className="flex flex-col items-center gap-1.5 cursor-pointer group"
  >
    <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-[1.2rem] transition-all duration-500 border shadow-2xl ${
      active ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-white border-white/5 group-hover:border-amber-500/50 group-hover:bg-amber-500/10'
    }`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-[0.2em] transition-opacity">{label}</span>
  </motion.div>
);

// نافذة تفاصيل المنتج السينمائية
export const ProductDetails = ({ product, onClose, lang }: any) => (
  <AnimatePresence>
    {product && (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
      >
        <motion.div 
          initial={{ y: 100, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
          className="bg-[#0a0a0a] w-full max-w-4xl rounded-[3rem] overflow-hidden border border-white/10 relative flex flex-col md:flex-row shadow-[0_50px_100px_rgba(0,0,0,0.9)]"
        >
          <button onClick={onClose} className="absolute top-6 right-6 z-10 bg-black/50 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-2xl hover:bg-amber-500 hover:text-black transition-all">✕</button>
          
          <div className="w-full md:w-1/2 h-[300px] md:h-auto bg-black">
            <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <span className="text-amber-500 font-black text-[10px] tracking-[0.4em] uppercase mb-4 block">MILA PREMIUM</span>
            <h2 className="text-3xl md:text-5xl font-black mb-6 italic tracking-tighter uppercase">{product.name}</h2>
            <div className="flex gap-3 mb-8">
              <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold opacity-60">📍 {product.location}</span>
              <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold opacity-60">📁 {product.category}</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-10 line-clamp-4">{product.description || "هذا المنتج متوفر حالياً في ولاية ميلة، تواصل مع البائع للمزيد من المعلومات."}</p>
            
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black opacity-30 uppercase">Price</span>
                <span className="text-3xl font-black text-amber-500">{product.price} <small className="text-xs opacity-50 italic">DZD</small></span>
              </div>
              <motion.a 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                href={`https://wa.me/${product.whatsapp}`} target="_blank"
                className="bg-[#25D366] text-black px-10 py-5 rounded-2xl font-black text-xs tracking-widest shadow-2xl"
              >
                WHATSAPP
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const MilaAlert = ({ msg, isVisible }: { msg: string, isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div 
        initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
        className="fixed bottom-10 right-10 bg-amber-500 text-black px-8 py-5 rounded-[2rem] font-black z-[2000] shadow-2xl border-4 border-black flex items-center gap-3"
      >
        <span>⚠️</span> {msg}
      </motion.div>
    )}
  </AnimatePresence>
);