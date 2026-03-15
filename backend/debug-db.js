import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.model.js";
import Message from "./src/models/Message.model.js";

dotenv.config();

async function debugDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("--- USERS ---");
  const users = await User.find({});
  users.forEach((u) => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
  });

  console.log("\n--- RECENT MESSAGES ---");
  const msgs = await Message.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("senderId", "name");
  msgs.forEach((m) => {
    console.log(
      `Content: ${m.content}, SenderID: ${m.senderId._id}, SenderName: ${m.senderId.name}`,
    );
  });

  await mongoose.disconnect();
}

debugDB();
