'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';

const dictionaries = { en, es };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('rc_lang');
    if (saved && dictionaries[saved]) {
      setLang(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'es' : 'en';
    setLang(nextLang);
    localStorage.setItem('rc_lang', nextLang);
    document.documentElement.lang = nextLang;
  };

  /**
   * Retrieves a translation string based on a dot-notated key.
   * Example: t('header.browse') -> "Browse" (or "Explorar")
   */
  const t = (key) => {
    const keys = key.split('.');
    let value = dictionaries[lang];
    for (const k of keys) {
      if (value[k] === undefined) {
        // Fallback to English if translation is missing
        let fallbackValue = dictionaries['en'];
        for (const fk of keys) {
          if (fallbackValue[fk] === undefined) return key; // Return key if not found in English either
          fallbackValue = fallbackValue[fk];
        }
        return fallbackValue;
      }
      value = value[k];
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
