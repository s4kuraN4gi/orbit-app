// Theme types and default values
// Separated from Server Actions to avoid "use server" export restrictions

export type ThemeColors = {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  accent: string;
  destructive: string;
  muted: string;
  border: string;
};

export type CustomColors = {
  light: ThemeColors;
  dark: ThemeColors;
};

export type UserSettings = {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_view: 'list' | 'overview';
  language: 'ja' | 'en';
  custom_colors: CustomColors | null;
  created_at: string;
  updated_at: string;
};

// Default colors matching shadcn/ui defaults
export const defaultColors: CustomColors = {
  light: {
    primary: '#4f46e5',
    primaryForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    accent: '#f1f5f9',
    destructive: '#ef4444',
    muted: '#64748b',
    border: '#e2e8f0',
  },
  dark: {
    primary: '#818cf8',
    primaryForeground: '#0f172a',
    background: '#020617',
    foreground: '#f8fafc',
    card: '#0f172a',
    accent: '#1e293b',
    destructive: '#f87171',
    muted: '#94a3b8',
    border: '#334155',
  },
};
