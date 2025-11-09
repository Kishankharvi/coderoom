// routes/invitations.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import Room from "../models/Room.js";
import User from "../models/User.js";
import RoomInvitation from "../models/RoomInvitation.js";
import { verifyToken } from "./auth.js";

const router = express.Router();

/**
 * @route   POST /api/invitations/:roomId/invite
 * @desc    Create a new room invitation for a user (mentor/owner only)
 * @access  Private
 */
router.post("/:roomId/invite", verifyToken, async (req, res) => {
  try {
    const { invitedUserEmail, expiresInHours = 24 } = req.body;

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.owner.toString() !== req.userId) {
      return res.status(403).json({ error: "Only the room owner can send invitations" });
    }

    const invitedUser = await User.findOne({ email: invitedUserEmail });
    if (!invitedUser) return res.status(404).json({ error: "User not found" });

    // Avoid duplicate pending invitations
    const existingInvitation = await RoomInvitation.findOne({
      room: room._id,
      invitedUser: invitedUser._id,
      status: "pending",
    });
    if (existingInvitation) return res.status(400).json({ error: "User already has a pending invitation" });

    const invitationLink = uuidv4();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invitation = new RoomInvitation({
      room: room._id,
      invitedUser: invitedUser._id,
      invitedBy: req.userId,
      invitationLink,
      expiresAt,
    });

    await invitation.save();

    const shareLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join-room/${req.params.roomId}?invite=${invitationLink}`;

    res.json({
      message: "Invitation created successfully",
      invitation: {
        _id: invitation._id,
        invitedUserEmail: invitedUser.email,
        shareLink,
        expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/invitations/:roomId/status
 * @desc    Check the current user’s invitation or access status for a room
 * @access  Private
 */
router.get("/:roomId/status", verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const invitation = await RoomInvitation.findOne({
      room: room._id,
      invitedUser: req.userId,
    });

    const isOwner = room.owner.toString() === req.userId;
    const isAllowed = room.allowedParticipants.includes(req.userId);

    res.json({
      isOwner,
      isAllowed,
      hasValidInvitation: invitation && invitation.status !== "rejected",
      invitationStatus: invitation?.status || "none",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
