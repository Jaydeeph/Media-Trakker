import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';
import { getTheme, getThemeNames, THEME_NAMES, DEFAULT_THEME, getAllThemes } from './themes';
import { ThemedCard, ThemedButton, ThemedInput, ThemedText, ThemeSelector, useThemeConfig } from './ThemeComponents';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the current theme configuration
  const themeConfig = useThemeConfig(currentThemeName);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await axios.get(`${API}/user-preferences`);
      const themeName = response.data.theme || DEFAULT_THEME;
      if (getThemeNames().includes(themeName)) {
        setCurrentThemeName(themeName);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setCurrentThemeName(DEFAULT_THEME);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newThemeName) => {
    if (!getThemeNames().includes(newThemeName)) return;
    
    setCurrentThemeName(newThemeName);
    
    try {
      await axios.put(`${API}/user-preferences`, { theme: newThemeName });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const value = {
    theme: currentThemeName, // Keep backward compatibility
    themeName: currentThemeName,
    themeConfig: themeConfig,
    setTheme: updateTheme, // Keep backward compatibility
    changeTheme: updateTheme,
    availableThemes: getThemeNames(),
    allThemes: getAllThemes(),
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={currentThemeName}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Apple-like Collapsible Sidebar with Dark Theme
const Sidebar = ({ currentPage, onPageChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'tv', label: 'TV Shows', icon: '📺' },
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'manga', label: 'Manga', icon: '📚' },
    { id: 'books', label: 'Books', icon: '📖' },
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const sidebarWidth = isExpanded ? 'w-64' : 'w-16';

  return (
    <div 
      className={`${sidebarWidth} ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} h-screen fixed left-0 top-0 overflow-hidden transition-all duration-300 ease-in-out z-50 border-r`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300`}>
        <div className="mb-8">
          {isExpanded ? (
            <h1 className={`text-xl font-bold text-red-500 px-2`}>Media Trakker</h1>
          ) : (
            <div className="text-red-500 text-2xl font-bold text-center h-8 flex items-center justify-center">MT</div>
          )}
        </div>
        
        <nav className="space-y-1">
          {menuItems.map(item => {
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center rounded-xl transition-all duration-200 group ${
                  isExpanded ? 'px-3 py-3' : 'px-0 py-3'
                } ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={!isExpanded ? item.label : ''}
              >
                <div className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center w-full'}`}>
                  <span className="text-xl">{item.icon}</span>
                  {isExpanded && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Dark Theme Top Navigation
const TopNavigation = ({ currentPage, onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Convert frontend page names to backend media types
      const mediaTypeMap = {
        'books': 'book',
        'games': 'game',
        'movies': 'movie',
        'tv': 'tv',
        'anime': 'anime',
        'manga': 'manga'
      };
      const mediaType = mediaTypeMap[currentPage] || currentPage;
      onSearch(query, mediaType);
    }
  };

  const getPageInfo = (page) => {
    const pageInfo = {
      'movies': { title: 'Movies', placeholder: 'Search for movies...', icon: '🎬' },
      'tv': { title: 'TV Shows', placeholder: 'Search for TV shows...', icon: '📺' },
      'anime': { title: 'Anime', placeholder: 'Search for anime...', icon: '🎌' },
      'manga': { title: 'Manga', placeholder: 'Search for manga...', icon: '📚' },
      'books': { title: 'Books', placeholder: 'Search for books...', icon: '📖' },
      'games': { title: 'Games', placeholder: 'Search for games...', icon: '🎮' }
    };
    return pageInfo[page] || null;
  };

  const pageInfo = getPageInfo(currentPage);

  if (!pageInfo) return null;

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-lg border-b px-6 py-4 sticky top-0 z-40`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
            <span className="text-lg">{pageInfo.icon}</span>
          </div>
          <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{pageInfo.title}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pageInfo.placeholder}
              className={`w-96 px-4 py-2.5 ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200`}
            />
            <div className={`absolute inset-y-0 right-0 flex items-center pr-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>⌘F</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Enhanced Dashboard with Detailed Statistics
const Dashboard = ({ stats, userListItems }) => {
  const { theme } = useTheme();
  
  const totalItems = Object.values(stats).reduce((acc, mediaStats) => {
    return acc + Object.values(mediaStats).reduce((sum, count) => sum + count, 0);
  }, 0);

  const getCompletionRate = () => {
    let completed = 0;
    let total = 0;
    Object.values(stats).forEach(mediaStats => {
      Object.entries(mediaStats).forEach(([status, count]) => {
        total += count;
        if (status === 'completed') completed += count;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getMediaTypeStats = () => {
    const mediaLabels = {
      'movie': { name: 'Movies', icon: '🎬', bgColor: 'bg-red-500' },
      'tv': { name: 'TV Shows', icon: '📺', bgColor: 'bg-blue-500' },
      'anime': { name: 'Anime', icon: '🎌', bgColor: 'bg-purple-500' },
      'manga': { name: 'Manga', icon: '📚', bgColor: 'bg-green-500' },
      'book': { name: 'Books', icon: '📖', bgColor: 'bg-yellow-500' },
      'game': { name: 'Games', icon: '🎮', bgColor: 'bg-indigo-500' }
    };

    return Object.entries(stats).map(([mediaType, statusCounts]) => {
      const label = mediaLabels[mediaType] || { name: mediaType, icon: '📄', bgColor: 'bg-gray-500' };
      const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      const completed = statusCounts.completed || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...label,
        mediaType,
        total,
        completed,
        completionRate,
        statusCounts
      };
    }).filter(item => item.total > 0);
  };

  const getRecentActivity = () => {
    const sortedItems = [...userListItems].sort((a, b) => 
      new Date(b.list_item.updated_at) - new Date(a.list_item.updated_at)
    );
    
    return sortedItems.slice(0, 8);
  };

  const getActivityByMediaType = () => {
    const mediaLabels = {
      'movie': { name: 'Movies', icon: '🎬' },
      'tv': { name: 'TV Shows', icon: '📺' },
      'anime': { name: 'Anime', icon: '🎌' },
      'manga': { name: 'Manga', icon: '📚' },
      'book': { name: 'Books', icon: '📖' },
      'game': { name: 'Games', icon: '🎮' }
    };

    const activityByType = {};
    
    userListItems.forEach(item => {
      const mediaType = item.media_item.media_type;
      if (!activityByType[mediaType]) {
        activityByType[mediaType] = [];
      }
      activityByType[mediaType].push(item);
    });

    // Sort each type by most recent and limit to 3 items
    Object.keys(activityByType).forEach(type => {
      activityByType[type] = activityByType[type]
        .sort((a, b) => new Date(b.list_item.updated_at) - new Date(a.list_item.updated_at))
        .slice(0, 3);
    });

    return { activityByType, mediaLabels };
  };

  const mediaTypeStats = getMediaTypeStats();
  const recentActivity = getRecentActivity();
  const { activityByType, mediaLabels } = getActivityByMediaType();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Welcome back! 👋
        </h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Here's your media tracking overview
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Items</p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {totalItems}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Completion Rate</p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {getCompletionRate()}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Media Types</p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {mediaTypeStats.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl">🎭</span>
            </div>
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Recent Activity</p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {recentActivity.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Media Type Breakdown */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Media Type Breakdown
        </h2>
        
        {mediaTypeStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaTypeStats.map((media) => (
              <div key={media.mediaType} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${media.bgColor} rounded-xl flex items-center justify-center`}>
                    <span className="text-lg">{media.icon}</span>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {media.name}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {media.total} items • {media.completionRate}% complete
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(media.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`text-sm capitalize ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {status}
                      </span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className={`w-full h-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${media.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-4xl mb-2">🎬</div>
            <p>No media in your collection yet. Start adding some!</p>
          </div>
        )}
      </div>

      {/* Recent Activity by Media Type */}
      {Object.keys(activityByType).length > 0 && (
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity by Type
          </h2>
          
          <div className="space-y-6">
            {Object.entries(activityByType).map(([mediaType, items]) => (
              <div key={mediaType}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{mediaLabels[mediaType]?.icon}</span>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Recent {mediaLabels[mediaType]?.name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div key={item.list_item.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="flex gap-3">
                        {item.media_item.poster_path && (
                          <img
                            src={item.media_item.poster_path}
                            alt={item.media_item.title}
                            className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm mb-1 truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {item.media_item.title}
                          </h4>
                          <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.media_item.year}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                            item.list_item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.list_item.status === 'watching' || item.list_item.status === 'reading' || item.list_item.status === 'playing' ? 'bg-blue-100 text-blue-800' :
                            item.list_item.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            item.list_item.status === 'dropped' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.list_item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  const { theme, themeName, themeConfig, changeTheme, allThemes } = useTheme();
  
  return (
    <div className="space-y-8">
      {/* Settings Header */}
      <ThemedCard themeName={themeName} className="p-8">
        <ThemedText themeName={themeName} variant="primary" size="4xl" weight="bold" as="h1" className="mb-2">
          Settings
        </ThemedText>
        <ThemedText themeName={themeName} variant="secondary" size="lg">
          Customize your Media Trakker experience
        </ThemedText>
      </ThemedCard>
      
      {/* Theme Settings */}
      <ThemedCard themeName={themeName} className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <ThemedText themeName={themeName} variant="primary" size="2xl" weight="bold" as="h2" className="mb-2">
              Theme Selection
            </ThemedText>
            <ThemedText themeName={themeName} variant="secondary" size="base">
              Choose your preferred color theme for the application
            </ThemedText>
          </div>
        </div>
        
        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allThemes.map((themeOption) => (
            <div
              key={themeOption.meta.name}
              className={`
                relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105
                ${themeName === themeOption.meta.name 
                  ? `border-blue-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}` 
                  : `border-gray-300 dark:border-gray-600 hover:border-gray-400 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`
                }
              `}
              onClick={() => changeTheme(themeOption.meta.name)}
            >
              {/* Theme Preview */}
              <div className="mb-4">
                <div className={`w-full h-20 ${themeOption.bg.primary} rounded-lg border ${themeOption.border.primary} flex items-center justify-center mb-3`}>
                  <div className={`w-8 h-8 ${themeOption.bg.accent} rounded-full`}></div>
                </div>
                <div className="flex gap-2">
                  <div className={`flex-1 h-2 ${themeOption.bg.secondary} rounded`}></div>
                  <div className={`flex-1 h-2 ${themeOption.bg.tertiary} rounded`}></div>
                  <div className={`flex-1 h-2 ${themeOption.bg.accent} rounded`}></div>
                </div>
              </div>
              
              {/* Theme Info */}
              <div className="text-center">
                <h3 className={`font-bold text-lg mb-1 ${themeOption.text.primary}`}>
                  {themeOption.meta.displayName}
                </h3>
                <p className={`text-sm ${themeOption.text.secondary}`}>
                  {themeOption.meta.isDark ? 'Dark Theme' : 'Light Theme'}
                </p>
              </div>
              
              {/* Selected Indicator */}
              {themeName === themeOption.meta.name && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Current Theme Info */}
        <div className={`mt-8 p-4 ${themeConfig.bg.secondary} ${themeConfig.border.primary} border rounded-xl`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: themeConfig.meta.accentColor }}
            ></div>
            <ThemedText themeName={themeName} variant="primary" weight="medium">
              Current Theme: {themeConfig.meta.displayName}
            </ThemedText>
          </div>
          <ThemedText themeName={themeName} variant="secondary" size="sm" className="mt-1">
            {themeConfig.meta.isDark ? 'Dark mode with' : 'Light mode with'} {themeConfig.meta.accentColor} accent
          </ThemedText>
        </div>
      </ThemedCard>
      
      {/* Other Settings */}
      <ThemedCard themeName={themeName} className="p-8">
        <ThemedText themeName={themeName} variant="primary" size="2xl" weight="bold" as="h2" className="mb-4">
          Other Settings
        </ThemedText>
        <ThemedText themeName={themeName} variant="secondary">
          Additional settings will be added here in future updates.
        </ThemedText>
      </ThemedCard>
    </div>
  );
};

// Other components with dark theme support...
const ProfilePage = ({ userListItems, onUpdateItem, onRemoveItem }) => {
  const { theme } = useTheme();
  
  const getItemsByMediaType = () => {
    const itemsByType = {};
    userListItems.forEach(item => {
      const mediaType = item.media_item.media_type;
      if (!itemsByType[mediaType]) {
        itemsByType[mediaType] = [];
      }
      itemsByType[mediaType].push(item);
    });
    return itemsByType;
  };

  const getMediaTypeInfo = (mediaType) => {
    const info = {
      'movie': { name: 'Movies', icon: '🎬', bgColor: theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200' },
      'tv': { name: 'TV Shows', icon: '📺', bgColor: theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200' },
      'anime': { name: 'Anime', icon: '🎌', bgColor: theme === 'dark' ? 'bg-pink-900/20 border-pink-800' : 'bg-pink-50 border-pink-200' },
      'manga': { name: 'Manga', icon: '📚', bgColor: theme === 'dark' ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200' },
      'book': { name: 'Books', icon: '📖', bgColor: theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200' },
      'game': { name: 'Games', icon: '🎮', bgColor: theme === 'dark' ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200' }
    };
    return info[mediaType] || { name: mediaType, icon: '📄', bgColor: theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200' };
  };

  const itemsByType = getItemsByMediaType();

  return (
    <div className={`space-y-8 max-w-6xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Manage your media collections</p>
      </div>

      {Object.keys(itemsByType).length === 0 ? (
        <div className="text-center py-16">
          <div className={`w-20 h-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your Lists Are Empty</h2>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Start adding movies, TV shows, anime, manga, books, and games to see them here!</p>
          <button className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">
            Explore Media
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(itemsByType).map(([mediaType, items]) => {
            const mediaInfo = getMediaTypeInfo(mediaType);
            return (
              <div key={mediaType} className={`${mediaInfo.bgColor} rounded-2xl border p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${theme === 'dark' ? 'bg-gray-700/80' : 'bg-white/80'} rounded-2xl flex items-center justify-center`}>
                      <span className="text-2xl">{mediaInfo.icon}</span>
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mediaInfo.name}</h2>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{items.length} items</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {items.map(item => (
                    <div key={item.list_item.id} className={`${theme === 'dark' ? 'bg-gray-800/70 hover:bg-gray-700/90' : 'bg-white/70 hover:bg-white/90'} rounded-xl p-4 transition-all duration-200`}>
                      <div className="flex items-start gap-4">
                        {item.media_item.poster_path && (
                          <img
                            src={item.media_item.poster_path}
                            alt={item.media_item.title}
                            className="w-16 h-24 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>{item.media_item.title}</h3>
                          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                            {item.media_item.year || 'Unknown Year'}
                          </p>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status:</label>
                            <select
                              value={item.list_item.status}
                              onChange={(e) => onUpdateItem(item.list_item.id, { status: e.target.value })}
                              className={`px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                                theme === 'dark' 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              {['watching', 'reading', 'playing', 'completed', 'paused', 'planning', 'dropped'].map(status => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {item.list_item.rating && (
                            <p className="text-sm text-yellow-600 mb-2 flex items-center gap-1">
                              <span>⭐</span>
                              <span>Your Rating: {item.list_item.rating}/10</span>
                            </p>
                          )}
                          
                          <button
                            onClick={() => onRemoveItem(item.list_item.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            Remove from List
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Apple-style Add to List Button Component
const AddToListButton = ({ media, isInUserList, onAddToList, theme, mediaType }) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'watching', label: 'Watching' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
    { value: 'dropped', label: 'Dropped' },
    // Add media-specific statuses
    ...(mediaType === 'game' ? [
      { value: 'playing', label: 'Playing' }
    ] : []),
    ...((mediaType === 'book' || mediaType === 'manga') ? [
      { value: 'reading', label: 'Reading' }
    ] : [])
  ];
  
  // Remove duplicates by value
  const uniqueStatusOptions = statusOptions.filter((option, index, self) => 
    index === self.findIndex(o => o.value === option.value)
  );
  
  const handleStatusSelect = (status) => {
    onAddToList(media, status);
    setShowStatusDropdown(false);
  };
  
  if (isInUserList) {
    return (
      <div className="absolute bottom-3 left-3 right-3">
        <div className={`w-full px-4 py-2.5 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl rounded-xl text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} text-center`}>
          In Library
        </div>
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-3 left-3 right-3 z-10">
      {!showStatusDropdown ? (
        <button
          onClick={() => setShowStatusDropdown(true)}
          className={`w-full px-4 py-2.5 ${theme === 'dark' ? 'bg-blue-600/90' : 'bg-blue-500/90'} backdrop-blur-xl rounded-xl text-white text-sm font-medium border ${theme === 'dark' ? 'border-blue-500/30' : 'border-blue-400/30'} hover:bg-blue-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}
        >
          Add to Library
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <div className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl rounded-2xl border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} shadow-2xl overflow-hidden max-h-80 z-50`}>
          <div className="p-3 max-h-72 overflow-y-auto">
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} px-3 py-2 uppercase tracking-wider`}>
              Add to List
            </div>
            <div className="space-y-1">
              {uniqueStatusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl ${theme === 'dark' ? 'text-white hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-100/50'} transition-all duration-150 hover:scale-[1.02]`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`px-3 pb-3 border-t ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-100/50'}`}>
            <button
              onClick={() => setShowStatusDropdown(false)}
              className={`w-full px-3 py-2.5 text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} rounded-xl hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-all duration-150 mt-2`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Media Page Component with Its Own Search Bar and State
const MediaPage = ({ mediaType, searchResults = [], searchQuery = '', loading = false, userMediaItems = [], onAddToList, onUpdateItem, onRemoveItem, onSearch, advancedMode = false, onToggleAdvancedMode }) => {
  const { theme } = useTheme();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  
  // Sync local search query with parent state
  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);
  
  // Ensure searchResults is always an array
  const safeSearchResults = searchResults || [];
  
  const getMediaTypeInfo = (type) => {
    const info = {
      'movie': { title: 'Movies', icon: '🎬', description: 'Discover and track your favorite movies', placeholder: 'Search for movies...' },
      'tv': { title: 'TV Shows', icon: '📺', description: 'Keep up with your favorite TV series', placeholder: 'Search for TV shows...' },
      'anime': { title: 'Anime', icon: '🎌', description: 'Explore the world of anime', placeholder: 'Search for anime...' },
      'manga': { title: 'Manga', icon: '📚', description: 'Track your manga reading progress', placeholder: 'Search for manga...' },
      'book': { title: 'Books', icon: '📖', description: 'Manage your reading list', placeholder: 'Search for books...' },
      'game': { title: 'Games', icon: '🎮', description: 'Track your gaming progress and achievements', placeholder: 'Search for games...' }
    };
    return info[type] || { title: type, icon: '📄', description: 'Media content', placeholder: 'Search...' };
  };

  const mediaInfo = getMediaTypeInfo(mediaType);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (localSearchQuery.trim() && onSearch) {
      onSearch(localSearchQuery, mediaType);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    await onUpdateItem(itemId, { status: newStatus });
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from your list?')) {
      await onRemoveItem(itemId);
    }
  };

  const renderMediaCard = (media, isUserItem = false, advancedMode) => {
    const isInUserList = userMediaItems.some(item => item.media_item.external_id === media.external_id);
    
    return (
      <div key={media.id} className={`group relative overflow-visible ${theme === 'dark' ? 'bg-gray-900/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl border ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/30'} shadow-sm hover:shadow-2xl transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1`}>
        
        {/* Poster Container */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-50 dark:bg-gray-800">
          {media.poster_path ? (
            <img
              src={media.poster_path}
              alt={media.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className={`w-16 h-16 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                <span className="text-2xl opacity-40">{
                  mediaType === 'movie' ? '🎬' : 
                  mediaType === 'tv' ? '📺' : 
                  mediaType === 'game' ? '🎮' : 
                  mediaType === 'book' ? '📖' : 
                  mediaType === 'manga' ? '📚' : 
                  mediaType === 'anime' ? '🎌' : '📄'
                }</span>
              </div>
            </div>
          )}
          
          {/* Subtle Rating Badge */}
          {media.vote_average && (
            <div className={`absolute top-3 right-3 ${theme === 'dark' ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-md rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'border-gray-700/30' : 'border-white/30'}`}>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {media.vote_average.toFixed(1)}
              </span>
            </div>
          )}
          
          {/* Clean Status Badge for User Items */}
          {isUserItem && isUserItem.list_item?.status && (
            <div className={`absolute top-3 left-3 ${theme === 'dark' ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-md rounded-full px-3 py-1.5 border ${theme === 'dark' ? 'border-gray-700/30' : 'border-white/30'}`}>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} capitalize`}>
                {isUserItem.list_item.status}
              </span>
            </div>
          )}
          
          {/* Gentle Hover Overlay */}
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6`}>
            
            {/* Advanced Info on Hover */}
            {advancedMode && (
              <div className="space-y-3 mb-4">
                {/* Overview */}
                {media.overview && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} line-clamp-3 leading-relaxed`}>
                    {media.overview}
                  </p>
                )}
                
                {/* Genres */}
                {media.genres && media.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {media.genres.slice(0, 3).map(genre => (
                      <span key={genre} className={`px-3 py-1 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm rounded-full text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Media-specific details */}
                <div className="space-y-1 text-xs">
                  {media.platforms && media.platforms.length > 0 && (
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      <span className="font-semibold">Platforms:</span> {media.platforms.slice(0, 2).join(', ')}
                    </p>
                  )}
                  
                  {media.developers && media.developers.length > 0 && (
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      <span className="font-semibold">Developer:</span> {media.developers[0]}
                    </p>
                  )}
                  
                  {(media.seasons || media.episodes) && (
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      {media.seasons && `${media.seasons} seasons`}
                      {media.seasons && media.episodes && ', '}
                      {media.episodes && `${media.episodes} episodes`}
                    </p>
                  )}
                  
                  {media.authors && media.authors.length > 0 && (
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      <span className="font-semibold">By:</span> {media.authors[0]}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Apple-style Action Buttons */}
          {isUserItem ? (
            // Clean user controls
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <select
                value={isUserItem.list_item?.status || 'planning'}
                onChange={(e) => handleStatusChange(isUserItem.list_item.id, e.target.value)}
                className={`flex-1 px-3 py-2 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl rounded-xl text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all`}
              >
                <option value="planning">Planning</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="dropped">Dropped</option>
                {mediaType === 'game' && <option value="playing">Playing</option>}
                {(mediaType === 'book' || mediaType === 'manga') && <option value="reading">Reading</option>}
              </select>
              <button
                onClick={() => handleRemove(isUserItem.list_item.id)}
                className={`px-3 py-2 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl rounded-xl text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} hover:bg-red-500 hover:text-white transition-all duration-200`}
              >
                Remove
              </button>
            </div>
          ) : (
            // Apple-style Add Button
            <AddToListButton 
              media={media}
              isInUserList={isInUserList}
              onAddToList={onAddToList}
              theme={theme}
              mediaType={mediaType}
            />
          )}
        </div>
        
        {/* Clean Card Footer */}
        <div className="p-4">
          <h3 className={`font-semibold text-sm mb-1 line-clamp-2 leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {media.title}
          </h3>
          
          <div className="flex items-center justify-between">
            {media.year && (
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                {media.year}
              </span>
            )}
            
            {/* Minimal media type indicator */}
            <div className={`w-2 h-2 rounded-full ${
              mediaType === 'movie' ? 'bg-blue-500' :
              mediaType === 'tv' ? 'bg-purple-500' :
              mediaType === 'game' ? 'bg-green-500' :
              mediaType === 'book' ? 'bg-orange-500' :
              mediaType === 'manga' ? 'bg-pink-500' :
              mediaType === 'anime' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Clean Apple-style Page Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl p-8 border ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/30'} shadow-sm`}>
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-2xl flex items-center justify-center backdrop-blur-sm border ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
              <span className="text-3xl">{mediaInfo.icon}</span>
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>
                {mediaInfo.title}
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                {mediaInfo.description}
              </p>
            </div>
          </div>
          
          {/* Clean Advanced Mode Toggle */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${!advancedMode ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Simple
              </span>
              <button
                onClick={onToggleAdvancedMode}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${advancedMode ? 'bg-blue-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} focus:ring-4 focus:ring-blue-500/20 focus:outline-none`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform ${advancedMode ? 'translate-x-7' : 'translate-x-1'} top-1`}></div>
              </button>
              <span className={`text-sm font-medium ${advancedMode ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Advanced
              </span>
            </div>
          </div>
        </div>
        
        {/* Individual Search Bar for This Page */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={mediaInfo.placeholder}
              className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500'} border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* My List Section */}
      {userMediaItems.length > 0 && (
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            My {mediaInfo.title} ({userMediaItems.length})
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {userMediaItems.map(item => renderMediaCard(item.media_item, item, advancedMode))}
          </div>
        </div>
      )}

      {/* Search Results Section */}
      {localSearchQuery && (
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {loading ? 'Searching...' : `Search Results for "${localSearchQuery}"`}
            {!loading && safeSearchResults.length > 0 && ` (${safeSearchResults.length})`}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : safeSearchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {safeSearchResults.map(media => renderMediaCard(media, false, advancedMode))}
            </div>
          ) : (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No results found for "{localSearchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!localSearchQuery && userMediaItems.length === 0 && (
        <div className={`text-center py-16 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="text-6xl mb-4">{mediaInfo.icon}</div>
          <h3 className="text-xl font-semibold mb-2">No {mediaInfo.title} Yet</h3>
          <p>Use the search bar above to discover and add {mediaInfo.title.toLowerCase()} to your list!</p>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userListItems, setUserListItems] = useState([]);
  const [stats, setStats] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false); // Simple vs Advanced mode
  
  // Individual state for each media type
  const [mediaStates, setMediaStates] = useState({
    movie: { searchResults: [], searchQuery: '', loading: false },
    tv: { searchResults: [], searchQuery: '', loading: false },
    anime: { searchResults: [], searchQuery: '', loading: false },
    manga: { searchResults: [], searchQuery: '', loading: false },
    book: { searchResults: [], searchQuery: '', loading: false },
    game: { searchResults: [], searchQuery: '', loading: false }
  });

  useEffect(() => {
    loadUserList();
    loadStats();
  }, []);

  const loadUserList = async () => {
    try {
      const response = await axios.get(`${API}/user-list`);
      setUserListItems(response.data);
    } catch (error) {
      console.error('Error loading user list:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (query, mediaType) => {
    // Update the loading state for the specific media type
    setMediaStates(prev => ({
      ...prev,
      [mediaType]: { ...prev[mediaType], loading: true, searchQuery: query }
    }));

    try {
      const response = await axios.get(`${API}/search`, {
        params: { query, media_type: mediaType }
      });
      
      // Update search results for the specific media type
      setMediaStates(prev => ({
        ...prev,
        [mediaType]: { 
          ...prev[mediaType], 
          searchResults: response.data.results, 
          loading: false 
        }
      }));
    } catch (error) {
      console.error('Error searching:', error);
      setMediaStates(prev => ({
        ...prev,
        [mediaType]: { ...prev[mediaType], loading: false }
      }));
    }
  };

  const handleAddToList = async (mediaItem, status = 'planning') => {
    try {
      const response = await axios.post(`${API}/user-list`, {
        media_id: mediaItem.id,
        media_type: mediaItem.media_type,
        status: status,
        // Include complete media information
        title: mediaItem.title,
        poster_path: mediaItem.poster_path,
        year: mediaItem.year,
        overview: mediaItem.overview,
        genres: mediaItem.genres || [],
        vote_average: mediaItem.vote_average,
        seasons: mediaItem.seasons,
        episodes: mediaItem.episodes,
        chapters: mediaItem.chapters,
        volumes: mediaItem.volumes,
        authors: mediaItem.authors || [],
        publisher: mediaItem.publisher,
        page_count: mediaItem.page_count,
        platforms: mediaItem.platforms || [],
        developers: mediaItem.developers || [],
        publishers: mediaItem.publishers || [],
        release_year: mediaItem.release_year,
        game_modes: mediaItem.game_modes || []
      });
      
      // Reload user list and stats
      await loadUserList();
      await loadStats();
      
      alert('Added to your list!');
    } catch (error) {
      console.error('Error adding to list:', error);
      if (error.response?.data?.detail?.includes('already in your list')) {
        alert('This item is already in your list!');
      } else {
        alert('Error adding to list');
      }
    }
  };

  const handleUpdateItem = async (listItemId, updateData) => {
    try {
      await axios.put(`${API}/user-list/${listItemId}`, updateData);
      await loadUserList();
      await loadStats();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleRemoveItem = async (listItemId) => {
    try {
      await axios.delete(`${API}/user-list/${listItemId}`);
      await loadUserList();
      await loadStats();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleToggleAdvancedMode = () => {
    setAdvancedMode(prev => !prev);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} userListItems={userListItems} />;
      case 'movies':
      case 'tv':
      case 'anime':
      case 'manga':
      case 'books':
      case 'games':
        const mediaType = currentPage === 'movies' ? 'movie' : currentPage === 'books' ? 'book' : currentPage === 'games' ? 'game' : currentPage;
        const mediaState = mediaStates[mediaType] || { searchResults: [], searchQuery: '', loading: false };
        const userMediaItems = userListItems.filter(item => item.media_item.media_type === mediaType);
        
        return (
          <MediaPage 
            mediaType={mediaType}
            searchResults={mediaState.searchResults}
            searchQuery={mediaState.searchQuery}
            loading={mediaState.loading}
            userMediaItems={userMediaItems}
            onAddToList={handleAddToList}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            onSearch={handleSearch}
            advancedMode={advancedMode}
            onToggleAdvancedMode={handleToggleAdvancedMode}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            userListItems={userListItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard stats={stats} userListItems={userListItems} />;
    }
  };

  return (
    <ThemeProvider>
      <ThemeContent 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSearch={handleSearch}
        loading={
          ['movies', 'tv', 'anime', 'manga', 'books', 'games'].includes(currentPage) 
            ? (mediaStates[currentPage === 'books' ? 'book' : currentPage === 'games' ? 'game' : currentPage]?.loading || false)
            : false
        }
        renderPage={renderPage}
      />
    </ThemeProvider>
  );
}

const ThemeContent = ({ currentPage, setCurrentPage, onSearch, loading, renderPage }) => {
  const { theme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const sidebarMargin = 'ml-16';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50/50'}`}>
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      <div className={`flex-1 ${sidebarMargin} transition-all duration-300`}>
        <main className="p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;