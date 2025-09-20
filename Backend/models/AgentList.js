import mongoose from "mongoose";

const agentListSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const AgentList = mongoose.models.AgentList || mongoose.model("AgentList", agentListSchema);

export default AgentList;
