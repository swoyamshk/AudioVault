import React, { useState, useEffect } from "react";
import axios from "axios";
import SpotifyEmbed from "./SpotifyEmbed";

const ExploreNew = ({ accessToken }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popularTracks, setPopularTracks] = useState([]);
  const [categoryPlaylists, setCategoryPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [embedUri, setEmbedUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch categories when component mounts
  useEffect(() => {
    if (accessToken) {
      fetchCategories();
      fetchPopularTracks();
    }
  }, [accessToken]);

  // Fetch categories from Spotify
  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://api.spotify.com/v1/browse/categories", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 20, country: "US" }
      });
      setCategories(response.data.categories.items);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch popular tracks (featured playlists or new releases)
  const fetchPopularTracks = async () => {
    setLoading(true);
    try {
      // Get new releases
      const response = await axios.get("https://api.spotify.com/v1/browse/new-releases", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 10, country: "US" }
      });
      setPopularTracks(response.data.albums.items);
    } catch (error) {
      console.error("Error fetching popular tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlists for a selected category
  const fetchCategoryPlaylists = async (categoryId) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 10 }
      });
      setCategoryPlaylists(response.data.playlists.items);
      setSelectedCategory(categoryId);
      setSelectedPlaylist(null);
      setPlaylistTracks([]);
    } catch (error) {
      console.error("Error fetching category playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tracks for a selected playlist
  const fetchPlaylistTracks = async (playlistId) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 15 }
      });
      setPlaylistTracks(response.data.items);
      setSelectedPlaylist(playlistId);
    } catch (error) {
      console.error("Error fetching playlist tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (uri) => {
    setEmbedUri(uri);
  };

  // Render loading indicator
  if (loading && !popularTracks.length && !categories.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <h2 className="text-2xl font-bold mb-6">Explore New Music</h2>
      
      {/* Genre Categories */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Browse By Genre</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => fetchCategoryPlaylists(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium
                ${selectedCategory === category.id ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Playlists */}
      {selectedCategory && categoryPlaylists.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Featured Playlists</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className={`bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700 transition
                  ${selectedPlaylist === playlist.id ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => fetchPlaylistTracks(playlist.id)}
              >
                <img
                  src={playlist.images[0]?.url || "/placeholder-album.png"}
                  alt={playlist.name}
                  className="w-full aspect-square object-cover rounded mb-2"
                />
                <p className="font-medium truncate">{playlist.name}</p>
                <p className="text-gray-400 text-sm truncate">{playlist.tracks.total} tracks</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlist Tracks */}
      {selectedPlaylist && playlistTracks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Tracks</h3>
          <div className="bg-gray-800 rounded overflow-hidden">
            {playlistTracks.map((item) => (
              <div
                key={item.track.id}
                className="flex items-center p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer"
                onClick={() => handlePlay(item.track.uri)}
              >
                <img
                  src={item.track.album.images[2]?.url || "/placeholder-album.png"}
                  alt={item.track.name}
                  className="w-10 h-10 mr-3"
                />
                <div className="flex-grow">
                  <p className="font-medium">{item.track.name}</p>
                  <p className="text-gray-400 text-sm">
                    {item.track.artists.map(artist => artist.name).join(", ")}
                  </p>
                </div>
                <div className="text-gray-400 text-sm">
                  {Math.floor(item.track.duration_ms / 60000)}:
                  {String(Math.floor((item.track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Releases */}
      {popularTracks.length > 0 && !selectedPlaylist && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">New Releases</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {popularTracks.map((album) => (
              <div
                key={album.id}
                className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700 transition"
                onClick={() => handlePlay(album.uri)}
              >
                <img
                  src={album.images[0]?.url || "/placeholder-album.png"}
                  alt={album.name}
                  className="w-full aspect-square object-cover rounded mb-2"
                />
                <p className="font-medium truncate">{album.name}</p>
                <p className="text-gray-400 text-sm truncate">
                  {album.artists.map(artist => artist.name).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spotify Embed Player */}
      {embedUri && (
        <div className="mt-6">
          <SpotifyEmbed embedUri={embedUri} />
        </div>
      )}
    </div>
  );
};

export default ExploreNew;