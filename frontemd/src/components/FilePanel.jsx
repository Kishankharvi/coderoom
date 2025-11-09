// src/components/FilePanel.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const FilePanel = ({ roomId, user, socket }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();

    if (!socket) return;

    const handleNewFile = (data) => setFiles((prev) => [data.file, ...prev]);
    const handleFileRemoved = (data) =>
      setFiles((prev) => prev.filter((f) => f._id !== data.fileId));

    socket.on("new-file", handleNewFile);
    socket.on("file-removed", handleFileRemoved);

    return () => {
      socket.off("new-file", handleNewFile);
      socket.off("file-removed", handleFileRemoved);
    };
  }, [roomId, socket]);

  const fetchFiles = async () => {
    try {
      const { data } = await axios.get(`/api/files/room/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("room", roomId);

      const { data } = await axios.post("/api/files/upload", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFiles((prev) => [data.file, ...prev]);
      socket?.emit("file-uploaded", roomId, data.file._id);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const { data } = await axios.get(`/api/files/download/${fileId}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      socket?.emit("file-deleted", roomId, fileId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="bg-card-bg border border-border rounded-lg p-4 flex flex-col h-full">
      <h3 className="font-semibold mb-4 text-foreground text-sm flex items-center gap-2">
        📁 Shared Files
        {uploading && (
          <span className="text-xs text-gray-400 italic">(Uploading...)</span>
        )}
      </h3>

      <div className="mb-4">
        <label className="flex items-center justify-center px-4 py-2 rounded bg-primary/20 border-2 border-dashed border-primary text-primary cursor-pointer hover:bg-primary/30 transition">
          <span className="text-sm font-semibold">
            {uploading ? "Please wait..." : "+ Upload File"}
          </span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 text-sm">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No files uploaded yet</p>
        ) : (
          files.map((file) => (
            <div
              key={file._id}
              className="p-3 rounded bg-border/50 hover:bg-border transition"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)} •{" "}
                    {file.uploader?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() =>
                    handleDownload(file._id, file.originalName)
                  }
                  className="flex-1 px-2 py-1 rounded text-xs bg-primary/20 text-primary hover:bg-primary/30 transition font-semibold"
                >
                  Download
                </button>

                {file.uploader?._id === user.id && (
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="px-2 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition font-semibold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FilePanel;
