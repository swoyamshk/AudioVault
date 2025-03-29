import React, { useState, useEffect } from 'react';
import axios from 'axios';

const History = ({ accessToken, refreshToken }) => {
  const [listeningHistory, setListeningHistory] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeRange, setTimeRange] = useState('medium_term');
  const [activeTab, setActiveTab] = useState('top');
  const [successMessage, setSuccessMessage] = useState("");
  const [tokenDetails, setTokenDetails] = useState(null);
  const [scopeStatus, setScopeStatus] = useState(null);
  const [currentTrackEmbed, setCurrentTrackEmbed] = useState(null);

  // On component mount, verify the token and check scopes
  useEffect(() => {
    if (accessToken) {
      verifyToken(accessToken);
      if (activeTab === 'top') {
        checkTopTracksScope(accessToken);
        fetchTopTracks(accessToken);
      } else {
        checkRecentlyPlayedScope(accessToken);
        fetchRecentlyPlayed(accessToken);
      }
    }
  }, [accessToken, timeRange, activeTab]);

  // Verify token validity
  const verifyToken = async (token) => {
    try {
      // Make a request to our server to verify the token
      const response = await axios.post("http://localhost:4000/verify-token", {
        access_token: token
      });
      
      setTokenDetails(response.data);
      console.log("Token verification:", response.data);
      
      if (!response.data.valid) {
        setErrorMessage("Token validation failed. Please log in again.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      setTokenDetails({ valid: false, error: error.message });
    }
  };

  // Check if the token has the required top tracks scope
  const checkTopTracksScope = async (token) => {
    try {
      // Direct test with a minimal request to top tracks endpoint
      const testResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          time_range: 'medium_term', 
          limit: 1 
        }
      });
      
      // If we get here without an error, the scope is valid
      setScopeStatus({ hasTopReadScope: true });
      console.log("Token has user-top-read scope");
      return true;
    } catch (error) {
      console.error("Error checking top tracks scope:", error);
      
      if (error.response && error.response.status === 403) {
        setScopeStatus({ 
          hasTopReadScope: false, 
          error: error.response.data?.error?.message 
        });
        console.log("Token is missing user-top-read scope");
        return false;
      }
      
      // For other errors, we can't determine scope status
      setScopeStatus({ hasTopReadScope: null, error: error.message });
      return null;
    }
  };

  // Check if the token has the required recently played scope
  const checkRecentlyPlayedScope = async (token) => {
    try {
      // Direct test with a minimal request to recently played endpoint
      const testResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          limit: 1 
        }
      });
      
      // If we get here without an error, the scope is valid
      setScopeStatus({ hasRecentlyPlayedScope: true });
      console.log("Token has user-read-recently-played scope");
      return true;
    } catch (error) {
      console.error("Error checking recently played scope:", error);
      
      if (error.response && error.response.status === 403) {
        setScopeStatus({ 
          hasRecentlyPlayedScope: false, 
          error: error.response.data?.error?.message 
        });
        console.log("Token is missing user-read-recently-played scope");
        return false;
      }
      
      // For other errors, we can't determine scope status
      setScopeStatus({ hasRecentlyPlayedScope: null, error: error.message });
      return null;
    }
  };

  const refreshTokenAndRetry = async () => {
    setIsLoading(true);
    
    try {
      // Clear previous error message
      setErrorMessage("");
      
      console.log("Refreshing token...");
      const response = await axios.post("http://localhost:4000/refresh-token", {
        refresh_token: refreshToken
      });
      
      const newToken = response.data.access_token;
      
      // Update token in localStorage
      localStorage.setItem("access_token", newToken);
      
      console.log("Token refreshed, verifying new token...");
      await verifyToken(newToken);
      
      // Try again with the new token based on active tab
      if (activeTab === 'top') {
        await checkTopTracksScope(newToken);
        return fetchTopTracks(newToken);
      } else {
        await checkRecentlyPlayedScope(newToken);
        return fetchRecentlyPlayed(newToken);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      setErrorMessage("Failed to refresh your session. Please log in again.");
      setIsLoading(false);
      return null;
    }
  };

  const fetchTopTracks = async (token = accessToken) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log(`Fetching top tracks with token: ${token.substring(0, 10)}...`);
      console.log(`Time range: ${timeRange}`);
      
      const response = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          time_range: timeRange, 
          limit: 50 
        }
      });
      
      console.log("Top tracks fetch successful!");
      
      const formattedTracks = response.data.items.map((track, index) => ({
        position: index + 1,
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        albumImage: track.album.images[1]?.url || '',
        popularity: track.popularity,
        duration: formatDuration(track.duration_ms),
        uri: track.uri
      }));
      
      setListeningHistory(formattedTracks);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      console.log("Response status:", error.response?.status);
      console.log("Response data:", error.response?.data);
      
      if (error.response) {
        if (error.response.status === 403) {
          setErrorMessage("Access denied. This app may not have permission to access your top tracks. Please make sure you've granted the necessary permissions.");
          setScopeStatus({ hasTopReadScope: false });
          
          // Log the specific Spotify error
          if (error.response.data && error.response.data.error) {
            console.log("Spotify error message:", error.response.data.error.message);
            console.log("Spotify error status:", error.response.data.error.status);
          }
          
          setIsLoading(false);
        } else if (error.response.status === 401) {
          console.log("Token expired, attempting to refresh...");
          await refreshTokenAndRetry();
        } else {
          setErrorMessage(`Error: ${error.response.data?.error?.message || "Failed to load top tracks"}`);
          setIsLoading(false);
        }
      } else {
        setErrorMessage("Network error. Please check your connection and try again.");
        setIsLoading(false);
      }
    }
  };

  const fetchRecentlyPlayed = async (token = accessToken) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log(`Fetching recently played with token: ${token.substring(0, 10)}...`);
      
      const response = await axios.get(`https://api.spotify.com/v1/me/player/recently-played`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          limit: 50 
        }
      });
      
      console.log("Recently played fetch successful!");
      
      const formattedHistory = response.data.items.map((item, index) => ({
        position: index + 1,
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        albumImage: item.track.album.images[1]?.url || '',
        playedAt: new Date(item.played_at).toLocaleString(),
        uri: item.track.uri
      }));
      
      setRecentlyPlayed(formattedHistory);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching recently played:", error);
      console.log("Response status:", error.response?.status);
      console.log("Response data:", error.response?.data);
      
      if (error.response) {
        if (error.response.status === 403) {
          setErrorMessage("Access denied. This app may not have permission to access your recently played tracks. Please make sure you've granted the necessary permissions.");
          setScopeStatus({ hasRecentlyPlayedScope: false });
          
          // Log the specific Spotify error
          if (error.response.data && error.response.data.error) {
            console.log("Spotify error message:", error.response.data.error.message);
            console.log("Spotify error status:", error.response.data.error.status);
          }
          
          setIsLoading(false);
        } else if (error.response.status === 401) {
          console.log("Token expired, attempting to refresh...");
          await refreshTokenAndRetry();
        } else {
          setErrorMessage(`Error: ${error.response.data?.error?.message || "Failed to load recently played tracks"}`);
          setIsLoading(false);
        }
      } else {
        setErrorMessage("Network error. Please check your connection and try again.");
        setIsLoading(false);
      }
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const playTrack = async (trackUri, trackId) => {
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      // First try to play using the Spotify API (Premium accounts only)
      try {
        // Get the user's active devices first
        const devicesResponse = await axios.get('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const devices = devicesResponse.data.devices;
        
        if (devices.length === 0) {
          throw new Error("No active Spotify devices found. Open Spotify on any device first.");
        }
        
        // Play the track on the active device
        await axios.put(
          'https://api.spotify.com/v1/me/player/play',
          { uris: [trackUri] },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        setSuccessMessage("Playing track...");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        console.error("Error playing track with Spotify API:", error);
        
        // If the error is due to not having a premium account, show the embed player
        if (error.response?.status === 403 || error.message?.includes("Premium")) {
          // Extract the track ID from the URI if it's not provided
          const id = trackId || trackUri.split(':').pop();
          
          // Set the track ID for the embed player
          setCurrentTrackEmbed(id);
          
          // No error message, as we're falling back to the embed player
        } else if (error.response?.status === 401) {
          await refreshTokenAndRetry();
        } else {
          throw error; // Re-throw if it's not a premium account error
        }
      }
    } catch (error) {
      console.error("Error playing track:", error);
      setErrorMessage(`Failed to play track: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const handleReauthorize = () => {
    // Redirect to login with clear parameters to force a new auth flow
    window.location.href = "/login?force_auth=true";
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Redirect to login page
    window.location.href = "/";
  };

  return (
    <div className="mt-8 w-xl">
      <h2 className="text-2xl font-bold mb-6">Your Listening History</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('top')}
          className={`py-2 px-4 ${activeTab === 'top' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
        >
          Your Top Tracks
        </button>
        <button 
          onClick={() => setActiveTab('recent')}
          className={`py-2 px-4 ${activeTab === 'recent' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400 hover:text-white'}`}
        >
          Recently Played
        </button>
      </div>
      
      {activeTab === 'top' && (
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setTimeRange('short_term')}
              className={`px-4 py-2 rounded-full text-sm ${
                timeRange === 'short_term'
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-200"
              }`}
            >
              Last 4 Weeks
            </button>
            <button
              onClick={() => setTimeRange('medium_term')}
              className={`px-4 py-2 rounded-full text-sm ${
                timeRange === 'medium_term'
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-200"
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setTimeRange('long_term')}
              className={`px-4 py-2 rounded-full text-sm ${
                timeRange === 'long_term'
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-200"
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-500 text-white p-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'top' ? (
            listeningHistory.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Tracks list - 2/3 width on large screens */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-4">Your Top {listeningHistory.length} Tracks</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Track</th>
                          <th className="py-3 px-4 text-left">Album</th>
                          <th className="py-3 px-4 text-left">Popularity</th>
                          <th className="py-3 px-4 text-left">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listeningHistory.map((track) => (
                          <tr 
                            key={track.id} 
                            className={`border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${currentTrackEmbed === track.id ? 'bg-gray-600' : ''}`}
                            onClick={() => playTrack(track.uri, track.id)}
                          >
                            <td className="py-3 px-4">{track.position}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {track.albumImage && (
                                  <img src={track.albumImage} alt={track.album} className="w-10 h-10 mr-3" />
                                )}
                                <div>
                                  <div className="font-medium">{track.name}</div>
                                  <div className="text-gray-400 text-sm">{track.artists}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{track.album}</td>
                            <td className="py-3 px-4">
                              <div className="w-24 bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${track.popularity}%` }} 
                                ></div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{track.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Now Playing section - 1/3 width on large screens */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-4">Now Playing</h3>
                  {currentTrackEmbed ? (
                    <div>
                      <iframe
                        src={`https://open.spotify.com/embed/track/${currentTrackEmbed}?utm_source=generator&theme=0`}
                        width="100%"
                        height="352"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-lg"
                      />
                      <p className="text-sm text-gray-400 mt-2">
                        Note: Free Spotify accounts can preview tracks using this player.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <p>Click on a track to play it</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No listening history found for this time period.</p>
                <button 
                  onClick={() => fetchTopTracks(accessToken)}
                  className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full"
                >
                  Refresh
                </button>
              </div>
            )
          ) : recentlyPlayed.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Recently played list - 2/3 width on large screens */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-4">Your Recently Played Tracks</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="py-3 px-4 text-left">#</th>
                        <th className="py-3 px-4 text-left">Track</th>
                        <th className="py-3 px-4 text-left">Album</th>
                        <th className="py-3 px-4 text-left">Played At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentlyPlayed.map((track) => (
                        <tr 
                          key={`${track.id}-${track.position}`} 
                          className={`border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${currentTrackEmbed === track.id ? 'bg-gray-600' : ''}`}
                          onClick={() => playTrack(track.uri, track.id)}
                        >
                          <td className="py-3 px-4">{track.position}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {track.albumImage && (
                                <img src={track.albumImage} alt={track.album} className="w-10 h-10 mr-3" />
                              )}
                              <div>
                                <div className="font-medium">{track.name}</div>
                                <div className="text-gray-400 text-sm">{track.artists}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{track.album}</td>
                          <td className="py-3 px-4 text-gray-300">{track.playedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Now Playing section - 1/3 width on large screens */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-4">Now Playing</h3>
                {currentTrackEmbed ? (
                  <div>
                    <iframe
                      src={`https://open.spotify.com/embed/track/${currentTrackEmbed}?utm_source=generator&theme=0`}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-lg"
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      Note: Free Spotify accounts can preview tracks using this player.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p>Click on a track to play it</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No recently played tracks found.</p>
              <button 
                onClick={() => fetchRecentlyPlayed(accessToken)}
                className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full"
              >
                Refresh
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;