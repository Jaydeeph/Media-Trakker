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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
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

const UserList = ({ userListItems, onUpdateItem, onRemoveItem }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all');

  const filteredItems = userListItems.filter(item => {
    const statusMatch = selectedStatus === 'all' || item.list_item.status === selectedStatus;
    const typeMatch = selectedMediaType === 'all' || item.media_item.media_type === selectedMediaType;
    return statusMatch && typeMatch;
  });

  const statusOptions = ['all', 'watching', 'completed', 'paused', 'planning', 'dropped'];
  const typeOptions = ['all', 'movie', 'tv', 'anime', 'manga', 'book'];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">My List ({userListItems.length})</h2>
      
      <div className="flex gap-4 mb-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        
        <select
          value={selectedMediaType}
          onChange={(e) => setSelectedMediaType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          {typeOptions.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : 
               type === 'tv' ? 'TV Shows' : 
               type === 'anime' ? 'Anime' :
               type === 'manga' ? 'Manga' :
               type === 'book' ? 'Books' :
               'Movies'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredItems.map(item => (
          <div key={item.list_item.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start gap-4">
              {item.media_item.poster_path && (
                <img
                  src={item.media_item.poster_path}
                  alt={item.media_item.title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.media_item.title}</h3>
                <p className="text-gray-600 mb-2">
                  {item.media_item.media_type === 'movie' ? 'Movie' : 
                   item.media_item.media_type === 'tv' ? 'TV Show' :
                   item.media_item.media_type === 'anime' ? 'Anime' :
                   item.media_item.media_type === 'manga' ? 'Manga' :
                   item.media_item.media_type === 'book' ? 'Book' : 'Game'} • {item.media_item.year || 'Unknown Year'}
                </p>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-sm">Status:</span>
                  <select
                    value={item.list_item.status}
                    onChange={(e) => onUpdateItem(item.list_item.id, { status: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {statusOptions.slice(1).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {item.list_item.rating && (
                  <p className="text-sm text-yellow-600 mb-2">
                    Your Rating: ⭐ {item.list_item.rating}/10
                  </p>
                )}
                <button
                  onClick={() => onRemoveItem(item.list_item.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove from List
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items found in your list.
        </div>
      )}
    </div>
  );
};

const Stats = ({ stats }) => {
  const totalItems = Object.values(stats).reduce((acc, mediaStats) => {
    return acc + Object.values(mediaStats).reduce((sum, count) => sum + count, 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{totalItems}</div>
          <div className="text-gray-600">Total Items</div>
        </div>
        {Object.entries(stats).map(([mediaType, statsByStatus]) => (
          <div key={mediaType} className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2 capitalize">
              {mediaType === 'tv' ? 'TV Shows' : 
               mediaType === 'anime' ? 'Anime' :
               mediaType === 'manga' ? 'Manga' :
               mediaType === 'book' ? 'Books' :
               mediaType === 'game' ? 'Games' : 'Movies'}
            </h3>
            {Object.entries(statsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="capitalize">{status}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [userListItems, setUserListItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('search');

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
      console.log('Search response:', response.data);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (mediaId, mediaType, status) => {
    try {
      await axios.post(`${API}/user-list`, {
        media_id: mediaId,
        media_type: mediaType,
        status: status
      });
      await loadUserList();
      await loadStats();
    } catch (error) {
      console.error('Error adding to list:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-red-500">Media Trakker</h1>
            <nav className="space-x-6">
              <button
                onClick={() => setCurrentView('search')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'search' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'list' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                My List ({userListItems.length})
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentView === 'stats' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Stats
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'search' && (
          <div>
            <SearchBar onSearch={handleSearch} loading={loading} />
            
            {searchResults.length > 0 && (
              <div className="grid gap-6">
                {searchResults.map(media => (
                  <MediaCard
                    key={media.id}
                    media={media}
                    onAddToList={handleAddToList}
                    userListItems={userListItems}
                  />
                ))}
              </div>
            )}
            
            {!loading && searchResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to Media Trakker</h2>
                <p>Search for movies, TV shows, anime, manga, and books to start tracking your media consumption!</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'list' && (
          <UserList
            userListItems={userListItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        )}

        {currentView === 'stats' && (
          <Stats stats={stats} />
        )}
      </main>
    </div>
  );
}

export default App;