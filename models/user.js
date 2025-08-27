const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // Step 1: Basic Info
        username: {
            type: String,
            required: true,
            unique: true, // email will be unique
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            require: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        // Step 2: Address
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            zip: { type: String, required: true },
        },

        // Step 3: Demographics
        ageRange: {
            type: String,
            required: true,
        },
        maritalStatus: {
            type: String,
            required: true,
        },
        stylePreference: {
            type: String,
            required: true,
        },
        genderIdentity: {
            type: String,
            required: true,
        },
        familySize: {
            type: String,
            required: true,
        },

        // Step 4: Product Preferences
        productPreferences: {
            type: [String],
            required: true,
        },
        tryFrequency: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
