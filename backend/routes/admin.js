import express from "express"
import { verifyToken } from "./auth.js"
import User from "../models/User.js"
import Room from "../models/Room.js"
import File from "../models/File.js"

const router = express.Router()

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// Get dashboard stats
router.get("/stats", verifyToken, checkAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalMentors = await User.countDocuments({ role: "mentor" })
    const totalStudents = await User.countDocuments({ role: "student" })
    const activeRooms = await Room.countDocuments({ isActive: true })
    const totalFiles = await File.countDocuments()
    const totalFileSize = await File.aggregate([{ $group: { _id: null, totalSize: { $sum: "$size" } } }])

    const userStats = {
      total: totalUsers,
      mentors: totalMentors,
      students: totalStudents,
    }

    const roomStats = {
      active: activeRooms,
    }

    const fileStats = {
      total: totalFiles,
      totalSize: totalFileSize[0]?.totalSize || 0,
    }

    res.json({
      userStats,
      roomStats,
      fileStats,
      timestamp: new Date(),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all users
router.get("/users", verifyToken, checkAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all active rooms
router.get("/rooms", verifyToken, checkAdmin, async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate("mentor", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 })

    res.json(rooms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all files
router.get("/files", verifyToken, checkAdmin, async (req, res) => {
  try {
    const files = await File.find()
      .populate("uploader", "name email")
      .populate("room", "roomId name")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user role
router.put("/users/:userId/role", verifyToken, checkAdmin, async (req, res) => {
  try {
    const { role } = req.body

    if (!["student", "mentor", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true })

    res.json({ message: "User role updated", user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
router.delete("/users/:userId", verifyToken, checkAdmin, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.userId })
    res.json({ message: "User deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Close room
router.put("/rooms/:roomId/close", verifyToken, checkAdmin, async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate({ roomId: req.params.roomId }, { isActive: false }, { new: true })

    res.json({ message: "Room closed", room })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get room activity
router.get("/rooms/:roomId/activity", verifyToken, checkAdmin, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("mentor", "name email")
      .populate("students", "name email")

    res.json({
      roomId: room.roomId,
      name: room.name,
      mentor: room.mentor,
      students: room.students,
      mode: room.mode,
      participants: room.participants,
      createdAt: room.createdAt,
      lastUpdated: room.lastUpdated,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
