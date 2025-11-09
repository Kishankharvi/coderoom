// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import invitationRoutes from "./routes/invitations.js";
import complexityRoutes from "./routes/complexity.js";
import fileRoutes from "./routes/files.js";
import executionRoutes from "./routes/execution.js";
import adminRoutes from "./routes/admin.js";
import { registerSocketHandlers } from "./socket-handlers.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// --- MIDDLEWARE SETUP --- //
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(morgan("dev")); // logs requests for debugging

// --- DATABASE CONNECTION --- //
console.log("Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/coderoom")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- ROUTES --- //
// Authentication and user management
app.use("/api/auth", authRoutes);

// Room and session management
app.use("/api/rooms", roomRoutes);

// Room invitation links and access control
app.use("/api/invitations", invitationRoutes);

// Code complexity analysis
app.use("/api/complexity", complexityRoutes);

// File upload, download, and sharing
app.use("/api/files", fileRoutes);

// Code execution and supported languages
app.use("/api/execute", executionRoutes);

// Admin dashboard and monitoring APIs
app.use("/api/admin", adminRoutes);

// --- SOCKET HANDLERS --- //
registerSocketHandlers(io);

// --- HEALTH CHECK ENDPOINT --- //
app.get("/api/health", (req, res) => {
  res.json({ status: "✅ Server is running" });
});

// --- START SERVER --- //
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { io };
