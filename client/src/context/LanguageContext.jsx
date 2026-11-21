import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { gu } from '../i18n/gu';

const LanguageContext = createContext();

const STORAGE_KEY = 'salon_language';

const dictionaries = {
  en,
  gu,
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gu' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }
  }, [language]);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'gu') {
      setLanguageState(lang);
    }
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'gu' : 'en'));
  };

  /**
   * Helper function to look up nested dot notation keys:
   * e.g., t('brand.name') or t('status.WAITING')
   */
  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = dictionaries[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary if key is missing in active language
        let fallbackVal = dictionaries.en;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  };

  const isGujarati = language === 'gu';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isGujarati,
        t,
        dict: dictionaries[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
