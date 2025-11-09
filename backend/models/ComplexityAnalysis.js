import mongoose from "mongoose"

const complexityAnalysisSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  detectedTimeComplexity: { type: String, default: "Unknown" }, // O(n), O(n^2), etc
  detectedSpaceComplexity: { type: String, default: "Unknown" },
  analysis: {
    loops: [{ type: String, count: Number }],
    recursionDetected: Boolean,
    nestedLoops: Number,
    hasHashMaps: Boolean,
    hasArrays: Boolean,
    recommendations: [String],
  },
  executionMetrics: {
    actualTimeMs: Number,
    estimatedOperations: Number,
    memoryUsageMB: Number,
  },
  createdAt: { type: Date, default: Date.now },
})

const ComplexityAnalysis = mongoose.model("ComplexityAnalysis", complexityAnalysisSchema)
export default ComplexityAnalysis
