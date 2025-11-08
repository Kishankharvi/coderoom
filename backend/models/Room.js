import mongoose from "mongoose"

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mode: { type: String, enum: ["teaching", "interview"], default: "teaching" },
  code: { type: String, default: "// Start coding here..." },
  language: { type: String, default: "javascript" },
  isActive: { type: Boolean, default: true },
  participants: [{ userId: mongoose.Schema.Types.ObjectId, joinedAt: Date, socketId: String }],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
})

const Room = mongoose.model("Room", roomSchema)
export default Room
