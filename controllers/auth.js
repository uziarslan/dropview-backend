const mongoose = require("mongoose");
const User = mongoose.model("User");
const jwt = require("jsonwebtoken");

const jwt_secret = process.env.JWT_SECRET;

const generateToken = (id) => {
    return jwt.sign({ id }, jwt_secret, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
    try {
        // Extract all required fields from request body
        const {
            username,
            password,
            name,
            phone,
            street,
            city,
            zip,
            ageRange,
            maritalStatus,
            stylePreference,
            genderIdentity,
            familySize,
            occupation,
            purchasePriorities,
            productPreferences,
            tryFrequency
        } = req.body;

        // Check if user already exists
        const foundUser = await User.findOne({ username });
        if (foundUser) {
            return res.status(400).json({ error: "Email already in use. Try a different one." });
        }

        // Validate required fields
        const requiredFields = {
            username: "Email is required",
            password: "Password is required",
            name: "Full name is required",
            phone: "Phone number is required",
            street: "Street address is required",
            city: "City is required",
            zip: "ZIP code is required",
            ageRange: "Age range is required",
            maritalStatus: "Marital status is required",
            stylePreference: "Style preference is required",
            genderIdentity: "Gender identity is required",
            familySize: "Family size is required",
            occupation: "Occupation is required",
            purchasePriorities: "Purchase priorities is required",
            productPreferences: "Product preferences are required",
            tryFrequency: "Try frequency is required"
        };

        // Check for missing required fields
        for (const [field, message] of Object.entries(requiredFields)) {
            if (!req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0)) {
                return res.status(400).json({ error: message });
            }
        }

        // Validate productPreferences is an array with at least one item
        if (!Array.isArray(productPreferences) || productPreferences.length === 0) {
            return res.status(400).json({ error: "At least one product preference must be selected" });
        }

        // Create address object
        const address = {
            street,
            city,
            zip
        };

        // Create user with all fields
        const user = await User.create({
            username,
            password,
            name,
            phone,
            address,
            ageRange,
            maritalStatus,
            stylePreference,
            genderIdentity,
            familySize,
            occupation,
            purchasePriorities,
            productPreferences,
            tryFrequency
        });

        res.status(201).json({
            token: generateToken(user._id),
            success: "Account has been registered successfully",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: "Validation failed",
                details: errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                error: `${field} already exists`
            });
        }

        res.status(500).json({
            error: "Internal server error during registration"
        });
    }
};

const userLogin = async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    if (await user.matchPassword(password)) {
        return res.status(201).json({ token: generateToken(user._id) });
    }
    return res.status(400).json({ error: "Invalid email or password" });
};

const getUser = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(400).json({ error: "Invalid user" });
    }
    res.json(user);
};


module.exports = {
    registerUser,
    userLogin,
    getUser,
};