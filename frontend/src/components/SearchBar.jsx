import React from "react";

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => {
  return (
    <div className="flex justify-center mb-8">
      <input
        type="text"
        placeholder="Search for a song..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-64 p-2 rounded-l-lg bg-gray-700 text-white focus:outline-none"
      />
      <button
        onClick={handleSearch}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-r-lg"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
