const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const community = require("../controllers/community");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

// Posts
router.get("/posts", protect, community.listPosts);
router.post("/posts", protect, upload.single("image"), community.createPost);
router.put("/posts/:id", protect, upload.single("image"), community.updatePost);
router.delete("/posts/:id", protect, community.deletePost);
router.delete("/posts/:id/image", protect, community.deletePostImage);
router.post("/posts/:id/like", protect, community.togglePostLike);

// Comments
router.get("/posts/:id/comments", protect, community.listComments);
router.post("/posts/:id/comments", protect, community.createComment);
router.put("/comments/:commentId", protect, community.updateComment);
router.delete("/comments/:commentId", protect, community.deleteComment);
router.post("/comments/:commentId/like", protect, community.toggleCommentLike);

module.exports = router;


