const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://0.0.0.0:27017/audiovault", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  spotifyConnected: { type: Boolean, default: false },
  spotifyRefreshToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// JWT Secret
const JWT_SECRET = "your_jwt_secret_key"; // Change this to a secure random string in production

// Spotify credentials (unchanged)
const CLIENT_ID = "60479c2e1ab447ad8209ee337cd74a7f";
const CLIENT_SECRET = "092b86385636484b83e8f0ca9bfdb88b";
const REDIRECT_URI = "http://localhost:4000/callback";

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email or username already exists" 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Create JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        spotifyConnected: user.spotifyConnected
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during registration" 
    });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }
    
    // Create JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        spotifyConnected: user.spotifyConnected,
        spotifyRefreshToken: user.spotifyRefreshToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Access denied. No token provided." 
    });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
};

// Get user profile
app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching profile" 
    });
  }
});

app.get("/api/spotify-auth", verifyToken, (req, res) => {
  const userId = req.user.id;
  
  // We'll use state parameter to maintain user context during OAuth flow
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const scope = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read user-read-recently-played";

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  
  res.json({ authUrl });
});

// Consolidated callback route handling
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const stateParam = req.query.state;
  
  if (!code) return res.status(400).send("Authorization code not found");

  let userId = null;
  
  // Extract user info from state if available
  if (stateParam) {
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = stateData.userId;
    } catch (e) {
      console.error("Failed to parse state parameter:", e);
    }
  }

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

    const { access_token, refresh_token } = response.data;
    
    // Link Spotify account to user account if userId is provided
    if (userId) {
      try {
        // Get Spotify user data to verify connection
        const spotifyUser = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        
        // Update user in database
        await User.findByIdAndUpdate(userId, {
          spotifyConnected: true,
          spotifyRefreshToken: refresh_token,
          spotifyId: spotifyUser.data.id
        });
        
        console.log(`Spotify account (${spotifyUser.data.id}) linked to user: ${userId}`);
      } catch (linkError) {
        console.error("Failed to link Spotify account:", linkError);
      }
    }
    
    // Redirect back to frontend with tokens
    res.redirect(`http://localhost:3000/auth-callback?access_token=${access_token}&refresh_token=${refresh_token}&userId=${userId || ''}`);
  } catch (error) {
    console.error("Error exchanging code:", error.response?.data || error.message);
    res.status(500).send("Failed to authenticate with Spotify. Error: " + (error.response?.data?.error_description || error.message));
  }
});

// Connect Spotify account to user
app.post("/api/connect-spotify", verifyToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Update user record
    await User.findByIdAndUpdate(req.user.id, {
      spotifyConnected: true,
      spotifyRefreshToken: refreshToken
    });
    
    res.json({
      success: true,
      message: "Spotify account connected successfully"
    });
  } catch (error) {
    console.error("Spotify connection error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to connect Spotify account" 
    });
  }
});

// Modified callback route to handle user account linking
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state; // We'll pass user ID as state parameter
  
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
    
    // If userId is provided, link to user account
    if (userId && userId !== "undefined") {
      try {
        await User.findByIdAndUpdate(userId, {
          spotifyConnected: true,
          spotifyRefreshToken: refresh_token
        });
        console.log("Spotify account linked to user:", userId);
      } catch (linkError) {
        console.error("Failed to link Spotify account:", linkError);
      }
    }
    
    res.redirect(`http://localhost:3000?access_token=${access_token}&refresh_token=${refresh_token}&userId=${userId}`);
  } catch (error) {
    console.error("Error exchanging code:", error.response?.data || error.message);
    res.status(500).send("Failed to authenticate. Error: " + (error.response?.data?.error_description || error.message));
  }
});

// Modified login route to include user ID
app.get("/login", (req, res) => {
  const userId = req.query.userId || "undefined";
  
  const scope = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read user-read-recently-played";

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${userId}`;
  
  res.redirect(authUrl);
});

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