// Theme Utility Component
// This component provides easy-to-use theme styling utilities

import React from 'react';
import { getTheme } from './themes';

// Higher-order component for theme styling
export const withTheme = (Component) => {
  return (props) => {
    const { theme: themeName, ...otherProps } = props;
    const theme = getTheme(themeName);
    
    return <Component theme={theme} themeName={themeName} {...otherProps} />;
  };
};

// Theme-aware styled component utility
export const ThemedDiv = ({ themeName, className = '', children, ...props }) => {
  const theme = getTheme(themeName);
  
  return (
    <div 
      className={`${className}`}
      data-theme={theme.meta.name}
      {...props}
    >
      {children}
    </div>
  );
};

// Common themed components for consistent styling
export const ThemedCard = ({ themeName, children, hover = true, className = '', ...props }) => {
  const theme = getTheme(themeName);
  
  const baseClasses = `
    ${theme.bg.card} 
    ${theme.border.card} 
    ${theme.blur.lg}
    border rounded-2xl 
    ${theme.shadow.sm}
    transition-all duration-500 ease-out
  `;
  
  const hoverClasses = hover ? `
    ${theme.shadow.xl}
    transform hover:scale-[1.02] hover:-translate-y-1
  ` : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const ThemedButton = ({ 
  themeName, 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}) => {
  const theme = getTheme(themeName);
  
  const variants = {
    primary: `
      ${theme.bg.button} 
      ${theme.text.button} 
      ${theme.border.accent}
      hover:${theme.bg.buttonHover}
    `,
    secondary: `
      ${theme.bg.secondary} 
      ${theme.text.secondary} 
      ${theme.border.primary}
      hover:${theme.bg.tertiary}
    `,
    ghost: `
      bg-transparent 
      ${theme.text.primary} 
      ${theme.border.secondary}
      hover:${theme.bg.secondary}
    `
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const baseClasses = `
    ${variants[variant]}
    ${sizes[size]}
    font-medium rounded-xl border transition-all duration-200
    focus:ring-4 focus:ring-blue-500/20 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const ThemedInput = ({ themeName, className = '', ...props }) => {
  const theme = getTheme(themeName);
  
  const baseClasses = `
    ${theme.bg.input} 
    ${theme.text.primary} 
    ${theme.border.input}
    placeholder:${theme.text.tertiary}
    border rounded-xl px-4 py-3 transition-all duration-200
    focus:ring-2 focus:ring-blue-500/30 focus:border-transparent focus:outline-none
  `;
  
  return (
    <input className={`${baseClasses} ${className}`} {...props} />
  );
};

export const ThemedText = ({ 
  themeName, 
  variant = 'primary', 
  size = 'base', 
  weight = 'normal',
  children, 
  className = '',
  as: Component = 'p',
  ...props 
}) => {
  const theme = getTheme(themeName);
  
  const variants = {
    primary: theme.text.primary,
    secondary: theme.text.secondary,
    tertiary: theme.text.tertiary,
    accent: theme.text.accent,
    success: theme.text.success,
    warning: theme.text.warning,
    error: theme.text.error
  };
  
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };
  
  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const classes = `${variants[variant]} ${sizes[size]} ${weights[weight]} ${className}`;
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

// Theme selector component
export const ThemeSelector = ({ currentTheme, onThemeChange, themes, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme.meta.name}
          onClick={() => onThemeChange(theme.meta.name)}
          className={`
            w-8 h-8 rounded-full border-2 transition-all duration-200
            ${currentTheme === theme.meta.name 
              ? 'border-white scale-110 shadow-lg' 
              : 'border-gray-300 hover:scale-105'
            }
          `}
          style={{ backgroundColor: theme.meta.accentColor }}
          title={theme.meta.displayName}
        />
      ))}
    </div>
  );
};

// Utility hook for theme values
export const useThemeConfig = (themeName) => {
  return getTheme(themeName);
};