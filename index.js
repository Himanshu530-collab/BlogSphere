const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); // Import cookie-parser
const { validateToken } = require("./services/authentication"); // Import validateToken from authentication.js

const app = express();
const port = 3000;

// Middleware setup
app.use(cookieParser()); // Enable cookie parsing globally

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/blogify")
    .then(e => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB connection failed:", err));

const userRoute = require('./routes/user');
const blogRoute = require("./routes/blog");  // Ensure the blog route is required

// Set up the view engine to use EJS
app.set("view engine", "ejs");

// Set the directory for views
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));  // Middleware for parsing URL-encoded form data
app.use(express.json());  // Middleware for parsing JSON bodies

// Home route
app.get("/", (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.render("home", { user: null });  // No user, render home without user data
    }

    try {
        const decoded = validateToken(token); // Validate token and decode it
        if (!decoded) {
            return res.redirect("/user/signin");  // Redirect to signin if token is invalid
        }
        return res.render("home", { user: decoded }); // Pass the user data to home.ejs
    } catch (error) {
        console.error("Invalid token:", error);
        return res.redirect("/user/signin");  // Redirect to signin if token is invalid
    }
});

// User routes
app.use('/user', userRoute);

// Blog routes
app.use("/blog", blogRoute);  // This will handle /blog/add-new and other blog-related routes

// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
