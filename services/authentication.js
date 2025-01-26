const JWT = require("jsonwebtoken");
const secret = "$uperMan@123";

// Function to create token for a user
function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role,
    };
    const token = JWT.sign(payload, secret, { expiresIn: '1h' });  // Token expires in 1 hour
    return token;
}

// Function to validate token and return the decoded user
function validateToken(token) {
    try {
        const payload = JWT.verify(token, secret); // Throws an error if the token is invalid
        return payload;
    } catch (error) {
        return null;  // Return null if token is invalid
    }
}

// Add verifyToken function to handle JWT verification and errors
function verifyToken(token) {
    try {
        const decoded = JWT.verify(token, secret);
        return decoded;
    } catch (error) {
        return null;  // Return null if the token is invalid or expired
    }
}

module.exports = {
    createTokenForUser,
    validateToken,
    verifyToken,  // Export verifyToken
};
