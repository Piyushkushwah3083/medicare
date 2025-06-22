const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const connectToDatabase = require('../utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password, fcmToken } = req.body; // 👈 Accept fcmToken from frontend

  try {
    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        username: user.username,
        profilePhotoUrl: user.profilePhotoUrl,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store token and fcmToken
    user.tokens.push({ token });

    if (fcmToken && typeof fcmToken === 'string') {
      user.fcmToken = fcmToken; // 👈 Save/update FCM token
    }

    await user.save();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        name: user.username,
        email: user.email,
        profilePhoto: user.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
