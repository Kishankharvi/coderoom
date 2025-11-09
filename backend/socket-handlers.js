// socket-handlers.js
import Room from "./models/Room.js";
import User from "./models/User.js";
import File from "./models/File.js";

/**
 * Registers all Socket.IO event handlers for real-time collaboration.
 * This manages chat, code synchronization, file updates, and user sessions.
 */
export const registerSocketHandlers = (io) => {
  const roomChats = {}; // In-memory chat cache per room

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    /**
     * User joins a room
     * Validates access and sends current room state to the client.
     */
    socket.on("join-room", async (roomId, userId) => {
      try {
        socket.join(roomId);
        const room = await Room.findOne({ roomId })
          .populate("owner", "name email avatar")
          .populate("allowedParticipants", "name email avatar");

        if (!room) return socket.emit("error", { message: "Room not found" });

        const user = await User.findById(userId);
        const isOwner = room.owner._id.toString() === userId;
        const isAllowed = room.allowedParticipants.some((p) => p._id.toString() === userId);

        if (!isOwner && !isAllowed) {
          socket.emit("error", { message: "Access denied to this room" });
          socket.leave(roomId);
          return;
        }

        const userRole = isOwner ? "owner" : "participant";

        // Track participant
        room.currentParticipants.push({
          userId,
          socketId: socket.id,
          joinedAt: new Date(),
          role: userRole,
        });
        await room.save();

        // Send chat history
        socket.emit("chat-history", roomChats[roomId] || []);
        roomChats[roomId] = roomChats[roomId] || [];

        // Notify room participants
        socket.broadcast.to(roomId).emit("user-joined", {
          user: { id: user._id, name: user.name, avatar: user.avatar, role: userRole },
          participants: room.currentParticipants,
        });

        // Send room data
        socket.emit("room-data", {
          code: room.code,
          language: room.language,
          mode: room.mode,
          participants: room.currentParticipants,
          owner: room.owner,
          userRole,
          canEdit: isOwner || room.mode === "interview",
          problemTitle: room.problemTitle,
          problemDescription: room.problemDescription,
          timeComplexity: room.timeComplexity,
          spaceComplexity: room.spaceComplexity,
        });

        io.to(roomId).emit("mode-status", {
          mode: room.mode,
          message:
            room.mode === "teaching"
              ? "Teaching Mode: Participants are read-only"
              : "Interview Mode: Both can edit",
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * Handle chat message
     */
    socket.on("send-message", async (roomId, userId, text) => {
      try {
        const user = await User.findById(userId);
        const message = {
          _id: Date.now().toString(),
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          text,
          timestamp: new Date(),
        };

        roomChats[roomId] = roomChats[roomId] || [];
        roomChats[roomId].push(message);

        if (roomChats[roomId].length > 100) roomChats[roomId] = roomChats[roomId].slice(-100);

        io.to(roomId).emit("new-message", message);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * Typing indicator
     */
    socket.on("user-typing", async (roomId, userId) => {
      try {
        const user = await User.findById(userId);
        socket.broadcast.to(roomId).emit("typing-indicator", { userId, userName: user.name });
      } catch (error) {}
    });

    socket.on("stop-typing", (roomId, userId) => {
      socket.broadcast.to(roomId).emit("typing-stopped", { userId });
    });

    /**
     * Mentor feedback event
     */
    socket.on("add-feedback", async (roomId, userId, line, feedback) => {
      try {
        const room = await Room.findOne({ roomId }).populate("owner");
        const userRole = room.owner._id.toString() === userId ? "owner" : "participant";
        if (userRole !== "owner") return socket.emit("error", { message: "Only mentors can add feedback" });

        const user = await User.findById(userId);
        const feedbackItem = {
          _id: Date.now().toString(),
          userId,
          userName: user.name,
          line,
          feedback,
          timestamp: new Date(),
        };

        roomChats[roomId] = roomChats[roomId] || [];
        roomChats[roomId].push(feedbackItem);

        io.to(roomId).emit("feedback-added", feedbackItem);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * Code update synchronization
     */
    socket.on("code-change", async (roomId, userId, code, language) => {
      try {
        const room = await Room.findOne({ roomId }).populate("owner");
        const isOwner = room.owner._id.toString() === userId;
        const canEdit = isOwner || room.mode === "interview";

        if (!canEdit) return socket.emit("error", { message: "You cannot edit in this mode" });

        await Room.findOneAndUpdate({ roomId }, { code, language, lastUpdated: new Date() });
        socket.broadcast.to(roomId).emit("code-update", { code, language });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * Mode toggle (teaching/interview)
     */
    socket.on("toggle-mode", async (roomId, userId, newMode) => {
      try {
        const room = await Room.findOne({ roomId }).populate("owner");
        if (room.owner._id.toString() !== userId)
          return socket.emit("error", { message: "Only the owner can change mode" });

        if (!["teaching", "interview"].includes(newMode))
          return socket.emit("error", { message: "Invalid mode" });

        await Room.findOneAndUpdate({ roomId }, { mode: newMode });
        io.to(roomId).emit("mode-changed", {
          mode: newMode,
          message:
            newMode === "teaching"
              ? "Switched to Teaching Mode - Read only"
              : "Switched to Interview Mode - Collaborative editing enabled",
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    /**
     * File upload and delete notifications
     */
    socket.on("file-uploaded", async (roomId, fileId) => {
      try {
        const file = await File.findById(fileId).populate("uploader", "name email avatar");
        io.to(roomId).emit("new-file", { file });
      } catch (error) {}
    });

    socket.on("file-deleted", (roomId, fileId) => {
      io.to(roomId).emit("file-removed", { fileId });
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });
};
