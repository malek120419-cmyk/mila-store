"use client";
import { motion, AnimatePresence } from 'framer-motion';

// 1. الأيقونات التفاعلية
export const ModernIcon = ({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) => (
  <motion.div whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all border border-white/5">
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase opacity-30 group-hover:opacity-100 tracking-tighter">{label}</span>
  </motion.div>
);

// 2. نافذة تسجيل الدخول الفخمة
export const AuthModal = ({ isOpen, onClose, isSignUp, setIsSignUp, email, setEmail, password, setPassword, onAuth, loading }: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0a] p-10 rounded-[3rem] w-full max-w-md border border-white/10 relative text-center shadow-2xl">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/20 text-xl">✕</button>
          <h2 className="text-2xl font-black mb-2 italic text-amber-500 uppercase italic">MILA STORE</h2>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-8">{isSignUp ? 'أنشئ حسابك' : 'سجل دخولك'}</p>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold text-center" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/5 border border-white/5 outline-none font-bold text-center" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={onAuth} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">
              {loading ? "انتظر..." : (isSignUp ? "إنشاء حساب" : "دخول")}
            </button>
          </div>
          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 text-[9px] font-black text-amber-500/50 uppercase underline">
            {isSignUp ? 'لديك حساب؟ دخول' : 'ليس لديك حساب؟ سجل هنا'}
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// 3. التنبيه الذكي
export const MilaAlert = ({ msg, isVisible }: { msg: string, isVisible: boolean }) => (
  <motion.div initial={{ x: 100, opacity: 0 }} animate={isVisible ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }} className="fixed bottom-10 right-10 bg-amber-500 text-black px-6 py-4 rounded-2xl font-black z-[1100] shadow-2xl border-2 border-black text-xs uppercase">
    {msg} ⚠️
  </motion.div>
);

// 4. بروفايل المستخدم
export const UserProfile = ({ user, onLogin, onLogout }: any) => (
  <div className="flex items-center gap-3">
    {user ? (
      <div className="flex items-center gap-2 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
        <button onClick={onLogout} className="text-[8px] font-black opacity-30 hover:opacity-100">✕</button>
        <span className="text-[10px] font-black text-amber-500">{user.email[0].toUpperCase()}</span>
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black font-black text-xs shadow-lg uppercase">
          {user.email[0]}
        </div>
      </div>
    ) : (
      <ModernIcon icon="👤" label="حسابي" onClick={onLogin} />
    )}
  </div>
);
