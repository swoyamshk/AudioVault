// components/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processAuthCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userId = params.get('userId');

        if (!accessToken) {
          throw new Error('No access token received from authentication');
        }

        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // If we have a userId, update the user data to reflect Spotify connection
        if (userId) {
          const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
          userData.spotifyConnected = true;
          localStorage.setItem('user_data', JSON.stringify(userData));
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing authentication callback:', err);
        setError(err.message);
        setIsProcessing(false);
      }
    }

    processAuthCallback();
  }, []);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Finalizing Authentication...</h2>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Redirect to home page after successful processing
  return <Navigate to="/" replace />;
};

export default AuthCallback;