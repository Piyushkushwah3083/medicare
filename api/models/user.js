const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  phoneNumber: String,
  password: String,
  profilePhotoUrl: String,
  labelname:String,
  tokens: [{ token: String }],
  isActive:Boolean,
  isDelete:Boolean,
});

module.exports = mongoose.model("User", userSchema);
