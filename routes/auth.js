const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const { protect } = require("../middlewares/authMiddleware");
const {
    registerUser,
    userLogin,
    getUser,
    updateProfile,
} = require("../controllers/auth");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const router = express();

// Handling and saving the user credentials
router.post("/user/signup", wrapAsync(registerUser));

// Fetching and verify user request
router.post("/user/login", wrapAsync(userLogin));

// Fetching User for frontend
router.get("/user", protect, wrapAsync(getUser));

// Update user profile
router.put("/user/profile", protect, wrapAsync(updateProfile));

module.exports = router;