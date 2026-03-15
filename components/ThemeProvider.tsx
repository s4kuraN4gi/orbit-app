'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomColors, ThemeColors } from '@/lib/theme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  customColors: CustomColors | null;
  setCustomColors: (colors: CustomColors | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return safe defaults if used outside ThemeProvider (SSR safety)
  if (!context) {
    return {
      theme: 'system' as const,
      setTheme: () => {},
      resolvedTheme: 'light' as const,
      customColors: null,
      setCustomColors: () => {},
    };
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  initialCustomColors?: CustomColors | null;
}

// Convert hex color to CSS color format that works with tailwind
function hexToColor(hex: string): string {
  // Return hex as-is for direct CSS usage
  return hex;
}

// Map our color keys to CSS variable names used in globals.css
const colorVarMap: Record<keyof ThemeColors, string[]> = {
  primary: ['--primary', '--sidebar-primary'],
  primaryForeground: ['--primary-foreground', '--sidebar-primary-foreground'],
  background: ['--background'],
  foreground: ['--foreground', '--sidebar-foreground'],
  card: ['--card', '--popover', '--sidebar'],
  accent: ['--accent', '--secondary', '--sidebar-accent'],
  destructive: ['--destructive'],
  muted: ['--muted-foreground'],
  border: ['--border', '--input', '--sidebar-border'],
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'orbit-theme',
  initialCustomColors = null,
}: ThemeProviderProps) {
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
  };
  const getInitialCustomColors = (): CustomColors | null => {
    if (typeof window === 'undefined') return initialCustomColors;
    const storedColors = localStorage.getItem('orbit-custom-colors');
    if (storedColors) {
      try { return JSON.parse(storedColors); } catch { /* ignore */ }
    }
    return initialCustomColors;
  };
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [customColors, setCustomColorsState] = useState<CustomColors | null>(getInitialCustomColors);

  // Mark as mounted — standard Next.js hydration pattern
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
      
      // Apply custom colors if set
      if (customColors) {
        const colors = resolved === 'dark' ? customColors.dark : customColors.light;
        Object.entries(colors).forEach(([key, value]) => {
          const cssVars = colorVarMap[key as keyof ThemeColors];
          if (cssVars && value) {
            // Set each related CSS variable directly
            cssVars.forEach(cssVar => {
              root.style.setProperty(cssVar, hexToColor(value));
            });
          }
        });
        root.setAttribute('data-custom-colors', 'true');
      } else {
        // Remove custom color overrides - reset to stylesheet defaults
        Object.values(colorVarMap).flat().forEach(cssVar => {
          root.style.removeProperty(cssVar);
        });
        root.removeAttribute('data-custom-colors');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted, customColors]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const setCustomColors = (colors: CustomColors | null) => {
    setCustomColorsState(colors);
    if (colors) {
      localStorage.setItem('orbit-custom-colors', JSON.stringify(colors));
    } else {
      localStorage.removeItem('orbit-custom-colors');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
