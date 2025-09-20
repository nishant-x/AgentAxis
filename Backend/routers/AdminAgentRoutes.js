// AdminAgentRoutes.js
import express from "express";
import multer from "multer";
import {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  uploadCSV,
  getAllUploads,
  getAgentUploads,
  deleteUpload,
  updateLeadStatus,
} from "../controllers/AdminAgentController.js"; // ES module imports

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// -------------------- AGENT MANAGEMENT --------------------
router.get("/agents", getAllAgents);
router.post("/newagent", createAgent);
router.put("/agents/:id", updateAgent);
router.delete("/agents/:id", deleteAgent);

// -------------------- CSV & LEADS --------------------
router.post("/upload", upload.single("file"), uploadCSV);
router.get("/uploads", getAllUploads);
router.get("/uploads/agent/:id", getAgentUploads);
router.delete("/uploads/:id", deleteUpload);
router.put("/uploads/:id/status", updateLeadStatus);

export default router;
