const express = require('express');
const auth = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');

const {
    createUser,
    loginUser,
    getUserbyId,
    updateUser,
    deleteUser,
    getUser,
    getUserProfile,
    getProfileImage,
    getTotalUsers
  } = require('../controllers/userController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile'); // Specify the destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  },
});
const upload = multer({ storage });

router.post('/createUser', createUser);
router.post('/loginUser', loginUser);
router.get('/me', auth, getUserProfile);

router.get('/getUser/', getUser);

router.get('/getProfileImage', getProfileImage);

// GET /api/users/:id - Get a user by ID
router.get('/getUser/:id', getUserbyId);

router.get('/totalusers', getTotalUsers);
// PUT /api/users/:id - Update a user by ID
router.put('/updateUser/:id', upload.single('image'), updateUser);

// DELETE /api/users/:id - Delete a user by ID
router.delete('/deleteUser/:id', deleteUser);


module.exports = router;

//model, controller, route