import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../../assets/img/logo1-bg.png';
import bgimage from '../../assets/img/bgimage.png';

const LoginPage = () => {
  // Define state variables for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // Validate form fields
  const validate = () => {
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/user/loginUser',
          { email, password }
        );
        // Set token in local storage

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id); 
        localStorage.setItem('role',response.data.user.role)
        
        // console.log(response.data.token);

        // Show success message
        toast.success('Login successful');

        // Redirect to homepage
        navigate('/');
      } catch (error) {
        console.error(error.response.data.msg);
        toast.error(error.response.data.msg);
      }
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-1 w-full min-h-screen">
      <div className="flex-1 flex justify-center items-center p-5 overflow-y-auto">
        <div className="flex justify-center items-center w-full">
          <img src={bgimage} alt="background-image" className='mr-10 hidden md:block' />
          <div className="w-full max-w-md text-center bg-white p-10 rounded-lg shadow-lg">
            <div className="w-24 mb-5 mx-auto">
              <img src={logo} alt="Logo" />
            </div>
            <h2 className="mt-5 text-2xl text-gray-800">Welcome back</h2>
            <p className="my-2 text-gray-600">Log in to your account</p>
            <form id="account" method="post" onSubmit={handleSubmit} className="flex flex-col items-center w-full">
              <ToastContainer />
              <label htmlFor="email" className="self-start my-1 text-sm text-gray-800">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
                autoComplete="username"
                placeholder="example.email@gmail.com"
              />
              {errors.email && (
                <div className="text-red-500 text-sm">{errors.email}</div>
              )}
              <label htmlFor="password" className="self-start my-1 text-sm text-gray-800">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
                autoComplete="current-password"
                placeholder="Enter at least 8+ characters"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-8 cursor-pointer" onClick={togglePasswordVisibility}>
                {showPassword ? (
                  <FaEyeSlash className="text-gray-500" />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </div>
              {errors.password && (
                <div className="text-red-500 text-sm">{errors.password}</div>
              )}
              <div className="w-full flex justify-between items-center mb-3 text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2"
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="text-blue-600 underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                className="w-full p-3 my-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-800"
              >
                Log in
              </button>
            </form>
            <section className="w-full text-center">
              <hr className="my-5" />
              <div>
                <p>
                  <button
                    type="button"
                    className="flex items-center justify-center w-full p-3 mt-3 border border-gray-300 bg-white text-gray-800 rounded-lg shadow hover:bg-gray-100"
                  >
                    {/* <img src={googleLogo} alt="Google logo" className="w-5 h-5 mr-2" /> */}
                    Sign in with Google
                  </button>
                </p>
              </div>
            </section>
            <div className="mt-3 text-sm">
              <p>Don't have an account? <Link to="/signup" className="text-blue-600 underline">Sign up</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
