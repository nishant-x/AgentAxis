const User = require("../models/User");
const AgentList = require("../models/AgentList");
const fs = require("fs");
const csvParser = require("csv-parser");

// Get all agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("-password");
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new agent
exports.createAgent = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const mobileRegex = /^[0-9]{10}$/; 
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: "Mobile number must be 10 digits" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Agent already exists with this email" });
    }

    const agent = new User({ name, email, mobile, password, role: "agent" });
    await agent.save();

    res.status(201).json({ message: "Agent created successfully", agent });
  } catch (err) {
    console.error("Error creating agent:", err);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Update agent data
exports.updateAgent = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    const agent = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile },
      { new: true }
    );

    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ message: "Agent updated successfully", agent });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete agent
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Upload CSV & distribute leads
exports.uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file required" });

  try {
    const agents = await User.find({ role: "agent" });
    if (!agents.length) return res.status(400).json({ message: "No agents available" });

    const requiredHeaders = ["firstName", "phone", "email", "notes"];
    const results = [];
    let headersValidated = false;

    const stream = fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on("headers", (headers) => {
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length) {
          stream.destroy(); // stop reading
          fs.unlinkSync(req.file.path);
          return res
            .status(400)
            .json({ message: `Invalid CSV format. Missing headers: ${missing.join(", ")}` });
        }
        headersValidated = true;
      })
      .on("data", (row) => {
        if (!headersValidated) return; // skip until headers are validated

        // Row validation
        if (!row.firstName || !row.phone) return;

        const phoneRegex = /^[0-9]{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!phoneRegex.test(row.phone)) return;
        if (row.email && !emailRegex.test(row.email)) return;

        results.push({
          firstName: row.firstName.trim(),
          phone: row.phone.trim(),
          email: row.email ? row.email.trim() : "",
          notes: row.notes || "",
        });
      })
      .on("end", async () => {
        fs.unlinkSync(req.file.path); // remove file after processing

        if (!results.length) {
          return res.status(400).json({ message: "No valid rows in CSV" });
        }

        // Distribute leads to agents
        const distributed = results.map((item, index) => ({
          agent: agents[index % agents.length]._id,
          ...item,
          status: "active",
        }));

        const inserted = await AgentList.insertMany(distributed);

        res.json({
          message: "CSV uploaded & distributed successfully",
          uploads: inserted,
        });
      })
      .on("error", (err) => {
        // handle stream errors
        fs.unlinkSync(req.file.path);
        console.error("CSV stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "CSV parsing error" });
        }
      });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    console.error("CSV upload error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Get all uploaded leads
exports.getAllUploads = async (req, res) => {
  try {
    const uploads = await AgentList.find().populate("agent", "name email");
    res.json({ uploads });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get leads for a specific agent
exports.getAgentUploads = async (req, res) => {
  try {
    const entries = await AgentList.find({ agent: req.params.id });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a lead
exports.deleteUpload = async (req, res) => {
  try {
    const upload = await AgentList.findByIdAndDelete(req.params.id);
    if (!upload) return res.status(404).json({ message: "Upload not found" });

    res.json({ message: "Upload deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update lead status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const lead = await AgentList.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    res.json({ message: "Status updated successfully", lead });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
