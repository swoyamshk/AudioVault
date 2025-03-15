import React, { useState } from "react";

const PlayMusic = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioSrc, setAudioSrc] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  // Handle file selection and set the audio source
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioSrc(URL.createObjectURL(file));
    }
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Stop the audio
  const stopAudio = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Play Music from Your PC</h1>
      <div className="flex justify-center mb-8">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="bg-gray-700 text-white p-2 rounded-lg"
        />
      </div>
      {audioFile && (
        <div className="max-w-4xl mx-auto">
          <audio
            ref={(ref) => setAudioRef(ref)}
            src={audioSrc}
            controls={false}
            className="w-full"
          />
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={togglePlay}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={stopAudio}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayMusic;
