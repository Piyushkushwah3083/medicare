const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  tokens: [{ token: { type: String, required: true } }] // Store JWT tokens for multiple logins
});

const User = mongoose.model('User', userSchema);
module.exports = User;
