import mongoose from "mongoose"

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  fileData: { type: Buffer, required: true },
  shareUrl: { type: String, unique: true },
  expiresAt: { type: Date },
  downloads: { type: Number, default: 0 },
  accessLog: [{ userId: mongoose.Schema.Types.ObjectId, accessedAt: Date }],
  createdAt: { type: Date, default: Date.now },
})

const File = mongoose.model("File", fileSchema)
export default File
