"use client"

import { useState } from "react"
import axios from "axios"

const OutputPanel = ({ code, language, socket, roomId }) => {
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState("")
  const [input, setInput] = useState("")

  const handleRunCode = async () => {
    setIsRunning(true)
    setError("")
    setOutput("")

    try {
      const response = await axios.post(
        "/api/execute/execute",
        { code, language, input },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      const { stdout, stderr, exitCode } = response.data

      if (stderr) {
        setError(stderr)
        setOutput("")
      } else {
        setOutput(stdout || "(No output)")
      }

      // Broadcast execution result to room
      if (socket) {
        socket.emit("execution-result", roomId, {
          stdout,
          stderr,
          exitCode,
          language,
          executedAt: new Date(),
        })
      }
    } catch (err) {
      setError(err.response?.data?.stderr || "Execution failed")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Output</h3>
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition"
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <label className="block text-sm font-semibold text-foreground">Input (optional)</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input for your program..."
          className="w-full h-20 p-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary font-mono text-sm"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-black rounded p-3 overflow-y-auto flex-1 font-mono text-sm">
          {isRunning ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
              Running...
            </div>
          ) : error ? (
            <pre className="text-red-400 whitespace-pre-wrap break-words">{error}</pre>
          ) : output ? (
            <pre className="text-green-400 whitespace-pre-wrap break-words">{output}</pre>
          ) : (
            <span className="text-gray-500">Output will appear here</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OutputPanel
