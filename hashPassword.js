const bcrypt = require('bcryptjs');

// Function to hash the password
async function hashPassword() {
  const password = '236589';  // Replace with the password you want to hash

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the salt
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed Password:', hashedPassword);
  } catch (err) {
    console.error('Error hashing the password:', err);
  }
}

hashPassword();
