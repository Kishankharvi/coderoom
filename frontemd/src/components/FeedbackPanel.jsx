// src/components/FeedbackPanel.jsx
"use client";

import { useState, useEffect } from "react";

const FeedbackPanel = ({ socket, roomId, user }) => {
  const [lineNumber, setLineNumber] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleFeedbackAdded = (data) => {
      setFeedbacks((prev) => [...prev, data]);
    };

    socket.on("feedback-added", handleFeedbackAdded);

    // Fetch existing feedbacks when joining
    socket.emit("fetch-feedbacks", roomId);

    socket.on("feedback-history", (data) => {
      setFeedbacks(data.feedbacks || []);
    });

    return () => {
      socket.off("feedback-added", handleFeedbackAdded);
      socket.off("feedback-history");
    };
  }, [socket, roomId]);

  const handleSubmit = () => {
    if (!lineNumber || !feedback.trim()) return;
    socket.emit("add-feedback", roomId, user.id, Number(lineNumber), feedback);
    setLineNumber("");
    setFeedback("");
  };

  if (user.role !== "mentor") return null;

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <h3 className="font-semibold mb-3 text-foreground text-sm">📝 Code Feedback</h3>

      {/* Feedback Form */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Line Number</label>
          <input
            type="number"
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            placeholder="Enter line number..."
            className="w-full px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Feedback Message</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your feedback..."
            className="w-full px-3 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary text-sm h-20"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || !lineNumber}
          className="w-full px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 transition text-sm"
        >
          Add Feedback
        </button>
      </div>

      {/* Feedback History */}
      <div className="flex-1 overflow-y-auto border-t border-border pt-3 space-y-2 text-sm">
        {feedbacks.length === 0 ? (
          <p className="text-gray-500 text-center text-xs py-4">No feedback added yet</p>
        ) : (
          feedbacks.map((f, idx) => (
            <div key={idx} className="p-2 rounded bg-border/50 border border-border">
              <p className="text-xs text-gray-400 mb-1">Line {f.lineNumber}</p>
              <p className="text-foreground text-sm">{f.feedback}</p>
              <p className="text-[10px] text-gray-500 mt-1">By: {f.mentorName}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
