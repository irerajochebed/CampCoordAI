import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/LanguageContext';

export default function ThemeSwitcher({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl bg-white dark:bg-white text-slate-700 dark:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-100 border border-slate-200 dark:border-slate-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${className}`}
      title={isDark ? t('theme.switchToLight', 'Switch to Light Mode') : t('theme.switchToDark', 'Switch to Dark Mode')}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}
