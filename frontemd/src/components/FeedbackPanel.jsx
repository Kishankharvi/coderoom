"use client"

import { useState } from "react"

const FeedbackPanel = ({ socket, roomId, user, language }) => {
  const [selectedLine, setSelectedLine] = useState(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleAddFeedback = () => {
    if (selectedLine !== null && feedbackText.trim()) {
      socket.emit("add-feedback", roomId, user.id, selectedLine, feedbackText)
      setFeedbackText("")
      setSelectedLine(null)
      setShowForm(false)
    }
  }

  if (user.role !== "mentor") {
    return null
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-3 text-foreground">Add Feedback</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Line Number</label>
          <input
            type="number"
            value={selectedLine || ""}
            onChange={(e) => setSelectedLine(e.target.value ? Number.parseInt(e.target.value) : null)}
            placeholder="Enter line number..."
            className="w-full px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Feedback Message</label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Write your feedback..."
            className="w-full px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm h-20"
          />
        </div>

        <button
          onClick={handleAddFeedback}
          disabled={selectedLine === null || !feedbackText.trim()}
          className="w-full px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 transition text-sm"
        >
          Add Feedback
        </button>
      </div>
    </div>
  )
}

export default FeedbackPanel
