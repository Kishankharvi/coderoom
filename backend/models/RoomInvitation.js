import mongoose from "mongoose"

const roomInvitationSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invitationLink: { type: String, unique: true, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})

const RoomInvitation = mongoose.model("RoomInvitation", roomInvitationSchema)
export default RoomInvitation
