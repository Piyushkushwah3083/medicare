require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user'); // Assuming User schema is in models/User.js

// MongoDB Connection
let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

// User Registration API
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, email, phoneNumber, password } = req.body;

    try {
      await connectToDatabase();

      if (!username || !email || !phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if the email or username already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Email or username already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate JWT Token
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Create new user
      const newUser = new User({
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        tokens: [{ token }], // Store JWT token
      });

      await newUser.save();

      res.status(201).json({ message: 'User account created successfully', token });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
