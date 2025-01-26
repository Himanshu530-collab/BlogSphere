const User = require('../models/user');  // Ensure this line is at the top of your blog.js

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
// View a single blog (GET route)
router.get("/blog/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await Blog.findById(id).populate('createdBy', 'email');
        if (!blog) {
            return res.status(404).send("Blog not found");
        }
        return res.render("singleBlog", { blog });
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).send("Error fetching blog");
    }
});



// Fetch all blogs and display on the home page (GET route)
router.get("/", async (req, res) => {
    try {
        // Fetch all blogs
        const blogs = await Blog.find().populate('createdBy', 'email profileImageURL'); // Fetch blogs and populate the 'createdBy' field

        return res.render('home', {
            blogs,  // Pass the fetched blogs to the view
            user: req.user  // Pass user data
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send("Error fetching blogs");
    }
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
        res.redirect("/blog");  // Redirect to the home route to view all blogs after adding the new one

    } catch (error) {
        console.error("Error adding new blog:", error);
        res.status(500).send("Error adding new blog");
    }
});

module.exports = router;
