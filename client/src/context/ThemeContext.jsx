import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: 'navy-sapphire',
    name: 'Velvet Navy & Sapphire (Champion)',
    primary: '#0284C7',
    secondary: '#38BDF8',
    gradient: 'from-sky-500 to-blue-600',
    bg: '#070D1E',
    panelBg: 'bg-[#0E1A34]/85',
    cardBg: 'bg-[#13203E]/70',
    bubbleSent: 'bg-gradient-to-r from-sky-600 to-blue-600 shadow-sky-500/25',
    accentText: 'text-sky-400'
  },
  {
    id: 'slate-minimal',
    name: 'Linear Slate & Cobalt',
    primary: '#2563EB',
    secondary: '#60A5FA',
    gradient: 'from-blue-600 to-indigo-600',
    bg: '#0A0F1D',
    panelBg: 'bg-[#111827]/85',
    cardBg: 'bg-[#1E293B]/70',
    bubbleSent: 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25',
    accentText: 'text-blue-400'
  },
  {
    id: 'deep-space',
    name: 'Obsidian & Cyan Electric',
    primary: '#06B6D4',
    secondary: '#3B82F6',
    gradient: 'from-cyan-500 to-blue-600',
    bg: '#050914',
    panelBg: 'bg-[#0B132B]/85',
    cardBg: 'bg-[#1C2541]/70',
    bubbleSent: 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-500/25',
    accentText: 'text-cyan-400'
  },
  {
    id: 'midnight-violet',
    name: 'Velvet Violet & Indigo',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    gradient: 'from-purple-500 to-pink-500',
    bg: '#080514',
    panelBg: 'bg-[#140E2D]/85',
    cardBg: 'bg-[#221747]/70',
    bubbleSent: 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/25',
    accentText: 'text-purple-400'
  }
];

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem('nextchat_theme') || 'navy-sapphire';
  });

  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem('nextchat_theme', currentThemeId);
    document.documentElement.setAttribute('data-theme', currentThemeId);
  }, [currentThemeId]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeId: currentThemeId,
        setTheme: setCurrentThemeId,
        availableThemes: THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
