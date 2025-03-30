import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
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
import History from "./components/History";
import AuthModal from "./components/AuthModal";

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check for existing user data on initial load
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
    if (userData.id) {
      setCurrentUser(userData);
    }
  }, []);

  // Handle user authentication from the AuthModal
  const handleAuth = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setIsAuthModalOpen(false);

    // If user has connected Spotify already, set the access token
    if (userData.spotifyConnected && localStorage.getItem("access_token")) {
      setAccessToken(localStorage.getItem("access_token"));
    } else {
      // Redirect to Spotify OAuth
      handleSpotifyLogin();
    }
  };

  // Handle the UI login button click
  const handleUILogin = () => {
    // Check if we have a user account already
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    if (userData.id) {
      // User is already logged in to your app, direct to Spotify OAuth
      handleSpotifyLogin();
    } else {
      // User needs to login/register to your app first
      setIsAuthModalOpen(true);
    }
  };

  // Specifically handle Spotify login redirect
  const handleSpotifyLogin = () => {
    // Clear any stored tokens before redirecting
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "http://localhost:4000/login";
  };

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
        refresh_token,
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

      axios
        .get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          console.log("User data received:", response.data);
          setUserId(response.data.id);
        })
        .catch(async (error) => {
          console.error("Error fetching user ID:", error);
          console.error("Response details:", error.response?.data);

          // If we get a 403 or 401, try refreshing the token
          if (
            error.response &&
            (error.response.status === 403 || error.response.status === 401)
          ) {
            console.log("Attempting to refresh token...");
            const newToken = await refreshToken();
            if (newToken) {
              // Retry with new token
              console.log("Retrying with new token...");
              axios
                .get("https://api.spotify.com/v1/me", {
                  headers: { Authorization: `Bearer ${newToken}` },
                })
                .then((response) => {
                  console.log(
                    "User data received after refresh:",
                    response.data
                  );
                  setUserId(response.data.id);
                })
                .catch((retryError) => {
                  console.error("Error after token refresh:", retryError);
                  // If still failing, redirect to login
                  alert("Your session has expired. Please log in again.");
                  handleSpotifyLogin();
                });
            } else {
              // If refresh fails, redirect to login
              alert("Unable to refresh your session. Please log in again.");
              handleSpotifyLogin();
            }
          }
        });
    }
  }, [accessToken]);

  useEffect(() => {
    if (userId && accessToken) {
      axios
        .get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => setPlaylists(response.data.items))
        .catch(async (error) => {
          console.error("Error fetching playlists:", error);

          // If we get a 403 or 401, try refreshing the token
          if (
            error.response &&
            (error.response.status === 403 || error.response.status === 401)
          ) {
            const newToken = await refreshToken();
            if (newToken) {
              // Retry with new token
              axios
                .get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                  headers: { Authorization: `Bearer ${newToken}` },
                })
                .then((response) => setPlaylists(response.data.items))
                .catch((retryError) => {
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
      if (
        error.response &&
        (error.response.status === 403 || error.response.status === 401)
      ) {
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          try {
            const response = await axios.get(
              "https://api.spotify.com/v1/search",
              {
                headers: { Authorization: `Bearer ${newToken}` },
                params: { q: searchQuery, type: "track", limit: 10 },
              }
            );
            setSearchResults(response.data.tracks.items);
          } catch (retryError) {
            console.error("Error after token refresh:", retryError);
            alert(
              "There was an error searching for tracks. Please try logging in again."
            );
          }
        } else {
          alert("Your session has expired. Please log in again.");
          handleSpotifyLogin();
        }
      }
    }
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
          const retryResponse = await fetch(
            "http://localhost:5001/recommend-similar",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                playlist_id: playlistId,
                access_token: newToken,
              }),
            }
          );

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            console.error(
              "Failed to fetch recommendations after token refresh:",
              errorData.error
            );
            alert("Error: " + errorData.error);
          } else {
            const data = await retryResponse.json();
            console.log("Recommendations:", data);
            setRecommendations(data);
            setIsModalOpen(true);
          }
        } else {
          alert("Your session has expired. Please log in again.");
          handleSpotifyLogin();
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-8">
        {/* Hero Section */}
        <div className="max-w-4xl w-full flex flex-col items-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">
            Audio<span className="text-green-500">Vault</span>
          </h1>
          <p className="text-xl text-gray-300 text-center mb-8 max-w-2xl">
            Your personal music insights platform powered by Spotify
          </p>
          <button
            onClick={handleUILogin}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full flex items-center transition-all transform hover:scale-105"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 496 512"
            >
              <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 30.6 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z" />
            </svg>
            Connect with Spotify
          </button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-16">
          <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="text-green-500 text-3xl mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Music Insights</h3>
            <p className="text-gray-400">
              Discover patterns in your listening habits and uncover your true
              music taste.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="text-green-500 text-3xl mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Personalized Playlists</h3>
            <p className="text-gray-400">
              Create custom playlists based on your unique preferences and
              musical journey.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="text-green-500 text-3xl mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Music Discovery</h3>
            <p className="text-gray-400">
              Expand your musical horizons with intelligent recommendations
              based on your taste.
            </p>
          </div>
        </div>

        {/* Testimonials/Social Proof */}
        <div className="max-w-4xl w-full mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Trusted by Music Lovers
          </h2>
          <div className="flex flex-col md:flex-row justify-between space-y-6 md:space-y-0 md:space-x-6">
            <div className="bg-gray-800 p-6 rounded-lg flex-1">
              <p className="italic text-gray-300 mb-4">
                "AudioVault helped me rediscover music I had forgotten about and
                introduced me to new artists I now love."
              </p>
              <p className="font-semibold">— Alex K.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg flex-1">
              <p className="italic text-gray-300 mb-4">
                "The insights into my listening habits were eye-opening. This
                app changed how I experience music."
              </p>
              <p className="font-semibold">— Jamie T.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-4xl text-center text-gray-500 text-sm">
          <p>© 2025 AudioVault. Powered by Spotify API. All rights reserved.</p>
          <p className="mt-2">
            By connecting, you agree to our{" "}
            <span className="text-green-500 cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-green-500 cursor-pointer">
              Privacy Policy
            </span>
            .
          </p>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuth={handleAuth}
        />
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
            <Route
              path="/"
              element={
                <>
                  <h1 className="text-4xl font-bold text-center mb-8 underline">
                    AudioVault
                  </h1>
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                  />
                  <SearchResults searchResults={searchResults} />
                  {embedUri && <SpotifyEmbed embedUri={embedUri} />}
                </>
              }
            />
            <Route path="/history" element={<History />} />

            <Route
              path="/play"
              element={
                <>
                  <h2 className="text-2xl font-bold mb-6">Play Music</h2>
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                  />
                  <SearchResults searchResults={searchResults} />
                  {embedUri && <SpotifyEmbed embedUri={embedUri} />}
                </>
              }
            />
            <Route
              path="/top-tracks"
              element={
                <>
                  <h2 className="text-2xl font-bold mb-6">Your Top Tracks</h2>
                  <TopTracks
                    accessToken={accessToken}
                    refreshToken={localStorage.getItem("refresh_token")}
                  />
                </>
              }
            />
            <Route
              path="/explore"
              element={
                <>
                  <h2 className="text-2xl font-bold mb-6">Explore New Music</h2>
                  <ExploreNew accessToken={accessToken} />
                </>
              }
            />

            {/* Playlists Page */}
            <Route
              path="/playlists"
              element={
                <>
                  {/* <h2 className="text-2xl font-bold mb-6">Your Playlists</h2> */}
                  <Playlists
                    playlists={playlists}
                    handleSetEmbed={setEmbedUri}
                    handleRecommendSimilar={handleRecommendSimilar}
                  />
                </>
              }
            />
            <Route
              path="/recommend"
              element={
                <>
                  <h2 className="text-2xl font-bold mb-6">Recommend Music</h2>
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">
                      Get Recommendations from a Playlist URL
                    </h3>
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
                    <h3 className="text-xl font-semibold mb-4">
                      Or Select from Your Playlists
                    </h3>
                    <Playlists
                      playlists={playlists}
                      handleSetEmbed={setEmbedUri}
                      handleRecommendSimilar={handleRecommendSimilar}
                    />
                  </div>
                </>
              }
            />

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
