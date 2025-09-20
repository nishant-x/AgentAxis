const express = require("express");
const router = express.Router();
const multer = require("multer");

// Multer config for CSV uploads
const upload = multer({ dest: "uploads/" });

// Import controller
const {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  uploadCSV,
  getAllUploads,
  getAgentUploads,
  deleteUpload,
  updateLeadStatus,
} = require("../controllers/AdminAgentController");

 
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

module.exports = router;
