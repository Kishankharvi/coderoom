// routes/complexity.js
import express from "express";
import { verifyToken } from "./auth.js";
import ComplexityAnalysis from "../models/ComplexityAnalysis.js";

const router = express.Router();

/**
 * @route   POST /api/complexity/analyze
 * @desc    Store or update complexity analysis results for a user's code
 * @access  Private
 */
router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const { roomId, code, language, analysis } = req.body;
    if (!roomId || !code || !language) {
      return res.status(400).json({ error: "Missing required fields: roomId, code, or language" });
    }

    const record = new ComplexityAnalysis({
      roomId,
      userId: req.userId,
      code,
      language,
      detectedTimeComplexity: analysis?.timeComplexity || "O(n)",
      detectedSpaceComplexity: analysis?.spaceComplexity || "O(n)",
      analysis: {
        loops: analysis?.loops || [],
        recursionDetected: analysis?.recursionDetected || false,
        nestedLoops: analysis?.nestedLoops || 0,
        hasHashMaps: analysis?.hasHashMaps || false,
        hasArrays: analysis?.hasArrays || false,
        recommendations: analysis?.recommendations || [],
      },
      executionMetrics: analysis?.executionMetrics || {},
    });

    await record.save();
    res.status(201).json({ message: "Complexity analysis stored successfully", record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/complexity/room/:roomId
 * @desc    Get all stored complexity analyses for a given room
 * @access  Private
 */
router.get("/room/:roomId", verifyToken, async (req, res) => {
  try {
    const records = await ComplexityAnalysis.find({ roomId: req.params.roomId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/complexity/user/:userId
 * @desc    Get all complexity analyses performed by a specific user
 * @access  Private (admin or user themselves)
 */
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const records = await ComplexityAnalysis.find({ userId: req.params.userId })
      .populate("roomId", "name roomId")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
