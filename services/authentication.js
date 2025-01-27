const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// Function to create token for a user
function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role,
    };
    const token = JWT.sign(payload, secret, { expiresIn: '2d' });  // Token expires in 1 hour
    return token;
}

// Function to validate token and return the decoded user
function validateToken(token) {
    try {
        console.log("Validating token:", token);
        const payload = JWT.verify(token, secret); // Throws an error if the token is invalid
        return payload;
    } catch (error) {
        console.error("Token validation failed:", error);  // Log the error if token is invalid
        return null;  // Return null if token is invalid
    }
}

module.exports = {
    createTokenForUser,
    validateToken,
};
