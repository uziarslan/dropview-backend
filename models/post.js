const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["question", "experience"], required: true },
        title: { type: String, trim: true },
        content: { type: String, required: true, trim: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        commentsCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);


