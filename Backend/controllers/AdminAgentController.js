import User from "../models/User.js";
import AgentList from "../models/AgentList.js";
import fs from "fs";
import csvParser from "csv-parser";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Regex patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[0-9]{10}$/;

// Validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all agents
export const getAllAgents = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Fetch only those agents created by this admin
    const agents = await User.find({
      role: "agent",
      createdBy: adminId
    }).select("-password");

    res.status(200).json({ agents });
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const createAgent = async (req, res) => {
  try {
    const { name, email, mobile, password, adminId } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !password || !adminId) {
      return res.status(400).json({ message: "All fields are required including adminId" });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters long" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: "Mobile number must be 10 digits" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check for duplicate agent
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Agent already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create agent with adminId
    const agent = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "agent",
      createdBy: adminId, // store which admin created this agent
    });

    await agent.save();

    res.status(201).json({
      message: "Agent created successfully",
      agent: { ...agent._doc, password: undefined },
    });
  } catch (err) {
    console.error("Error creating agent:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Update agent data
export const updateAgent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid agent ID" });

    const { name, email, mobile } = req.body;
    const agent = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile },
      { new: true, runValidators: true }
    ).select("-password");

    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ message: "Agent updated successfully", agent });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete agent
export const deleteAgent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid agent ID" });

    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Upload CSV & distribute leads
export const uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file required" });

  try {
    const { adminId } = req.body; // ✅ get adminId from frontend
    if (!adminId) return res.status(400).json({ message: "Admin ID is required" });

    // ✅ fetch only agents created by this admin
    const agents = await User.find({ role: "agent", createdBy: adminId });
    if (!agents.length) return res.status(400).json({ message: "No agents available for this admin" });

    const requiredHeaders = ["firstName", "phone", "email", "notes"];
    const results = [];
    let headersValidated = false;

    const stream = fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on("headers", (headers) => {
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length) {
          stream.destroy();
          fs.unlink(req.file.path, () => {});
          return res.status(400).json({ message: `Invalid CSV format. Missing headers: ${missing.join(", ")}` });
        }
        headersValidated = true;
      })
      .on("data", (row) => {
        if (!headersValidated) return;
        if (!row.firstName || !row.phone) return;
        if (!mobileRegex.test(row.phone)) return;
        if (row.email && !emailRegex.test(row.email)) return;

        results.push({
          firstName: row.firstName.trim(),
          phone: row.phone.trim(),
          email: row.email ? row.email.trim() : "",
          notes: row.notes || "",
        });
      })
      .on("end", async () => {
        fs.unlink(req.file.path, () => {});
        if (!results.length) return res.status(400).json({ message: "No valid rows in CSV" });

        // ✅ distribute only among agents of this admin
        const distributed = results.map((item, index) => ({
          agent: agents[index % agents.length]._id,
          admin: adminId, // ✅ store which admin created this lead
          ...item,
          status: "active",
        }));

        const inserted = await AgentList.insertMany(distributed);
        res.json({ message: "CSV uploaded & distributed successfully", uploads: inserted });
      })
      .on("error", (err) => {
        fs.unlink(req.file.path, () => {});
        console.error("CSV stream error:", err);
        if (!res.headersSent) res.status(500).json({ message: "CSV parsing error" });
      });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("CSV upload error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
};

// Get all uploaded leads for a particular admin
export const getAllUploads = async (req, res) => {
  try {
    const adminId = req.query.adminId;
    if (!adminId) return res.status(400).json({ message: "Admin ID is required" });

    // Find all agents created by this admin
    const agents = await User.find({ role: "agent", createdBy: adminId }).select("_id");

    if (!agents.length) return res.json({ uploads: [] });

    const agentIds = agents.map((a) => a._id);

    // Fetch uploads for these agents
    const uploads = await AgentList.find({ agent: { $in: agentIds } }).populate("agent", "name email");

    res.json({ uploads });
  } catch (err) {
    console.error("Error fetching uploads:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get leads for a specific agent
export const getAgentUploads = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid agent ID" });

    const entries = await AgentList.find({ agent: req.params.id });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a lead
export const deleteUpload = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid lead ID" });

    const upload = await AgentList.findByIdAndDelete(req.params.id);
    if (!upload) return res.status(404).json({ message: "Upload not found" });

    res.json({ message: "Upload deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update lead status
export const updateLeadStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid lead ID" });

    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const lead = await AgentList.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    res.json({ message: "Status updated successfully", lead });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const { adminId } = req.query; 
    if (!adminId) return res.status(400).json({ message: "Admin ID is required" });

    // Count agents created by this admin
    const agentCount = await User.countDocuments({ role: "agent", createdBy: adminId });

    // Count leads uploaded by this admin
    const leadCount = await AgentList.countDocuments({ admin: adminId });

    res.json({ agentCount, leadCount });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};