import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', badge: 'EN', flag: '🇬🇧' },
  { code: 'rw', name: 'Kinyarwanda', badge: 'RW', flag: '🇷🇼' },
  { code: 'fr', name: 'Français', badge: 'FR', flag: '🇫🇷' }
];

export default function LanguageSwitcher({ compact = false }) {
  const { language, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs transition-all cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span>{compact ? currentLang.badge : currentLang.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#111D38] shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fadeIn">
          <div className="py-1">
            <div className="px-3.5 py-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary-500" />
              Language / Ururimi
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  language === lang.code
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm leading-none">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {language === lang.code && (
                  <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
