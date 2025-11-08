"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const Dashboard = ({ user }) => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRoomName, setNewRoomName] = useState("")
  const [showCreateRoom, setShowCreateRoom] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await axios.get("/api/rooms/active", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setRooms(response.data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    try {
      const response = await axios.post(
        "/api/rooms/create",
        { name: newRoomName },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      setRooms([...rooms, response.data.room])
      setNewRoomName("")
      setShowCreateRoom(false)
    } catch (error) {
      console.error("Failed to create room:", error)
    }
  }

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
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

        {/* Create Room Section */}
        {user.role === "mentor" && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="px-6 py-3 rounded bg-primary hover:bg-primary-light text-white font-semibold transition"
            >
              + Create New Room
            </button>

            {showCreateRoom && (
              <form onSubmit={handleCreateRoom} className="mt-4 p-6 rounded bg-card-bg border border-border flex gap-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="flex-1 px-4 py-2 rounded bg-border text-foreground border border-border placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  Create
                </button>
              </form>
            )}
          </div>
        )}

        {/* Rooms Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No rooms available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="p-6 rounded-lg bg-card-bg border border-border hover:border-primary transition cursor-pointer"
                  onClick={() => handleJoinRoom(room.roomId)}
                >
                  <h3 className="text-xl font-bold text-foreground mb-2">{room.name}</h3>
                  <p className="text-gray-400 mb-3">
                    Room ID: <span className="font-mono text-primary">{room.roomId}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${room.mode === "teaching" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}
                    >
                      {room.mode === "teaching" ? "👨‍🏫 Teaching" : "🎯 Interview"}
                    </span>
                    <span className="text-sm text-gray-400">{room.students.length} students</span>
                  </div>
                  <button className="mt-4 w-full py-2 rounded bg-primary hover:bg-primary-light text-white font-semibold transition">
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
