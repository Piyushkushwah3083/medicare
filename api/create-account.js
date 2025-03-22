// Import required modules
const mongoose = require('mongoose');

// Connect to MongoDB (use environment variable for connection string)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Define the Mongoose schema and model
const dataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true }
});

const Data = mongoose.model('Data', dataSchema);

// This is the Vercel serverless function handler
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { name, age } = req.body;

    if (!name || !age) {
      return res.status(400).json({ message: 'Name and Age are required!' });
    }

    try {
      // Create a new document from the request data
      const newData = new Data({
        name,
        age
      });

      // Save the data to MongoDB
      await newData.save();

      // Respond with a success message
      res.status(201).json({
        message: 'Data saved successfully!',
        data: newData
      });
    } catch (error) {
      console.error('Error saving data to MongoDB:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
