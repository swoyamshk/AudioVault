import React from "react";

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex shadow-lg rounded-full overflow-hidden border border-gray-700 bg-gray-800 focus-within:ring-2 focus-within:ring-green-500 transition duration-300">
        <input
          type="text"
          placeholder="Search for songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pl-6 bg-transparent text-white focus:outline-none text-lg"
        />
        <button
          onClick={handleSearch}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-r-full transition duration-300 flex items-center justify-center min-w-24"
        >
          <span>Search</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
