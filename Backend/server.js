import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routers/authRoutes.js";
import AdminAgentRoutes from "./routers/AdminAgentRoutes.js";
import agentrouter from './routers/agentrouter.js'
// import uploadRoutes from "./routers/upload.js";

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.VITE_FRONTEND_URL || "http://localhost:5173",
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
app.use("/api/agents" , agentrouter)
// app.use("/api/upload", uploadRoutes);

// MongoDB connection
const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error("MONGODB_URL environment variable is required");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

// Root route (optional)
app.get("/", (req, res) => {
  res.send("MERN backend is running 🚀");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
