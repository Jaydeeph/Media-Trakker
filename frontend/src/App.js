import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState('movie');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, mediaType);
    }
  };

  const mediaTypeOptions = [
    { value: 'movie', label: 'Movies' },
    { value: 'tv', label: 'TV Shows' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga', label: 'Manga' },
    { value: 'book', label: 'Books' }
  ];

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4 max-w-3xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies, TV shows, anime, manga, or books..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[120px]"
        >
          {mediaTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

const MediaCard = ({ media, onAddToList, userListItems }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('watching');
  const [loading, setLoading] = useState(false);

  const isInList = userListItems.some(item => item.media_item.id === media.id);
  const userListItem = userListItems.find(item => item.media_item.id === media.id);

  const handleAddToList = async () => {
    setLoading(true);
    try {
      await onAddToList(media.id, media.media_type, selectedStatus);
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = (mediaType) => {
    switch (mediaType) {
      case 'book':
      case 'manga':
        return ['reading', 'completed', 'paused', 'planning', 'dropped'];
      case 'game':
        return ['playing', 'completed', 'paused', 'planning', 'dropped'];
      default:
        return ['watching', 'completed', 'paused', 'planning', 'dropped'];
    }
  };

  const getMediaTypeLabel = (mediaType) => {
    const labels = {
      'movie': 'Movie',
      'tv': 'TV Show',
      'anime': 'Anime',
      'manga': 'Manga',
      'book': 'Book',
      'game': 'Game'
    };
    return labels[mediaType] || mediaType;
  };

  const getProgressInfo = (media) => {
    switch (media.media_type) {
      case 'tv':
      case 'anime':
        return (
          <div className="text-sm text-gray-600">
            {media.seasons && <span>Seasons: {media.seasons} • </span>}
            {media.episodes && <span>Episodes: {media.episodes}</span>}
          </div>
        );
      case 'manga':
        return (
          <div className="text-sm text-gray-600">
            {media.chapters && <span>Chapters: {media.chapters} • </span>}
            {media.volumes && <span>Volumes: {media.volumes}</span>}
          </div>
        );
      case 'book':
        return (
          <div className="text-sm text-gray-600">
            {media.page_count && <span>Pages: {media.page_count}</span>}
            {media.authors && media.authors.length > 0 && (
              <span> • By: {media.authors.join(', ')}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const statusOptions = getStatusOptions(media.media_type);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        {media.poster_path && (
          <img
            src={media.poster_path}
            alt={media.title}
            className="w-32 h-48 object-cover"
          />
        )}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-semibold mb-2">{media.title}</h3>
          <p className="text-gray-600 mb-2">
            {getMediaTypeLabel(media.media_type)} • {media.year || 'Unknown Year'}
          </p>
          {media.genres && media.genres.length > 0 && (
            <p className="text-sm text-gray-500 mb-2">
              {media.genres.slice(0, 3).join(', ')}
            </p>
          )}
          {media.vote_average && (
            <p className="text-sm text-yellow-600 mb-2">
              ⭐ {media.vote_average.toFixed(1)}/10
            </p>
          )}
          
          {getProgressInfo(media)}
          
          {!isInList ? (
            <div className="flex gap-2 items-center mt-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToList}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Adding...' : 'Add to List'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {userListItem?.list_item.status.charAt(0).toUpperCase() + userListItem?.list_item.status.slice(1)}
              </span>
              <span className="text-sm text-green-600">✓ In your list</span>
            </div>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>
      
      {showDetails && media.overview && (
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-700 mb-2">{media.overview}</p>
          {media.status && (
            <p className="text-sm text-gray-600 mb-1">
              <strong>Status:</strong> {media.status}
            </p>
          )}
          {media.publisher && (
            <p className="text-sm text-gray-600 mb-1">
              <strong>Publisher:</strong> {media.publisher}
            </p>
          )}
          {media.developers && media.developers.length > 0 && (
            <p className="text-sm text-gray-600 mb-1">
              <strong>Studio:</strong> {media.developers.join(', ')}
            </p>
          )}
        </div>
      )}
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
                  {item.media_item.media_type === 'movie' ? 'Movie' : 'TV Show'} • {item.media_item.year}
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
              {mediaType === 'tv' ? 'TV Shows' : 'Movies'}
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
                <p>Search for movies and TV shows to start tracking your media consumption!</p>
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