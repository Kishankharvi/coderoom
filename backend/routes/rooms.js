import express from "express"
import { v4 as uuidv4 } from "uuid"
import Room from "../models/Room.js"
import { verifyToken } from "./auth.js"

const router = express.Router()

// Create a new room (mentors only)
router.post("/create", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "mentor" && req.userRole !== "admin") {
      return res.status(403).json({ error: "Only mentors can create rooms" })
    }

    const { name, language } = req.body
    const roomId = uuidv4().slice(0, 8)

    const room = new Room({
      roomId,
      name: name || `Room ${roomId}`,
      mentor: req.userId,
      language: language || "javascript",
    })

    await room.save()

    res.status(201).json({ message: "Room created", room })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all active rooms
router.get("/active", async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate("mentor", "name email")
      .populate("students", "name email")
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get room by ID
router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("mentor", "name email avatar")
      .populate("students", "name email avatar")

    if (!room) {
      return res.status(404).json({ error: "Room not found" })
    }

    res.json(room)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Join room
router.post("/:roomId/join", verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })

    if (!room) {
      return res.status(404).json({ error: "Room not found" })
    }

    if (!room.students.includes(req.userId)) {
      room.students.push(req.userId)
      await room.save()
    }

    res.json({ message: "Joined room", room })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
