const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = "60479c2e1ab447ad8209ee337cd74a7f";
const CLIENT_SECRET = "092b86385636484b83e8f0ca9bfdb88b";
const REDIRECT_URI = "http://localhost:4000/callback";

// Login route
app.get("/login", (req, res) => {
  // Clear any existing cookies/sessions if applicable
  // res.clearCookie('spotify_auth_state');
  
  const scope = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read user-read-recently-played";

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  
  res.redirect(authUrl);
});

// Callback route
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authorization code not found.");

  try {
    console.log("Exchanging code for token...");
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Token received successfully");
    const { access_token, refresh_token } = response.data;
    
    // Verify token works before redirecting
    try {
      const userCheck = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      console.log("Token verified - user:", userCheck.data.id);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError.response?.data);
      // Continue anyway, as our frontend will handle this
    }
    
    res.redirect(`http://localhost:3000?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error("Error exchanging code:", error.response?.data || error.message);
    res.status(500).send("Failed to authenticate. Error: " + (error.response?.data?.error_description || error.message));
  }
});

// Refresh Token Route
app.post("/refresh-token", async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token is required." });
  }

  try {
    console.log("Attempting to refresh token...");
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log("Token refreshed successfully");
    res.json({ 
      access_token: response.data.access_token,
      // Send new refresh token if Spotify provided one
      refresh_token: response.data.refresh_token || refresh_token
    });
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to refresh token.",
      details: error.response?.data?.error_description || error.message
    });
  }
});

// Debug route to verify tokens
app.post("/verify-token", async (req, res) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ error: "Access token is required." });
  }
  
  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    res.json({ 
      valid: true, 
      user: {
        id: response.data.id,
        display_name: response.data.display_name,
        email: response.data.email
      }
    });
  } catch (error) {
    res.json({ 
      valid: false, 
      error: error.response?.data?.error?.message || error.message,
      status: error.response?.status
    });
  }
});

app.get("/test-top-tracks", async (req, res) => {
  const accessToken = req.query.token;
  const timeRange = req.query.time_range || 'medium_term'; // default to medium_term
  
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required as a query parameter" });
  }
  
  try {
    console.log(`Testing top tracks API with time_range: ${timeRange}`);
    
    // First verify the token works at all
    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`Token valid for user: ${userResponse.data.display_name} (${userResponse.data.id})`);
    
    // Now try to get top tracks
    const topTracksResponse = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks`,
      {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: { 
          time_range: timeRange, 
          limit: 10 
        }
      }
    );
    
    // Format the response to be more readable
    const formattedTracks = topTracksResponse.data.items.map((track, index) => {
      return {
        position: index + 1,
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        popularity: track.popularity,
        id: track.id
      };
    });
    
    res.json({
      success: true,
      user: {
        id: userResponse.data.id,
        name: userResponse.data.display_name
      },
      time_range: timeRange,
      tracks: formattedTracks,
      raw_count: topTracksResponse.data.items.length
    });
    
  } catch (error) {
    console.error("Error in test-top-tracks:", error.message);
    
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
      
      res.status(error.response.status).json({
        success: false,
        error: error.response.data.error?.message || error.message,
        status: error.response.status,
        scopes_needed: ["user-top-read"]
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        scopes_needed: ["user-top-read"]
      });
    }
  }
});

// Add this utility route to check what scopes a token has
app.get("/check-token-scopes", async (req, res) => {
  const accessToken = req.query.token;
  
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required as a query parameter" });
  }
  
  try {
    // There's no direct endpoint to check scopes, but we can check 
    // by trying to access endpoints that require specific scopes
    
    const endpoints = [
      { name: "user profile", url: "https://api.spotify.com/v1/me", scope: "user-read-private" },
      { name: "top tracks", url: "https://api.spotify.com/v1/me/top/tracks?limit=1", scope: "user-top-read" },
      { name: "saved tracks", url: "https://api.spotify.com/v1/me/tracks?limit=1", scope: "user-library-read" },
      { name: "recently played", url: "https://api.spotify.com/v1/me/player/recently-played?limit=1", scope: "user-read-recently-played" }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(endpoint.url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        results[endpoint.scope] = true;
      } catch (error) {
        results[endpoint.scope] = false;
      }
    }
    
    res.json({
      token_status: "Valid for checked endpoints",
      scope_results: results
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});