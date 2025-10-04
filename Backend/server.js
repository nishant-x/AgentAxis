import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routers/authRoutes.js";
import AdminAgentRoutes from "./routers/AdminAgentRoutes.js";
import agentRouter from "./routers/agentrouter.js";
import superAdminRoutes from "./routers/superAdminRoutes.js"; // <-- Added SuperAdmin routes

// Initialize Express app
const app = express();

// Allowed origins
const allowedOrigins = [
  "https://agent-axis-rouge.vercel.app",
  "http://localhost:5173",
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed by server"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", AdminAgentRoutes);
app.use("/api/agents", agentRouter);
app.use("/api/superadmin", superAdminRoutes);

// MongoDB connection
const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error("MONGODB_URL environment variable is required");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  });

// Root route (optional)
app.get("/", (req, res) => {
  res.send("🚀 MERN backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
