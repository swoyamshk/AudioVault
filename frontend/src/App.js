import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Components
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResult";
import Playlists from "./components/Playlists";
import SpotifyEmbed from "./components/SpotifyEmbed";
import RecommendedMusicModal from "./components/RecommendMusicModal";
import ExploreNew from "./components/ExploreNew";
import TopTracks from "./components/TopTracks";

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userId, setUserId] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [embedUri, setEmbedUri] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token) {
      localStorage.setItem("access_token", access_token);
      setAccessToken(access_token);
      
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, []);

  const refreshToken = async () => {
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) {
      console.error("No refresh token available");
      return null;
    }
    
    try {
      const response = await axios.post("http://localhost:4000/refresh-token", {
        refresh_token
      });
      const newToken = response.data.access_token;
      localStorage.setItem("access_token", newToken);
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (accessToken) {
      console.log("Token being used:", accessToken.substring(0, 10) + "...");
      
      axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(response => {
        console.log("User data received:", response.data);
        setUserId(response.data.id);
      })
      .catch(async error => {
        console.error("Error fetching user ID:", error);
        console.error("Response details:", error.response?.data);
        
        // If we get a 403 or 401, try refreshing the token
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
          console.log("Attempting to refresh token...");
          const newToken = await refreshToken();
          if (newToken) {
            // Retry with new token
            console.log("Retrying with new token...");
            axios.get("https://api.spotify.com/v1/me", {
              headers: { Authorization: `Bearer ${newToken}` },
            })
            .then(response => {
              console.log("User data received after refresh:", response.data);
              setUserId(response.data.id);
            })
            .catch(retryError => {
              console.error("Error after token refresh:", retryError);
              // If still failing, redirect to login
              alert("Your session has expired. Please log in again.");
              handleLogin();
            });
          } else {
            // If refresh fails, redirect to login
            alert("Unable to refresh your session. Please log in again.");
            handleLogin();
          }
        }
      });
    }
  }, [accessToken]);

  useEffect(() => {
    if (userId && accessToken) {
      axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(response => setPlaylists(response.data.items))
      .catch(async error => {
        console.error("Error fetching playlists:", error);
        
        // If we get a 403 or 401, try refreshing the token
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
          const newToken = await refreshToken();
          if (newToken) {
            // Retry with new token
            axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
              headers: { Authorization: `Bearer ${newToken}` },
            })
            .then(response => setPlaylists(response.data.items))
            .catch(retryError => {
              console.error("Error after token refresh:", retryError);
            });
          }
        }
      });
    }
  }, [userId, accessToken]);

  const handleSearch = async () => {
    if (!accessToken) {
      alert("Please log in first.");
      return;
    }

    try {
      const response = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q: searchQuery, type: "track", limit: 10 },
      });
      setSearchResults(response.data.tracks.items);
    } catch (error) {
      console.error("Error searching for tracks:", error);
      
      // If we get a 403 or 401, try refreshing the token
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          try {
            const response = await axios.get("https://api.spotify.com/v1/search", {
              headers: { Authorization: `Bearer ${newToken}` },
              params: { q: searchQuery, type: "track", limit: 10 },
            });
            setSearchResults(response.data.tracks.items);
          } catch (retryError) {
            console.error("Error after token refresh:", retryError);
            alert("There was an error searching for tracks. Please try logging in again.");
          }
        } else {
          alert("Your session has expired. Please log in again.");
          handleLogin();
        }
      }
    }
  };

  const handleLogin = () => {
    // Clear any stored tokens before redirecting
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "http://localhost:4000/login";
  };

  const extractPlaylistId = (url) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleRecommendSimilar = async (playlistId) => {
    const currentToken = localStorage.getItem("access_token");
  
    if (!currentToken) {
      console.error("Access token is missing");
      alert("Please log in first.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5001/recommend-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlist_id: playlistId,
          access_token: currentToken,
        }),
      });
  
      if (response.status === 401 || response.status === 403) {
        // Try refreshing the token
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch("http://localhost:5001/recommend-similar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playlist_id: playlistId,
              access_token: newToken,
            }),
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            console.error("Failed to fetch recommendations after token refresh:", errorData.error);
            alert("Error: " + errorData.error);
          } else {
            const data = await retryResponse.json();
            console.log("Recommendations:", data);
            setRecommendations(data);
            setIsModalOpen(true);
          }
        } else {
          alert("Your session has expired. Please log in again.");
          handleLogin();
        }
      } else if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch recommendations:", errorData.error);
        alert("Error: " + errorData.error);
      } else {
        const data = await response.json();
        console.log("Recommendations:", data);
        setRecommendations(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching recommendations.");
    }
  };
  
  const handleRecommendFromUrl = () => {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      alert("Invalid Spotify playlist URL. Please enter a valid link.");
      return;
    }
    handleRecommendSimilar(playlistId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Render login screen if not authenticated
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-center mb-8">AudioVault</h1>
        <div className="flex justify-center">
          <button onClick={handleLogin} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        
        <div className="max-w-4xl mx-auto p-8">
          <Routes>
            {/* Home Page */}
            <Route path="/" element={
              <>
                <h1 className="text-4xl font-bold text-center mb-8 underline">AudioVault</h1>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
                <SearchResults searchResults={searchResults} />
                {embedUri && <SpotifyEmbed embedUri={embedUri} />}
              </>
            } />
            
            {/* Play Music Page */}
            <Route path="/play" element={
              <>
                <h2 className="text-2xl font-bold mb-6">Play Music</h2>
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
                <SearchResults searchResults={searchResults} />
                {embedUri && <SpotifyEmbed embedUri={embedUri} />}
              </>
            } />
            <Route path="/top-tracks" element={
  <>
    <h2 className="text-2xl font-bold mb-6">Your Top Tracks</h2>
    <TopTracks accessToken={accessToken} refreshToken={localStorage.getItem("refresh_token")} />  </>
} />
            {/* Explore New Music Page */}
            <Route path="/explore" element={
              <>
                <h2 className="text-2xl font-bold mb-6">Explore New Music</h2>
                <ExploreNew accessToken={accessToken} />
              </>
            } />
            
            {/* Playlists Page */}
            <Route path="/playlists" element={
              <>
                <h2 className="text-2xl font-bold mb-6">Your Playlists</h2>
                <Playlists playlists={playlists} handleSetEmbed={setEmbedUri} handleRecommendSimilar={handleRecommendSimilar} />
              </>
            } />
            
            {/* Recommend Music Page */}
            <Route path="/recommend" element={
              <>
                <h2 className="text-2xl font-bold mb-6">Recommend Music</h2>
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Get Recommendations from a Playlist URL</h3>
                  <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="Enter Spotify playlist URL..."
                    className="w-full p-2 rounded bg-gray-800 text-white mt-2"
                  />
                  <button
                    onClick={handleRecommendFromUrl}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-2"
                  >
                    Get Recommendations
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Or Select from Your Playlists</h3>
                  <Playlists playlists={playlists} handleSetEmbed={setEmbedUri} handleRecommendSimilar={handleRecommendSimilar} />
                </div>
              </>
            } />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Recommended Music Modal */}
        <RecommendedMusicModal 
          isOpen={isModalOpen}
          onClose={closeModal}
          recommendedTracks={recommendations}
        />
      </div>
    </Router>
  );
};

export default App;