// src/components/ParticipantsList.jsx
"use client";

import { useEffect, useState } from "react";

const ParticipantsList = ({ participants = [], mentor, userRole, socket }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data) => setOnlineUsers(data.onlineUsers);

    socket.emit("get-presence");
    socket.on("presence-update", handlePresenceUpdate);

    return () => {
      socket.off("presence-update", handlePresenceUpdate);
    };
  }, [socket]);

  const isOnline = (id) => onlineUsers.includes(id);

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 h-full flex flex-col">
      <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm">
        👥 Participants ({participants.length})
      </h3>

      <div className="space-y-2 overflow-y-auto">
        {mentor && (
          <div className="flex items-center gap-3 p-2 rounded bg-primary/20 border border-primary/30">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {mentor.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-xs text-gray-400">Mentor — Full Control</p>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline(mentor._id) ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
          </div>
        )}

        {participants
          .filter((p) => p.role === "student")
          .map((participant, idx) => (
            <div
              key={participant._id || idx}
              className="flex items-center gap-3 p-2 rounded bg-border/50"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold">
                {participant.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-foreground">{participant.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {participant.role || "student"}
                </p>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline(participant._id) ? "bg-green-500" : "bg-gray-500"
                }`}
              ></span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ParticipantsList;
