import User from "../models/User.js";
import AgentList from "../models/AgentList.js";

// Create a new admin (only superadmin)
export const createAdmin = async (req, res) => {
  try {
    // Only superadmin can create admins
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin allowed" });
    }

    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const admin = new User({
      name,
      email,
      mobile,
      password, 
      role: "admin",
    });

    await admin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: { ...admin._doc, password: undefined },
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get total counts of admins, agents, and agent lists
export const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin allowed" });
    }

    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalAgents = await User.countDocuments({ role: "agent" });
    const totalLeads = await AgentList.countDocuments();

    res.status(200).json({ totalAdmins, totalAgents, totalLeads });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};
