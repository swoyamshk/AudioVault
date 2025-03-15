import React from "react";

const SearchResults = ({ searchResults }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Search Results</h2>
      <ul className="space-y-4">
        {searchResults.map((track) => (
          <li key={track.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-16 h-16 rounded-lg"
              />
              <div>
                <strong className="text-lg">{track.name}</strong>
                <p className="text-gray-400">
                  by {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </div>
            {/* Spotify Embed Player */}
            <iframe
              src={`https://open.spotify.com/embed/track/${track.id}`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              className="mt-2 rounded-lg"
            ></iframe>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResults;
