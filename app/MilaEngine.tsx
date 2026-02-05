"use client";
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import Image from "next/image";
import { X, Copy, Share2, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

// أيقونات جميلة تفاعلية
type ModernIconProps = { icon: ReactNode; label: string; onClick?: () => void };
export const ModernIcon = ({ icon, label, onClick }: ModernIconProps) => (
  <motion.button
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    aria-label={typeof label === "string" ? label : "action"}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    }}
    className="flex flex-col items-center gap-1 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
  >
    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-all border border-white/5">
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-tighter">{label}</span>
  </motion.button>
);

// نافذة تفاصيل المنتج المظورة مع التقييم
type Product = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image_url: string;
  whatsapp: string;
  category?: string;
  location?: string;
  additional_images?: string[];
};
type ProductDetailsProps = {
  product: Product | null;
  onClose: () => void;
  userRating: number;
  setUserRating: (rating: number) => void;
  t: { price: string; wa: string; cash: string; toastCopied: string; toastShared: string; copyLabel: string; shareLabel: string; rateLabel: string };
};
export const ProductDetails = ({ product, onClose, userRating, setUserRating, t }: ProductDetailsProps) => {
  const [idx, setIdx] = useState(0);
  const [inlineToast, setInlineToast] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const imgs = product ? ([product.image_url, ...(Array.isArray(product.additional_images) ? product.additional_images : [])].filter(Boolean) as string[]) : [];
  return (
    <AnimatePresence>
      {product && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/98 backdrop-blur-3xl p-4 overflow-y-auto">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onClose} className="fixed top-8 right-8 z-[610] bg-white/10 w-12 h-12 rounded-full text-white flex items-center justify-center">
            <X />
          </motion.button>
          <div className="max-w-5xl mx-auto mt-20 flex flex-col items-center pb-20">
            <div className="w-full max-w-xl aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 relative">
              {imgs.length > 0 ? (
                <>
                  <Image src={imgs[idx]} alt={product.name} fill sizes="(min-width: 768px) 40vw, 80vw" className="object-cover" />
                  {imgs.length > 1 && (
                    <>
                      <button onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 text-white p-3 rounded-full border border-white/20 backdrop-blur">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setIdx((i) => (i + 1) % imgs.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-white p-3 rounded-full border border-white/20 backdrop-blur">
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {imgs.map((_, i) => (
                          <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-amber-500' : 'bg-white/20'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-white/5" />
              )}
            </div>
            <div className="mt-12 text-center space-y-8 w-full max-w-2xl px-6">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-amber-500">{product.name}</h2>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setUserRating(star)} className={`text-3xl ${userRating >= star ? 'opacity-100' : 'opacity-20 grayscale'}`}>⭐</button>
                  ))}
                </div>
                <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em]">{t.rateLabel}</p>
              </div>

              <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
                <p className="text-amber-500 text-3xl font-black mb-4">{product.price} {t.price}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">{t.cash}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {product.category && <span className="px-3 py-1 text-[10px] rounded-full bg-white/10">{product.category}</span>}
                {product.location && <span className="px-3 py-1 text-[10px] rounded-full bg-white/10">{product.location}</span>}
              </div>
                <p className="opacity-60 text-lg leading-relaxed">{product.description || "تفاصيل أكثر عند التواصل مع البائع."}</p>
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <motion.a
                  whileHover={{ scale: 1.04 }}
                  href={`https://wa.me/${product.whatsapp}`}
                  target="_blank"
                  aria-label="WhatsApp"
                  className="inline-flex items-center gap-2 bg-gradient-to-br from-[#25D366] to-[#21c35b] text-black px-6 py-4 rounded-[2rem] font-black text-lg shadow-2xl"
                >
                  <Phone size={18} />
                  <span>{t.wa}</span>
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Copy WhatsApp link"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://wa.me/${product.whatsapp}`).then(() => {
                      setInlineToast({ id: Date.now(), text: t.toastCopied });
                      setTimeout(() => setInlineToast(null), 1600);
                    });
                  }}
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-4 rounded-[2rem] font-bold text-sm border border-white/10 backdrop-blur"
                >
                  <Copy size={16} />
                  <span>{t.copyLabel}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Share"
                  onClick={async () => {
                    const shareData = { title: product.name, text: product.description || product.name, url: `https://wa.me/${product.whatsapp}` };
                    if (navigator.share) {
                      await navigator.share(shareData);
                      setInlineToast({ id: Date.now(), text: t.toastShared });
                      setTimeout(() => setInlineToast(null), 1600);
                    } else {
                      await navigator.clipboard.writeText(shareData.url);
                      setInlineToast({ id: Date.now(), text: t.toastCopied });
                      setTimeout(() => setInlineToast(null), 1600);
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-4 rounded-[2rem] font-bold text-sm border border-white/10 backdrop-blur"
                >
                  <Share2 size={16} />
                  <span>{t.shareLabel}</span>
                </motion.button>
              </div>
              <AnimatePresence>
                {inlineToast && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-6 z-[700] bg-amber-500 text-black px-4 py-3 rounded-2xl shadow-2xl">
                    <span className="font-black text-xs">{inlineToast.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
