import React, { useState, useEffect } from "react";
import axios from "axios";

const TopTracks = ({ accessToken, refreshToken }) => {
  const [topTracks, setTopTracks] = useState([]);
  const [timeRange, setTimeRange] = useState("medium_term");
  const [isLoading, setIsLoading] = useState(false);
  const [playlistName, setPlaylistName] = useState("My Top Tracks");
  const [playlistDescription, setPlaylistDescription] = useState("Created with AudioVault");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [embedUri, setEmbedUri] = useState(null);
  const [tokenDetails, setTokenDetails] = useState(null);
  const [scopeStatus, setScopeStatus] = useState(null);
  const [currentTrackEmbed, setCurrentTrackEmbed] = useState(null);

  const timeRangeOptions = [
    { value: "short_term", label: "Last 4 Weeks" },
    { value: "medium_term", label: "Last 6 Months" },
    { value: "long_term", label: "All Time" }
  ];

  // On component mount, verify the token and check scopes
  useEffect(() => {
    if (accessToken) {
      verifyToken(accessToken);
      checkTokenScopes(accessToken);
      fetchTopTracks(accessToken);
    }
  }, [accessToken, timeRange]);

  // Verify token scopes and validity
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

  // Check if the token has the required scopes
  const checkTokenScopes = async (token) => {
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
      console.error("Error checking scope:", error);
      
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
      await checkTokenScopes(newToken);
      
      // Try again with the new token
      return fetchTopTracks(newToken);
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
          limit: 20 
        }
      });
      
      console.log("Top tracks fetch successful!");
      setTopTracks(response.data.items);
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

  const handleDirectAPICall = async () => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log("Making direct fetch API call to Spotify...");
      
      const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Direct API call successful!");
      setTopTracks(data.items);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in direct API call:", error);
      setErrorMessage(`Direct API call failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Redirect to login page
    window.location.href = "/";
  };

  const handleReauthorize = () => {
    // Redirect to login with clear parameters to force a new auth flow
    window.location.href = "/login?force_auth=true";
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
  

  const createPlaylist = async () => {
    if (topTracks.length === 0) {
      setErrorMessage("No tracks to save to playlist");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      // First get the user ID
      const userResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const userId = userResponse.data.id;
      
      // Create an empty playlist
      const playlistResponse = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: playlistName,
          description: playlistDescription,
          public: false
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const playlistId = playlistResponse.data.id;
      
      // Add tracks to the playlist
      const trackUris = topTracks.map(track => track.uri);
      
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: trackUris
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccessMessage(`Playlist "${playlistName}" created successfully!`);
      setEmbedUri(`spotify:playlist:${playlistId}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
      
      if (error.response && error.response.status === 401) {
        const newToken = await refreshTokenAndRetry();
        if (newToken) {
          // Try again with the new token (the component will re-render with the new token)
          return;
        }
      }
      
      setErrorMessage("Failed to create playlist. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-xl">
      
      {/* Enhanced token status indicator */}
      {/* <div className="bg-gray-800 p-3 rounded mb-4 text-sm">
        <p>Token Status: {tokenDetails?.valid ? "Valid" : "Invalid or not verified"}</p>
        {tokenDetails?.user && (
          <p>User: {tokenDetails.user.display_name} ({tokenDetails.user.id})</p>
        )}
        {scopeStatus && (
          <p>Top Tracks Scope: {scopeStatus.hasTopReadScope === true ? 
            "✅ Authorized" : 
            scopeStatus.hasTopReadScope === false ? 
            "❌ Not Authorized" : 
            "⚠️ Unknown"}
          </p>
        )}
        <div className="mt-2 flex space-x-2">
          <button 
            onClick={() => fetchTopTracks(accessToken)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Retry Axios
          </button>
          <button 
            onClick={handleDirectAPICall}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
          >
            Try Direct Fetch
          </button>
          <button 
            onClick={refreshTokenAndRetry}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Refresh Token
          </button>
          <button 
            onClick={handleReauthorize}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
          >
            Re-authorize
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div> */}
      
      {/* Time range selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Time Range:</label>
        <div className="flex space-x-4">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-full text-sm ${
                timeRange === option.value
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
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
      
      {/* Enhanced info message about permissions */}
      {/* {(errorMessage && errorMessage.includes("permission")) || (scopeStatus && scopeStatus.hasTopReadScope === false) ? (
        <div className="bg-blue-500 text-white p-3 rounded mb-4 mt-2">
          <p className="font-semibold">Note about Spotify permissions:</p>
          <p>The "user-top-read" scope is required to access your top tracks.</p>
          <p>You may need to revoke access to this app and log in again to grant all necessary permissions.</p>
          <div className="mt-4">
            <ol className="list-decimal pl-5">
              <li>Go to <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noopener noreferrer" className="underline">Spotify Account Apps</a></li>
              <li>Find this application and click "REMOVE ACCESS"</li>
              <li>Return to this app and log in again</li>
              <li>Make sure to accept all permissions when prompted</li>
            </ol>
          </div>
          <button
            onClick={handleReauthorize}
            className="mt-4 bg-white text-blue-500 hover:bg-gray-100 font-bold py-2 px-4 rounded"
          >
            Re-authorize Now
          </button>
        </div>
      ) : null} */}
      
      {/* Token debugging information */}
      {errorMessage && (
        <div className="bg-gray-800 p-3 rounded mb-4 text-sm mt-2">
          <p className="font-semibold">Debugging Information:</p>
          <details>
            <summary className="cursor-pointer text-gray-300 hover:text-white">Show token details (first 15 chars)</summary>
            <p className="mt-2">Access Token: {accessToken ? `${accessToken.substring(0, 15)}...` : 'Not available'}</p>
            <p>Refresh Token: {refreshToken ? `${refreshToken.substring(0, 10)}...` : 'Not available'}</p>
          </details>
        </div>
      )}
      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Top tracks list */}
          {/* {topTracks.length > 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topTracks.map((track, index) => (
  <div key={track.id} className="flex items-center p-3 bg-gray-700 rounded">
    <div className="text-lg font-bold text-green-400 mr-3">{index + 1}</div>
    <img 
      src={track.album.images.length > 0 ? track.album.images[track.album.images.length - 1].url : ''}
      alt={track.album.name}
      className="h-12 w-12 mr-4"
    />
    <div className="flex-grow overflow-hidden">
      <div className="font-medium truncate">{track.name}</div>
      <div className="text-sm text-gray-400 truncate">
        {track.artists.map(artist => artist.name).join(", ")}
      </div>
    </div>
    <button 
      onClick={() => playTrack(track.uri, track.id)}
      className="ml-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
      title="Play track"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
))}
              </div>
            </div>
          ) : !isLoading && !errorMessage && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
              No tracks found. Try selecting a different time range.
            </div>
          )}
           */}
          {/* Create playlist form */}
          {topTracks.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Tracks list - 2/3 width on large screens */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-4">Your Top {topTracks.length} Tracks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topTracks.map((track, index) => (
                    <div key={track.id} className={`flex items-center p-3 bg-gray-700 rounded ${currentTrackEmbed === track.id ? 'border-2 border-green-500' : ''}`}>
                      <div className="text-lg font-bold text-green-400 mr-3">{index + 1}</div>
                      <img 
                        src={track.album.images.length > 0 ? track.album.images[track.album.images.length - 1].url : ''}
                        alt={track.album.name}
                        className="h-12 w-12 mr-4"
                      />
                      <div className="flex-grow overflow-hidden">
                        <div className="font-medium truncate">{track.name}</div>
                        <div className="text-sm text-gray-400 truncate">
                          {track.artists.map(artist => artist.name).join(", ")}
                        </div>
                      </div>
                      <button 
                        onClick={() => playTrack(track.uri, track.id)}
                        className={`ml-2 p-2 rounded-full ${currentTrackEmbed === track.id ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                        title="Play track"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  ))}
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
          )}

       {/* Create playlist form */}
       {topTracks.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-xl font-semibold mb-4">Save as Playlist</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Playlist Name:</label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description:</label>
                <input
                  type="text"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>
              <button
                onClick={createPlaylist}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Create Playlist
              </button>
            </div>
          )}
          
          {/* Embed player if playlist was created */}
          {embedUri && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Your New Playlist</h3>
              <iframe
                title="Spotify Embed: New Playlist"
                src={`https://open.spotify.com/embed/${embedUri.replace('spotify:', '')}?utm_source=generator&theme=0`}
                width="100%"
                height="380"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
              />
            </div>

          )}
        </>
      )}
    </div>
  );
};

export default TopTracks;