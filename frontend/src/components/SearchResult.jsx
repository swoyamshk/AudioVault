import React from "react";

const SearchResults = ({ searchResults }) => {
  if (searchResults.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-xl font-medium mb-2">No results found</h3>
        <p>Try searching for a song, artist, or album</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center border-b border-gray-700 pb-3">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-500">
          Tracks
        </span>
        <span className="ml-3 text-gray-400 text-base font-normal">
          {searchResults.length} results
        </span>
      </h2>
      <div className="space-y-4">
        {searchResults.map((track) => (
          <div 
            key={track.id} 
            className="bg-gray-800 bg-opacity-50 p-4 rounded-xl shadow-md backdrop-blur-lg border border-gray-700 hover:border-green-500 transition duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white">{track.name}</h3>
                <p className="text-gray-400">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span>{track.album.name}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              
              </div>
            </div>
            
            <iframe
              src={`https://open.spotify.com/embed/track/${track.id}`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              className="mt-4 rounded-lg"
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
