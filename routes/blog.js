const { Router } = require("express");
const router = Router();
const Blog = require('../models/blog');
const authenticate = require('../middlewares/authenticate'); // Import authenticate middleware

// Show the form to add a new blog (GET route)
router.get("/add-new", authenticate, (req, res) => {
    return res.render('addBlog', {
        user: req.user, // Passing user data to the view
    });
});

// Add a new blog (POST route)
router.post("/add-new", authenticate, async (req, res) => {
    const { title, body, coverImageURL } = req.body;

    if (!req.user) {
        return res.status(401).send("User not authenticated");
    }

    try {
        const newBlog = new Blog({
            title,
            body,
            coverImageURL,
            createdBy: req.user._id, // Use the user's ID from the decoded token
        });

        await newBlog.save();
        res.redirect("/");  // Redirect after adding the blog

    } catch (error) {
        console.error("Error adding new blog:", error);
        res.status(500).send("Error adding new blog");
    }
});

module.exports = router;
