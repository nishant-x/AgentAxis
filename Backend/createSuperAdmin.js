import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error("MONGODB_URL is required in .env");
  process.exit(1);
}

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ role: "superadmin" });
    if (existing) {
      console.log("Superadmin already exists:", existing.email);
      process.exit(0);
    }

    const superAdmin = new User({
      name: "Super Admin",
      email: "superadmin@example.com",
      mobile: "9999999999",
      password: "SuperAdmin@123", // DO NOT HASH here, model will handle it
      role: "superadmin",
    });

    await superAdmin.save();
    console.log("✅ Superadmin created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating superadmin:", err);
    process.exit(1);
  }
};

createSuperAdmin();
