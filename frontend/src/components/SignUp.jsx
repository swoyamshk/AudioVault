import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../../assets/img/logo1-bg.png';
import bgimage from '../../assets/img/bgimage.png';

const RegisterPage = () => {
  // Define state variables for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName') setFirstName(value);
    if (name === 'lastName') setLastName(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
  };

  // Validate form fields
  const validate = () => {
    const errors = {};
    if (!firstName) errors.firstName = 'First Name is required';
    if (!lastName) errors.lastName = 'Last Name is required';
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (password !== confirmPassword)
      errors.confirmPassword = 'Passwords must match';
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
          'http://localhost:5000/api/user/createUser',
          {
            firstName,
            lastName,
            email,
            password,
          }
        );
        console.log(response);
        toast.success('Registration successful');

        // Navigate to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        if (error.response) {
          console.error(error.response.data.msg);
          toast.error(error.response.data.msg);
        } else {
          console.error('Error:', error.message);
          toast.error('An error occurred. Please try again.');
        }
      }
    }
  };

  return (
    <div className="flex flex-1 w-full min-h-screen">
      <div className="flex-1 flex justify-center items-center overflow-y-auto">
        <img src={bgimage} alt="background-image" className="mr-10 hidden md:block" />
        <div className="w-full max-w-md text-center bg-white p-5 md:p-10 rounded-lg shadow-lg">
          <div className="w-24 mb-5 mx-auto">
            <img src={logo} alt="Logo" />
          </div>
          <h2 className="mt-5 text-2xl text-gray-800">Welcome</h2>
          <p className="my-2 text-gray-600">Create A New Account</p>
          <form id="registerForm" method="post" onSubmit={handleSubmit} className="flex flex-col items-center w-full">
            <ToastContainer />
            <div className="flex flex-col md:flex-row w-full space-y-3 md:space-y-0 md:space-x-3">
              <div className="w-full md:w-1/2">
                <label htmlFor="firstName" className="self-start my-1 text-sm text-gray-800">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={firstName}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
                  placeholder="John"
                />
                {errors.firstName && <div className="text-red-500 text-sm">{errors.firstName}</div>}
              </div>
              <div className="w-full md:w-1/2">
                <label htmlFor="lastName" className="self-start my-1 text-sm text-gray-800">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
                  placeholder="Doe"
                />
                {errors.lastName && <div className="text-red-500 text-sm">{errors.lastName}</div>}
              </div>
            </div>
            <label htmlFor="email" className="self-start my-1 text-sm text-gray-800">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
              placeholder="example.email@gmail.com"
            />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            <label htmlFor="password" className="self-start my-1 text-sm text-gray-800">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
              placeholder="At least 8+ characters"
            />
            {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
            <label htmlFor="confirmPassword" className="self-start my-1 text-sm text-gray-800">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg"
              placeholder="Confirm Password"
            />
            {errors.confirmPassword && <div className="text-red-500 text-sm">{errors.confirmPassword}</div>}
            <button type="submit" className="w-full p-3 my-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-800">Sign-up</button>
          </form>
          <div className="mt-3 text-sm">
            <p>Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link></p>
          </div>
          <hr className="my-5" />
          <div className="mt-3">
            <button id="google-signin-button" className="flex items-center justify-center w-full p-3 mt-3 border border-gray-300 bg-white text-gray-800 rounded-lg shadow hover:bg-gray-100">
              {/* <img src={googleLogo} alt="Google logo" className="w-5 h-5 mr-2" /> */}
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
