const { Router } = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const Blog = require("../models/blog");
const User = require("../models/user");
const authenticate = require("../middlewares/authenticate");

const router = Router();

/*
|--------------------------------------------------------------------------
| Cloudinary Storage
|--------------------------------------------------------------------------
*/

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "Blogging-App/blog-images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `blog-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    })
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB
    },
    fileFilter: (req, file, cb) => {

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"
        ];

        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }

        cb(null, true);
    }
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id)
      .populate('createdBy', 'email profileImageURL')
      .populate({
        path: 'comments',
        populate: { path: 'createdBy', select: 'email' }
      });

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Sanitize comments (ensure they always have a 'createdBy')
    const comments = blog.comments.map(comment => ({
      ...comment.toObject(),
      createdBy: comment.createdBy || { email: 'Unknown user' },
    }));

    // Ensure 'user' is passed from req.user (which will be null if not logged in)
    return res.render("singleBlog", {
      blog,
      comments,
      isSingleBlogPage: true,
      user: req.user || null, // Pass the user data or null if not logged in
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
// Add a new blog (POST route)
router.post("/add-new", authenticate, (req, res) => {

    upload.single("coverImage")(req, res, async (err) => {

        // Handle Multer Errors
        if (err instanceof multer.MulterError) {

            if (err.code === "LIMIT_FILE_SIZE") {
                return res.render("addBlog", {
                    user: req.user,
                    errorMessage: "Image must be less than 2 MB.",
                    title: req.body.title,
                    body: req.body.body,
                });
            }

        } else if (err) {

            return res.render("addBlog", {
                user: req.user,
                errorMessage: err.message,
                title: req.body.title,
                body: req.body.body,
            });

        }

        const { title, body } = req.body;

        // Validate required fields
        if (!title || !body) {

            return res.render("addBlog", {
                user: req.user,
                errorMessage: "Title and Body are required.",
                title,
                body,
            });

        }

        // Ensure user is authenticated
        if (!req.user) {
            return res.status(401).send("User not authenticated");
        }

        try {

            const blog = await Blog.create({
                title,
                body,
                coverImageURL: req.file ? req.file.path : "",
                coverImagePublicId: req.file ? req.file.filename : "",
                createdBy: req.user._id,
            });

            return res.redirect(`/blog/${blog._id}`);

        } catch (error) {

            console.error("Error creating blog:", error);
            return res.status(500).send("Error creating blog.");

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
// Handle Edit Blog
router.post("/edit/:id", authenticate, (req, res) => {

    upload.single("coverImage")(req, res, async (err) => {

        if (err instanceof multer.MulterError) {

            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).send("Image must be less than 2 MB.");
            }

        } else if (err) {

            return res.status(500).send(err.message);

        }

        const { id } = req.params;
        const { title, body } = req.body;

        try {

            const blog = await Blog.findById(id);

            if (!blog) {
                return res.status(404).send("Blog not found");
            }

            if (blog.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).send("Unauthorized");
            }

            blog.title = title;
            blog.body = body;

            // Upload new image if selected
            if (req.file) {

                // Delete old Cloudinary image
                if (blog.coverImagePublicId) {

                    try {

                        await cloudinary.uploader.destroy(blog.coverImagePublicId);

                    } catch (deleteError) {

                        console.error("Error deleting old Cloudinary image:", deleteError);

                    }

                }

                // Save new image information
                blog.coverImageURL = req.file.path;
                blog.coverImagePublicId = req.file.filename;

            }

            await blog.save();

            return res.redirect(`/blog/${blog._id}`);

        } catch (error) {

            console.error("Error updating blog:", error);

            return res.status(500).send("Error updating blog.");

        }

    });

});

// Delete Blog (POST route)
router.post("/delete/:id", authenticate, async (req, res) => {

    const { id } = req.params;

    try {

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).send("Blog not found");
        }

        if (blog.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send("Unauthorized");
        }

        // Delete image from Cloudinary
        if (blog.coverImagePublicId) {

            try {

                await cloudinary.uploader.destroy(blog.coverImagePublicId);

            } catch (deleteError) {

                console.error("Error deleting Cloudinary image:", deleteError);

            }

        }

        // Delete blog from MongoDB
        await Blog.findByIdAndDelete(id);

        return res.redirect("/");

    } catch (error) {

        console.error("Error deleting blog:", error);

        return res.status(500).send("Error deleting blog.");

    }

});
module.exports = router;
/*router.post("/add-new", authenticate, (req, res) => {
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
          .resize(800)
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
});*/
