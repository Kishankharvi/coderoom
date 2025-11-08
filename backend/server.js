import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import { Server as SocketIOServer } from "socket.io"
import authRoutes from "./routes/auth.js"
import roomRoutes from "./routes/rooms.js"
import fileRoutes from "./routes/files.js"
import executionRoutes from "./routes/execution.js"
import adminRoutes from "./routes/admin.js"
import { registerSocketHandlers } from "./socket-handlers.js"
import { json } from "stream/consumers"

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true },
})

// Middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }))

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/coderoom")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/execute", executionRoutes)
app.use("/api/admin", adminRoutes)

// Register Socket.io event handlers
registerSocketHandlers(io)

app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
console.log("Socket.io server running"+JSON.toString(io))
export { io }
