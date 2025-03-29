// import React from "react";
// import { Link, useLocation } from "react-router-dom";

// const Navbar = () => {
//   const location = useLocation();

//   // Function to check if the current path matches the given path
//   const isActive = (path) => {
//     return location.pathname === path;
//   };

//   // Function to handle logout
//   const handleLogout = () => {
//     // Add your logout logic here
//     console.log("Logging out...");
//    localStorage.clear();
//   };

//   return (
//     <nav className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-lg sticky top-0 z-10">
//       <div className="max-w-6xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex items-center">
//             <Link to="/" className="flex items-center">
//               <svg
//                 className="h-8 w-8 text-green-500"
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 24 24"
//                 fill="currentColor"
//               >
//                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12v8l6-4-6-4z" />
//               </svg>
//               <span className="ml-2 text-xl font-bold text-white">
//                 AudioVault
//               </span>
//             </Link>
//           </div>

//           {/* Navigation Links */}
//           <div className="hidden md:flex space-x-4">
//             <Link
//               to="/"
//               className={`px-3 py-2 rounded-md text-sm font-medium ${
//                 isActive("/")
//                   ? "bg-green-600 text-white"
//                   : "text-gray-300 hover:bg-gray-700 hover:text-white"
//               }`}
//             >
//               Home
//             </Link>

//             <Link
//               to="/play"
//               className={`px-3 py-2 rounded-md text-sm font-medium ${
//                 isActive("/play")
//                   ? "bg-green-600 text-white"
//                   : "text-gray-300 hover:bg-gray-700 hover:text-white"
//               }`}
//             >
//               Play Music
//             </Link>
//             <Link
//               to="/explore"
//               className="text-white hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium"
//             >
//               Explore New Music
//             </Link>
//             <Link 
//               to="/top-tracks" 
//               className="px-4 py-2 text-white hover:bg-gray-700 rounded transition duration-200"
//             >
//               Top Tracks
//             </Link>
//             <Link
//               to="/playlists"
//               className={`px-3 py-2 rounded-md text-sm font-medium ${
//                 isActive("/playlists")
//                   ? "bg-green-600 text-white"
//                   : "text-gray-300 hover:bg-gray-700 hover:text-white"
//               }`}
//             >
//               Your Playlists
//             </Link>
//             <Link
//               to="/recommend"
//               className={`px-3 py-2 rounded-md text-sm font-medium ${
//                 isActive("/recommend")
//                   ? "bg-green-600 text-white"
//                   : "text-gray-300 hover:bg-gray-700 hover:text-white"
//               }`}
//             >
//               Recommend Music
//             </Link>
//             <button
//               onClick={handleLogout}
//               className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
//             >
//               Logout
//             </button>
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden flex items-center">
//             <button
//               className="mobile-menu-button outline-none focus:outline-none"
//               aria-label="Toggle menu"
//             >
//               <svg
//                 className="h-6 w-6 text-gray-300 hover:text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       <div className="mobile-menu hidden md:hidden">
//         <Link
//           to="/"
//           className={`block px-4 py-2 text-sm ${
//             isActive("/")
//               ? "bg-green-600 text-white"
//               : "text-gray-300 hover:bg-gray-700 hover:text-white"
//           }`}
//         >
//           Home
//         </Link>
//         <Link
//           to="/play"
//           className={`block px-4 py-2 text-sm ${
//             isActive("/play")
//               ? "bg-green-600 text-white"
//               : "text-gray-300 hover:bg-gray-700 hover:text-white"
//           }`}
//         >
//           Play Music
//         </Link>
//         <Link
//           to="/explore"
//           className={`block px-4 py-2 text-sm ${
//             isActive("/exlpore")
//               ? "bg-green-600 text-white"
//               : "text-gray-300 hover:bg-gray-700 hover:text-white"
//           }`}
//         >
//           Explore New
//         </Link>
//         <Link
//           to="/playlists"
//           className={`block px-4 py-2 text-sm ${
//             isActive("/playlists")
//               ? "bg-green-600 text-white"
//               : "text-gray-300 hover:bg-gray-700 hover:text-white"
//           }`}
//         >
//           Your Playlists
//         </Link>
//         <Link
//           to="/recommend"
//           className={`block px-4 py-2 text-sm ${
//             isActive("/recommend")
//               ? "bg-green-600 text-white"
//               : "text-gray-300 hover:bg-gray-700 hover:text-white"
//           }`}
//         >
//           Recommend Music
//         </Link>
//         <button
//           onClick={handleLogout}
//           className="w-full text-left block px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700"
//         >
//           Logout
//         </button>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

// In Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentUser, onLoginClick, onLogout }) => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <Link to="/" className="text-xl font-bold text-white">AudioVault</Link>
        </div>
        
        <div className="flex space-x-4">
          <Link to="/play" className="text-gray-300 hover:text-white">Play</Link>
          <Link to="/explore" className="text-gray-300 hover:text-white">Explore</Link>
          <Link to="/playlists" className="text-gray-300 hover:text-white">Playlists</Link>
          <Link to="/recommend" className="text-gray-300 hover:text-white">Recommend</Link>
          <Link to="/top-tracks" className="text-gray-300 hover:text-white">Top Tracks</Link>
          <Link to="/history" className="text-gray-300 hover:text-white">History</Link>
          
          {currentUser ? (
            <div className="flex items-center">
              <span className="text-gray-300 mr-2">{currentUser.username}</span>
              <button 
                onClick={onLogout}
                className="text-gray-300 hover:text-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="text-gray-300 hover:text-white"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;