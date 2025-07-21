// Theme Configuration System
// This file contains all theme definitions for easy management and extensibility

export const THEME_NAMES = {
  DARK: 'dark',
  LIGHT: 'light',
  BLUE: 'blue',
  EMERALD: 'emerald',
  PURPLE: 'purple'
};

// Base theme structure - all themes should follow this pattern
const createTheme = (config) => ({
  // Background colors
  bg: {
    primary: config.bg.primary,
    secondary: config.bg.secondary,
    tertiary: config.bg.tertiary,
    card: config.bg.card,
    cardHover: config.bg.cardHover,
    sidebar: config.bg.sidebar,
    header: config.bg.header,
    overlay: config.bg.overlay,
    dropdown: config.bg.dropdown,
    input: config.bg.input,
    button: config.bg.button,
    buttonHover: config.bg.buttonHover,
    accent: config.bg.accent,
    success: config.bg.success,
    warning: config.bg.warning,
    error: config.bg.error
  },
  
  // Text colors
  text: {
    primary: config.text.primary,
    secondary: config.text.secondary,
    tertiary: config.text.tertiary,
    accent: config.text.accent,
    success: config.text.success,
    warning: config.text.warning,
    error: config.text.error,
    button: config.text.button,
    link: config.text.link
  },
  
  // Border colors
  border: {
    primary: config.border.primary,
    secondary: config.border.secondary,
    accent: config.border.accent,
    input: config.border.input,
    card: config.border.card
  },
  
  // Shadow configurations
  shadow: {
    sm: config.shadow.sm,
    md: config.shadow.md,
    lg: config.shadow.lg,
    xl: config.shadow.xl
  },
  
  // Backdrop blur settings
  blur: {
    sm: config.blur.sm,
    md: config.blur.md,
    lg: config.blur.lg
  },
  
  // Theme metadata
  meta: {
    name: config.meta.name,
    displayName: config.meta.displayName,
    isDark: config.meta.isDark,
    accentColor: config.meta.accentColor
  }
});

// Dark Theme (Current default)
const darkTheme = createTheme({
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    card: 'bg-gray-900/60',
    cardHover: 'bg-gray-800/80',
    sidebar: 'bg-gray-900',
    header: 'bg-gray-900/95',
    overlay: 'bg-black/60',
    dropdown: 'bg-gray-900/95',
    input: 'bg-gray-800',
    button: 'bg-blue-600/90',
    buttonHover: 'bg-blue-500',
    accent: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    accent: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    button: 'text-white',
    link: 'text-blue-400'
  },
  border: {
    primary: 'border-gray-800/50',
    secondary: 'border-gray-700/30',
    accent: 'border-blue-500/30',
    input: 'border-gray-600',
    card: 'border-gray-800/50'
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl'
  },
  meta: {
    name: THEME_NAMES.DARK,
    displayName: 'Dark Mode',
    isDark: true,
    accentColor: '#3B82F6'
  }
});

// Light Theme
const lightTheme = createTheme({
  bg: {
    primary: 'bg-gray-50',
    secondary: 'bg-white',
    tertiary: 'bg-gray-100',
    card: 'bg-white/80',
    cardHover: 'bg-white/90',
    sidebar: 'bg-white',
    header: 'bg-white/95',
    overlay: 'bg-white/60',
    dropdown: 'bg-white/95',
    input: 'bg-gray-100',
    button: 'bg-blue-500/90',
    buttonHover: 'bg-blue-600',
    accent: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-500',
    accent: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    button: 'text-white',
    link: 'text-blue-600'
  },
  border: {
    primary: 'border-gray-200/50',
    secondary: 'border-gray-200/30',
    accent: 'border-blue-400/30',
    input: 'border-gray-300',
    card: 'border-gray-200/30'
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl'
  },
  meta: {
    name: THEME_NAMES.LIGHT,
    displayName: 'Light Mode',
    isDark: false,
    accentColor: '#3B82F6'
  }
});

// Blue Theme (Ocean-inspired)
const blueTheme = createTheme({
  bg: {
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    tertiary: 'bg-slate-700',
    card: 'bg-slate-900/70',
    cardHover: 'bg-slate-800/80',
    sidebar: 'bg-slate-900',
    header: 'bg-slate-900/95',
    overlay: 'bg-slate-900/60',
    dropdown: 'bg-slate-900/95',
    input: 'bg-slate-800',
    button: 'bg-sky-600/90',
    buttonHover: 'bg-sky-500',
    accent: 'bg-sky-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-rose-600'
  },
  text: {
    primary: 'text-slate-100',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
    accent: 'text-sky-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
    button: 'text-white',
    link: 'text-sky-400'
  },
  border: {
    primary: 'border-slate-800/50',
    secondary: 'border-slate-700/30',
    accent: 'border-sky-500/30',
    input: 'border-slate-600',
    card: 'border-slate-800/50'
  },
  shadow: {
    sm: 'shadow-sm shadow-slate-900/20',
    md: 'shadow-lg shadow-slate-900/20',
    lg: 'shadow-xl shadow-slate-900/20',
    xl: 'shadow-2xl shadow-slate-900/20'
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl'
  },
  meta: {
    name: THEME_NAMES.BLUE,
    displayName: 'Ocean Blue',
    isDark: true,
    accentColor: '#0EA5E9'
  }
});

// Emerald Theme (Nature-inspired)
const emeraldTheme = createTheme({
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    card: 'bg-gray-900/70',
    cardHover: 'bg-gray-800/80',
    sidebar: 'bg-gray-900',
    header: 'bg-gray-900/95',
    overlay: 'bg-gray-900/60',
    dropdown: 'bg-gray-900/95',
    input: 'bg-gray-800',
    button: 'bg-emerald-600/90',
    buttonHover: 'bg-emerald-500',
    accent: 'bg-emerald-600',
    success: 'bg-green-600',
    warning: 'bg-orange-600',
    error: 'bg-red-600'
  },
  text: {
    primary: 'text-gray-100',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    accent: 'text-emerald-400',
    success: 'text-green-400',
    warning: 'text-orange-400',
    error: 'text-red-400',
    button: 'text-white',
    link: 'text-emerald-400'
  },
  border: {
    primary: 'border-gray-800/50',
    secondary: 'border-gray-700/30',
    accent: 'border-emerald-500/30',
    input: 'border-gray-600',
    card: 'border-gray-800/50'
  },
  shadow: {
    sm: 'shadow-sm shadow-emerald-900/20',
    md: 'shadow-lg shadow-emerald-900/20',
    lg: 'shadow-xl shadow-emerald-900/20',
    xl: 'shadow-2xl shadow-emerald-900/20'
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl'
  },
  meta: {
    name: THEME_NAMES.EMERALD,
    displayName: 'Forest Green',
    isDark: true,
    accentColor: '#10B981'
  }
});

// Purple Theme (Premium-inspired)
const purpleTheme = createTheme({
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    card: 'bg-gray-900/70',
    cardHover: 'bg-gray-800/80',
    sidebar: 'bg-gray-900',
    header: 'bg-gray-900/95',
    overlay: 'bg-gray-900/60',
    dropdown: 'bg-gray-900/95',
    input: 'bg-gray-800',
    button: 'bg-purple-600/90',
    buttonHover: 'bg-purple-500',
    accent: 'bg-purple-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  },
  text: {
    primary: 'text-gray-100',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    accent: 'text-purple-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    button: 'text-white',
    link: 'text-purple-400'
  },
  border: {
    primary: 'border-gray-800/50',
    secondary: 'border-gray-700/30',
    accent: 'border-purple-500/30',
    input: 'border-gray-600',
    card: 'border-gray-800/50'
  },
  shadow: {
    sm: 'shadow-sm shadow-purple-900/20',
    md: 'shadow-lg shadow-purple-900/20',
    lg: 'shadow-xl shadow-purple-900/20',
    xl: 'shadow-2xl shadow-purple-900/20'
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-xl'
  },
  meta: {
    name: THEME_NAMES.PURPLE,
    displayName: 'Royal Purple',
    isDark: true,
    accentColor: '#8B5CF6'
  }
});

// Theme registry - add new themes here
export const THEMES = {
  [THEME_NAMES.DARK]: darkTheme,
  [THEME_NAMES.LIGHT]: lightTheme,
  [THEME_NAMES.BLUE]: blueTheme,
  [THEME_NAMES.EMERALD]: emeraldTheme,
  [THEME_NAMES.PURPLE]: purpleTheme
};

// Helper functions
export const getTheme = (themeName) => {
  return THEMES[themeName] || THEMES[THEME_NAMES.DARK];
};

export const getAllThemes = () => {
  return Object.values(THEMES);
};

export const getThemeNames = () => {
  return Object.keys(THEMES);
};

export const isValidTheme = (themeName) => {
  return Object.keys(THEMES).includes(themeName);
};

// Theme utility functions for conditional classes
export const getConditionalClass = (currentTheme, lightClass, darkClass) => {
  const theme = getTheme(currentTheme);
  return theme.meta.isDark ? darkClass : lightClass;
};

// Export default theme
export const DEFAULT_THEME = THEME_NAMES.DARK;