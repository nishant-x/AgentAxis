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
} from "../controllers/AdminAgentController.js"; // Make sure controller also uses ES exports

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Agent Management Routes
router.get("/agents", getAllAgents);
router.post("/newagent", createAgent);
router.put("/agents/:id", updateAgent);
router.delete("/agents/:id", deleteAgent);

// CSV Management Routes
router.post("/upload", upload.single("file"), uploadCSV);
router.get("/uploads", getAllUploads);
router.get("/uploads/agent/:id", getAgentUploads);
router.delete("/uploads/:id", deleteUpload);
router.put("/uploads/:id/status", updateLeadStatus);

export default router;
