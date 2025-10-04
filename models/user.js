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
        occupation: {
            type: String,
            required: true,
        },
        purchasePriorities: {
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
        },

        // Referral System
        referralCode: {
            type: String,
            unique: true,
            sparse: true // allows null values but ensures uniqueness when present
        },
        referralsCount: {
            type: Number,
            default: 0
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    // Hash password if modified
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Generate referral code if new user and no code exists
    if (this.isNew && !this.referralCode) {
        let referralCode;
        let isUnique = false;

        while (!isUnique) {
            // Generate a random 8-character code
            referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // Check if this code already exists
            const existingUser = await this.constructor.findOne({ referralCode });
            if (!existingUser) {
                isUnique = true;
            }
        }

        this.referralCode = referralCode;
    }

    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
