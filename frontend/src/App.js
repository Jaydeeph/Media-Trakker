import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sidebar Navigation Component
const Sidebar = ({ currentPage, onPageChange, userListCounts }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'tv', label: 'TV Shows', icon: '📺' },
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'manga', label: 'Manga', icon: '📚' },
    { id: 'books', label: 'Books', icon: '📖' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  return (
    <div className="w-64 bg-black text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500 mb-8">Media Trakker</h1>
        
        <nav className="space-y-2">
          {menuItems.map(item => {
            const count = userListCounts[item.id] || 0;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={\`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors \${
                  currentPage === item.id 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }\`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {(['movies', 'tv', 'anime', 'manga', 'books'].includes(item.id) && count > 0) && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Search Bar Component for each media type
const MediaSearchBar = ({ mediaType, onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, mediaType);
    }
  };

  const getPlaceholder = (type) => {
    const placeholders = {
      'movie': 'Search for movies...',
      'tv': 'Search for TV shows...',
      'anime': 'Search for anime...',
      'manga': 'Search for manga...',
      'book': 'Search for books...'
    };
    return placeholders[type] || 'Search...';
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getPlaceholder(mediaType)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
};

// Dashboard Page Component  
const Dashboard = ({ stats, userListItems }) => {
  const totalItems = Object.values(stats).reduce((acc, mediaStats) => {
    return acc + Object.values(mediaStats).reduce((sum, count) => sum + count, 0);
  }, 0);

  const getRecentActivity = () => {
    return userListItems
      .sort((a, b) => new Date(b.list_item.created_at) - new Date(a.list_item.created_at))
      .slice(0, 5);
  };

  const getMediaTypeLabel = (mediaType) => {
    const labels = {
      'movie': 'Movies',
      'tv': 'TV Shows', 
      'anime': 'Anime',
      'manga': 'Manga',
      'book': 'Books',
      'game': 'Games'
    };
    return labels[mediaType] || mediaType;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your media consumption</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">{totalItems}</div>
          <div className="text-blue-100">Total Items</div>
        </div>
        
        {Object.entries(stats).map(([mediaType, statsByStatus]) => {
          const count = Object.values(statsByStatus).reduce((sum, val) => sum + val, 0);
          return (
            <div key={mediaType} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-red-500">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-gray-600">{getMediaTypeLabel(mediaType)}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {getRecentActivity().length > 0 ? (
          <div className="space-y-3">
            {getRecentActivity().map(item => (
              <div key={item.list_item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                {item.media_item.poster_path && (
                  <img
                    src={item.media_item.poster_path}
                    alt={item.media_item.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.media_item.title}</h3>
                  <p className="text-sm text-gray-600">
                    {getMediaTypeLabel(item.media_item.media_type)} • {item.list_item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity. Start adding some media to your lists!</p>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [userListItems, setUserListItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    loadUserList();
    loadStats();
  }, []);

  const loadUserList = async () => {
    try {
      const response = await axios.get(\`\${API}/user-list\`);
      setUserListItems(response.data);
    } catch (error) {
      console.error('Error loading user list:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(\`\${API}/stats\`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getUserListCounts = () => {
    const counts = {};
    userListItems.forEach(item => {
      const mediaType = item.media_item.media_type;
      counts[mediaType] = (counts[mediaType] || 0) + 1;
    });
    return counts;
  };

  const handleSearch = async (query, mediaType) => {
    setLoading(true);
    try {
      const response = await axios.get(\`\${API}/search\`, {
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
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎬</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Movies</h1>
                <p className="text-gray-600">Discover and track your favorite movies</p>
              </div>
            </div>
            <MediaSearchBar mediaType="movie" onSearch={handleSearch} loading={loading} />
            {searchResults.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Search Results</h2>
                <div className="grid gap-6">
                  {searchResults.map(media => (
                    <div key={media.id} className="bg-white rounded-lg shadow-md p-4">
                      <h3 className="text-lg font-semibold">{media.title}</h3>
                      <p className="text-gray-600">{media.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-2xl font-semibold mb-2">Search for Movies</h2>
                <p>Use the search bar above to find and add movies to your list!</p>
              </div>
            )}
          </div>
        );
      default:
        return <Dashboard stats={stats} userListItems={userListItems} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        userListCounts={getUserListCounts()}
      />
      <div className="flex-1 ml-64">
        <main className="p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
