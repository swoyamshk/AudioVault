const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const UserProfile = require("../models/userProfileModel");
dotenv.config();

// User registration
const createUser = async (req, res) => {
  const { email, password, firstName, lastName} = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Create profile for the new user
    const newProfile = new UserProfile({ user: user._id });
    await newProfile.save();

    // do this if you want to redirect to dashboard after registration
    // const payload = {
    //   user: {
    //     id: user.id,
    //   },
    // };

    // console.log(payload);

    // jwt.sign(
    //   payload,
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1h" },
    //   (err, token) => {
    //     if (err) throw err;
    //     res.json({ token});
    //   }
    // );

    res.status(201).json({
      msg: "User registered successfully",
      user: user,
      userProfile: newProfile,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ msg: err.message });
  }
};

// User login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "10d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          msg: "user logged in successfully",
          token: `Bearer ${token}`,
          user: user,
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.find();
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
const getProfileImage = async (req, res) => {
  try {
    console.log('User ID from token:', req.user.id);

    // Find the user by ID and select only the imageUrl field
    const user = await User.findById(req.user.id).select('imageUrl');

    // Log the found user for debugging purposes
    console.log('User found:', user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send back the imageUrl
    res.json({ imageUrl: user.imageUrl });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({ error: 'Failed to fetch profile image' });
  }
};


// Get a single user by ID
const getUserbyId = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const updateUser = async (req, res) => {
  const { firstName, lastName, bio, phone } = req.body;
  const imageUrl = req.file ? `http://localhost:4000/uploads/profile/${req.file.filename}` : null; // Construct the image URL if a file is uploaded

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update user fields with provided values, or keep existing values if not provided
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.imageUrl = imageUrl || user.imageUrl;

    await user.save();

    res.json({ msg: "User updated successfully", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
const getTotalUsers = async (req, res) => {
  try {
    // Count the number of users in the database
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await UserProfile.findOneAndDelete({ user: req.params.id });

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  createUser,
  loginUser,
  deleteUser,
  updateUser,
  getUserbyId,
  getUser,
  getUserProfile,
  getProfileImage,
  getTotalUsers

};
