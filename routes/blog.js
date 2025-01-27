const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require('fs'); // This is needed to delete the original image
const sharp = require("sharp"); // Import sharp for image resizing
const Blog = require('../models/blog');
const User = require('../models/user');
const authenticate = require('../middlewares/authenticate'); // Import authenticate middleware

const router = Router();

// Set up multer for file uploading with a file size limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save the uploaded images in the 'public/images/' directory
    cb(null, path.join(__dirname, '../public/images/'));
  },
  filename: (req, file, cb) => {
    // Use the original file extension, and create a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer configuration with file size limit of 15KB
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 }, // 15KB limit
});

// Show the form to add a new blog (GET route)
router.get("/add-new", authenticate, (req, res) => {
  return res.render('addBlog', {
    user: req.user, // Passing user data to the view
    errorMessage: null, // No error message initially
    title: '', // Ensure the title is empty initially
    body: '', // Ensure the body is empty initially
  });
});

// View a single blog (GET route)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the blog with its comments and populate 'createdBy' field
    const blog = await Blog.findById(id)
      .populate('createdBy', 'email profileImageURL')  // Populate the blog creator
      .populate({
        path: 'comments',  // Populate the comments array
        populate: { path: 'createdBy', select: 'email' }  // Populate the creator for each comment
      });

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Ensure comments have a default createdBy if missing
    const comments = blog.comments.map(comment => ({
      ...comment.toObject(),
      createdBy: comment.createdBy || { email: 'Unknown user' },  // Fallback if createdBy is missing
    }));

    // Pass the blog, sanitized comments, user, and isSingleBlogPage flag to the template
    return res.render("singleBlog", {
      blog,
      comments,  // Pass the sanitized comments
      isSingleBlogPage: true,
      user: req.user  // Pass the logged-in user (if any)
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Error fetching blog");
  }
});


// Fetch all blogs and display on the home page (GET route)
router.get("/", async (req, res) => {
  try {
    // Fetch blogs, sorted by 'createdAt' in descending order (most recent first)
    const blogs = await Blog.find()
                            .populate('createdBy', 'email profileImageURL')
                            .sort({ createdAt: -1 }) // Sort blogs by creation date, newest first
                            .exec(); // Ensure the query is executed


    return res.render('home', {
      blogs,  // Pass the fetched blogs to the view
      user: req.user,  // Pass user data
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Error fetching blogs");
  }
});


// Add a new blog (POST route) with file upload and error handling
router.post("/add-new", authenticate, (req, res) => {
  upload.single('coverImage')(req, res, async (err) => { // Call upload.single explicitly here
    // Handle Multer Errors
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.render('addBlog', {
          user: req.user, 
          errorMessage: "File size must be less than 15KB", // Send error message to the view
          title: req.body.title, // Retain the entered title
          body: req.body.body,   // Retain the entered body
        });
      }
    } else if (err) {
      return res.status(500).send("An unexpected error occurred");
    }

    const { title, body } = req.body;

    // Basic validation to ensure title and body are not empty
    if (!title || !body) {
      return res.render('addBlog', {
        user: req.user, 
        errorMessage: "Title and body are required", // Show a validation error message
        title: req.body.title,
        body: req.body.body,
      });
    }

    let coverImageURL = null;
    if (req.file) {
      try {
        const inputPath = path.join(__dirname, '../public/images/', req.file.filename);
        const outputPath = path.join(__dirname, '../public/images/', 'resized-' + req.file.filename);

        await sharp(inputPath)
          .resize(800, 600)
          .toFile(outputPath);

        fs.unlinkSync(inputPath);

        coverImageURL = `/images/resized-${req.file.filename}`;
      } catch (resizeError) {
        console.error("Error resizing image:", resizeError);
        return res.status(500).send("Error resizing image");
      }
    }

    if (!req.user) {
      return res.status(401).send("User not authenticated");
    }

    try {
      const newBlog = new Blog({
        title,
        body,
        coverImageURL,
        createdBy: req.user._id,
      });

      await newBlog.save();
      res.redirect("/");  // Redirect to the home route to view all blogs after adding the new one
    } catch (error) {
      console.error("Error adding new blog:", error);
      res.status(500).send("Error adding new blog");
    }
  });
});

// Edit Blog (GET route)
// Route to display the edit form
router.get("/edit/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    // Find the blog by ID
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Ensure the logged-in user is the author of the blog
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    // Render the edit page with the blog data
    return res.render("edit", {
      blog,
      user: req.user,  // Passing the user info to the view for conditional rendering if needed
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Error fetching blog");
  }
});

// Handle the update when the user submits the edit form (POST route)
router.post('/edit/:id', authenticate, (req, res) => {
  // File upload middleware
  upload.single('coverImage')(req, res, async (err) => {  
    const { id } = req.params;
    const { title, body } = req.body;
    const coverImage = req.file;  // Get uploaded file (if any)

    try {
      // Find the blog by its ID
      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).send('Blog not found');
      }

      // Ensure the logged-in user is the author of the blog
      if (blog.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).send('Unauthorized');
      }

      // Update the blog's title and body
      blog.title = title;
      blog.body = body;

      // If a new cover image is uploaded, update the image URL
      if (coverImage) {
        blog.coverImageURL = `/images/${coverImage.filename}`;
      }

      // Save the updated blog to the database
      await blog.save();

      // Redirect to the updated blog page (this should show the updated blog)
      res.redirect(`/blog/${blog._id}`);
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).send('Error updating blog');
    }
  });
});


// Delete Blog (POST route)
router.post('/delete/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    // Check if the current user is the creator of the blog
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    // Delete the blog using deleteOne
    await Blog.deleteOne({ _id: id });

    // Redirect to homepage after deletion
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).send('Error deleting blog');
  }
});

module.exports = router;
