const express = require("express");
const router = express.Router();
const { getReferralInfo, validateReferralCode, getReferralLeaderboard } = require("../controllers/referral");
const { protect } = require("../middlewares/authMiddleware");

// Get user's referral information (protected route)
router.get("/info", protect, getReferralInfo);

// Validate referral code (public route for signup)
router.get("/validate/:referralCode", validateReferralCode);

// Get referral leaderboard (protected route)
router.get("/leaderboard", protect, getReferralLeaderboard);

module.exports = router;
