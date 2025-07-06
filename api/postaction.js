require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Post = require("./models/post");
const User = require("./models/user");
// const admin = require("../firebase");

let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  let userData;
  try {
    userData = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { postId, action, commentText } = req.body;
  if (!postId || !action) {
    return res.status(400).json({ message: "postId and action are required" });
  }

  try {
    await connectToDatabase();

    // Fetch full user info from DB (fixes undefined name/profilePhoto)
    const dbUser = await User.findById(userData._id);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = {
      id: dbUser._id.toString(),
      name: dbUser.username,
      profilePhoto: dbUser.profilePhotoUrl,
    };

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const postOwner = await User.findOne({ username: post.name });
    if (!postOwner) {
      return res.status(404).json({ message: "Post owner not found" });
    }

    let updated = false;
    let notification = null;

    switch (action) {
      case "like":
        const likeIndex = post.likes.findIndex((l) => l.id === user.id);
        if (likeIndex > -1) {
          post.likes.splice(likeIndex, 1); // unlike
        } else {
          post.likes.push(user); // like
          notification = {
            type: "like",
            from: {
              id: user.id,
              name: user.name,
              profilePhoto: user.profilePhoto,
            },
            message: `${user.name} liked your post`,
            createdAt: new Date(),
            isRead: false,
          };
        }
        post.likecount = post.likes.length;
        updated = true;
        break;

      case "comment":
        if (!commentText) {
          return res.status(400).json({ message: "commentText is required" });
        }

        post.comments.push({
          id: user.id,
          name: user.name,
          profilePhoto: user.profilePhoto,
          commentText,
        });

        post.commentsCounts = post.comments.length;

        notification = {
          type: "comment",
          from: user,
          message: `${user.name} commented on your post`,
          createdAt: new Date(),
          isRead: false,
        };
        updated = true;
        break;

      case "save":
        const saveIndex = post.savedBy.findIndex((s) => s.id === user.id);
        if (saveIndex > -1) {
          post.savedBy.splice(saveIndex, 1);
        } else {
          post.savedBy.push(user);
        }
        post.saved = post.savedBy.length;
        updated = true;
        break;

      case "share":
        const alreadyShared = post.shareBy.find((s) => s.id === user.id);
        if (!alreadyShared) {
          post.shareBy.push(user);
        }
        post.shares += 1;
        updated = true;
        break;

      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    if (updated) {
      await post.save();

      // Add notification only if actor ≠ owner
      if (notification && postOwner._id.toString() !== user.id) {
        postOwner.notifications.push(notification);
        await postOwner.save();

        // Optional: Send FCM push notification
        // if (postOwner.fcmToken) {
        //   await admin.messaging().send({
        //     token: postOwner.fcmToken,
        //     notification: {
        //       title: "New Notification",
        //       body: notification.message,
        //     },
        //     data: {
        //       type: notification.type,
        //       fromUserId: user.id,
        //       postId: postId,
        //     },
        //   });
        // }
      }
    }

    return res.status(200).json({
      message: `Post ${action} successful`,
      post,
      statusCode: 200,
    });
  } catch (err) {
    console.error("Action error:", err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};
