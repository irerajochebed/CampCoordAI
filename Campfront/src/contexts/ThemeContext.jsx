import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (e) => {
      const darkActive = e.matches;
      setIsDark(darkActive);
      const root = document.documentElement;
      if (darkActive) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    // Apply initially
    applyTheme(mediaQuery);

    // Event listener for OS/Browser theme changes
    try {
      mediaQuery.addEventListener('change', applyTheme);
    } catch (err) {
      // Fallback for legacy browsers
      mediaQuery.addListener(applyTheme);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', applyTheme);
      } catch (err) {
        mediaQuery.removeListener(applyTheme);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? 'dark' : 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
