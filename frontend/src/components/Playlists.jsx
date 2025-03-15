import React from "react";

const Playlists = ({ playlists, handleSetEmbed, handleRecommendSimilar }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Public Playlists</h2>
      <ul className="space-y-4">
        {playlists.map((playlist) => (
          <li key={playlist.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              {playlist.images.length > 0 && (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-16 h-16 rounded-lg"
                />
              )}
              <div>
                <strong className="text-lg">{playlist.name}</strong>
                <p className="text-gray-400">Tracks: {playlist.tracks?.total || 0}</p>
              </div>
              <button
                onClick={() => handleSetEmbed(playlist.uri)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
              >
                Listen on Spotify
              </button>
              <button
                onClick={() => handleRecommendSimilar(playlist.id)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Recommend Similar Music
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlists;