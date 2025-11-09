const ProblemStatement = ({ problem }) => {
  if (!problem) {
    return (
      <div className="bg-card-bg border border-border rounded-lg p-4">
        <p className="text-gray-500 text-sm">No problem statement available</p>
      </div>
    )
  }

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 space-y-4 h-full overflow-y-auto">
      {problem.title && (
        <div>
          <h2 className="text-lg font-bold text-foreground">{problem.title}</h2>
        </div>
      )}

      {problem.description && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.description}</p>
        </div>
      )}

      {problem.constraints && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Constraints</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.constraints}</p>
        </div>
      )}

      {problem.examples && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Examples</h3>
          <pre className="bg-black p-2 rounded text-xs text-gray-300 overflow-x-auto font-mono">{problem.examples}</pre>
        </div>
      )}

      {problem.timeComplexity && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
          <p className="text-xs text-blue-400">
            <span className="font-semibold">Expected Time Complexity:</span> {problem.timeComplexity}
          </p>
        </div>
      )}

      {problem.spaceComplexity && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
          <p className="text-xs text-purple-400">
            <span className="font-semibold">Expected Space Complexity:</span> {problem.spaceComplexity}
          </p>
        </div>
      )}
    </div>
  )
}

export default ProblemStatement
