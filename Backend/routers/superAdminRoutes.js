import express from "express";
import authMiddleware from "../middleware/auth.js";
import { createAdmin, getDashboardStats } from "../controllers/superAdminController.js";

const router = express.Router();

// Routes only accessible by superadmin
router.post("/newadmin", authMiddleware, createAdmin);
router.get("/dashboard-stats", authMiddleware, getDashboardStats);

export default router;
