require('dotenv').config();  // Add this at the top of your file to load the .env variables

const express = require("express");
const path = require("path");
const Blog = require("./models/blog");
  // Add this line to import the Blog model
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); // Import cookie-parser
const { validateToken } = require("./services/authentication"); // Import validateToken from authentication.js

const app = express();
const sharp = require("sharp");

const port = process.env.PORT 

// Middleware setup
app.use(cookieParser()); // Enable cookie parsing globally

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(e => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB connection failed:", err));

const userRoute = require('./routes/user');
const commentRoute = require('./routes/comment'); // Add this line for comments

const blogRoute = require("./routes/blog");  // Ensure the blog route is required

// Set up the view engine to use EJS
app.set("view engine", "ejs");

// Set the directory for views
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));  // Middleware for parsing URL-encoded form data
app.use(express.json());  // Middleware for parsing JSON bodies

// Home route
app.get("/", async (req, res) => {
    const token = req.cookies.authToken;  // Check for token in cookies

    try {
        // If a token is present, validate it
        if (token) {
            const decoded = validateToken(token);  // Validate and decode the token
            if (!decoded) {
                // If token is invalid, clear it and proceed to render the homepage without user info
                res.clearCookie('authToken');
                const blogs = await Blog.find().sort({ createdAt: -1 });  // Fetch blogs
                return res.render("home", { user: null, blogs });  // Render home with no user data
            }

            // Token is valid, pass user data and blogs to home page
            const blogs = await Blog.find().sort({ createdAt: -1 });  // Fetch and sort blogs
            return res.render("home", { user: decoded, blogs });  // Render home with user data and blogs
        } else {
            // No token means the user is unauthenticated, render blogs without user data
            const blogs = await Blog.find().sort({ createdAt: -1 });
            return res.render("home", { user: null, blogs });  // Render home without user data
        }
    } catch (error) {
        console.error("Error during token validation:", error);
        // In case of an error, render the home page with no user data and no blogs
        const blogs = await Blog.find().sort({ createdAt: -1 });
        return res.render("home", { user: null, blogs });
    }
});


app.use(express.static(path.join(__dirname, 'public')));

// User routes
app.use('/user', userRoute);
app.use('/comments', commentRoute);  // Add this line for comments route


// Blog routes
app.use("/blog", blogRoute);  // This will handle /blog/add-new and other blog-related routes

// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
