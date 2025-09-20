import User from "../models/User.js";
import AgentList from "../models/AgentList.js";

// Get agent dashboard (leads)
export const getDashboard = async (req, res) => {
  try {
    if (req.user.role !== "agent")
      return res.status(403).json({ message: "Access denied" });

    const agent = await User.findById(req.user.userId).select("name");
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const leads = await AgentList.find({ agent: req.user.userId }).select(
      "firstName phone notes status"
    );

    res.json({ agent: agent.name, leads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update lead status
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const lead = await AgentList.findOne({ _id: req.params.id, agent: req.user.userId });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    lead.status = status;
    await lead.save();

    res.json({ message: "Status updated", lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
