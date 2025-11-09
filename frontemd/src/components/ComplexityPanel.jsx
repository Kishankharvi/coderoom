// src/components/ComplexityPanel.jsx
"use client";

import { useState } from "react";
import axios from "axios";

const ComplexityPanel = ({ code, language }) => {
  const [complexity, setComplexity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeComplexity = async () => {
    setLoading(true);
    setError("");
    setComplexity(null);

    try {
      const { data } = await axios.post(
        "/api/complexity/analyze",
        { code, language },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setComplexity(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to analyze complexity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">🧠 Code Complexity</h3>
        <button
          onClick={analyzeComplexity}
          disabled={loading}
          className="px-3 py-1 rounded text-sm bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Crunching numbers...</p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        ) : complexity ? (
          <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
              <p className="text-xs text-blue-400">
                <span className="font-semibold">Time Complexity:</span> {complexity.timeComplexity || "Unknown"}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
              <p className="text-xs text-purple-400">
                <span className="font-semibold">Space Complexity:</span> {complexity.spaceComplexity || "Unknown"}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
              <p className="text-xs text-green-400">
                <span className="font-semibold">Optimization Suggestions:</span>
              </p>
              <ul className="text-xs text-gray-300 list-disc list-inside mt-2 space-y-1">
                {complexity.suggestions?.length > 0
                  ? complexity.suggestions.map((s, idx) => <li key={idx}>{s}</li>)
                  : <li>No major issues detected.</li>}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            Click “Analyze” to evaluate your algorithm’s complexity.
          </p>
        )}
      </div>
    </div>
  );
};

export default ComplexityPanel;
