// api/hello.js
module.exports = (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ message: 'Hello, Vercel!' });
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ error: 'Something went wrong' });
  }
};
