const PlayPage = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchResults,
  embedUri,
}) => {
  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          Music Discovery
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Find your next favorite track with AudioVault
        </p>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          <div className="lg:col-span-2">
            <SearchResults searchResults={searchResults} />
          </div>

          <div className="lg:col-span-1">
            {embedUri && (
              <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-4 border-l-4 border-green-500 pl-3">
                  Now Playing
                </h3>
                <SpotifyEmbed embedUri={embedUri} />
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">
                Featured Playlists
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-800 bg-opacity-40 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-70 transition duration-300 border border-gray-700">
                  <div className="flex items-center p-3">
                    <img
                      src="/api/placeholder/400/400"
                      alt="Playlist"
                      className="w-12 h-12 rounded"
                    />
                    <div className="ml-3">
                      <h4 className="font-medium">Today's Top Hits</h4>
                      <p className="text-xs text-gray-400">
                        Playlist • Spotify
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-70 transition duration-300 border border-gray-700">
                  <div className="flex items-center p-3">
                    <img
                      src="/api/placeholder/400/400"
                      alt="Playlist"
                      className="w-12 h-12 rounded"
                    />
                    <div className="ml-3">
                      <h4 className="font-medium">RapCaviar</h4>
                      <p className="text-xs text-gray-400">
                        Playlist • Spotify
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-70 transition duration-300 border border-gray-700">
                  <div className="flex items-center p-3">
                    <img
                      src="/api/placeholder/400/400"
                      alt="Playlist"
                      className="w-12 h-12 rounded"
                    />
                    <div className="ml-3">
                      <h4 className="font-medium">Lo-Fi Beats</h4>
                      <p className="text-xs text-gray-400">
                        Playlist • Spotify
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">
                Your Statistics
              </h3>
              <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">247</div>
                    <div className="text-xs text-gray-400">Tracks Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">14</div>
                    <div className="text-xs text-gray-400">
                      Playlists Created
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">32</div>
                    <div className="text-xs text-gray-400">
                      Artists Followed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      86h
                    </div>
                    <div className="text-xs text-gray-400">Listening Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
