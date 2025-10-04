const mongoose = require("mongoose");
const User = mongoose.model("User");

// Get user's referral link and stats
const getReferralInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("referralCode referralsCount name");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Generate the referral link
        const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?ref=${user.referralCode}`;

        const responseData = {
            referralCode: user.referralCode,
            referralLink: referralLink,
            referralsCount: user.referralsCount,
            userName: user.name
        };

        res.json(responseData);
    } catch (error) {
        console.error("Get referral info error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Validate referral code (for signup flow)
const validateReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.params;

        if (!referralCode) {
            return res.status(400).json({ error: "Referral code is required" });
        }

        const referrer = await User.findOne({ referralCode }).select("name referralCode");

        if (!referrer) {
            return res.status(404).json({ error: "Invalid referral code" });
        }

        res.json({
            valid: true,
            referrerName: referrer.name,
            referralCode: referrer.referralCode
        });
    } catch (error) {
        console.error("Validate referral code error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Increment referral count (called when someone signs up with a referral code)
const incrementReferralCount = async (referralCode) => {
    try {
        await User.findOneAndUpdate(
            { referralCode },
            { $inc: { referralsCount: 1 } }
        );
    } catch (error) {
        console.error("Increment referral count error:", error);
    }
};

// Get referral leaderboard (optional feature)
const getReferralLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find({ referralsCount: { $gt: 0 } })
            .select("name referralsCount referralCode")
            .sort({ referralsCount: -1 })
            .limit(10);

        res.json({
            leaderboard: leaderboard.map(user => ({
                name: user.name,
                referralsCount: user.referralsCount,
                referralCode: user.referralCode
            }))
        });
    } catch (error) {
        console.error("Get referral leaderboard error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getReferralInfo,
    validateReferralCode,
    incrementReferralCount,
    getReferralLeaderboard
};
