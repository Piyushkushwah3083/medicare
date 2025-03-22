const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
  console.log('Connected to MongoDB');
}

// User Schema definition
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, email, phoneNumber, password } = req.body;

    try {
      // Connect to the database
      await connectToDatabase();

      // Check if all required fields are provided
      if (!username || !email || !phoneNumber || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if the email or username already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Email or username already exists' });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = new User({
        username,
        email,
        phoneNumber,
        password: hashedPassword
      });

      // Save the user to the database
      await newUser.save();

      res.status(201).json({ message: 'User account created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
