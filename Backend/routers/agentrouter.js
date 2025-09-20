// routes/agentDashboardRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const agentDashboardController = require("../controllers/agentController");

router.use(authMiddleware);

router.get("/dashboard", agentDashboardController.getDashboard);
router.patch("/lead/:id/status", agentDashboardController.updateLeadStatus);

module.exports = router;
