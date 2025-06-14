const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profilePhoto: { type: String, required: true },
  description: { type: String, required: true },
  media: [String],
  likes: { type: Number, default: 0 },
  commentsCounts: { type: Number, default: 0 },
  comments:[String],
  saved: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
