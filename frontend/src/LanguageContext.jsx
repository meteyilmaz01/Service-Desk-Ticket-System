import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('userLanguage') || 'TR'
  );

  useEffect(() => {
    localStorage.setItem('userLanguage', currentLanguage);
  }, [currentLanguage]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // return key as fallback
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
