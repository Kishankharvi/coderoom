import express from "express"
import { verifyToken } from "./auth.js"
import File from "../models/File.js"
import { v4 as uuidv4 } from "uuid"

const router = express.Router()

// Get files for a room
router.get("/room/:roomId", async (req, res) => {
  try {
    const files = await File.find({ room: req.params.roomId })
      .populate("uploader", "name email avatar")
      .sort({ createdAt: -1 })

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload file
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const { filename, mimeType, fileData, room } = req.body

    if (!filename || !fileData) {
      return res.status(400).json({ error: "Filename and file data required" })
    }

    const file = new File({
      filename: uuidv4(),
      originalName: filename,
      mimeType: mimeType || "application/octet-stream",
      size: Buffer.byteLength(fileData, "base64"),
      uploader: req.userId,
      room,
      fileData: Buffer.from(fileData, "base64"),
      shareUrl: `share-${uuidv4()}`,
    })

    await file.save()
    await file.populate("uploader", "name email avatar")

    res.status(201).json({
      message: "File uploaded",
      file: {
        _id: file._id,
        originalName: file.originalName,
        size: file.size,
        shareUrl: file.shareUrl,
        uploader: file.uploader,
        createdAt: file.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Download file
router.get("/download/:fileId", async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    file.downloads += 1
    await file.save()

    res.set("Content-Type", file.mimeType)
    res.set("Content-Disposition", `attachment; filename="${file.originalName}"`)
    res.send(file.fileData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete file
router.delete("/:fileId", verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    if (file.uploader.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own files" })
    }

    await File.deleteOne({ _id: req.params.fileId })
    res.json({ message: "File deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Share file via link
router.get("/share/:shareUrl", async (req, res) => {
  try {
    const file = await File.findOne({ shareUrl: req.params.shareUrl })

    if (!file) {
      return res.status(404).json({ error: "Shared file not found or expired" })
    }

    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ error: "Share link has expired" })
    }

    file.accessLog.push({ userId: null, accessedAt: new Date() })
    await file.save()

    res.set("Content-Type", file.mimeType)
    res.set("Content-Disposition", `attachment; filename="${file.originalName}"`)
    res.send(file.fileData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get file info (for sharing)
router.get("/info/:fileId", async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId).populate("uploader", "name email avatar")

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    res.json({
      _id: file._id,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      uploader: file.uploader,
      createdAt: file.createdAt,
      downloads: file.downloads,
      shareUrl: file.shareUrl,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
