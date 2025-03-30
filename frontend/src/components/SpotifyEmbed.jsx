import React from "react";

const SpotifyEmbed = ({ embedUri }) => {
  if (!embedUri) return null;
  
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-gray-700">
      <iframe
        src={`https://open.spotify.com/embed/${embedUri.includes("playlist") ? "playlist" : "track"}/${embedUri.split(":").pop()}`}
        width="100%"
        height="380"
        frameBorder="0"
        allowTransparency="true"
        allow="encrypted-media"
        className="rounded-lg"
      ></iframe>
    </div>
  );
};
export default SpotifyEmbed;
