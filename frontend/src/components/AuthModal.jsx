import React, { useState } from 'react';
import axios from 'axios';

const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    login: { username: '', password: '' },
    register: { username: '', email: '', password: '', confirmPassword: '' }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e, form) => {
    setFormData({
      ...formData,
      [form]: {
        ...formData[form],
        [e.target.name]: e.target.value
      }
    });
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!formData.login.username.trim()) newErrors.username = 'Username is required';
    if (!formData.login.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    if (!formData.register.username.trim()) newErrors.username = 'Username is required';
    if (!formData.register.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.register.email)) newErrors.email = 'Email is invalid';
    if (!formData.register.password) newErrors.password = 'Password is required';
    if (formData.register.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.register.password !== formData.register.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const formErrors = validateLoginForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/api/login', {
        username: formData.login.username,
        password: formData.login.password
      });
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          spotifyConnected: response.data.user.spotifyConnected
        }));
        
        // If user has Spotify connected, retrieve refresh token
        if (response.data.user.spotifyConnected && response.data.user.spotifyRefreshToken) {
          localStorage.setItem('refresh_token', response.data.user.spotifyRefreshToken);
        }
        
        onAuth(response.data.user);
        onClose();
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const formErrors = validateRegisterForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/api/register', {
        username: formData.register.username,
        email: formData.register.email,
        password: formData.register.password
      });
  
      if (response.data.success) {
        // Instead of storing the token, switch to login tab
        setActiveTab("login");
        setErrors({ form: "Registration successful! Please log in." });
  
        // Optionally, you can prefill the login fields
        setFormData((prev) => ({
          ...prev,
          login: {
            username: formData.register.username,
            password: "" // Keep password empty for security
          }
        }));
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleSpotifyAuth = async () => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const authToken = localStorage.getItem('auth_token');
    
    if (userData.id && authToken) {
      // User is already logged in, use the proper API endpoint with authentication
      try {
        const response = await axios.get('http://localhost:4000/api/spotify-auth', {
          headers: { 
            'Authorization': `Bearer ${authToken}` 
          }
        });
        
        window.location.href = response.data.authUrl;
      } catch (error) {
        console.error('Error initiating Spotify auth:', error);
        setErrors({
          form: 'Failed to connect to Spotify. Please try again.'
        });
      }
    } else {
      // No logged in user, use simplified flow
      window.location.href = 'http://localhost:4000/login';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            {activeTab === 'login' ? 'Login' : 'Register'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'register' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>
        
        {errors.form && (
          <div className="bg-red-800 text-white p-3 rounded mb-4">
            {errors.form}
          </div>
        )}
        
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.login.username}
                onChange={(e) => handleChange(e, 'login')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.username && <p className="text-red-500 mt-1">{errors.username}</p>}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.login.password}
                onChange={(e) => handleChange(e, 'login')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.password && <p className="text-red-500 mt-1">{errors.password}</p>}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.register.username}
                onChange={(e) => handleChange(e, 'register')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.username && <p className="text-red-500 mt-1">{errors.username}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.register.email}
                onChange={(e) => handleChange(e, 'register')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.email && <p className="text-red-500 mt-1">{errors.email}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.register.password}
                onChange={(e) => handleChange(e, 'register')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.password && <p className="text-red-500 mt-1">{errors.password}</p>}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.register.confirmPassword}
                onChange={(e) => handleChange(e, 'register')}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              {errors.confirmPassword && <p className="text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleSpotifyAuth}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0Z" fill="#1DB954"/>
            </svg>
            Continue with Spotify
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;