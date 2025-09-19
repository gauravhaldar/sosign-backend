import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import connectDB from "../config/db.js";

dotenv.config();

function generateCode(length = 7) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude similar-looking chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB");

    const cursor = User.find({
      $or: [
        { uniqueCode: { $exists: false } },
        { uniqueCode: null },
        { uniqueCode: "" },
      ],
    }).cursor();
    let updated = 0;
    for (
      let user = await cursor.next();
      user != null;
      user = await cursor.next()
    ) {
      // Try a few times to avoid collision
      let assigned = false;
      for (let attempt = 0; attempt < 7 && !assigned; attempt++) {
        const candidate = generateCode();
        const exists = await User.exists({ uniqueCode: candidate });
        if (!exists) {
          user.uniqueCode = candidate;
          await user.save();
          updated++;
          assigned = true;
          console.log(`Assigned code ${candidate} to user ${user._id}`);
        }
      }
      if (!assigned) {
        const fallback = generateCode() + Math.floor(Math.random() * 9);
        user.uniqueCode = fallback;
        await user.save();
        updated++;
        console.log(`Assigned fallback code ${fallback} to user ${user._id}`);
      }
    }

    console.log(`Backfill complete. Updated ${updated} users.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

run();
