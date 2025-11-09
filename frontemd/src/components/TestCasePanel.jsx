"use client"

import { useState } from "react"

const TestCasesPanel = ({ testCases = [], onTestRun }) => {
  const [testResults, setTestResults] = useState({})

  const handleRunTest = async (testIndex) => {
    console.log("[v0] Running test case", testIndex)
    setTestResults((prev) => ({ ...prev, [testIndex]: { running: true } }))

    // Simulate test execution
    setTimeout(() => {
      setTestResults((prev) => ({
        ...prev,
        [testIndex]: {
          passed: Math.random() > 0.5,
          actual: "output",
          expected: testCases[testIndex]?.expectedOutput,
        },
      }))
    }, 1000)
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <h3 className="font-semibold text-foreground mb-4">Test Cases</h3>

      {testCases.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          <p>No test cases defined</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {testCases.map((testCase, idx) => (
            <div key={idx} className="p-3 bg-gray-500/10 border border-gray-500/20 rounded">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-foreground">Test {idx + 1}</span>
                <button
                  onClick={() => handleRunTest(idx)}
                  className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white transition"
                >
                  Run
                </button>
              </div>

              <div className="space-y-1 text-sm font-mono">
                <div className="text-gray-400">
                  <span className="text-gray-500">Input:</span> {testCase.input}
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">Expected:</span> {testCase.expectedOutput}
                </div>
              </div>

              {testResults[idx] && (
                <div
                  className={`mt-2 p-2 rounded text-sm ${
                    testResults[idx].passed ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {testResults[idx].running ? "Running..." : testResults[idx].passed ? "✓ Passed" : "✗ Failed"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TestCasesPanel
