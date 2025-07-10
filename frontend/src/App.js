import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Apple-like Collapsible Sidebar with Perfect Icon Alignment
const Sidebar = ({ currentPage, onPageChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'tv', label: 'TV Shows', icon: '📺' },
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'manga', label: 'Manga', icon: '📚' },
    { id: 'books', label: 'Books', icon: '📖' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  const sidebarWidth = isExpanded ? 'w-64' : 'w-16';

  return (
    <div 
      className={`${sidebarWidth} bg-black text-white h-screen fixed left-0 top-0 overflow-hidden transition-all duration-300 ease-in-out z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300`}>
        <div className="mb-8">
          {isExpanded ? (
            <h1 className="text-xl font-bold text-red-500 px-2">Media Trakker</h1>
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
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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

// Apple-like Top Navigation Bar
const TopNavigation = ({ currentPage, onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, currentPage);
    }
  };

  const getPageInfo = (page) => {
    const pageInfo = {
      'movies': { title: 'Movies', placeholder: 'Search for movies...', icon: '🎬' },
      'tv': { title: 'TV Shows', placeholder: 'Search for TV shows...', icon: '📺' },
      'anime': { title: 'Anime', placeholder: 'Search for anime...', icon: '🎌' },
      'manga': { title: 'Manga', placeholder: 'Search for manga...', icon: '📚' },
      'books': { title: 'Books', placeholder: 'Search for books...', icon: '📖' }
    };
    return pageInfo[page] || null;
  };

  const pageInfo = getPageInfo(currentPage);

  if (!pageInfo) return null;

  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-lg">{pageInfo.icon}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{pageInfo.title}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pageInfo.placeholder}
              className="w-96 px-4 py-2.5 bg-gray-100/70 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white transition-all duration-200 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-400">⌘F</span>
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

// Enhanced Dashboard with Media Segregation
const Dashboard = ({ stats, userListItems }) => {
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
        'movie': { name: 'Movies', icon: '🎬', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
        'tv': { name: 'TV Shows', icon: '📺', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
        'anime': { name: 'Anime', icon: '🎌', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
        'manga': { name: 'Manga', icon: '📚', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
        'book': { name: 'Books', icon: '📖', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
        'game': { name: 'Games', icon: '🎮', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' }
      };
      
      return {
        type: mediaType,
        count,
        completed,
        completionRate,
        ...mediaLabels[mediaType] || { name: mediaType, icon: '📄', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-600' }
      };
    });
  };

  // Segregate recent activity by media type
  const getRecentActivityByMedia = () => {
    const activityByMedia = {};
    userListItems.forEach(item => {
      const mediaType = item.media_item.media_type;
      if (!activityByMedia[mediaType]) {
        activityByMedia[mediaType] = [];
      }
      activityByMedia[mediaType].push(item);
    });
    
    // Sort each media type by date and limit to recent items
    Object.keys(activityByMedia).forEach(mediaType => {
      activityByMedia[mediaType] = activityByMedia[mediaType]
        .sort((a, b) => new Date(b.list_item.created_at) - new Date(a.list_item.created_at))
        .slice(0, 3);
    });
    
    return activityByMedia;
  };

  const recentActivityByMedia = getRecentActivityByMedia();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your media consumption journey</p>
      </div>

      {/* Apple-style Key Statistics Cards */}
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Media Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getMediaStats().map(media => (
            <div key={media.type} className={`${media.bgColor} rounded-2xl p-5 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center">
                    <span className="text-xl">{media.icon}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{media.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{media.count}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completed</span>
                  <span className="font-medium">{media.completed}/{media.count}</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2.5">
                  <div 
                    className={`bg-gradient-to-r ${media.color} h-2.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${media.completionRate}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 font-medium">
                  {media.completionRate}% complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segregated Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Activity</h2>
        {Object.keys(recentActivityByMedia).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(recentActivityByMedia).map(([mediaType, items]) => {
              const mediaInfo = getMediaStats().find(m => m.type === mediaType);
              return (
                <div key={mediaType} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mediaInfo?.icon}</span>
                    <h3 className="font-semibold text-gray-900">{mediaInfo?.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${mediaInfo?.bgColor} ${mediaInfo?.textColor}`}>
                      {items.length} recent
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {items.map(item => (
                      <div key={item.list_item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        {item.media_item.poster_path && (
                          <img
                            src={item.media_item.poster_path}
                            alt={item.media_item.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.media_item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              item.list_item.status === 'completed' ? 'bg-green-100 text-green-700' :
                              item.list_item.status === 'watching' || item.list_item.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.list_item.status}
                            </span>
                            <span className="text-xs text-gray-500">
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
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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

// Apple-like Profile Page with User Lists
const ProfilePage = ({ userListItems, onUpdateItem, onRemoveItem }) => {
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
      'movie': { name: 'Movies', icon: '🎬', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
      'tv': { name: 'TV Shows', icon: '📺', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
      'anime': { name: 'Anime', icon: '🎌', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
      'manga': { name: 'Manga', icon: '📚', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
      'book': { name: 'Books', icon: '📖', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
      'game': { name: 'Games', icon: '🎮', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' }
    };
    return info[mediaType] || { name: mediaType, icon: '📄', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
  };

  const itemsByType = getItemsByMediaType();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your media collections</p>
      </div>

      {Object.keys(itemsByType).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">👤</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Your Lists Are Empty</h2>
          <p className="text-gray-600 mb-6">Start adding movies, TV shows, anime, manga, and books to see them here!</p>
          <button className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">
            Explore Media
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(itemsByType).map(([mediaType, items]) => {
            const mediaInfo = getMediaTypeInfo(mediaType);
            return (
              <div key={mediaType} className={`${mediaInfo.bgColor} rounded-2xl border ${mediaInfo.borderColor} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">{mediaInfo.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{mediaInfo.name}</h2>
                      <p className="text-sm text-gray-600">{items.length} items</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {items.map(item => (
                    <div key={item.list_item.id} className="bg-white/70 rounded-xl p-4 hover:bg-white/90 transition-all duration-200">
                      <div className="flex items-start gap-4">
                        {item.media_item.poster_path && (
                          <img
                            src={item.media_item.poster_path}
                            alt={item.media_item.title}
                            className="w-16 h-24 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.media_item.title}</h3>
                          <p className="text-gray-600 mb-3">
                            {item.media_item.year || 'Unknown Year'}
                          </p>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <label className="text-sm font-medium text-gray-700">Status:</label>
                            <select
                              value={item.list_item.status}
                              onChange={(e) => onUpdateItem(item.list_item.id, { status: e.target.value })}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
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

// Apple-like Media Page Component
const MediaPage = ({ mediaType, searchResults }) => {
  const getMediaTypeInfo = (type) => {
    const info = {
      'movie': { title: 'Movies', icon: '🎬', description: 'Discover and track your favorite movies' },
      'tv': { title: 'TV Shows', icon: '📺', description: 'Keep up with your favorite TV series' },
      'anime': { title: 'Anime', icon: '🎌', description: 'Explore the world of anime' },
      'manga': { title: 'Manga', icon: '📚', description: 'Track your manga reading progress' },
      'book': { title: 'Books', icon: '📖', description: 'Manage your reading list' }
    };
    return info[type] || { title: type, icon: '📄', description: 'Media content' };
  };

  const mediaInfo = getMediaTypeInfo(mediaType);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
          <div className="grid gap-6">
            {searchResults.map(media => (
              <div key={media.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex gap-6">
                  {media.poster_path && (
                    <img
                      src={media.poster_path}
                      alt={media.title}
                      className="w-24 h-36 object-cover rounded-xl shadow-sm"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{media.title}</h3>
                    <p className="text-gray-600 mb-3">{media.year}</p>
                    {media.genres && media.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {media.genres.slice(0, 3).map(genre => (
                          <span key={genre} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {genre}
                          </span>
                        ))}
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
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">{mediaInfo.icon}</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Search for {mediaInfo.title}</h2>
          <p className="text-gray-600 mb-2">{mediaInfo.description}</p>
          <p className="text-sm text-gray-500">Use the search bar above to find and add {mediaInfo.title.toLowerCase()} to your list!</p>
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
        return <MediaPage mediaType={currentPage === 'books' ? 'book' : currentPage} searchResults={searchResults} />;
      case 'profile':
        return (
          <ProfilePage
            userListItems={userListItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        );
      default:
        return <Dashboard stats={stats} userListItems={userListItems} />;
    }
  };

  const sidebarMargin = 'ml-16';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      <div className={`flex-1 ${sidebarMargin} transition-all duration-300`}>
        <TopNavigation 
          currentPage={currentPage}
          onSearch={handleSearch}
          loading={loading}
        />
        <main className="p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;