"use client";
import { motion } from 'framer-motion';

// 1. أيقونات احترافية متفاعلة (للنافبار والخيارات)
export const ModernIcon = ({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer group"
  >
    <div className="w-14 h-14 flex items-center justify-center text-2xl bg-white/5 rounded-[1.5rem] shadow-xl group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 border border-white/5 group-hover:border-amber-500/50 group-hover:shadow-amber-500/20">
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase opacity-30 group-hover:opacity-100 tracking-widest transition-opacity">
      {label}
    </span>
  </motion.div>
);

// 2. نظام التنبيهات الذكي (يظهر في زاوية الشاشة)
export const MilaAlert = ({ msg, isVisible, onClose }: { msg: string, isVisible: boolean, onClose: () => void }) => (
  <motion.div 
    initial={{ x: 100, opacity: 0 }}
    animate={isVisible ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
    className="fixed bottom-10 right-10 bg-black/90 backdrop-blur-2xl text-white px-8 py-5 rounded-[2rem] font-black z-[1000] shadow-2xl border border-amber-500/30 flex items-center gap-4"
  >
    <span className="text-amber-500 text-xl">⚠️</span>
    <span className="text-xs uppercase tracking-tighter">{msg}</span>
    <button onClick={onClose} className="ml-4 opacity-30 hover:opacity-100">✕</button>
  </motion.div>
);

// 3. مكون حساب المستخدم (يظهر الاسم والصورة)
export const UserProfile = ({ user, onLogin, onLogout }: { user: any, onLogin: () => void, onLogout: () => void }) => (
  <div className="flex items-center gap-4">
    {user ? (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-3 bg-white/5 p-1.5 pr-5 rounded-full border border-white/10"
      >
        <button onClick={onLogout} className="text-[8px] font-black opacity-30 hover:opacity-100 uppercase ml-2">خروج</button>
        <span className="text-[10px] font-black text-amber-500 truncate max-w-[80px]">{user.email.split('@')[0]}</span>
        <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center text-black font-black text-sm shadow-lg">
          {user.email[0].toUpperCase()}
        </div>
      </motion.div>
    ) : (
      <ModernIcon icon="👤" label="دخول" onClick={onLogin} />
    )}
  </div>
);