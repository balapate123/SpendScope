import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load persisted theme logic could go here
    const savedTheme = localStorage.getItem('spendscope_theme') as Theme;
    if (savedTheme) setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let appliedTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      appliedTheme = isDarkSystem ? 'dark' : 'light';
    } else {
      appliedTheme = theme;
    }

    setResolvedTheme(appliedTheme);

    if (appliedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('spendscope_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
