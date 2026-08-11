import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import rw from '../locales/rw.json';
import fr from '../locales/fr.json';

const translations = { en, rw, fr };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  useEffect(() => {
    const handleLanguageEvent = (e) => {
      if (e.detail && translations[e.detail]) {
        setLanguage(e.detail);
      }
    };
    window.addEventListener('language_changed', handleLanguageEvent);
    return () => window.removeEventListener('language_changed', handleLanguageEvent);
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
      window.dispatchEvent(new CustomEvent('language_changed', { detail: lang }));

      // Optionally sync to logged-in user profile
      const savedUserStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUserStr && token) {
        try {
          const user = JSON.parse(savedUserStr);
          if (user?.id) {
            import('../api').then(({ userApi }) => {
              userApi.update(user.id, { preferredLanguage: lang }).catch(() => {});
            });
            user.preferredLanguage = lang;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (err) {
          // ignore background sync errors
        }
      }
    }
  };

  // Helper function to resolve nested translation keys (e.g. 'auth.welcomeBack')
  const t = (keyPath, fallback = '') => {
    if (!keyPath) return fallback;

    const keys = keyPath.split('.');
    let currentDict = translations[language] || translations['en'];
    let fallbackDict = translations['en'];

    for (const key of keys) {
      if (currentDict && currentDict[key] !== undefined) {
        currentDict = currentDict[key];
      } else {
        currentDict = null;
        break;
      }
    }

    if (currentDict && typeof currentDict === 'string') {
      return currentDict;
    }

    // Fallback to English dictionary
    for (const key of keys) {
      if (fallbackDict && fallbackDict[key] !== undefined) {
        fallbackDict = fallbackDict[key];
      } else {
        fallbackDict = null;
        break;
      }
    }

    return (fallbackDict && typeof fallbackDict === 'string') ? fallbackDict : (fallback || keyPath);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
