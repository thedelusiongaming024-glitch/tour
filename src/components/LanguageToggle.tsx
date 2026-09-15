"use client";

import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "subtle" | "compact";
}

export function LanguageToggle({ className = "", variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage, isBn } = useLanguage();

  if (variant === "compact") {
    return (
      <button
        onClick={toggleLanguage}
        type="button"
        aria-label="Toggle language between English and Bangla"
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider transition-all ${
          isBn
            ? "bg-emerald text-white shadow-xs"
            : "border border-ink/15 bg-white/70 text-ink hover:bg-white"
        } ${className}`}
      >
        <span className={!isBn ? "font-bold" : "opacity-70"}>EN</span>
        <span className="opacity-40">/</span>
        <span className={isBn ? "font-bold" : "opacity-70"}>বাং</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`relative inline-flex items-center rounded-full bg-slate-200/70 p-0.5 text-xs font-semibold backdrop-blur-xs transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`relative z-10 rounded-full px-2.5 py-1 transition-colors duration-200 ${
          !isBn ? "text-emerald-950 font-bold" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {!isBn && (
          <motion.span
            layoutId="lang-active-pill"
            className="absolute inset-0 rounded-full bg-white shadow-xs"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <span className="relative z-10">EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className={`relative z-10 rounded-full px-2.5 py-1 transition-colors duration-200 ${
          isBn ? "text-emerald-950 font-bold" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {isBn && (
          <motion.span
            layoutId="lang-active-pill"
            className="absolute inset-0 rounded-full bg-white shadow-xs"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <span className="relative z-10">বাং</span>
      </button>
    </div>
  );
}
