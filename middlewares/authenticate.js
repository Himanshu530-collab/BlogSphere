const { validateToken } = require('../services/authentication'); // Import validation function

const authenticate = (req, res, next) => {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];  // Look for token in cookies or headers
    console.log("Token received:", token);  // Log token for debugging

    if (!token) {
        return res.status(401).send('Unauthorized access');
    }

    const decoded = validateToken(token);  // Validate the token

    if (!decoded) {
        return res.status(403).send('Invalid or expired token');
    }

    req.user = decoded;  // Attach decoded user data to request object
    console.log("Decoded user:", req.user);  // Log user data to ensure it's correctly populated
    next();  // Proceed to next middleware/route handler
};

module.exports = authenticate;
