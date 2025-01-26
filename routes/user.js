const { Router } = require("express");
const User = require('../models/user');
const { createTokenForUser, validateToken } = require('../services/authentication');  // Import the functions from services/authentication.js
const router = Router();
const cookieParser = require('cookie-parser'); // Import cookie-parser

// Middleware to parse cookies
router.use(cookieParser());

router.get('/signin', (req, res) => {
    return res.render("signin");
});

router.get('/signup', (req, res) => {
    return res.render("signup");
});

// Signin route
// Signin route
// Signin route
// Signin route
// Signin route
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    console.log("Signin request received:", { email, password });

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found for email:", email);
            return res.render('signin', {
                errorMessage: 'Invalid email or password',  // Pass error message to the view
            });
        }

        // Compare password using the instance method
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log("Invalid password for user:", email);
            return res.render('signin', {
                errorMessage: 'Invalid email or password',  // Pass error message to the view
            });
        }

        // Create JWT token for the user
        const token = createTokenForUser(user);

        // Store the JWT token in an HTTP-only cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Use HTTPS in production
            maxAge: 3600000,  // Cookie expires after 1 hour
            sameSite: 'strict',
        });

        // Redirect to home page after successful login
        return res.redirect("/");

    } catch (error) {
        console.error("Error during signin:", error);
        return res.status(500).send('Something went wrong, please try again');
    }
});




// Signup route
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    console.log("Signup request received:", { fullName, email, password });

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User with this email already exists:", email);
            return res.status(400).send('Email already in use');
        }

        // Create new user
        const newUser = await User.create({
            fullName,
            email,
            password,
        });

        console.log("New user created:", newUser);

        // Create JWT token for the newly registered user
        const token = createTokenForUser(newUser);

        // Store the JWT token in an HTTP-only cookie
        res.cookie('authToken', token, {
            httpOnly: true,  // Prevents client-side JS from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Set to true for HTTPS in production
            maxAge: 3600000, // Cookie expires after 1 hour
            sameSite: 'strict' // Prevents CSRF attacks
        });

        // Redirect to the homepage
        return res.redirect("/");

    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(400).send('Error creating user');
    }
});


module.exports = router;
