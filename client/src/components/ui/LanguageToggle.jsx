import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { springSnappy } from '../../lib/motion';

/**
 * High-precision pill toggle switching seamlessly between English and Gujarati (ગુજરાતી)
 */
export const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const options = [
    { code: 'en', label: 'EN', sub: 'English' },
    { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
  ];

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-1 rounded-full glass-pill border border-slate-700/60 bg-obsidian-900/90 shadow-inner ${className}`}
    >
      {options.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 z-10 ${
              isActive ? 'text-obsidian-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-lang-indicator"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 shadow-glow-gold -z-10"
                transition={springSnappy}
              />
            )}
            <span className={opt.code === 'gu' ? 'font-gujarati text-[13px]' : ''}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
