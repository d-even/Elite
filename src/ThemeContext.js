import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? {
      // Dark Mode Colors
      bg: '#0a0e1a',
      bgSecondary: '#141824',
      bgTertiary: '#1e2535',
      card: '#1a1f2e',
      cardHover: '#232938',
      text: '#e4e7eb',
      textSecondary: '#9ca3af',
      textTertiary: '#6b7280',
      border: '#2d3748',
      borderLight: '#374151',
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: 'rgba(99, 102, 241, 0.1)',
      secondary: '#ec4899',
      secondaryHover: '#db2777',
      secondaryLight: 'rgba(236, 72, 153, 0.1)',
      success: '#10b981',
      successHover: '#059669',
      successLight: 'rgba(16, 185, 129, 0.1)',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningLight: 'rgba(245, 158, 11, 0.1)',
      danger: '#ef4444',
      dangerHover: '#dc2626',
      dangerLight: 'rgba(239, 68, 68, 0.1)',
      info: '#3b82f6',
      infoLight: 'rgba(59, 130, 246, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gradient2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      gradient3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      gradient4: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      gradientDanger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    } : {
      // Light Mode Colors
      bg: '#f8fafc',
      bgSecondary: '#ffffff',
      bgTertiary: '#f1f5f9',
      card: '#ffffff',
      cardHover: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#cbd5e1',
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: 'rgba(99, 102, 241, 0.08)',
      secondary: '#ec4899',
      secondaryHover: '#db2777',
      secondaryLight: 'rgba(236, 72, 153, 0.08)',
      success: '#10b981',
      successHover: '#059669',
      successLight: 'rgba(16, 185, 129, 0.08)',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningLight: 'rgba(245, 158, 11, 0.08)',
      danger: '#ef4444',
      dangerHover: '#dc2626',
      dangerLight: 'rgba(239, 68, 68, 0.08)',
      info: '#3b82f6',
      infoLight: 'rgba(59, 130, 246, 0.08)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gradient2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      gradient3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      gradient4: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      gradientDanger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
