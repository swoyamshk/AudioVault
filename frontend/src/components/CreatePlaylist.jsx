import React, { useState } from "react";
import axios from "axios";

const CreatePlaylist = ({ accessToken, userId }) => {
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState("");

  const handleCreatePlaylist = async () => {
    if (!playlistName || !playlistDescription) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Create the playlist
      const playlistResponse = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: playlistName,
          description: playlistDescription,
          public: false, // Set to true if you want the playlist to be public
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const playlistId = playlistResponse.data.id;

      // Add tracks to the playlist
      if (tracks.length > 0) {
        await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            uris: tracks.map((track) => track.uri),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      setStatus("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      setStatus("Failed to create playlist. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Create Playlist</h1>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Playlist Name</label>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 text-white focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Playlist Description</label>
          <input
            type="text"
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 text-white focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Tracks to Add</label>
          <ul className="space-y-2">
            {tracks.map((track) => (
              <li key={track.id} className="bg-gray-800 p-2 rounded-lg">
                {track.name} by {track.artists.map((artist) => artist.name).join(", ")}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleCreatePlaylist}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Create Playlist
        </button>
        {status && <p className="mt-4 text-green-500">{status}</p>}
      </div>
    </div>
  );
};

export default CreatePlaylist;