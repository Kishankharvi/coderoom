import Room from "./models/Room.js"
import User from "./models/User.js"
import File from "./models/File.js"

export const registerSocketHandlers = (io) => {
  const roomChats = {} // Store chat messages per room

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // User joins a room
    socket.on("join-room", async (roomId, userId) => {
      try {
        socket.join(roomId)

        const room = await Room.findOne({ roomId })
          .populate("mentor", "name email avatar")
          .populate("students", "name email avatar")

        const user = await User.findById(userId)
        const userRole = room.mentor._id.toString() === userId ? "mentor" : "student"

        // Update participants
        room.participants.push({ userId, socketId: socket.id, joinedAt: new Date(), role: userRole })
        await room.save()

        // Send existing chat history
        if (roomChats[roomId]) {
          socket.emit("chat-history", roomChats[roomId])
        } else {
          roomChats[roomId] = []
        }

        // Notify others
        socket.broadcast.to(roomId).emit("user-joined", {
          user: { id: user._id, name: user.name, avatar: user.avatar, role: userRole },
          participants: room.participants,
        })

        socket.emit("room-data", {
          code: room.code,
          language: room.language,
          mode: room.mode,
          participants: room.participants,
          mentor: room.mentor,
          userRole: userRole,
          canEdit: userRole === "mentor" || room.mode === "interview",
        })

        io.to(roomId).emit("mode-status", {
          mode: room.mode,
          message:
            room.mode === "teaching"
              ? "Teaching Mode: Students are in read-only mode"
              : "Interview Mode: Both can edit",
        })
      } catch (error) {
        socket.emit("error", { message: error.message })
      }
    })

    // Chat messages
    socket.on("send-message", async (roomId, userId, messageText) => {
      try {
        const user = await User.findById(userId)

        const message = {
          _id: Date.now().toString(),
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          text: messageText,
          timestamp: new Date(),
          type: "message",
        }

        // Store message
        if (!roomChats[roomId]) roomChats[roomId] = []
        roomChats[roomId].push(message)

        // Limit chat history to last 100 messages
        if (roomChats[roomId].length > 100) {
          roomChats[roomId] = roomChats[roomId].slice(-100)
        }

        // Broadcast to room
        io.to(roomId).emit("new-message", message)
      } catch (error) {
        socket.emit("error", { message: error.message })
      }
    })

    // Typing indicator
    socket.on("user-typing", async (roomId, userId) => {
      try {
        const user = await User.findById(userId)
        socket.broadcast.to(roomId).emit("typing-indicator", {
          userId,
          userName: user.name,
        })
      } catch (error) {
        console.error("Typing indicator error:", error)
      }
    })

    // Stop typing
    socket.on("stop-typing", (roomId, userId) => {
      socket.broadcast.to(roomId).emit("typing-stopped", { userId })
    })

    // Inline feedback/comments
    socket.on("add-feedback", async (roomId, userId, line, feedback) => {
      try {
        const room = await Room.findOne({ roomId }).populate("mentor")
        const userRole = room.mentor._id.toString() === userId ? "mentor" : "student"

        // Only mentors can add feedback
        if (userRole !== "mentor") {
          return socket.emit("error", { message: "Only mentors can add feedback" })
        }

        const user = await User.findById(userId)

        const feedbackItem = {
          _id: Date.now().toString(),
          userId,
          userName: user.name,
          line,
          feedback,
          timestamp: new Date(),
          type: "feedback",
        }

        // Store in chat history
        if (!roomChats[roomId]) roomChats[roomId] = []
        roomChats[roomId].push(feedbackItem)

        io.to(roomId).emit("feedback-added", feedbackItem)
      } catch (error) {
        socket.emit("error", { message: error.message })
      }
    })

    // Reactions to messages
    socket.on("add-reaction", (roomId, messageId, emoji) => {
      io.to(roomId).emit("message-reaction", { messageId, emoji })
    })

    // Notifications
    socket.on("notify-users", (roomId, notification) => {
      io.to(roomId).emit("notification", {
        ...notification,
        timestamp: new Date(),
      })
    })

    // Code execution in room
    socket.on("run-code", (roomId, userId, code, language) => {
      io.to(roomId).emit("execution-start", { userId, language })
    })

    // Receive execution output and broadcast to room
    socket.on("execution-result", (roomId, result) => {
      io.to(roomId).emit("execution-output", result)
    })

    // Code editing
    socket.on("code-change", async (roomId, userId, code, language) => {
      try {
        const room = await Room.findOne({ roomId }).populate("mentor")

        const userRole = room.mentor._id.toString() === userId ? "mentor" : "student"
        const canEdit = userRole === "mentor" || room.mode === "interview"

        if (!canEdit) {
          return socket.emit("error", { message: "You don't have permission to edit in this mode" })
        }

        await Room.findOneAndUpdate({ roomId }, { code, language, lastUpdated: new Date() })
        socket.broadcast.to(roomId).emit("code-update", { code, language })
      } catch (error) {
        console.error("Code update error:", error)
        socket.emit("error", { message: error.message })
      }
    })

    // Mode toggle
    socket.on("toggle-mode", async (roomId, userId, newMode) => {
      try {
        const room = await Room.findOne({ roomId }).populate("mentor")

        if (room.mentor._id.toString() !== userId) {
          return socket.emit("error", { message: "Only mentors can change the mode" })
        }

        if (!["teaching", "interview"].includes(newMode)) {
          return socket.emit("error", { message: "Invalid mode" })
        }

        await Room.findOneAndUpdate({ roomId }, { mode: newMode })

        io.to(roomId).emit("mode-changed", {
          mode: newMode,
          message:
            newMode === "teaching"
              ? "Mentor switched to Teaching Mode - Students are read-only"
              : "Mentor switched to Interview Mode - Both can edit",
        })
      } catch (error) {
        socket.emit("error", { message: error.message })
      }
    })

    // File upload notification
    socket.on("file-uploaded", async (roomId, fileId) => {
      try {
        const file = await File.findById(fileId).populate("uploader", "name email avatar")

        io.to(roomId).emit("new-file", {
          file: {
            _id: file._id,
            originalName: file.originalName,
            size: file.size,
            uploader: file.uploader,
            createdAt: file.createdAt,
          },
        })
      } catch (error) {
        console.error("File upload notification error:", error)
      }
    })

    // File deleted notification
    socket.on("file-deleted", (roomId, fileId) => {
      io.to(roomId).emit("file-removed", { fileId })
    })

    // User leaves room
    socket.on("leave-room", async (roomId, userId) => {
      try {
        const room = await Room.findOne({ roomId })
        room.participants = room.participants.filter((p) => p.userId.toString() !== userId)
        await room.save()

        socket.broadcast.to(roomId).emit("user-left", { userId, participants: room.participants })
        socket.leave(roomId)
      } catch (error) {
        console.error("Leave room error:", error)
      }
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })
  })
}
