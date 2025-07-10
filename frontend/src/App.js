import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Collapsible Sidebar Navigation Component
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
      <div className="p-4">
        <div className="mb-8">
          {isExpanded ? (
            <h1 className="text-xl font-bold text-red-500">Media Trakker</h1>
          ) : (
            <div className="text-red-500 text-2xl font-bold text-center">MT</div>
          )}
        </div>
        
        <nav className="space-y-2">
          {menuItems.map(item => {
            const isActive = currentPage === item.id;
            const buttonClass = isActive 
              ? 'w-full flex items-center px-3 py-3 rounded-lg transition-colors bg-red-600 text-white'
              : 'w-full flex items-center px-3 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white';
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={buttonClass}
                title={!isExpanded ? item.label : ''}
              >
                <span className="text-xl">{item.icon}</span>
                {isExpanded && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Top Navigation Bar Component
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
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pageInfo.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pageInfo.placeholder}
            className="w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Enhanced Dashboard with Better Statistics Design
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
        'movie': { name: 'Movies', icon: '🎬', color: 'from-blue-500 to-blue-600' },
        'tv': { name: 'TV Shows', icon: '📺', color: 'from-purple-500 to-purple-600' },
        'anime': { name: 'Anime', icon: '🎌', color: 'from-pink-500 to-pink-600' },
        'manga': { name: 'Manga', icon: '📚', color: 'from-orange-500 to-orange-600' },
        'book': { name: 'Books', icon: '📖', color: 'from-green-500 to-green-600' },
        'game': { name: 'Games', icon: '🎮', color: 'from-indigo-500 to-indigo-600' }
      };
      
      return {
        type: mediaType,
        count,
        completed,
        completionRate,
        ...mediaLabels[mediaType] || { name: mediaType, icon: '📄', color: 'from-gray-500 to-gray-600' }
      };
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your media consumption journey</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Items */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold">{totalItems}</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold">{getCompletionRate()}%</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        {/* Media Types */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Media Types</p>
              <p className="text-3xl font-bold">{Object.keys(stats).length}</p>
            </div>
            <div className="text-4xl opacity-80">🎭</div>
          </div>
        </div>

        {/* Recent Activity Count */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Recent Items</p>
              <p className="text-3xl font-bold">{Math.min(userListItems.length, 5)}</p>
            </div>
            <div className="text-4xl opacity-80">⚡</div>
          </div>
        </div>
      </div>

      {/* Media Type Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Media Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getMediaStats().map(media => (
            <div key={media.type} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{media.icon}</span>
                  <span className="font-semibold text-gray-900">{media.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{media.count}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completed</span>
                  <span>{media.completed}/{media.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r ${media.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${media.completionRate}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {media.completionRate}% complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {userListItems.length > 0 ? (
          <div className="space-y-3">
            {userListItems.slice(0, 5).map(item => (
              <div key={item.list_item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {item.media_item.poster_path && (
                  <img
                    src={item.media_item.poster_path}
                    alt={item.media_item.title}
                    className="w-12 h-16 object-cover rounded shadow-sm"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.media_item.title}</h3>
                  <p className="text-sm text-gray-600">
                    {item.media_item.media_type} • {item.list_item.status}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(item.list_item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎬</div>
            <p>No recent activity. Start adding some media to your lists!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Media Page Component (without search bar)
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
    <div className="space-y-6">
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <div className="grid gap-6">
            {searchResults.map(media => (
              <div key={media.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4 hover:shadow-lg transition-shadow">
                {media.poster_path && (
                  <img
                    src={media.poster_path}
                    alt={media.title}
                    className="w-24 h-36 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{media.title}</h3>
                  <p className="text-gray-600 mb-2">{media.year}</p>
                  {media.genres && media.genres.length > 0 && (
                    <p className="text-sm text-gray-500 mb-2">{media.genres.join(', ')}</p>
                  )}
                  {media.vote_average && (
                    <p className="text-sm text-yellow-600 mb-3">⭐ {media.vote_average.toFixed(1)}/10</p>
                  )}
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                    Add to List
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">{mediaInfo.icon}</div>
          <h2 className="text-2xl font-semibold mb-2">Search for {mediaInfo.title}</h2>
          <p className="text-gray-600">{mediaInfo.description}</p>
          <p className="text-sm text-gray-500 mt-2">Use the search bar above to find and add {mediaInfo.title.toLowerCase()} to your list!</p>
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
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">👤</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">Manage your media lists and preferences</p>
              </div>
            </div>
            <p className="text-gray-500">Profile page coming soon...</p>
          </div>
        );
      default:
        return <Dashboard stats={stats} userListItems={userListItems} />;
    }
  };

  // Calculate sidebar margin
  const sidebarMargin = 'ml-16'; // Always 64px since sidebar collapses to this width

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      <div className={`flex-1 ${sidebarMargin}`}>
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