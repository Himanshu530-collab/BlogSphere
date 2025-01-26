const { Router } = require("express");
const User = require('../models/user');
const router = Router();

router.get('/signin', (req, res) => {
    return res.render("signin");
});

router.get('/signup', (req, res) => {
    return res.render("signup");
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
            return res.status(400).send('User not found');
        }

        // Compare password using the instance method
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log("Invalid password for user:", email);
            return res.status(400).send('Invalid email or password');
        }

        // Redirect to homepage or dashboard after successful login
        console.log("User signed in successfully:", email);
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

        // Redirect after successful signup
        return res.redirect("/");

    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(400).send('Error creating user');
    }
});

module.exports = router;
