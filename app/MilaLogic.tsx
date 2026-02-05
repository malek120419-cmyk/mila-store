"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const MUNICIPALITIES = {
  ar: ["ميلة المركز", "شلغوم العيد", "فرجيوي", "تاجنانت", "التلاغمة", "وادي العثمانية", "زغاية", "القرارم قوقة", "سيدي مروان", "مشديرة"],
  en: ["Mila Center", "Chelghoum Laid", "Ferdjioua", "Tadjenanet", "Teleghma", "Oued Athmania", "Zeghaia", "Grarem Gouga", "Sidi Merouane", "Mechira"],
  fr: ["Centre de Mila", "Chelghoum Laïd", "Ferdjioua", "Tadjenanet", "Télaghma", "Oued Athmania", "Zeghaïa", "Grarem Gouga", "Sidi Merouane", "Mechira"]
};

export const CATEGORIES = {
  ar: ["الكل", "إلكترونيات", "سيارات", "عقارات", "هواتف", "أثاث", "ملابس"],
  en: ["All", "Electronics", "Cars", "Real Estate", "Phones", "Furniture", "Clothing"],
  fr: ["Tous", "Électronique", "Voitures", "Immobilier", "Téléphones", "Meubles", "Vêtements"]
};

export const UI_TEXT = {
  ar: {
    search: "بحث في ميلة...", sell: "بيع +", login: "دخول", price: "دج",
    wa: "تواصل واتساب", addTitle: "إضافة منتج جديد", publish: "نشر الآن",
    authTitle: "ميلة ستور", signUp: "إنشاء حساب", signIn: "تسجيل الدخول"
  },
  en: {
    search: "Search...", sell: "Sell +", login: "Login", price: "DZD",
    wa: "WhatsApp", addTitle: "Add Product", publish: "Publish",
    authTitle: "Mila Store", signUp: "Sign Up", signIn: "Sign In"
  },
  fr: {
    search: "Rechercher...", sell: "Vendre +", login: "Connexion", price: "DZD",
    wa: "WhatsApp", addTitle: "Ajouter un produit", publish: "Publier",
    authTitle: "Mila Store", signUp: "Créer un compte", signIn: "Se connecter"
  }
};

type Lang = 'ar' | 'en' | 'fr';
type SearchBarProps = { lang: Lang; onChange: (value: string) => void; isDarkMode: boolean };
export const SearchBar = ({ lang, onChange, isDarkMode }: SearchBarProps) => (
  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
    <input 
      type="text" placeholder={UI_TEXT[lang].search} 
      className={`w-full p-6 md:p-8 rounded-[2.5rem] border-none outline-none text-center font-bold shadow-2xl transition-all ${isDarkMode ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-white text-black'}`}
      onChange={(e) => onChange(e.target.value)}
    />
  </motion.div>
);
