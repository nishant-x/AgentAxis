import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getDashboard,
  updateLeadStatus,
} from "../controllers/agentController.js";

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// Agent dashboard routes
router.get("/dashboard", getDashboard);
router.patch("/lead/:id/status", updateLeadStatus);

export default router;
