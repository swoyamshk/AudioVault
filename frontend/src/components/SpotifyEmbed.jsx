import React from "react";

const SpotifyEmbed = ({ embedUri }) => {
  if (!embedUri) return null;

  return (
    <div className="mt-8 flex justify-center">
      <iframe
        src={`https://open.spotify.com/embed/${embedUri.includes("playlist") ? "playlist" : "track"}/${embedUri.split(":").pop()}`}
        width="100%"
        height="380"
        frameBorder="0"
        allowTransparency="true"
        allow="encrypted-media"
        className="rounded-lg shadow-lg"
      ></iframe>
    </div>
  );
};

export default SpotifyEmbed;
