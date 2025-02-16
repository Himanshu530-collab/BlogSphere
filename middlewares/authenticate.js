const { validateToken } = require('../services/authentication'); // Import validation function

const authenticate = (req, res, next) => {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];  // Look for token in cookies or headers
    console.log("Token received:", token);  // Log token for debugging

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access, please login.' });  // Respond with a JSON message
    }

    try {
        const decoded = validateToken(token);  // Validate the token

        if (!decoded) {
            return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
        }

        req.user = decoded;  // Attach decoded user data to request object
        console.log("Decoded user:", req.user);  // Log user data to ensure it's correctly populated
        next();  // Proceed to next middleware/route handler
    } catch (error) {
        console.error("Token validation error:", error);
        return res.status(500).json({ message: 'Internal server error during authentication.' });  // Handle errors during token validation
    }
};

module.exports = authenticate;
