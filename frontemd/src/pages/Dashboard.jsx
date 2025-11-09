// src/pages/Dashboard.jsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [ownedRooms, setOwnedRooms] = useState([]);
  const [invitedRooms, setInvitedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const endpoints = [];

      if (["teacher", "interviewer"].includes(user.role)) {
        endpoints.push(axios.get("http://localhost:5000/api/rooms/my-rooms", { headers }));
      }
      endpoints.push(axios.get("http://localhost:5000/api/rooms/invited", { headers }));

      const [ownedRes, invitedRes] = await Promise.allSettled(endpoints);

      if (ownedRes.status === "fulfilled") setOwnedRooms(ownedRes.value.data);
      if (invitedRes.status === "fulfilled") setInvitedRooms(invitedRes.value.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/rooms/create",
        { name: newRoomName, description: newRoomDesc },
        { headers }
      );
      setOwnedRooms((prev) => [...prev, data.room]);
      setNewRoomName("");
      setNewRoomDesc("");
      setShowCreateRoom(false);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = (roomId) => navigate(`/room/${roomId}`);

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Delete this room?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}`, { headers });
      setOwnedRooms((prev) => prev.filter((r) => r.roomId !== roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-gray-400 mt-2">
              Role: <span className="capitalize font-semibold text-primary">{user.role}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Create Room */}
        {["teacher", "interviewer"].includes(user.role) && (
          <div className="mb-12">
            <button
              onClick={() => setShowCreateRoom((prev) => !prev)}
              className="px-6 py-3 rounded bg-primary hover:bg-primary/90 text-white font-semibold transition"
            >
              + Create New Room
            </button>

            {showCreateRoom && (
              <form
                onSubmit={handleCreateRoom}
                className="mt-4 p-6 rounded bg-card-bg border border-border space-y-3"
              >
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name..."
                  className="w-full px-4 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  className="w-full px-4 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    Create Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-6 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Room Lists */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {ownedRooms.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Your Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedRooms.map((room) => (
                    <div
                      key={room._id}
                      className="p-6 rounded-lg bg-card-bg border border-border hover:border-primary transition"
                    >
                      <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                      {room.description && <p className="text-sm text-gray-400 mb-3">{room.description}</p>}
                      <p className="text-xs font-mono text-primary mb-3">ID: {room.roomId}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRoom(room.roomId)}
                          className="flex-1 py-2 rounded bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition"
                        >
                          Enter
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.roomId)}
                          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {invitedRooms.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Invited Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invitedRooms.map((room) => (
                    <div
                      key={room._id}
                      className="p-6 rounded-lg bg-card-bg border border-border hover:border-primary transition"
                    >
                      <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                      {room.description && <p className="text-sm text-gray-400 mb-3">{room.description}</p>}
                      <p className="text-xs text-gray-400 mb-3">
                        Hosted by: <span className="text-primary">{room.owner.name}</span>
                      </p>
                      <button
                        onClick={() => handleJoinRoom(room.roomId)}
                        className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition"
                      >
                        Join Room
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!ownedRooms.length && !invitedRooms.length && (
              <div className="text-center py-12 text-gray-400">
                {["teacher", "interviewer"].includes(user.role)
                  ? "No rooms yet. Create one to get started!"
                  : "No rooms available yet."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
