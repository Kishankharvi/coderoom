// src/components/EnhancedOutputPanel.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const EnhancedOutputPanel = ({ code, language, socket, roomId }) => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleExecutionResult = (data) => {
      setOutput(data.stdout || "");
      setError(data.stderr || "");
      setExecutionTime(data.executionTime || null);
    };

    socket.on("execution-result", handleExecutionResult);

    return () => {
      socket.off("execution-result", handleExecutionResult);
    };
  }, [socket]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setExecutionTime(null);

    try {
      const startTime = performance.now();

      const { data } = await axios.post(
        "/api/execute/execute",
        { code, language, input },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const endTime = performance.now();
      const execTime = ((endTime - startTime) / 1000).toFixed(2);
      setExecutionTime(execTime);

      if (data.stderr) setError(data.stderr);
      else setOutput(data.stdout || "(No output)");

      // broadcast to participants
      socket.emit("execution-result", roomId, {
        stdout: data.stdout,
        stderr: data.stderr,
        exitCode: data.exitCode,
        language,
        executionTime: execTime,
      });
    } catch (err) {
      setError(err.response?.data?.stderr || "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">⚙️ Code Execution</h3>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition"
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <label className="block text-sm font-semibold text-foreground">Input (optional)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Provide input for your code..."
          className="w-full h-20 p-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary font-mono text-sm"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-black rounded p-3 overflow-y-auto flex-1 font-mono text-sm text-gray-300">
          {isRunning ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
              Running code...
            </div>
          ) : error ? (
            <pre className="text-red-400 whitespace-pre-wrap break-words">{error}</pre>
          ) : output ? (
            <pre className="text-green-400 whitespace-pre-wrap break-words">{output}</pre>
          ) : (
            <span className="text-gray-500">Output will appear here</span>
          )}
        </div>

        {executionTime && (
          <p className="text-xs text-gray-400 text-right mt-2">
            ⏱ Execution Time: <span className="text-primary">{executionTime}s</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedOutputPanel;
