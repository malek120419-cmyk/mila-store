"use client";
import { motion, AnimatePresence } from 'framer-motion';

// أيقونة متفاعلة تدعم الترجمة والضغط
export const ModernIcon = ({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) => (
  <motion.div whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all border border-white/5 shadow-lg">
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-widest transition-opacity">
      {label}
    </span>
  </motion.div>
);

// نافذة تسجيل دخول تعمل 100%
export const AuthModal = ({ isOpen, onClose, isSignUp, setIsSignUp, setEmail, setPassword, onAuth, loading, lang }: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-md border border-white/10 relative text-center">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/20 text-2xl">✕</button>
          <h2 className="text-2xl font-black mb-2 text-amber-500 italic">MILA STORE</h2>
          <div className="space-y-4 mt-8">
            <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={onAuth} disabled={loading} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">
              {loading ? "..." : (isSignUp ? (lang === 'ar' ? "إنشاء حساب" : "SIGN UP") : (lang === 'ar' ? "دخول" : "SIGN IN"))}
            </button>
          </div>
          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 text-[9px] font-black text-amber-500/50 uppercase underline">
            {isSignUp ? (lang === 'ar' ? "لديك حساب؟ دخول" : "Login") : (lang === 'ar' ? "ليس لديك حساب؟ سجل" : "Create Account")}
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const MilaAlert = ({ msg, isVisible }: { msg: string, isVisible: boolean }) => (
  <motion.div initial={{ x: 100, opacity: 0 }} animate={isVisible ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }} className="fixed bottom-10 right-10 bg-amber-500 text-black px-6 py-4 rounded-2xl font-black z-[1100] shadow-2xl border-2 border-black text-[10px] uppercase">
    {msg} ⚠️
  </motion.div>
);