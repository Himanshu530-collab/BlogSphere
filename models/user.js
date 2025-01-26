const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImageURL: {
    type: String,
    default: '/images/default.png',
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  },
}, 
{ timestamps: true });

userSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified("password")) return next(); // Skip if password isn't modified

  // Salt and hash the password with bcrypt
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.matchPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password); // Compare entered password with stored password
};

const User = model('User', userSchema);
module.exports = User;
