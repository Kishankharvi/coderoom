const ParticipantsList = ({ participants, mentor, userRole }) => {
  return (
    <div className="bg-card-bg border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
        👥 Participants ({participants.length})
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {mentor && (
          <div className="flex items-center gap-3 p-2 rounded bg-primary/20 border border-primary/30">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {mentor.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-xs text-gray-400">Mentor - Full Control</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>
        )}

        {participants
          .filter((p) => p.role === "student")
          .map((participant, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded bg-border/50">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold">
                {String.fromCharCode(65 + idx)}
              </div>
              <div className="flex-1 text-sm">
                <p className="text-gray-300">Student {idx + 1}</p>
                <p className="text-xs text-gray-500">Read-Only / Interview</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
          ))}
      </div>
    </div>
  )
}

export default ParticipantsList
