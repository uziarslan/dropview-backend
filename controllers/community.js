const mongoose = require("mongoose");
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = mongoose.model("User");
const { cloudinary } = require("../cloudinary");

// Posts
exports.createPost = async (req, res, next) => {
    try {
        const { type, title, content } = req.body;
        if (!type || !content) {
            return res.status(400).json({ error: "type and content are required" });
        }

        // Prepare post data
        const postData = {
            author: req.user._id,
            type,
            title: title || undefined,
            content,
        };

        // Add image data if uploaded
        if (req.file) {
            postData.image = {
                filename: req.file.originalname,
                path: req.file.path,
                public_id: req.file.public_id
            };
        }

        const post = await Post.create(postData);

        // Increment community actions count for posts only (not comments)
        await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { communityActionsCount: 1 } }
        );

        res.status(201).json(post);
    } catch (err) {
        next(err);
    }
};

exports.listPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
        const skip = (pageNumber - 1) * limitNumber;

        const [items, total] = await Promise.all([
            Post.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .populate("author", "username name")
                .lean(),
            Post.countDocuments({}),
        ]);

        res.json({ items, total, page: pageNumber, limit: limitNumber });
    } catch (err) {
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Check if user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to edit this post" });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;

        // Handle image update
        if (req.file) {
            updateData.image = {
                filename: req.file.originalname,
                path: req.file.path,
                public_id: req.file.public_id
            };
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("author", "username name");

        res.json(updatedPost);
    } catch (err) {
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Check if user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }

        // Delete image from Cloudinary if it exists
        if (post.image && post.image.filename) {
            try {
                const filename = post.image.filename;
                const publicId = `DropView/${filename.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryErr) {
                // Continue with post deletion even if image deletion fails
            }
        }

        // Delete all comments for this post
        await Comment.deleteMany({ post: id });

        // Delete the post
        await Post.findByIdAndDelete(id);

        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        next(err);
    }
};

exports.togglePostLike = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const userId = req.user._id;
        const hasLiked = post.likes.some((u) => u.toString() === userId.toString());

        if (hasLiked) {
            post.likes = post.likes.filter((u) => u.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json({ likes: post.likes.length, liked: !hasLiked });
    } catch (err) {
        next(err);
    }
};

exports.deletePostImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Check if user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to edit this post" });
        }

        if (!post.image || !post.image.filename) {
            return res.status(400).json({ error: "No image to delete" });
        }

        // Use the filename as public_id to delete from Cloudinary
        const filename = post.image.filename;
        const publicId = `DropView/${filename.split('.')[0]}`; // Include folder path and remove extension

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryErr) {
            // Continue with database update even if Cloudinary deletion fails
        }

        // Update database to remove image
        post.image = undefined;
        await post.save();

        res.json({ message: "Image deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Comments
exports.createComment = async (req, res, next) => {
    try {
        const { id } = req.params; // post id
        const { content, parentComment } = req.body;
        if (!content) return res.status(400).json({ error: "content is required" });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent) return res.status(400).json({ error: "parentComment invalid" });
        }

        const comment = await Comment.create({
            post: id,
            author: req.user._id,
            content,
            parentComment: parentComment || null,
        });

        // Increment cached count
        await Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

        // Populate author field before returning
        const populatedComment = await Comment.findById(comment._id)
            .populate("author", "username name")
            .lean();

        res.status(201).json(populatedComment);
    } catch (err) {
        next(err);
    }
};

exports.listComments = async (req, res, next) => {
    try {
        const { id } = req.params; // post id
        const { page = 1, limit = 20 } = req.query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const [items, total] = await Promise.all([
            Comment.find({ post: id })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limitNumber)
                .populate("author", "username name")
                .lean(),
            Comment.countDocuments({ post: id }),
        ]);

        res.json({ items, total, page: pageNumber, limit: limitNumber });
    } catch (err) {
        next(err);
    }
};

exports.updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        // Check if user is the author
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to edit this comment" });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { content },
            { new: true }
        ).populate("author", "username name");

        res.json(updatedComment);
    } catch (err) {
        next(err);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        // Check if user is the author
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);

        // Decrement cached count
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

        res.json({ message: "Comment deleted successfully" });
    } catch (err) {
        next(err);
    }
};

exports.toggleCommentLike = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        const userId = req.user._id;
        const hasLiked = comment.likes.some((u) => u.toString() === userId.toString());

        if (hasLiked) {
            comment.likes = comment.likes.filter((u) => u.toString() !== userId.toString());
        } else {
            comment.likes.push(userId);
        }
        await comment.save();
        res.json({ likes: comment.likes.length, liked: !hasLiked });
    } catch (err) {
        next(err);
    }
};


