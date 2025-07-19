import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';

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
  const [theme, setTheme] = useState('dark'); // Default to dark mode
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await axios.get(`${API}/user-preferences`);
      setTheme(response.data.theme || 'dark');
    } catch (error) {
      console.error('Error loading preferences:', error);
      setTheme('dark'); // Default to dark if error
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newTheme) => {
    try {
      await axios.put(`${API}/user-preferences`, { theme: newTheme });
      setTheme(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const value = {
    theme,
    setTheme: updateTheme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme}>
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

// Dark Theme Dashboard
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

  const getMediaStats = () => {
    return Object.entries(stats).map(([mediaType, statsByStatus]) => {
      const count = Object.values(statsByStatus).reduce((sum, val) => sum + val, 0);
      const completed = statsByStatus.completed || 0;
      const completionRate = count > 0 ? Math.round((completed / count) * 100) : 0;
      
      const mediaLabels = {
        'movie': { name: 'Movies', icon: '🎬', color: 'from-blue-500 to-blue-600', bgColor: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50', textColor: 'text-blue-600' },
        'tv': { name: 'TV Shows', icon: '📺', color: 'from-purple-500 to-purple-600', bgColor: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50', textColor: 'text-purple-600' },
        'anime': { name: 'Anime', icon: '🎌', color: 'from-pink-500 to-pink-600', bgColor: theme === 'dark' ? 'bg-pink-900/20' : 'bg-pink-50', textColor: 'text-pink-600' },
        'manga': { name: 'Manga', icon: '📚', color: 'from-orange-500 to-orange-600', bgColor: theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50', textColor: 'text-orange-600' },
        'book': { name: 'Books', icon: '📖', color: 'from-green-500 to-green-600', bgColor: theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50', textColor: 'text-green-600' },
        'game': { name: 'Games', icon: '🎮', color: 'from-indigo-500 to-indigo-600', bgColor: theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-50', textColor: 'text-indigo-600' }
      };
      
      return {
        type: mediaType,
        count,
        completed,
        completionRate,
        ...mediaLabels[mediaType] || { name: mediaType, icon: '📄', color: 'from-gray-500 to-gray-600', bgColor: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50', textColor: 'text-gray-600' }
      };
    });
  };

  const getRecentActivityByMedia = () => {
    const activityByMedia = {};
    userListItems.forEach(item => {
      const mediaType = item.media_item.media_type;
      if (!activityByMedia[mediaType]) {
        activityByMedia[mediaType] = [];
      }
      activityByMedia[mediaType].push(item);
    });
    
    Object.keys(activityByMedia).forEach(mediaType => {
      activityByMedia[mediaType] = activityByMedia[mediaType]
        .sort((a, b) => new Date(b.list_item.created_at) - new Date(a.list_item.created_at))
        .slice(0, 3);
    });
    
    return activityByMedia;
  };

  const recentActivityByMedia = getRecentActivityByMedia();

  return (
    <div className={`space-y-8 max-w-7xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Track your media consumption journey</p>
      </div>

      {/* Dark Theme Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium opacity-90">Total Items</p>
              <p className="text-3xl font-bold mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium opacity-90">Completion Rate</p>
              <p className="text-3xl font-bold mt-1">{getCompletionRate()}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium opacity-90">Media Types</p>
              <p className="text-3xl font-bold mt-1">{Object.keys(stats).length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🎭</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium opacity-90">This Week</p>
              <p className="text-3xl font-bold mt-1">{Math.min(userListItems.length, 12)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media Collection Progress */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6`}>
        <h2 className="text-xl font-semibold mb-6">Media Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getMediaStats().map(media => (
            <div key={media.type} className={`${media.bgColor} rounded-2xl p-5 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} rounded-xl flex items-center justify-center`}>
                    <span className="text-xl">{media.icon}</span>
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{media.name}</span>
                </div>
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{media.count}</span>
              </div>
              
              <div className="space-y-3">
                <div className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>Completed</span>
                  <span className="font-medium">{media.completed}/{media.count}</span>
                </div>
                <div className={`w-full ${theme === 'dark' ? 'bg-gray-700/60' : 'bg-white/60'} rounded-full h-2.5`}>
                  <div 
                    className={`bg-gradient-to-r ${media.color} h-2.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${media.completionRate}%` }}
                  ></div>
                </div>
                <div className={`text-right text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                  {media.completionRate}% complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segregated Recent Activity */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6`}>
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        {Object.keys(recentActivityByMedia).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(recentActivityByMedia).map(([mediaType, items]) => {
              const mediaInfo = getMediaStats().find(m => m.type === mediaType);
              return (
                <div key={mediaType} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mediaInfo?.icon}</span>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mediaInfo?.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${mediaInfo?.bgColor} ${mediaInfo?.textColor}`}>
                      {items.length} recent
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {items.map(item => (
                      <div key={item.list_item.id} className={`flex items-center gap-4 p-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl transition-colors`}>
                        {item.media_item.poster_path && (
                          <img
                            src={item.media_item.poster_path}
                            alt={item.media_item.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.media_item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              item.list_item.status === 'completed' ? 'bg-green-100 text-green-700' :
                              item.list_item.status === 'watching' || item.list_item.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.list_item.status}
                            </span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(item.list_item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <span className="text-2xl">🎬</span>
            </div>
            <p className="font-medium">No recent activity</p>
            <p className="text-sm">Start adding some media to your lists!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleThemeChange = async (newTheme) => {
    await setTheme(newTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetToDefault = async () => {
    await setTheme('dark');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`space-y-8 max-w-4xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Customize your Media Trakker experience</p>
      </div>

      {/* Theme Settings */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6`}>
        <h2 className="text-xl font-semibold mb-6">Appearance</h2>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Theme</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  theme === 'light'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">☀️</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Light Mode</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Classic bright interface</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 border-2 border-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🌙</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Easy on the eyes</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetToDefault}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} rounded-lg transition-colors`}
            >
              Reset to Default
            </button>
            
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-lg">✅</span>
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future Settings Sections */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6`}>
        <h2 className="text-xl font-semibold mb-4">More Settings</h2>
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Additional settings coming soon...</p>
          <p className="text-sm mt-1">Language preferences, notifications, and more!</p>
        </div>
      </div>
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

const MediaPage = ({ mediaType, searchResults }) => {
  const { theme } = useTheme();
  
  const getMediaTypeInfo = (type) => {
    const info = {
      'movie': { title: 'Movies', icon: '🎬', description: 'Discover and track your favorite movies' },
      'tv': { title: 'TV Shows', icon: '📺', description: 'Keep up with your favorite TV series' },
      'anime': { title: 'Anime', icon: '🎌', description: 'Explore the world of anime' },
      'manga': { title: 'Manga', icon: '📚', description: 'Track your manga reading progress' },
      'book': { title: 'Books', icon: '📖', description: 'Manage your reading list' },
      'game': { title: 'Games', icon: '🎮', description: 'Track your gaming progress and achievements' }
    };
    return info[type] || { title: type, icon: '📄', description: 'Media content' };
  };

  const mediaInfo = getMediaTypeInfo(mediaType);

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <div className="grid gap-6">
            {searchResults.map(media => (
              <div key={media.id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-200`}>
                <div className="flex gap-6">
                  {media.poster_path && (
                    <img
                      src={media.poster_path}
                      alt={media.title}
                      className="w-24 h-36 object-cover rounded-xl shadow-sm"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{media.title}</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{media.year}</p>
                    {media.genres && media.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {media.genres.slice(0, 3).map(genre => (
                          <span key={genre} className={`px-3 py-1 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-sm`}>
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Game-specific information */}
                    {media.platforms && media.platforms.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Platforms:</p>
                        <div className="flex flex-wrap gap-2">
                          {media.platforms.slice(0, 4).map(platform => (
                            <span key={platform} className={`px-2 py-1 ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'} rounded text-xs`}>
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {media.developers && media.developers.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="font-medium">Developer:</span> {media.developers.join(', ')}
                        </p>
                      </div>
                    )}
                    {media.publishers && media.publishers.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="font-medium">Publisher:</span> {media.publishers.join(', ')}
                        </p>
                      </div>
                    )}
                    {media.vote_average && (
                      <p className="text-sm text-yellow-600 mb-4 flex items-center gap-1">
                        <span>⭐</span>
                        <span>{media.vote_average.toFixed(1)}/10</span>
                      </p>
                    )}
                    <button className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm">
                      Add to List
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className={`w-20 h-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
            <span className="text-3xl">{mediaInfo.icon}</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3">Search for {mediaInfo.title}</h2>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{mediaInfo.description}</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Use the search bar above to find and add {mediaInfo.title.toLowerCase()} to your list!</p>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchResults, setSearchResults] = useState([]);
  const [userListItems, setUserListItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const response = await axios.get(`${API}/search`, {
        params: { query, media_type: mediaType }
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
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
        return <MediaPage mediaType={currentPage === 'books' ? 'book' : currentPage === 'games' ? 'game' : currentPage} searchResults={searchResults} />;
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
        loading={loading}
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
        <TopNavigation 
          currentPage={currentPage}
          onSearch={onSearch}
          loading={loading}
        />
        <main className="p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;