// src/pages/AdminDashboard.jsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const calls = [
        axios.get("/api/admin/stats", { headers }),
        axios.get("/api/admin/users", { headers }),
        axios.get("/api/admin/rooms", { headers }),
        axios.get("/api/admin/files", { headers }),
      ];

      const [statsRes, usersRes, roomsRes, filesRes] = await Promise.allSettled(calls);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      if (roomsRes.status === "fulfilled") setRooms(roomsRes.value.data);
      if (filesRes.status === "fulfilled") setFiles(filesRes.value.data);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, { headers });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, { headers });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleCloseRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to close this room?")) return;
    try {
      await axios.put(`/api/admin/rooms/${roomId}/close`, {}, { headers });
      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
    } catch (err) {
      console.error("Failed to close room:", err);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">System Administration & Analytics</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {["stats", "users", "rooms", "files"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition capitalize ${
                activeTab === tab ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-card-bg border border-border">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-foreground">{stats.userStats?.total ?? 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.userStats?.mentors ?? 0} mentors, {stats.userStats?.students ?? 0} students
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card-bg border border-border">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Active Rooms</h3>
              <p className="text-3xl font-bold text-foreground">{stats.roomStats?.active ?? 0}</p>
            </div>

            <div className="p-6 rounded-lg bg-card-bg border border-border">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Total Files</h3>
              <p className="text-3xl font-bold text-foreground">{stats.fileStats?.total ?? 0}</p>
              <p className="text-sm text-gray-500 mt-2">Total size: {formatBytes(stats.fileStats?.totalSize)}</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card-bg">
                  <th className="text-left px-6 py-3 font-semibold">Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Email</th>
                  <th className="text-left px-6 py-3 font-semibold">Role</th>
                  <th className="text-left px-6 py-3 font-semibold">Joined</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-border hover:bg-border/50 transition">
                    <td className="px-6 py-3">{u.name}</td>
                    <td className="px-6 py-3 text-gray-400">{u.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u._id, e.target.value)}
                        className="px-2 py-1 rounded bg-border text-foreground border border-border text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="px-3 py-1 rounded text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div key={room._id} className="p-6 rounded-lg bg-card-bg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{room.name}</h3>
                    <p className="text-sm text-gray-400">ID: {room.roomId}</p>
                  </div>
                  <button
                    onClick={() => handleCloseRoom(room.roomId)}
                    className="px-4 py-2 rounded text-sm bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    Close Room
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Mentor</p>
                    <p className="font-semibold">{room.mentor?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Students</p>
                    <p className="font-semibold">{room.students?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mode</p>
                    <p className={`font-semibold ${room.mode === "teaching" ? "text-primary" : "text-secondary"}`}>
                      {room.mode}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card-bg">
                  <th className="text-left px-6 py-3 font-semibold">File</th>
                  <th className="text-left px-6 py-3 font-semibold">Uploader</th>
                  <th className="text-left px-6 py-3 font-semibold">Size</th>
                  <th className="text-left px-6 py-3 font-semibold">Downloads</th>
                  <th className="text-left px-6 py-3 font-semibold">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file._id} className="border-b border-border hover:bg-border/50 transition">
                    <td className="px-6 py-3">{file.originalName}</td>
                    <td className="px-6 py-3 text-gray-400">{file.uploader?.name ?? "Unknown"}</td>
                    <td className="px-6 py-3 text-sm">{formatBytes(file.size)}</td>
                    <td className="px-6 py-3 text-sm">{file.downloads ?? 0}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
