const { Router } = require("express");
const User = require('../models/user');
const authenticate = require('../middlewares/authenticate');  // Add this line at the top of user.js

const { createTokenForUser, validateToken } = require('../services/authentication');  // Import the functions from services/authentication.js
const router = Router();
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser'); // Import cookie-parser

// Middleware to parse cookies
router.use(cookieParser());

// Middleware to check if the user is authenticated
const checkAuthenticated = (req, res, next) => {
    const token = req.cookies.authToken;  // Get token from cookies

    if (token) {
        try {
            const decodedUser = validateToken(token);  // Verify the token using the helper function
            req.user = decodedUser;  // Attach user to request if token is valid
            return next();  // Continue to the next middleware or route handler
        } catch (error) {
            console.error("Token verification failed:", error);
        }
    }
    req.user = null;  // If there's no token or it's invalid, set user to null
    next();
};

// Apply the middleware globally to all routes that need the user info
router.use(checkAuthenticated);

// Route to render SignIn page
router.get('/signin', (req, res) => {
    return res.render("signin", { user: req.user });
});

// Route to render SignUp page
router.get('/signup', (req, res) => {
    return res.render("signup", { user: req.user });
});

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
                user: req.user
            });
        }

        // Compare password using the instance method
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log("Invalid password for user:", email);
            return res.render('signin', {
                errorMessage: 'Invalid email or password',  // Pass error message to the view
                user: req.user
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

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('authToken');  // Clear the authToken cookie
    res.redirect('/');  // Redirect to the homepage
});
// Set up multer storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images');  // Store the file in public/images
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
    }
  });
  
  const upload = multer({ storage: storage });
  
  // Route to update profile image
  router.post('/update-profile-image', upload.single('profileImage'), async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No image uploaded');
    }
  
    try {
      const user = await User.findByIdAndUpdate(req.user._id, {
        profileImageURL: '/images/' + req.file.filename,  // Store the relative path in DB
      }, { new: true });
  
      // Redirect to profile page after update
      res.redirect('/user/profile');
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).send('Server error');
    }
  });
// In your user routes
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('profile', { user }); // Render profile page
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching profile.");
  }
});


module.exports = router;
