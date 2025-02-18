const { Router } = require("express");
const Comment = require('../models/comment');
const Blog = require('../models/blog');
const authenticate = require('../middlewares/authenticate');  // Import authenticate middleware

const router = Router();

// Add a comment to a blog (POST route)
router.post('/:blogId/add', authenticate, async (req, res) => {
  const { blogId } = req.params;
  const { text } = req.body;

  try {
    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Create a new comment
    const newComment = new Comment({
      text,
      createdBy: req.user._id,
      blog: blogId,
    });

    // Save the new comment
    await newComment.save();

    // Add the comment's ID to the blog's comments array
    await Blog.findByIdAndUpdate(blogId, {
      $push: { comments: newComment._id }
    });

    // Redirect back to the blog page with updated comments
    res.redirect(`/blog/${blogId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("Error adding comment");
  }
});
// Render the edit comment page (GET route)
router.get('/edit/:commentId', authenticate, async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    // Ensure the user is the creator of the comment
    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    // Render the edit comment form with the existing comment text
    res.render('editComment', { comment });
  } catch (error) {
    console.error("Error rendering edit comment page:", error);
    res.status(500).send('Error rendering edit comment page');
  }
});


// Delete a comment (POST route)
router.post('/delete/:commentId', authenticate, async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    // Only allow the user who created the comment to delete it
    if (comment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    // Delete the comment
    await Comment.deleteOne({ _id: commentId });

    // Redirect back to the blog page
    res.redirect(`/blog/${comment.blog}`);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).send("Error deleting comment");
  }
});

module.exports = router;
