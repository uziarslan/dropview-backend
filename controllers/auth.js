const mongoose = require("mongoose");
const User = mongoose.model("User");
const jwt = require("jsonwebtoken");

const jwt_secret = process.env.JWT_SECRET;

const generateToken = (id) => {
    return jwt.sign({ id }, jwt_secret, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    const foundUser = await User.findOne({ username });

    if (foundUser) {
        return res.status(400).json({ error: "Email already in use. Try a different one." });
    }

    if (!username) return res.status(400).json({ error: "Email is required." });
    if (!password) return res.status(400).json({ error: "Password is required." });

    const address = {
        street: req.body.street,
        city: req.body.city,
        zip: req.body.zip
    }

    const user = await User.create({ ...req.body, address });

    res.status(201).json({
        token: generateToken(user._id),
        success: "Email has been registered",
    });
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