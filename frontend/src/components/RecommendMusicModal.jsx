import React, { useState } from "react";

const RecommendedMusicModal = ({ isOpen, onClose, recommendedTracks }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: false, message: "" });

  if (!isOpen || !recommendedTracks || recommendedTracks.length === 0) {
    return null;
  }

  const saveToSpotifyPlaylist = async () => {
    try {
      setIsSaving(true);
      setSaveResult({ success: false, message: "" });
  
      const accessToken = localStorage.getItem("access_token");
  
      if (!accessToken) {
        throw new Error("No access token found. Please log in again.");
      }
  
      // Fetch user ID
      const userIdResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!userIdResponse.ok) {
        throw new Error("Failed to fetch user ID");
      }
      const userIdData = await userIdResponse.json();
      const userId = userIdData.id;
  
      // Create a new playlist
      const playlistName = `Recommended Tracks - ${new Date().toLocaleDateString()}`;
      const createPlaylistResponse = await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: playlistName,
            description: "Playlist created from AudioVault AI Recommendation",
            public: false,
          }),
        }
      );
  
      if (!createPlaylistResponse.ok) {
        const errorData = await createPlaylistResponse.json();
        console.error("Spotify API Error:", errorData);
        throw new Error(errorData.error.message || "Failed to create playlist");
      }
  
      const playlistData = await createPlaylistResponse.json();
      const playlistId = playlistData.id;
  
      // Add tracks to the playlist
      const trackUris = recommendedTracks.map((track) => `spotify:track:${track.spotify_id}`);
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: trackUris,
          }),
        }
      );
  
      if (!addTracksResponse.ok) {
        const errorData = await addTracksResponse.json();
        console.error("Spotify API Error:", errorData);
        throw new Error(errorData.error.message || "Failed to add tracks to playlist");
      }
  
      setSaveResult({
        success: true,
        message: `Playlist "${playlistName}" created successfully!`,
      });
    } catch (error) {
      console.error("Error saving playlist:", error);
      setSaveResult({
        success: false,
        message: `Error: ${error.message || "Failed to save playlist"}`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 bg-opacity-40 backdrop-blur-sm rounded-xl max-w-3xl w-full max-h-screen overflow-y-auto shadow-lg border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Recommended Music</h2>
            <button
              onClick={onClose}
              className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-gray-300 hover:text-white p-2 rounded-full focus:outline-none transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          {/* Save to Spotify Button */}
          <div className="mb-6 flex flex-col">
            <button
              onClick={saveToSpotifyPlaylist}
              disabled={isSaving}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"></path>
                  </svg>
                  Save as Spotify Playlist
                </span>
              )}
            </button>

            {saveResult.message && (
              <div
                className={`mt-2 p-2 rounded text-sm ${
                  saveResult.success
                    ? "bg-green-900 bg-opacity-50 text-green-300"
                    : "bg-red-900 bg-opacity-50 text-red-300"
                }`}
              >
                {saveResult.message}
              </div>
            )}
          </div>

          <ul className="space-y-4">
            {recommendedTracks.map((track) => {
              // Parse the artist_name if it's a string representation of an array
              let artists = track.artist_name;
              if (typeof artists === "string" && artists.startsWith("[")) {
                try {
                  artists = JSON.parse(artists.replace(/'/g, '"'));
                } catch (e) {
                  artists = [track.artist_name];
                }
              }
              if (!Array.isArray(artists)) {
                artists = [artists];
              }
              return (
                <li
                  key={track.spotify_id}
                  className="bg-gray-800 bg-opacity-50 p-4 rounded-lg shadow-md border border-gray-700"
                >
                  <div>
                    <strong className="text-lg text-white">{track.track_name}</strong>
                    <p className="text-gray-300">
                      by {Array.isArray(artists) ? artists.join(", ") : artists}
                    </p>
                    <p className="text-gray-400 text-sm">Album: {track.album}</p>
                  </div>
                  {/* Spotify Embed Player */}
                  <iframe
                    src={`https://open.spotify.com/embed/track/${track.spotify_id}`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="encrypted-media"
                    className="mt-2 rounded-lg"
                  ></iframe>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecommendedMusicModal;