import mongoose from "mongoose"

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerRole: { type: String, enum: ["teacher", "interviewer"], required: true },
  allowedParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentParticipants: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      joinedAt: Date,
      socketId: String,
      role: String,
    },
  ],
  mode: { type: String, enum: ["teaching", "interview"], default: "teaching" },
  code: { type: String, default: "// Start coding here..." },
  language: { type: String, default: "javascript" },
  problemTitle: { type: String, default: "" },
  problemDescription: { type: String, default: "" },
  timeLimit: { type: Number, default: null }, // in minutes
  spaceComplexity: { type: String, default: "" },
  timeComplexity: { type: String, default: "" },
  testCases: [
    {
      input: String,
      expectedOutput: String,
      description: String,
    },
  ],
  isActive: { type: Boolean, default: true },
  executionHistory: [
    {
      code: String,
      language: String,
      output: String,
      timeMs: Number,
      memoryUsageMB: Number,
      timestamp: Date,
      userId: mongoose.Schema.Types.ObjectId,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
})

const Room = mongoose.model("Room", roomSchema)
export default Room
